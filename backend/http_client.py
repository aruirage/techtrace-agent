from __future__ import annotations

from typing import Any

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


def build_session(*, headers: dict[str, str] | None = None) -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=2,
        connect=2,
        read=2,
        backoff_factor=0.4,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET", "POST"),
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    if headers:
        session.headers.update(headers)
    session.headers.setdefault("Connection", "close")
    return session


def request_with_fallbacks(
    *,
    method: str,
    urls: list[str],
    timeout: int,
    headers: dict[str, str] | None = None,
    params: dict[str, Any] | None = None,
    json: dict[str, Any] | None = None,
    raise_for_status: bool = True,
) -> requests.Response:
    session = build_session(headers=headers)
    last_error: Exception | None = None

    for url in urls:
        try:
            response = session.request(
                method=method,
                url=url,
                timeout=timeout,
                params=params,
                json=json,
            )
            if raise_for_status:
                response.raise_for_status()
            return response
        except Exception as exc:
            last_error = exc

    if last_error is None:
        raise RuntimeError("未提供可用请求地址。")
    raise last_error
