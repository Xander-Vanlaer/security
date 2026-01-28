"""
Admin router for managing users, regions, hospitals, and API keys
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Region, Hospital, APIKey
from app.schemas import (
    UserResponse, UserRoleUpdate, UserAssignment,
    RegionCreate, RegionResponse,
    HospitalCreate, HospitalResponse,
    APIKeyCreate, APIKeyResponse, MessageResponse
)
from app.dependencies import require_admin
import secrets

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.post("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update user role (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from changing their own role
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    user.role = role_update.role
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/users/{user_id}/assign", response_model=UserResponse)
async def assign_user(
    user_id: int,
    assignment: UserAssignment,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Assign user to region/hospital (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate region exists if provided
    if assignment.region_id:
        region = db.query(Region).filter(Region.id == assignment.region_id).first()
        if not region:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Region not found"
            )
    
    # Validate hospital exists if provided
    if assignment.hospital_id:
        hospital = db.query(Hospital).filter(Hospital.id == assignment.hospital_id).first()
        if not hospital:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hospital not found"
            )
        # Ensure hospital belongs to the region if region is also being set
        if assignment.region_id and hospital.region_id != assignment.region_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hospital does not belong to the specified region"
            )
    
    user.region_id = assignment.region_id
    user.hospital_id = assignment.hospital_id
    db.commit()
    db.refresh(user)
    
    return user


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    role: Optional[int] = None,
    region_id: Optional[int] = None,
    hospital_id: Optional[int] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all users with optional filters (admin only)"""
    query = db.query(User)
    
    if role is not None:
        query = query.filter(User.role == role)
    if region_id is not None:
        query = query.filter(User.region_id == region_id)
    if hospital_id is not None:
        query = query.filter(User.hospital_id == hospital_id)
    
    users = query.all()
    return users


@router.get("/regions", response_model=List[RegionResponse])
async def list_regions(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all regions (admin only)"""
    regions = db.query(Region).all()
    return regions


@router.post("/regions", response_model=RegionResponse, status_code=status.HTTP_201_CREATED)
async def create_region(
    region_data: RegionCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new region (admin only)"""
    # Check if region with same name or code exists
    existing = db.query(Region).filter(
        (Region.name == region_data.name) | (Region.code == region_data.code)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Region with this name or code already exists"
        )
    
    region = Region(
        name=region_data.name,
        code=region_data.code
    )
    db.add(region)
    db.commit()
    db.refresh(region)
    
    return region


@router.get("/hospitals", response_model=List[HospitalResponse])
async def list_hospitals(
    region_id: Optional[int] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all hospitals with optional region filter (admin only)"""
    query = db.query(Hospital)
    
    if region_id is not None:
        query = query.filter(Hospital.region_id == region_id)
    
    hospitals = query.all()
    return hospitals


@router.post("/hospitals", response_model=HospitalResponse, status_code=status.HTTP_201_CREATED)
async def create_hospital(
    hospital_data: HospitalCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new hospital (admin only)"""
    # Check if region exists
    region = db.query(Region).filter(Region.id == hospital_data.region_id).first()
    if not region:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Region not found"
        )
    
    # Check if hospital with same name or code exists
    existing = db.query(Hospital).filter(
        (Hospital.name == hospital_data.name) | (Hospital.code == hospital_data.code)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hospital with this name or code already exists"
        )
    
    hospital = Hospital(
        name=hospital_data.name,
        code=hospital_data.code,
        region_id=hospital_data.region_id,
        address=hospital_data.address
    )
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    
    return hospital


@router.post("/api-keys", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    api_key_data: APIKeyCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Generate API key for hospital (admin only)"""
    # Check if hospital exists
    hospital = db.query(Hospital).filter(Hospital.id == api_key_data.hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found"
        )
    
    # Generate secure API key
    api_key_value = f"sk_{secrets.token_urlsafe(32)}"
    
    api_key = APIKey(
        key=api_key_value,
        hospital_id=api_key_data.hospital_id,
        description=api_key_data.description
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    
    return api_key


@router.delete("/api-keys/{key_id}", response_model=MessageResponse)
async def revoke_api_key(
    key_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Revoke API key (admin only)"""
    api_key = db.query(APIKey).filter(APIKey.id == key_id).first()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    api_key.is_active = False
    db.commit()
    
    return MessageResponse(message="API key revoked successfully")


@router.get("/api-keys", response_model=List[APIKeyResponse])
async def list_api_keys(
    hospital_id: Optional[int] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all API keys with optional hospital filter (admin only)"""
    query = db.query(APIKey)
    
    if hospital_id is not None:
        query = query.filter(APIKey.hospital_id == hospital_id)
    
    api_keys = query.all()
    return api_keys
