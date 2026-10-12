from typing import Dict, Any
from backend.evidence.models import EvidenceCollection

class EvidenceReportGenerator:
    """
    Formats collected evidence into a clean summary payload for dashboard rendering.
    """
    def generate_report(self, collection: EvidenceCollection) -> Dict[str, Any]:
        by_type: Dict[str, int] = {}
        for item in collection.items:
            by_type[item.type.value] = by_type.get(item.type.value, 0) + 1
            
        return {
            "total_items": collection.total_count,
            "evidence_by_type": by_type,
            "items": [item.model_dump() for item in collection.items]
        }
