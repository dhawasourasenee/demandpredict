"""Load .env for local dev. On Vercel, variables come from the dashboard; dotenv may be absent."""

from __future__ import annotations

from pathlib import Path


def load_local_env(repo_root: Path) -> None:
    try:
        from dotenv import load_dotenv as _load
    except ModuleNotFoundError:
        return
    _load(repo_root / ".env")
    _load(repo_root / ".env.local")
