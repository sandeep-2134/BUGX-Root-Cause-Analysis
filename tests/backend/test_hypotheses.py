import pytest
from backend.evidence.models import EvidenceCollection, EvidenceItem, EvidenceType
from backend.evidence.validator import AntiHallucinationValidator
from backend.hypotheses.models import Hypothesis, HypothesisStatus, RootCause, CausalStep, InvestigationResult
from backend.llm.provider import MockLLMProvider
from backend.hypotheses.generator import WhyEngine

@pytest.mark.asyncio
async def test_hypothesis_data_models():
    item = EvidenceItem(
        id="E1",
        type=EvidenceType.SOURCE_CODE,
        source="repository",
        file="services/payment.py",
        line=184,
        description="Invalid state transition"
    )
    
    h1 = Hypothesis(
        id="H1",
        title="Invalid transaction state",
        description="State machine fails on retry",
        confidence=0.75,
        evidence=[item],
        predictions=["Retry fails"],
        tests=["Execute retry twice"]
    )
    
    assert h1.id == "H1"
    assert h1.confidence == 0.75
    assert len(h1.evidence) == 1
    assert h1.status == HypothesisStatus.NEEDS_VALIDATION

@pytest.mark.asyncio
async def test_anti_hallucination_validator():
    validator = AntiHallucinationValidator()
    
    valid_item = EvidenceItem(id="E1", file="app/payment.py", description="Valid file")
    fake_item = EvidenceItem(id="E2", file="nonexistent_fake_module.py", description="Fake hallucinated file")
    
    h1 = Hypothesis(
        id="H1",
        title="Hypothesis with mixed evidence",
        description="Test description",
        confidence=0.80,
        evidence=[valid_item, fake_item],
        predictions=[],
        tests=[]
    )
    
    repo_files = {"app/payment.py", "app/main.py", "requirements.txt"}
    collected_evidence = EvidenceCollection(items=[valid_item], total_count=1)
    
    validated_hypotheses = validator.validate_investigation_result([h1], None, repo_files, collected_evidence)
    
    assert len(validated_hypotheses) == 1
    validated_h = validated_hypotheses[0]
    
    # Valid item must be verified
    assert validated_h.evidence[0].verified is True
    # Fake item must be rejected/unverified
    assert validated_h.evidence[1].verified is False
    assert "could not be verified" in validated_h.evidence[1].unverified_reason

@pytest.mark.asyncio
async def test_why_engine_generator():
    mock_llm = MockLLMProvider()
    why_engine = WhyEngine(llm_provider=mock_llm)
    
    repo_info = {
        "name": "test-repo",
        "language": "Python",
        "framework": "FastAPI",
        "relevant_files": [{"path": "app/payment.py", "reason": "Contains payment logic"}]
    }
    bug_report = "Payment endpoint crashes with HTTP 500 when retry button clicked"
    evidence = EvidenceCollection(items=[], total_count=0)
    
    result = await why_engine.generate_hypotheses(repo_info, bug_report, evidence)
    assert isinstance(result, InvestigationResult)
    assert len(result.hypotheses) >= 2
    assert result.root_cause is not None
    assert result.root_cause.primary_hypothesis_id == "H1"
