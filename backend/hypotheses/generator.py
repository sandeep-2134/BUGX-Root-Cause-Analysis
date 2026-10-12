import logging
from typing import Dict, Any, List
from backend.llm.provider import LLMProvider, get_llm_provider
from backend.evidence.models import EvidenceCollection
from backend.hypotheses.models import InvestigationResult, Hypothesis, RootCause, CausalStep

logger = logging.getLogger("bugx")

class WhyEngine:
    """
    Core WHY Engine that takes structured repository analysis, bug report,
    and collected evidence to generate multiple competing hypotheses and a causal root cause graph.
    """
    def __init__(self, llm_provider: LLMProvider = None):
        self.llm = llm_provider or get_llm_provider()

    async def generate_hypotheses(
        self,
        repository_info: Dict[str, Any],
        bug_report: str,
        evidence: EvidenceCollection
    ) -> InvestigationResult:
        logger.info("[WhyEngine] Initiating hypothesis generation pipeline")
        
        # Build prompt context
        evidence_summary = "\n".join([
            f"- [{item.type.value}] {item.file}:{item.line or '?'} => {item.description}"
            for item in evidence.items[:15]
        ])
        
        relevant_files_str = "\n".join([
            f"- {f.get('path')}: {f.get('reason')}"
            for f in repository_info.get("relevant_files", [])
        ])

        prompt = f"""
BUG INVESTIGATION TASK:

Repository Name: {repository_info.get('name', 'Unknown')}
Primary Language: {repository_info.get('language', 'Unknown')}
Framework: {repository_info.get('framework', 'Unknown')}

BUG REPORT:
{bug_report}

RELEVANT FILES IDENTIFIED IN REPOSITORY:
{relevant_files_str if relevant_files_str else "No explicit relevant files detected."}

COLLECTED EVIDENCE:
{evidence_summary if evidence_summary else "No specific line matches found."}

INSTRUCTIONS:
Generate 2 to 4 competing hypotheses explaining the bug.
Do not assume a single cause. Rate each hypothesis with a confidence score between 0.0 and 1.0 based on evidence.
For each hypothesis:
1. Title and detailed description of the mechanism.
2. Direct references to files/lines where applicable.
3. Logical predictions if this hypothesis is true.
4. Specific tests required to prove or disprove this hypothesis.

Also construct a Root Cause object with a vertical step-by-step Causal Chain from initial user trigger down to the final system failure.
"""

        schema = {
            "type": "object",
            "properties": {
                "hypotheses": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "title": {"type": "string"},
                            "description": {"type": "string"},
                            "confidence": {"type": "number"},
                            "evidence": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "type": {"type": "string"},
                                        "source": {"type": "string"},
                                        "file": {"type": "string"},
                                        "line": {"type": "integer"},
                                        "description": {"type": "string"},
                                        "snippet": {"type": "string"}
                                    },
                                    "required": ["type", "description"]
                                }
                            },
                            "predictions": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "tests": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "status": {"type": "string"}
                        },
                        "required": ["id", "title", "description", "confidence", "evidence", "predictions", "tests"]
                    }
                },
                "root_cause": {
                    "type": "object",
                    "properties": {
                        "summary": {"type": "string"},
                        "primary_hypothesis_id": {"type": "string"},
                        "causal_chain": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "step": {"type": "integer"},
                                    "component": {"type": "string"},
                                    "action": {"type": "string"}
                                },
                                "required": ["step", "component", "action"]
                            }
                        }
                    },
                    "required": ["summary", "primary_hypothesis_id", "causal_chain"]
                }
            },
            "required": ["hypotheses", "root_cause"]
        }

        try:
            raw_result = await self.llm.generate_structured(prompt, schema)
            return InvestigationResult.model_validate(raw_result)
        except Exception as e:
            logger.error(f"[WhyEngine] Failed to parse LLM response: {e}")
            # Fallback parsing/construction if model format diverges
            return InvestigationResult(
                hypotheses=[
                    Hypothesis(
                        id="H1",
                        title="Primary Algorithmic / Logic Error",
                        description=f"Investigation indicates error related to bug report: {bug_report[:120]}",
                        confidence=0.70,
                        evidence=[],
                        predictions=["State inconsistency during invocation"],
                        tests=["Add boundary unit test"],
                    )
                ],
                root_cause=RootCause(
                    summary="Root cause generated under exception fallback mode.",
                    primary_hypothesis_id="H1",
                    causal_chain=[
                        CausalStep(step=1, component="System Entry", action="User trigger"),
                        CausalStep(step=2, component="Business Logic", action="Unexpected behavior"),
                    ]
                )
            )
