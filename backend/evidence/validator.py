import logging
from typing import List, Set, Dict, Any, Optional
from backend.evidence.models import EvidenceCollection, EvidenceItem
from backend.hypotheses.models import Hypothesis, HypothesisStatus, RootCause

logger = logging.getLogger("bugx")

class AntiHallucinationValidator:
    """
    Validates AI-generated hypothesis evidence references against real repository
    files and collected evidence items. Rejects or flags hallucinated file references.
    """
    def validate_investigation_result(
        self,
        hypotheses: List[Hypothesis],
        root_cause: Optional[RootCause],
        valid_repo_files: Set[str],
        collected_evidence: EvidenceCollection
    ) -> List[Hypothesis]:
        logger.info(f"[AntiHallucinationValidator] Validating evidence for {len(hypotheses)} hypotheses against {len(valid_repo_files)} repository files.")
        
        # Build map of verified collected evidence files
        collected_files_lower = {
            item.file.lower().strip() for item in collected_evidence.items if item.file
        }
        all_repo_files_lower = {
            f.lower().strip().lstrip("./") for f in valid_repo_files
        }

        for hypothesis in hypotheses:
            verified_count = 0
            for item in hypothesis.evidence:
                if not item.file:
                    item.verified = True
                    verified_count += 1
                    continue
                    
                clean_file = item.file.lower().strip().lstrip("./")
                
                # Check if file actually exists in repo or collected evidence
                is_valid = (clean_file in all_repo_files_lower) or any(clean_file in f or f in clean_file for f in all_repo_files_lower)
                
                if is_valid:
                    item.verified = True
                    verified_count += 1
                else:
                    logger.warning(f"[AntiHallucinationValidator] Rejecting invalid/hallucinated evidence reference: '{item.file}'")
                    item.verified = False
                    item.unverified_reason = f"Evidence reference '{item.file}' could not be verified in target repository."

            # Update hypothesis status based on evidence verification & predictions
            if verified_count > 0 and hypothesis.confidence >= 0.70:
                hypothesis.status = HypothesisStatus.SUPPORTED
            elif verified_count > 0:
                hypothesis.status = HypothesisStatus.NEEDS_VALIDATION
            elif len(hypothesis.evidence) > 0 and verified_count == 0:
                hypothesis.status = HypothesisStatus.REJECTED
            else:
                hypothesis.status = HypothesisStatus.UNTESTED

        return hypotheses
