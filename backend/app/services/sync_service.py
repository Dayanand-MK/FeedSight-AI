import json
from backend.app.database.assessment_repository import (get_unsynced_assessments, mark_assessment_synced)
from backend.app.database.supabase_client import get_supabase_client

def sync_assessments():
    client = get_supabase_client()

    if client is None:
        return {
            "enabled" : False,
            "synced" : 0,
            "message" : "Supabase sync is disabled or not configured"
        }

    assessments = get_unsynced_assessments()
    synced_count = 0

    for item in assessments:
        try:
            data = dict(item)

            if data.get("alerts"):
                data["alerts"] = json.loads(data["alerts"])

            data.pop("id", None)
            data.pop("synced", None)

            client.table("assessments").upsert(
                data,
                on_conflict = "sample_id",
            ).execute()

            mark_assessment_synced(item["sample_id"])
            synced_count += 1

        except Exception:
            continue

    return {
        "enabled" : True,
        "synced" : synced_count,
    }