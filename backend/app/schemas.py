"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """Base user schema"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    """Schema for user registration"""
    password: str = Field(..., min_length=8)
    
    @validator('password')
    def password_strength(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str


class User2FAVerify(BaseModel):
    """Schema for 2FA verification"""
    username: str
    totp_code: str = Field(..., min_length=6, max_length=6)


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    is_2fa_enabled: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    requires_2fa: bool = False


class Token2FAResponse(BaseModel):
    """Schema for 2FA token response"""
    requires_2fa: bool = True
    message: str = "2FA code required"


class Enable2FAResponse(BaseModel):
    """Schema for enable 2FA response"""
    qr_code: str
    secret: str
    message: str = "Scan QR code with your authenticator app"


class MessageResponse(BaseModel):
    """Generic message response"""
    message: str


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request"""
    refresh_token: str


class DataItemCreate(BaseModel):
    """Schema for creating data item"""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)


class DataItemResponse(BaseModel):
    """Schema for data item response"""
    id: int
    user_id: int
    title: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True
