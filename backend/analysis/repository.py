import os
import re
import shutil
import tempfile
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import git

from backend.core.config import settings
from backend.core.exceptions import RepositoryError

logger = logging.getLogger("bugx")

IGNORE_DIRS = {
    ".git", "node_modules", "venv", ".venv", "__pycache__",
    "dist", "build", ".next", "coverage", ".pytest_cache",
    ".idea", ".vscode", "eggs", "*.egg-info"
}

IGNORE_EXTENSIONS = {
    ".pyc", ".pyo", ".png", ".jpg", ".jpeg", ".gif", ".ico",
    ".svg", ".mp4", ".zip", ".tar", ".gz", ".pdf", ".exe", ".bin"
}

class RepositoryAnalyzer:
    def __init__(self, workspace_base: Optional[str] = None):
        self.workspace_base = Path(workspace_base or settings.WORKSPACE_TEMP_DIR)
        self.workspace_base.mkdir(parents=True, exist_ok=True)

    def validate_url(self, repo_url: str) -> bool:
        pattern = r"^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git)?$"
        return bool(re.match(pattern, repo_url.strip()))

    def clone_repository(self, repo_url: str, investigation_id: str) -> Path:
        if not self.validate_url(repo_url):
            raise RepositoryError(f"Invalid GitHub repository URL: {repo_url}")
            
        target_dir = self.workspace_base / investigation_id
        if target_dir.exists():
            shutil.rmtree(target_dir, ignore_errors=True)
            
        logger.info(f"[RepositoryAnalyzer] Cloning {repo_url} into {target_dir}")
        try:
            git.Repo.clone_from(repo_url, target_dir, depth=1)
            return target_dir
        except Exception as e:
            logger.error(f"[RepositoryAnalyzer] Failed to clone repo: {e}")
            raise RepositoryError(f"Failed to clone repository: {str(e)}")

    def detect_language_and_framework(self, repo_path: Path) -> Dict[str, str]:
        extension_counts: Dict[str, int] = {}
        found_files: set = set()

        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for file in files:
                found_files.add(file.lower())
                ext = Path(file).suffix.lower()
                if ext and ext not in IGNORE_EXTENSIONS:
                    extension_counts[ext] = extension_counts.get(ext, 0) + 1

        primary_lang = "Unknown"
        if extension_counts:
            top_ext = max(extension_counts, key=extension_counts.get)
            lang_map = {
                ".py": "Python",
                ".ts": "TypeScript",
                ".tsx": "TypeScript",
                ".js": "JavaScript",
                ".jsx": "JavaScript",
                ".go": "Go",
                ".rs": "Rust",
                ".java": "Java",
                ".cpp": "C++",
                ".c": "C",
                ".rb": "Ruby",
                ".php": "PHP"
            }
            primary_lang = lang_map.get(top_ext, "Other")

        # Framework detection
        framework = "Standard Library / Unknown"
        if "package.json" in found_files:
            pkg_json_path = repo_path / "package.json"
            if pkg_json_path.exists():
                try:
                    content = pkg_json_path.read_text(encoding="utf-8", errors="ignore").lower()
                    if "next" in content:
                        framework = "Next.js"
                    elif "react" in content:
                        framework = "React"
                    elif "express" in content:
                        framework = "Express.js"
                    elif "nest" in content:
                        framework = "NestJS"
                except Exception:
                    pass
        elif "requirements.txt" in found_files or "pyproject.toml" in found_files:
            req_path = repo_path / "requirements.txt"
            pyproject_path = repo_path / "pyproject.toml"
            combined_text = ""
            if req_path.exists():
                combined_text += req_path.read_text(encoding="utf-8", errors="ignore").lower()
            if pyproject_path.exists():
                combined_text += pyproject_path.read_text(encoding="utf-8", errors="ignore").lower()

            if "fastapi" in combined_text:
                framework = "FastAPI"
            elif "flask" in combined_text:
                framework = "Flask"
            elif "django" in combined_text:
                framework = "Django"

        return {
            "language": primary_lang,
            "framework": framework
        }

    def build_directory_tree(self, repo_path: Path, max_files: int = 200) -> List[str]:
        relative_paths = []
        for root, dirs, files in os.walk(repo_path):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for file in files:
                ext = Path(file).suffix.lower()
                if ext in IGNORE_EXTENSIONS:
                    continue
                full_path = Path(root) / file
                rel_path = full_path.relative_to(repo_path).as_posix()
                relative_paths.append(rel_path)
                if len(relative_paths) >= max_files:
                    break
            if len(relative_paths) >= max_files:
                break
        return relative_paths

    def cleanup(self, repo_path: Path):
        if repo_path.exists():
            shutil.rmtree(repo_path, ignore_errors=True)
