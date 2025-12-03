from pydantic import BaseModel, Field, validator
from typing import Optional, Literal, List
from datetime import datetime
from enum import Enum

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"

class Lifestyle(str, Enum):
    ACTIVE = "active"
    SEDENTARY = "sedentary"
    INACTIVE = "inactive"

class SmokingStatus(str, Enum):
    CURRENT = "current"
    FORMER = "former"
    NEVER = "never"

class SymptomFrequency(str, Enum):
    OFTEN = "often"
    RARELY = "rarely"
    NEVER = "never"

class RiskData(BaseModel):
    """Модель данных для оценки риска"""
    age: int = Field(..., ge=35, le=65, description="Возраст от 35 до 65 лет")
    gender: Gender
    height_cm: float = Field(..., ge=100, le=250, description="Рост в см")
    weight_kg: float = Field(..., ge=30, le=300, description="Вес в кг")
    family_history: bool = Field(..., description="Инсульт у родственников")
    lifestyle: Lifestyle
    smoking: SmokingStatus
    high_bp: bool = Field(..., description="Давление выше 130 мм.рт.ст.")
    diabetes: bool
    palpitations: SymptomFrequency
    shortness_of_breath: SymptomFrequency
    dizziness: SymptomFrequency
    atrial_fibrillation: bool
    ldl_cholesterol: Optional[float] = Field(None, ge=0, le=10, description="ЛПНП холестерин ммоль/л")
    
    @validator('ldl_cholesterol')
    def validate_ldl(cls, v):
        if v is not None and (v < 0 or v > 10):
            raise ValueError('ЛПНП должен быть между 0 и 10 ммоль/л')
        return v
    
    @property
    def bmi(self) -> float:
        """Рассчитать ИМТ"""
        height_m = self.height_cm / 100
        return round(self.weight_kg / (height_m ** 2), 1)

class RiskCategory(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"

class ActionItem(BaseModel):
    """Пункт рекомендаций"""
    priority: int
    title: str
    description: str
    frequency: str

class RiskResult(BaseModel):
    """Результат оценки риска"""
    risk_category: RiskCategory
    risk_percentage: float
    risk_description: str
    timeframe_months: int = 6
    bmi: Optional[float] = None
    recommendations: dict
    disclaimer: str = (
        "Этот инструмент не ставит диагноз и не заменяет консультацию врача. "
        "При любых подозрительных симптомах звоните 103 или 112 немедленно!"
    )
    calculation_id: str
    timestamp: datetime

class SymptomType(str, Enum):
    TYPICAL = "typical"
    ATYPICAL = "atypical"

class SymptomItem(BaseModel):
    """Симптом для образовательного модуля"""
    code: str
    title: str
    description: str
    icon: str
    emergency_level: str

class EmergencyContact(BaseModel):
    """Экстренный контакт"""
    name: str
    number: str
    description: str

class ApiResponse(BaseModel):
    """Стандартный ответ API"""
    success: bool
    data: Optional[dict] = None
    error: Optional[dict] = None
