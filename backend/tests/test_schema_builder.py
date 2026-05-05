from app.profile import CustomField, ExtractionProfile, FieldConfig
from app.schema_builder import build_candidate_model, describe_profile_for_system_prompt


def _profile(**fields_overrides):
    fields = {
        "full_name": FieldConfig(enabled=True, required=True),
        "contact.email": FieldConfig(enabled=True, required=True),
    }
    fields.update(fields_overrides)
    return ExtractionProfile(fields=fields)


def test_minimal_profile_only_keeps_requested_fields():
    profile = _profile()
    Model = build_candidate_model(profile)
    schema = Model.model_json_schema()

    props = schema["properties"]
    assert "full_name" in props
    assert "contact" in props
    # Things NOT enabled should be absent.
    assert "education" not in props
    assert "experience" not in props
    assert "projects" not in props

    required = schema.get("required", [])
    assert "full_name" in required


def test_skills_filter_categories_appended_to_description():
    profile = _profile(
        skills=FieldConfig(
            enabled=True, options={"filter_categories": ["language", "framework"]}
        ),
    )
    Model = build_candidate_model(profile)
    schema = Model.model_json_schema()
    desc = schema["properties"]["skills"]["description"]
    assert "language" in desc and "framework" in desc


def test_experience_max_items_in_description():
    profile = _profile(
        experience=FieldConfig(
            enabled=True, options={"max_items": 3, "include_bullets": True}
        ),
    )
    Model = build_candidate_model(profile)
    schema = Model.model_json_schema()
    desc = schema["properties"]["experience"]["description"]
    assert "at most 3" in desc.lower()


def test_custom_fields_added_to_dynamic_model():
    profile = _profile()
    profile = ExtractionProfile(
        fields=profile.fields,
        custom_fields=[
            CustomField(
                key="security_clearance",
                type="string",
                description="Any security clearance level mentioned, else null.",
            ),
            CustomField(
                key="open_to_relocation",
                type="boolean",
                description="True if relocation is mentioned, else null.",
            ),
        ],
    )
    Model = build_candidate_model(profile)
    schema = Model.model_json_schema()
    props = schema["properties"]
    assert "security_clearance" in props
    assert "clearance" in props["security_clearance"]["description"].lower()
    assert "open_to_relocation" in props


def test_describe_profile_summary_text():
    profile = _profile(
        skills=FieldConfig(
            enabled=True, options={"filter_categories": ["language"]}
        ),
        experience=FieldConfig(
            enabled=True, options={"max_items": 5, "include_bullets": False}
        ),
    )
    summary = describe_profile_for_system_prompt(profile)
    assert "language" in summary
    assert "5" in summary
    assert "bullet" in summary.lower()
