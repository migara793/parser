import json

import pytest

from app.errors import InvalidProfile
from app.profile import CustomField, parse_profile


def test_parse_profile_from_json_string():
    raw = json.dumps(
        {
            "name": "Test",
            "fields": {
                "full_name": {"enabled": True, "required": True},
                "contact.email": {"enabled": True},
            },
        }
    )
    p = parse_profile(raw)
    assert p.name == "Test"
    assert p.fields["full_name"].enabled is True


def test_parse_profile_rejects_missing_full_name():
    raw = json.dumps({"fields": {"headline": {"enabled": True}}})
    with pytest.raises(InvalidProfile):
        parse_profile(raw)


def test_parse_profile_rejects_unknown_keys():
    raw = json.dumps(
        {
            "fields": {
                "full_name": {"enabled": True},
                "not_a_real_field": {"enabled": True},
            }
        }
    )
    with pytest.raises(InvalidProfile):
        parse_profile(raw)


def test_custom_field_key_validation():
    with pytest.raises(Exception):
        CustomField(key="Bad-Key!", type="string", description="x")
    cf = CustomField(key="ok_key", type="string", description="x")
    assert cf.key == "ok_key"
