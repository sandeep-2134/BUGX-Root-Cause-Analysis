import pytest
from pathlib import Path
from backend.sandbox.models import ReproductionResult, ReproductionStatus
from backend.reproduction.engine import BugReproductionEngine
from backend.evidence.models import EvidenceCollection
from backend.hypotheses.models import Hypothesis, HypothesisStatus

@pytest.mark.asyncio
async def test_sample_buggy_repo_reproduction():
    engine = BugReproductionEngine()
    fixture_path = Path(__file__).resolve().parent.parent / "fixtures" / "sample_buggy_repo"
    
    assert fixture_path.exists(), f"Fixture path {fixture_path} should exist"
    
    repo_info = {
        "name": "sample_buggy_repo",
        "language": "Python",
        "framework": "Standard Library",
        "file_count": 3,
        "directory_tree": ["app/calculator.py", "tests/test_calculator.py", "requirements.txt"],
        "relevant_files": [{"path": "app/calculator.py", "reason": "Contains divide_values function"}]
    }
    
    bug_report = "divide_values raises unhandled ZeroDivisionError when b=0"
    primary_hyp = Hypothesis(
        id="H1",
        title="Unhandled Zero Division Exception",
        description="Division function does not validate zero denominator",
        confidence=0.85,
        evidence=[],
        predictions=["Division by zero raises ZeroDivisionError"],
        tests=["Execute test_calculator.py"]
    )
    
    evidence_coll = EvidenceCollection(items=[], total_count=0)
    
    rep_result, new_evidence = await engine.run_reproduction(
        repo_path=fixture_path,
        repository_info=repo_info,
        bug_report=bug_report,
        primary_hypothesis=primary_hyp,
        evidence_collection=evidence_coll
    )
    
    assert isinstance(rep_result, ReproductionResult)
    assert rep_result.status in [ReproductionStatus.REPRODUCED, ReproductionStatus.NOT_REPRODUCED]
    assert rep_result.attempts == 3
    assert len(new_evidence) == 1
    # Primary hypothesis status must be updated based on experimental evidence
    assert primary_hyp.status in [HypothesisStatus.SUPPORTED, HypothesisStatus.NEEDS_VALIDATION]
