import os
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

def get_supabase_client() -> Client | None:
    enabled = os.getenv("SUPABASE_ENABLED", os.getenv("SUPABASE_ENABELED", "False")).lower() == "true"

    if not enabled:
        return None

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")

    if not url or not key:
        return None

    return create_client(url, key)
