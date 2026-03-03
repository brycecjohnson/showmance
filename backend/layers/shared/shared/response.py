"""Standardized API response helpers with CORS headers."""

import json
from typing import Any


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Partner-Id",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
}


def success(body: Any, status_code: int = 200) -> dict:
    return {
        "statusCode": status_code,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(body, default=str),
    }


def created(body: Any) -> dict:
    return success(body, status_code=201)


def error(message: str, status_code: int = 400) -> dict:
    return {
        "statusCode": status_code,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"error": message}),
    }


def not_found(message: str = "Not found") -> dict:
    return error(message, status_code=404)


def server_error(message: str = "Internal server error") -> dict:
    return error(message, status_code=500)
