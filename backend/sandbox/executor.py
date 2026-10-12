import time
import asyncio
import subprocess
import logging
from typing import Dict, Any, Tuple
from backend.sandbox.resource_limits import sandbox_limits

logger = logging.getLogger("bugx")

class CommandExecutor:
    """
    Executes commands safely with strict timeouts, resource limits, and output truncation.
    """
    async def run_command_in_subprocess(
        self,
        command: str,
        cwd: str,
        timeout: int = sandbox_limits.SANDBOX_TIMEOUT_SECONDS
    ) -> Tuple[int, str, str, float]:
        start_time = time.time()
        max_bytes = sandbox_limits.SANDBOX_MAX_OUTPUT_KB * 1024

        try:
            logger.info(f"[CommandExecutor] Running subprocess command: '{command}' in {cwd}")
            proc = await asyncio.create_subprocess_shell(
                command,
                cwd=cwd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    proc.communicate(),
                    timeout=float(timeout)
                )
                duration_ms = (time.time() - start_time) * 1000.0
                exit_code = proc.returncode if proc.returncode is not None else 1

                stdout = stdout_bytes.decode("utf-8", errors="ignore")[:max_bytes]
                stderr = stderr_bytes.decode("utf-8", errors="ignore")[:max_bytes]

                return exit_code, stdout, stderr, round(duration_ms, 2)

            except asyncio.TimeoutError:
                logger.warning(f"[CommandExecutor] Command timed out after {timeout}s: '{command}'")
                try:
                    proc.kill()
                    await proc.wait()
                except Exception:
                    pass
                duration_ms = (time.time() - start_time) * 1000.0
                return 124, "", f"Command execution timed out after {timeout} seconds.", round(duration_ms, 2)

        except Exception as e:
            logger.error(f"[CommandExecutor] Command execution error: {e}")
            duration_ms = (time.time() - start_time) * 1000.0
            return 1, "", f"Execution error: {str(e)}", round(duration_ms, 2)
