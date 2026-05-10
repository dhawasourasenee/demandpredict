from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


def set_request_id(value: str) -> None:
    request_id_var.set(value)


def get_request_id() -> str:
    return request_id_var.get()
