from abc import ABC, abstractmethod
from pathlib import Path

from src.config import Settings, get_settings


class BaseStorage(ABC):
    @abstractmethod
    async def save(self, relative_path: str, content: bytes) -> str:
        raise NotImplementedError


class LocalStorage(BaseStorage):
    def __init__(self, base_path: str) -> None:
        self.base_path = Path(base_path)

    async def save(self, relative_path: str, content: bytes) -> str:
        destination = self.base_path / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)
        return str(destination)


class S3Storage(BaseStorage):
    def __init__(self, bucket_name: str, region: str) -> None:
        self.bucket_name = bucket_name
        self.region = region

    async def save(self, relative_path: str, content: bytes) -> str:
        raise NotImplementedError("S3 storage wiring will be added in a later milestone.")


def get_storage(settings: Settings | None = None) -> BaseStorage:
    resolved = settings or get_settings()
    if resolved.storage_backend == "s3" and resolved.aws_bucket_name:
        return S3Storage(resolved.aws_bucket_name, resolved.aws_region)
    return LocalStorage(resolved.local_storage_path)
