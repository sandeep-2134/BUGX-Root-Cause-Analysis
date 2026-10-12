import os
import time
import asyncio
import logging
from pathlib import Path
from typing import Tuple, Dict, Any, Optional

from backend.sandbox.resource_limits import sandbox_limits
from backend.sandbox.executor import CommandExecutor

logger = logging.getLogger("bugx")

class DockerManager:
    def __init__(self):
        self.executor = CommandExecutor()

    async def is_docker_available(self) -> bool:
        """Check if Docker CLI and daemon are operational."""
        try:
            exit_code, stdout, stderr, _ = await self.executor.run_command_in_subprocess(
                "docker info",
                cwd=str(Path.cwd()),
                timeout=5
            )
            return exit_code == 0
        except Exception:
            return False

    async def run_in_sandbox(
        self,
        repo_path: Path,
        command: str,
        image: str = "python:3.11-slim",
        timeout: int = sandbox_limits.SANDBOX_TIMEOUT_SECONDS
    ) -> Tuple[int, str, str, float, bool]:
        """
        Executes command in Docker container with resource limits.
        Returns: (exit_code, stdout, stderr, duration_ms, is_docker_used)
        """
        docker_active = await self.is_docker_available()
        
        if docker_active:
            logger.info(f"[DockerManager] Running command in Docker container ({image}): '{command}'")
            # Build docker run command with security & resource constraints
            container_name = f"bugx-sandbox-{int(time.time()*1000)}"
            repo_abs = str(repo_path.resolve())

            docker_cmd = (
                f"docker run --rm --name {container_name} "
                f"--memory={sandbox_limits.SANDBOX_MEMORY_LIMIT} "
                f"--cpus={sandbox_limits.SANDBOX_CPU_LIMIT} "
                f"--network={sandbox_limits.SANDBOX_NETWORK} "
                f"-v \"{repo_abs}:/workspace\" "
                f"-w /workspace "
                f"{image} "
                f"sh -c \"{command}\""
            )

            exit_code, stdout, stderr, duration_ms = await self.executor.run_command_in_subprocess(
                docker_cmd,
                cwd=repo_abs,
                timeout=timeout
            )
            return exit_code, stdout, stderr, duration_ms, True
        else:
            logger.info(f"[DockerManager] Docker daemon unavailable. Falling back to isolated workspace runner for: '{command}'")
            exit_code, stdout, stderr, duration_ms = await self.executor.run_command_in_subprocess(
                command,
                cwd=str(repo_path),
                timeout=timeout
            )
            return exit_code, stdout, stderr, duration_ms, False
