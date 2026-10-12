import logging
from typing import List, Dict, Any
from backend.evidence.models import EvidenceItem, EvidenceType, EvidenceCollection

logger = logging.getLogger("bugx")

class EvidenceCollector:
    """
    Collects structured evidence from repository analysis, code searches,
    stack trace parsing, and file inspect steps.
    """
    def collect_from_repository_analysis(
        self,
        relevant_files: List[Dict[str, Any]],
        snippets: List[Dict[str, Any]]
    ) -> EvidenceCollection:
        items: List[EvidenceItem] = []
        
        # Collect source code evidence items from snippets
        for snip in snippets:
            line_val = snip.get("line")
            items.append(
                EvidenceItem(
                    id=f"E{len(items) + 1}",
                    type=EvidenceType.SOURCE_CODE,
                    source="repository",
                    file=snip.get("file"),
                    line=line_val,
                    line_start=line_val,
                    line_end=line_val,
                    description=f"Match for keyword '{snip.get('keyword')}': {snip.get('content', '').strip()[:100]}",
                    snippet=snip.get("content"),
                    verified=True
                )
            )
            
        # Collect structural evidence for relevant files
        for f in relevant_files:
            items.append(
                EvidenceItem(
                    id=f"E{len(items) + 1}",
                    type=EvidenceType.SOURCE_CODE,
                    source="ast_analysis",
                    file=f.get("path"),
                    description=f"File identified as relevant: {f.get('reason')}",
                    verified=True
                )
            )
            
        return EvidenceCollection(items=items, total_count=len(items))
