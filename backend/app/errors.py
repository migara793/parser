from __future__ import annotations

import logging
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class ParserError(Exception):
    code: str = "parser_error"
    http_status: int = 500
    message: str = "Internal parser error"

    def __init__(self, message: Optional[str] = None, *, provider_error: Optional[str] = None):
        super().__init__(message or self.message)
        if message:
            self.message = message
        self.provider_error = provider_error


class UnsupportedFileType(ParserError):
    code = "unsupported_file_type"
    http_status = 415
    message = "Unsupported file type."


class FileTooLarge(ParserError):
    code = "file_too_large"
    http_status = 413
    message = "Uploaded file exceeds the maximum size."


class EmptyDocument(ParserError):
    code = "empty_document"
    http_status = 422
    message = "The document appears to be empty or unreadable."


class InvalidProfile(ParserError):
    code = "invalid_profile"
    http_status = 422
    message = "The provided extraction profile is invalid."


class ExtractionFailed(ParserError):
    code = "extraction_failed"
    http_status = 502
    message = "The language model failed to produce a valid candidate record."


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ParserError)
    async def _parser_error_handler(_request: Request, exc: ParserError) -> JSONResponse:
        if exc.provider_error:
            logger.error(
                "ParserError %s: %s | provider_error=%s",
                exc.code,
                exc.message,
                exc.provider_error,
            )
        else:
            logger.warning("ParserError %s: %s", exc.code, exc.message)
        return JSONResponse(
            status_code=exc.http_status,
            content={"error": {"code": exc.code, "message": exc.message}},
        )

    @app.exception_handler(Exception)
    async def _unhandled(_request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "internal_error", "message": "Internal server error."}},
        )
