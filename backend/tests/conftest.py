"""Shared pytest fixtures: moto-backed DynamoDB table + Lambda module loader.

Google HTTP is never called for real — tests stub shared.places._http_json
(the single choke point for all Google requests).
"""

import importlib.util
import json
import os
import sys
from pathlib import Path

import boto3
import pytest
from moto import mock_aws

BACKEND_DIR = Path(__file__).resolve().parents[1]
LAYER_DIR = BACKEND_DIR / "layers" / "shared"
sys.path.insert(0, str(LAYER_DIR))

os.environ["TABLE_NAME"] = "forkd-test"
os.environ["GOOGLE_API_KEY"] = "test-api-key"
os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")


@pytest.fixture()
def table():
    """Fresh moto DynamoDB table (matching template.yaml) per test."""
    with mock_aws():
        client = boto3.client("dynamodb")
        client.create_table(
            TableName="forkd-test",
            BillingMode="PAY_PER_REQUEST",
            AttributeDefinitions=[
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
                {"AttributeName": "GSI1PK", "AttributeType": "S"},
                {"AttributeName": "GSI1SK", "AttributeType": "S"},
            ],
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "GSI1",
                    "KeySchema": [
                        {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                        {"AttributeName": "GSI1SK", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
        )

        # Reset cached module state between tests
        import shared.dynamo as dynamo
        import shared.places as places
        dynamo._table = None
        places._mem_cache.clear()

        yield boto3.resource("dynamodb").Table("forkd-test")

        dynamo._table = None
        places._mem_cache.clear()


_module_cache = {}


def load_handler(function_name: str):
    """Import backend/functions/<name>/app.py under a unique module name."""
    if function_name in _module_cache:
        return _module_cache[function_name].handler
    path = BACKEND_DIR / "functions" / function_name / "app.py"
    spec = importlib.util.spec_from_file_location(f"{function_name}_app", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    _module_cache[function_name] = module
    return module.handler


def make_event(body=None, path_params=None, member_id=None, query=None):
    """Build a minimal API Gateway HTTP API event."""
    return {
        "body": json.dumps(body) if body is not None else None,
        "pathParameters": path_params or {},
        "queryStringParameters": query or {},
        "headers": {"x-partner-id": member_id} if member_id else {},
    }


def body_of(response):
    return json.loads(response["body"])


@pytest.fixture()
def room(table):
    """A couple's room with both members joined. Returns (code, member_a, member_b)."""
    create = load_handler("create_room")
    join = load_handler("join_room")

    resp = body_of(create(make_event(body={}), None))
    code = resp["room_code"]
    member_a = resp["partner_id"]

    resp = body_of(join(make_event(path_params={"code": code}), None))
    member_b = resp["partner_id"]

    return code, member_a, member_b


@pytest.fixture()
def located_room(room):
    """A couple's room with a downtown-Austin location set."""
    code, member_a, member_b = room
    set_location = load_handler("set_location")
    set_location(
        make_event(
            body={"lat": 30.2672, "lng": -97.7431, "radius_m": 8047},
            path_params={"code": code},
            member_id=member_a,
        ),
        None,
    )
    return code, member_a, member_b
