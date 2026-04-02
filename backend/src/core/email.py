from abc import ABC, abstractmethod

from src.config import Settings, get_settings


class BaseEmailService(ABC):
    @abstractmethod
    async def send(self, *, to_email: str, subject: str, body: str) -> None:
        raise NotImplementedError


class ConsoleEmail(BaseEmailService):
    async def send(self, *, to_email: str, subject: str, body: str) -> None:
        print(
            "ConsoleEmail",
            {
                "to_email": to_email,
                "subject": subject,
                "body": body,
            },
        )


class SESEmail(BaseEmailService):
    def __init__(self, from_email: str) -> None:
        self.from_email = from_email

    async def send(self, *, to_email: str, subject: str, body: str) -> None:
        raise NotImplementedError("SES delivery wiring will be added in a later milestone.")


def get_email_service(settings: Settings | None = None) -> BaseEmailService:
    resolved = settings or get_settings()
    if resolved.email_backend == "ses":
        return SESEmail(resolved.email_from)
    return ConsoleEmail()
