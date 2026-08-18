"""Thin client for the PandaScore REST API (https://developers.pandascore.co)."""

import requests
from django.conf import settings

BASE_URL = "https://api.pandascore.co"


def _get(path, params=None):
    response = requests.get(
        f"{BASE_URL}{path}",
        headers={"Authorization": f"Bearer {settings.PANDASCORE_API_TOKEN}"},
        params=params or {},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def fetch_matches(endpoint, per_page=50):
    """endpoint: one of 'upcoming' | 'running' | 'past'."""
    return _get(f"/matches/{endpoint}", params={"per_page": per_page})
