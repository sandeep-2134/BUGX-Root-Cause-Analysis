import os
import shutil
import logging
from pathlib import Path

logger = logging.getLogger("bugx")

class SandboxCleanup:
    def cleanup_temp_files(self, repo_path: Path, generated_files: list):
        for gf in generated_files:
            file_path = repo_path / gf
            if file_path.exists():
                try:
                    file_path.unlink()
                    logger.info(f"[SandboxCleanup] Cleaned temporary generated test file: {file_path}")
                except Exception as e:
                    logger.warning(f"[SandboxCleanup] Failed removing {file_path}: {e}")
