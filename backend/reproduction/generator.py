import logging
from typing import Dict, Any, Optional
from backend.sandbox.models import ReproductionPlan
from backend.hypotheses.models import Hypothesis

logger = logging.getLogger("bugx")

class ReproductionPlanGenerator:
    """
    Generates a structured bug reproduction plan based on project type,
    framework, bug report, and primary hypothesis.
    """
    def generate_plan(
        self,
        repository_info: Dict[str, Any],
        bug_report: str,
        primary_hypothesis: Optional[Hypothesis]
    ) -> ReproductionPlan:
        lang = (repository_info.get("language") or "").lower()
        framework = (repository_info.get("framework") or "").lower()
        relevant_files = repository_info.get("relevant_files") or []

        primary_file = relevant_files[0]["path"] if relevant_files else "main.py"
        hyp_title = primary_hypothesis.title if primary_hypothesis else "Unexpected application failure"

        # Determine language & framework test command
        if "python" in lang:
            # Check if pytest tests exist in repo directory tree
            dir_tree = repository_info.get("directory_tree") or []
            test_files = [f for f in dir_tree if f.startswith("test") or "/test" in f or "_test.py" in f]
            
            if test_files:
                test_command = f"pytest {test_files[0]}"
            else:
                test_command = f"python -m unittest discover -s ."

            return ReproductionPlan(
                scenario=f"Reproduce '{hyp_title}' in {primary_file}",
                steps=[
                    f"Initialize Python sandbox environment for project ({framework or 'standard'})",
                    f"Target file: {primary_file}",
                    f"Execute test suite to trigger reported bug condition"
                ],
                expected="Application processes request smoothly with HTTP 200 / successful exit.",
                actual=f"Unhandled exception / failure condition occurs as described in: {bug_report[:80]}...",
                test_command=test_command,
                success_condition="Non-zero exit code or assertion failure confirming reported bug."
            )

        elif any(k in lang for k in ["javascript", "typescript", "node"]):
            return ReproductionPlan(
                scenario=f"Reproduce '{hyp_title}' in Node.js runtime",
                steps=[
                    "Initialize Node.js container sandbox",
                    f"Target file: {primary_file}",
                    "Run package test runner"
                ],
                expected="Test suite completes with 0 errors.",
                actual="Test suite throws uncaught exception or HTTP error.",
                test_command="npm test",
                success_condition="Test runner exits with code > 0 confirming bug."
            )

        else:
            return ReproductionPlan(
                scenario=f"Generic execution scenario for {lang or 'unsupported'} project",
                steps=["Execute default test command"],
                expected="Success",
                actual="Failure",
                test_command="python -m unittest",
                success_condition="Exit code > 0"
            )
