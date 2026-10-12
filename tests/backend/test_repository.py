import pytest
from pathlib import Path
from backend.analysis.repository import RepositoryAnalyzer
from backend.analysis.code_search import CodeSearchEngine

def test_validate_url():
    analyzer = RepositoryAnalyzer()
    assert analyzer.validate_url("https://github.com/fastapi/fastapi") is True
    assert analyzer.validate_url("https://github.com/user/project.git") is True
    assert analyzer.validate_url("not_a_url") is False
    assert analyzer.validate_url("http://github.com/insecure/repo") is False

def test_extract_keywords():
    search = CodeSearchEngine()
    bug_report = "Payment API returns HTTP 500 state machine transition error in payment_service.py"
    keywords = search.extract_keywords(bug_report)
    assert "payment" in keywords or "payment_service.py" in keywords or "transition" in keywords
