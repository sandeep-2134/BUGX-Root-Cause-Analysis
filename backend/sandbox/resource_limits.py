import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class SandboxSettings(BaseSettings):
    SANDBOX_TIMEOUT_SECONDS: int = int(os.getenv("SANDBOX_TIMEOUT_SECONDS", "120"))
    SANDBOX_MEMORY_LIMIT: str = os.getenv("SANDBOX_MEMORY_LIMIT", "512m")
    SANDBOX_CPU_LIMIT: str = os.getenv("SANDBOX_CPU_LIMIT", "1.0")
    SANDBOX_MAX_OUTPUT_KB: int = int(os.getenv("SANDBOX_MAX_OUTPUT_KB", "512"))
    SANDBOX_NETWORK: str = os.getenv("SANDBOX_NETWORK", "none")
    REPRODUCTION_ATTEMPTS: int = int(os.getenv("REPRODUCTION_ATTEMPTS", "3"))

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

sandbox_limits = SandboxSettings()
