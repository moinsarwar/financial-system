class DuplicateEmailError(Exception):
    """Raised when a client email is already registered."""


class ResourceNotFoundError(Exception):
    """Raised when a requested resource does not exist."""
