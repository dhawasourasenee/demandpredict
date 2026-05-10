import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.request_context import set_request_id


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        req_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        set_request_id(req_id)
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response
