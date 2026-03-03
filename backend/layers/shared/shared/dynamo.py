"""DynamoDB client and helpers for the Showmance single-table design."""

import os
import boto3
from boto3.dynamodb.conditions import Key
from typing import Any, Optional


_table = None


def get_table():
    """Get (or lazily create) the DynamoDB Table resource."""
    global _table
    if _table is None:
        dynamodb = boto3.resource("dynamodb")
        _table = dynamodb.Table(os.environ["TABLE_NAME"])
    return _table


def put_item(item: dict) -> dict:
    """Put an item into the table."""
    return get_table().put_item(Item=item)


def get_item(pk: str, sk: str) -> Optional[dict]:
    """Get a single item by PK/SK. Returns None if not found."""
    resp = get_table().get_item(Key={"PK": pk, "SK": sk})
    return resp.get("Item")


def update_item(pk: str, sk: str, update_expr: str, expr_values: dict,
                expr_names: dict = None, condition_expr: str = None) -> dict:
    """Update an item with an update expression."""
    kwargs = {
        "Key": {"PK": pk, "SK": sk},
        "UpdateExpression": update_expr,
        "ExpressionAttributeValues": expr_values,
        "ReturnValues": "ALL_NEW",
    }
    if expr_names:
        kwargs["ExpressionAttributeNames"] = expr_names
    if condition_expr:
        kwargs["ConditionExpression"] = condition_expr
    return get_table().update_item(**kwargs)


def query_pk(pk: str, sk_prefix: str = None, limit: int = None) -> list[dict]:
    """Query items by PK with optional SK prefix."""
    kwargs = {"KeyConditionExpression": Key("PK").eq(pk)}
    if sk_prefix:
        kwargs["KeyConditionExpression"] &= Key("SK").begins_with(sk_prefix)
    if limit:
        kwargs["Limit"] = limit
    resp = get_table().query(**kwargs)
    return resp.get("Items", [])


def query_gsi1(gsi1pk: str, scan_forward: bool = True, limit: int = None) -> list[dict]:
    """Query the GSI1 index."""
    kwargs = {
        "IndexName": "GSI1",
        "KeyConditionExpression": Key("GSI1PK").eq(gsi1pk),
        "ScanIndexForward": scan_forward,
    }
    if limit:
        kwargs["Limit"] = limit
    resp = get_table().query(**kwargs)
    return resp.get("Items", [])


def atomic_add_to_set(pk: str, sk: str, attribute: str, values: set) -> dict:
    """Atomically add values to a DynamoDB set attribute. Creates the item if it doesn't exist."""
    return get_table().update_item(
        Key={"PK": pk, "SK": sk},
        UpdateExpression="ADD #attr :vals",
        ExpressionAttributeNames={"#attr": attribute},
        ExpressionAttributeValues={":vals": values},
    )
