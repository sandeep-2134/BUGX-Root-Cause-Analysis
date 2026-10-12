import time
import uuid
import logging
import asyncio
from enum import Enum
from typing import Dict, Any, Optional, List
from pathlib import Path

from backend.analysis.repository import RepositoryAnalyzer
from backend.analysis.code_search import CodeSearchEngine
from backend.analysis.ast_analyzer import ASTAnalyzer
from backend.analysis.dependency_analyzer import DependencyAnalyzer
from backend.evidence.collector import EvidenceCollector
from backend.evidence.report import EvidenceReportGenerator
from backend.evidence.validator import AntiHallucinationValidator
from backend.hypotheses.generator import WhyEngine
from backend.hypotheses.models import InvestigationResult
from backend.reproduction.engine import BugReproductionEngine
from backend.sandbox.models import ReproductionResult, ReproductionStatus

logger = logging.getLogger("bugx")

class InvestigationState(str, Enum):
    QUEUED = "QUEUED"
    ANALYZING = "ANALYZING"
    COLLECTING_EVIDENCE = "COLLECTING_EVIDENCE"
    GENERATING_HYPOTHESES = "GENERATING_HYPOTHESES"
    TESTING_HYPOTHESES = "TESTING_HYPOTHESES"
    ROOT_CAUSE_FOUND = "ROOT_CAUSE_FOUND"
    REPRODUCING = "REPRODUCING"
    GENERATING_FIX = "GENERATING_FIX"
    VERIFYING = "VERIFYING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class InvestigationRecord:
    def __init__(self, id: str, repository_url: str, bug_report: str, mode: str = "WHY"):
        self.id = id
        self.repository_url = repository_url
        self.bug_report = bug_report
        self.mode = mode
        self.state: InvestigationState = InvestigationState.QUEUED
        self.created_at: float = time.time()
        self.updated_at: float = time.time()
        self.error_message: Optional[str] = None
        
        # Pipeline Data Payload
        self.repository_info: Dict[str, Any] = {}
        self.evidence_report: Dict[str, Any] = {}
        self.investigation_result: Optional[InvestigationResult] = None
        self.reproduction_result: Optional[ReproductionResult] = None
        self.stages_log: Dict[str, Dict[str, Any]] = {}
        self.activity_events: List[Dict[str, Any]] = []

    def update_stage(self, stage_name: str, status: str, detail: str = "", duration: float = 0.0):
        self.stages_log[stage_name] = {
            "status": status,
            "detail": detail,
            "duration": round(duration, 2),
            "timestamp": time.time()
        }
        self.updated_at = time.time()

    def add_event(self, message: str, event_type: str = "info", stage: str = "Pipeline"):
        event = {
            "timestamp": time.time(),
            "message": message,
            "type": event_type,
            "stage": stage
        }
        self.activity_events.append(event)
        self.updated_at = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "repository_url": self.repository_url,
            "bug_report": self.bug_report,
            "mode": self.mode,
            "state": self.state.value,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "error_message": self.error_message,
            "repository_info": self.repository_info,
            "evidence_report": self.evidence_report,
            "investigation_result": self.investigation_result.model_dump() if self.investigation_result else None,
            "reproduction_result": self.reproduction_result.model_dump() if self.reproduction_result else None,
            "stages_log": self.stages_log,
            "activity_events": self.activity_events
        }


