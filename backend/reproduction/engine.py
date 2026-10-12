import time
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from backend.sandbox.models import (
    ReproductionResult, ReproductionStatus, ReproductionPlan, ReproductionAttempt
)
from backend.sandbox.resource_limits import sandbox_limits
from backend.sandbox.docker_manager import DockerManager
from backend.reproduction.generator import ReproductionPlanGenerator
from backend.evidence.models import EvidenceItem, EvidenceType, EvidenceCollection
from backend.hypotheses.models import Hypothesis, HypothesisStatus

logger = logging.getLogger("bugx")

class BugReproductionEngine:
    def __init__(self):
        self.docker_mgr = DockerManager()
        self.plan_gen = ReproductionPlanGenerator()

    async def run_reproduction(
        self,
        repo_path: Path,
        repository_info: Dict[str, Any],
        bug_report: str,
        primary_hypothesis: Optional[Hypothesis],
        evidence_collection: EvidenceCollection,
        events_callback=None
    ) -> Tuple[ReproductionResult, List[EvidenceItem]]:

        logger.info(f"[BugReproductionEngine] Initiating bug reproduction pipeline for {repo_path}")
        start_time = time.time()
        new_evidence_items: List[EvidenceItem] = []

        def log_evt(msg: str, evt_type: str = "info", stage: str = "Bug Reproduction"):
            logger.info(f"[BugReproductionEngine] {msg}")
            if events_callback:
                events_callback(msg, evt_type, stage)

        lang = (repository_info.get("language") or "").lower()
        
        # 1. Project Type & Environment Detection
        supported_langs = ["python", "javascript", "typescript", "node"]
        is_supported = any(sl in lang for sl in supported_langs) or (repo_path / "requirements.txt").exists() or (repo_path / "package.json").exists()

        if not is_supported:
            log_evt(f"Project language '{lang}' is not supported for automatic reproduction.", "error")
            return ReproductionResult(
                status=ReproductionStatus.UNSUPPORTED_PROJECT,
                unsupported_reason=f"Automatic reproduction is not currently supported for project type '{repository_info.get('language')}'."
            ), []

        # Choose container image & setup command
        if "python" in lang or (repo_path / "requirements.txt").exists():
            image = "python:3.11-slim"
            install_cmd = "pip install -r requirements.txt" if (repo_path / "requirements.txt").exists() else "python --version"
        else:
            image = "node:20-slim"
            install_cmd = "npm install" if (repo_path / "package.json").exists() else "node --version"

        log_evt("Preparing isolated sandbox environment...", "action")
        
        # 2. Dependency Installation inside Sandbox
        log_evt(f"Installing dependencies inside container sandbox ({install_cmd})...", "action")
        dep_code, dep_out, dep_err, dep_dur, is_docker = await self.docker_mgr.run_in_sandbox(
            repo_path=repo_path,
            command=install_cmd,
            image=image,
            timeout=120
        )

        env_label = f"Docker Container ({image})" if is_docker else "Isolated Subprocess Sandbox"
        log_evt(f"Sandbox environment initialized: {env_label}", "info")

        if dep_code != 0 and ("requirements.txt" in install_cmd or "npm" in install_cmd):
            log_evt(f"Dependency installation failed: {dep_err[:120]}", "error")
            return ReproductionResult(
                status=ReproductionStatus.DEPENDENCIES_FAILED,
                stderr=dep_err,
                stdout=dep_out,
                environment_info={"docker_used": is_docker, "image": image}
            ), []

        # 3. Reproduction Plan Generation
        log_evt("Generating structured reproduction scenario...", "action")
        plan = self.plan_gen.generate_plan(repository_info, bug_report, primary_hypothesis)
        log_evt(f"Reproduction command: '{plan.test_command}'", "info")

        # 4. Multi-Attempt Test Execution
        attempts_count = sandbox_limits.REPRODUCTION_ATTEMPTS
        attempts_list: List[ReproductionAttempt] = []
        failures = 0

        for idx in range(1, attempts_count + 1):
            log_evt(f"Running reproduction attempt {idx}/{attempts_count}...", "action")
            code, stdout, stderr, dur_ms, _ = await self.docker_mgr.run_in_sandbox(
                repo_path=repo_path,
                command=plan.test_command,
                image=image,
                timeout=sandbox_limits.SANDBOX_TIMEOUT_SECONDS
            )

            # In reproduction logic: non-zero exit code or error output indicates bug reproduction
            is_failure = (code != 0) or ("error" in stderr.lower()) or ("failed" in stdout.lower())
            if is_failure:
                failures += 1
                log_evt(f"Attempt {idx}/{attempts_count}: BUG REPRODUCED (exit code {code}, failure observed).", "success")
            else:
                log_evt(f"Attempt {idx}/{attempts_count}: Execution completed without error.", "info")

            attempts_list.append(
                ReproductionAttempt(
                    attempt_number=idx,
                    exit_code=code,
                    passed=not is_failure,
                    duration_ms=dur_ms,
                    stdout=stdout,
                    stderr=stderr
                )
            )

        success_rate = round(failures / attempts_count, 2)
        is_reproduced = failures > 0
        final_status = ReproductionStatus.REPRODUCED if is_reproduced else ReproductionStatus.NOT_REPRODUCED

        if is_reproduced:
            log_evt(f"Bug successfully reproduced ({failures}/{attempts_count} attempts failed).", "success")
        else:
            log_evt(f"Bug could not be reproduced ({failures}/{attempts_count} failures).", "info")

        # 5. Extract Evidence Items
        latest = attempts_list[-1]
        ev_id = f"E{evidence_collection.total_count + 1}"
        rep_ev = EvidenceItem(
            id=ev_id,
            type=EvidenceType.TEST_RESULT,
            source="reproduction_sandbox",
            file=repository_info.get("relevant_files", [{}])[0].get("path"),
            description=f"Reproduction test executed via '{plan.test_command}': {failures}/{attempts_count} failures (Exit code {latest.exit_code})",
            snippet=f"STDOUT:\n{latest.stdout[:300]}\nSTDERR:\n{latest.stderr[:300]}",
            verified=True
        )
        new_evidence_items.append(rep_ev)

        # 6. HYPOTHESIS VALIDATION - Update Primary Hypothesis Status
        if primary_hypothesis:
            if is_reproduced:
                primary_hypothesis.status = HypothesisStatus.SUPPORTED
                log_evt(f"Primary hypothesis '{primary_hypothesis.id}' status set to SUPPORTED based on experimental evidence.", "success")
            else:
                primary_hypothesis.status = HypothesisStatus.NEEDS_VALIDATION

        total_duration = round((time.time() - start_time) * 1000.0, 2)

        return ReproductionResult(
            status=final_status,
            attempts=attempts_count,
            failures=failures,
            success_rate=success_rate,
            expected=plan.expected,
            actual=plan.actual,
            exit_code=latest.exit_code,
            duration_ms=total_duration,
            stdout=latest.stdout,
            stderr=latest.stderr,
            evidence_ids=[ev_id],
            plan=plan,
            environment_info={
                "docker_used": is_docker,
                "image": image,
                "sandbox_network": sandbox_limits.SANDBOX_NETWORK,
                "memory_limit": sandbox_limits.SANDBOX_MEMORY_LIMIT,
                "cpu_limit": sandbox_limits.SANDBOX_CPU_LIMIT
            },
            detailed_attempts=attempts_list
        ), new_evidence_items
