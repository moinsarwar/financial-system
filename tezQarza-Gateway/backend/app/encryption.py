from cryptography.fernet import Fernet
from .config import settings

cipher = Fernet(settings.ENCRYPTION_KEY.encode())

def encrypt_value(value: str) -> str:
    return cipher.encrypt(value.encode()).decode()

def decrypt_value(encrypted: str) -> str:
    return cipher.decrypt(encrypted.encode()).decode()

def mask_cnic(cnic: str) -> str:
    return cnic[:5] + "****" + cnic[-4:]

def mask_mobile(mobile: str) -> str:
    return mobile[:4] + "******" + mobile[-2:]