class InvestigationOrchestrator:
    def __init__(self):
        self.storage: Dict[str, InvestigationRecord] = {}
        self.repo_analyzer = RepositoryAnalyzer()
        self.search_engine = CodeSearchEngine()
        self.ast_analyzer = ASTAnalyzer()
        self.dep_analyzer = DependencyAnalyzer()
        self.evidence_collector = EvidenceCollector()
        self.evidence_report_gen = EvidenceReportGenerator()
        self.anti_hallucination_validator = AntiHallucinationValidator()
        self.why_engine = WhyEngine()
        self.reproduction_engine = BugReproductionEngine()

    def create_investigation(self, repository_url: str, bug_report: str, mode: str = "WHY") -> InvestigationRecord:
        investigation_id = f"inv-{uuid.uuid4().hex[:10]}"
        record = InvestigationRecord(id=investigation_id, repository_url=repository_url, bug_report=bug_report, mode=mode)
        record.add_event(f"Investigation initialized for {repository_url}", "info", "Initialization")
        self.storage[investigation_id] = record
        return record

    def get_investigation(self, investigation_id: str) -> Optional[InvestigationRecord]:
        return self.storage.get(investigation_id)

    async def run_reproduction_step(self, record: InvestigationRecord, repo_path: Path):
        t_rep = time.time()
        record.state = InvestigationState.REPRODUCING
        record.update_stage("Reproduction", "running", "Executing automated bug reproduction scenario in sandbox...")
        
        primary_hyp = record.investigation_result.hypotheses[0] if (record.investigation_result and record.investigation_result.hypotheses) else None
        
        # Build evidence collection object from current report
        evidence_coll = self.evidence_collector.collect_from_repository_analysis(
            relevant_files=record.repository_info.get("relevant_files", []),
            snippets=[]
        )

        rep_result, new_ev = await self.reproduction_engine.run_reproduction(
            repo_path=repo_path,
            repository_info=record.repository_info,
            bug_report=record.bug_report,
            primary_hypothesis=primary_hyp,
            evidence_collection=evidence_coll,
            events_callback=record.add_event
        )

        record.reproduction_result = rep_result
        
        # Append reproduction evidence to evidence report
        if new_ev:
            for ev in new_ev:
                evidence_coll.items.append(ev)
            evidence_coll.total_count = len(evidence_coll.items)
            record.evidence_report = self.evidence_report_gen.generate_report(evidence_coll)

        stage_detail = f"Status: {rep_result.status.value} ({rep_result.failures}/{rep_result.attempts} failures)"
        record.update_stage("Reproduction", "completed", stage_detail, duration=time.time() - t_rep)

    async def run_pipeline(self, record: InvestigationRecord):
        logger.info(f"[Orchestrator] Running pipeline for investigation {record.id}")
        start_time = time.time()
        repo_path: Optional[Path] = None

        try:
            # 1. ANALYZING STAGE
            t0 = time.time()
            record.state = InvestigationState.ANALYZING
            record.update_stage("Repository Analysis", "running", "Cloning repository and inspecting language structure...")
            record.add_event(f"Cloning repository {record.repository_url} into isolated workspace...", "action", "Repository Analysis")
            
            repo_path = await asyncio.to_thread(self.repo_analyzer.clone_repository, record.repository_url, record.id)
            record.add_event("Repository cloned successfully.", "success", "Repository Analysis")

            meta = await asyncio.to_thread(self.repo_analyzer.detect_language_and_framework, repo_path)
            record.add_event(f"Detected primary language: {meta['language']} | Framework: {meta['framework']}", "info", "Repository Analysis")

            directory_tree = await asyncio.to_thread(self.repo_analyzer.build_directory_tree, repo_path)
            record.add_event(f"Built directory tree structure ({len(directory_tree)} files indexed).", "info", "Repository Analysis")

            dependencies = await asyncio.to_thread(self.dep_analyzer.analyze, repo_path)
            if dependencies:
                record.add_event(f"Parsed project dependencies ({len(dependencies)} found).", "info", "Repository Analysis")

            keywords = self.search_engine.extract_keywords(record.bug_report)
            record.add_event(f"Extracted bug report keywords: {', '.join(keywords[:6])}", "action", "Repository Analysis")

            search_results = await asyncio.to_thread(self.search_engine.search_repository, repo_path, keywords)
            record.add_event(f"Identified {len(search_results['relevant_files'])} code hotspots matching bug keywords.", "success", "Repository Analysis")

            record.repository_info = {
                "name": Path(record.repository_url).stem,
                "language": meta["language"],
                "framework": meta["framework"],
                "file_count": len(directory_tree),
                "directory_tree": directory_tree[:100],
                "relevant_files": search_results["relevant_files"],
                "dependencies": dependencies
            }
            record.update_stage(
                "Repository Analysis", "completed",
                f"Detected {meta['language']} ({meta['framework']}). Identified {len(search_results['relevant_files'])} relevant file(s).",
                duration=time.time() - t0
            )

            # 2. EVIDENCE COLLECTION STAGE
            t1 = time.time()
            record.state = InvestigationState.COLLECTING_EVIDENCE
            record.update_stage("Evidence Collection", "running", "Gathering code snippets and AST metadata...")
            record.add_event("Extracting source code evidence snippets and AST signatures...", "action", "Evidence Collection")

            evidence_coll = self.evidence_collector.collect_from_repository_analysis(
                relevant_files=search_results["relevant_files"],
                snippets=search_results["snippets"]
            )
            record.evidence_report = self.evidence_report_gen.generate_report(evidence_coll)
            record.add_event(f"Collected {evidence_coll.total_count} verified evidence items.", "success", "Evidence Collection")
            
            record.update_stage(
                "Evidence Collection", "completed",
                f"Extracted {evidence_coll.total_count} evidence items.",
                duration=time.time() - t1
            )

            # 3. WHY ENGINE - GENERATING HYPOTHESES & ANTI-HALLUCINATION CHECK
            t2 = time.time()
            record.state = InvestigationState.GENERATING_HYPOTHESES
            record.update_stage("WHY Engine", "running", "Generating competing hypotheses via LLM provider...")
            record.add_event("Invoking WHY Engine with structured repository context and evidence...", "action", "WHY Engine")

            investigation_res = await self.why_engine.generate_hypotheses(
                repository_info=record.repository_info,
                bug_report=record.bug_report,
                evidence=evidence_coll
            )

            # Anti-Hallucination Evidence Validation
            record.add_event("Running Anti-Hallucination Validator on generated hypothesis evidence references...", "action", "WHY Engine")
            validated_hypotheses = self.anti_hallucination_validator.validate_investigation_result(
                hypotheses=investigation_res.hypotheses,
                root_cause=investigation_res.root_cause,
                valid_repo_files=set(directory_tree),
                collected_evidence=evidence_coll
            )
            investigation_res.hypotheses = validated_hypotheses

            record.investigation_result = investigation_res
            record.add_event(f"Generated {len(investigation_res.hypotheses)} competing hypotheses with validated evidence links.", "success", "WHY Engine")
            
            record.update_stage(
                "WHY Engine", "completed",
                f"Generated {len(investigation_res.hypotheses)} competing hypotheses.",
                duration=time.time() - t2
            )

            # 4. ROOT CAUSE STAGE
            record.state = InvestigationState.ROOT_CAUSE_FOUND
            record.update_stage("Root Cause", "completed", "Synthesized vertical causal step chain.")
            record.add_event(f"Root cause identified: {investigation_res.root_cause.summary if investigation_res.root_cause else 'Hypothesis reasoning complete'}", "success", "Root Cause")

            # 5. REPRODUCTION ENGINE STAGE
            await self.run_reproduction_step(record, repo_path)

            record.state = InvestigationState.COMPLETED
            record.add_event(f"Investigation pipeline finished successfully in {round(time.time() - start_time, 2)}s.", "success", "Pipeline")
            logger.info(f"[Orchestrator] Investigation {record.id} completed successfully in {round(time.time() - start_time, 2)}s")

        except Exception as e:
            logger.error(f"[Orchestrator] Pipeline failed for {record.id}: {e}", exc_info=True)
            record.state = InvestigationState.FAILED
            record.error_message = str(e)
            record.add_event(f"Pipeline error: {str(e)}", "error", "Pipeline Error")
            record.update_stage("Pipeline Error", "failed", str(e))
        finally:
            if repo_path and repo_path.exists():
                self.repo_analyzer.cleanup(repo_path)


# Global Orchestrator Singleton
orchestrator = InvestigationOrchestrator()
