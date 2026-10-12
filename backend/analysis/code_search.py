import os
import re
import logging
from pathlib import Path
from typing import List, Dict, Any

from backend.analysis.repository import IGNORE_DIRS, IGNORE_EXTENSIONS

logger = logging.getLogger("bugx")

class CodeSearchEngine:
    def extract_keywords(self, bug_report: str) -> List[str]:
        # Extract camelCase, snake_case, PascalCase, URLs, status codes, and identifiers
        words = re.findall(r"\b[a-zA-Z_][a-zA-Z0-9_\-\.]{2,}\b", bug_report)
        stop_words = {
            "the", "and", "is", "for", "with", "that", "this", "from", "bug", "report",
            "when", "where", "user", "error", "fails", "failed", "does", "not", "should",
            "have", "been", "retry", "returns", "getting", "issue", "problem"
        }
        keywords = []
        for w in words:
            w_lower = w.lower()
            if w_lower not in stop_words and len(w) > 3 and w not in keywords:
                keywords.append(w)
        return keywords[:10]

    def search_repository(self, repo_path: Path, keywords: List[str]) -> Dict[str, Any]:
        matched_snippets: List[Dict[str, Any]] = []
        file_scores: Dict[str, int] = {}
        
        if not keywords:
            return {"relevant_files": [], "snippets": []}

        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for file in files:
                ext = Path(file).suffix.lower()
                if ext in IGNORE_EXTENSIONS or not ext:
                    continue
                    
                full_path = Path(root) / file
                rel_path = full_path.relative_to(repo_path).as_posix()
                
                try:
                    lines = full_path.read_text(encoding="utf-8", errors="ignore").splitlines()
                except Exception:
                    continue

                for idx, line in enumerate(lines, start=1):
                    for kw in keywords:
                        if kw.lower() in line.lower():
                            file_scores[rel_path] = file_scores.get(rel_path, 0) + 1
                            if len(matched_snippets) < 20:
                                matched_snippets.append({
                                    "file": rel_path,
                                    "line": idx,
                                    "keyword": kw,
                                    "content": line.strip()
                                })

        # Rank files by score
        sorted_files = sorted(file_scores.items(), key=lambda x: x[1], reverse=True)
        relevant_files = [
            {"path": f_path, "reason": f"Matches {score} keyword instance(s) in bug report"}
            for f_path, score in sorted_files[:8]
        ]

        return {
            "relevant_files": relevant_files,
            "snippets": matched_snippets
        }
