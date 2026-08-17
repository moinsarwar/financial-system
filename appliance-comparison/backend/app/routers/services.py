from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_services():
    return {
        "services": [
            {"id": "delivery", "name": "Delivery", "icon": "fa-truck"},
            {"id": "installation", "name": "Installation", "icon": "fa-wrench"},
            {"id": "warranty", "name": "Warranty", "icon": "fa-file-contract"},
            {"id": "repair", "name": "Repair", "icon": "fa-screwdriver"},
        ]
    }
