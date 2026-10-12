class BUGXException(Exception):
    """Base exception for all BUGX errors."""
    pass

class RepositoryError(BUGXException):
    """Raised when repository cloning, parsing, or analysis fails."""
    pass

class LLMProviderError(BUGXException):
    """Raised when LLM invocation or JSON parsing fails."""
    pass

class InvestigationNotFoundError(BUGXException):
    """Raised when investigation ID is invalid or missing."""
    pass

class EvidenceCollectionError(BUGXException):
    """Raised when evidence extraction fails."""
    pass
