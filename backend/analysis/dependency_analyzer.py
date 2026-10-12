import json
import logging
from pathlib import Path
from typing import Dict, Any, List

logger = logging.getLogger("bugx")

class DependencyAnalyzer:
    def analyze(self, repo_path: Path) -> List[str]:
        dependencies = []
        
        # package.json
        pkg_json = repo_path / "package.json"
        if pkg_json.exists():
            try:
                data = json.loads(pkg_json.read_text(encoding="utf-8", errors="ignore"))
                deps = data.get("dependencies", {})
                dev_deps = data.get("devDependencies", {})
                dependencies.extend([f"{k}@{v}" for k, v in {**deps, **dev_deps}.items()])
            except Exception as e:
                logger.debug(f"Failed parsing package.json: {e}")

        # requirements.txt
        req_txt = repo_path / "requirements.txt"
        if req_txt.exists():
            try:
                lines = req_txt.read_text(encoding="utf-8", errors="ignore").splitlines()
                for line in lines:
                    clean_line = line.strip()
                    if clean_line and not clean_line.startswith("#"):
                        dependencies.append(clean_line)
            except Exception as e:
                logger.debug(f"Failed parsing requirements.txt: {e}")

        return dependencies[:30]
