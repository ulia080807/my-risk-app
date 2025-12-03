from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict
import uuid
from datetime import datetime

from src.api.models import (
    RiskData, RiskResult, ApiResponse, 
    SymptomType, SymptomItem, EmergencyContact
)
from src.services.risk_calculator import risk_calculator
from src.services.recommendation_generator import recommendation_generator
from src.utils.validators import validate_risk_data

router = APIRouter()

@router.post("/calculate-risk", response_model=ApiResponse)
async def calculate_stroke_risk(risk_data: RiskData):
    """
    Рассчитать риск инсульта на 6 месяцев
    """
    try:
        # Валидация данных
        validation_errors = validate_risk_data(risk_data)
        if validation_errors:
            return ApiResponse(
                success=False,
                error={
                    "code": "VALIDATION_ERROR",
                    "message": "Ошибка валидации данных",
                    "details": validation_errors
                }
            )
        
        # Расчёт риска
        risk_result = risk_calculator.calculate_risk(risk_data)
        
        # Генерация рекомендаций
        recommendations = recommendation_generator.get_risk_specific_recommendations(
            risk_category=risk_result['risk_category'],
            risk_data=risk_data
        )
        
        # Формирование ответа
        result_data = RiskResult(
            risk_category=risk_result['risk_category'],
            risk_percentage=risk_result['risk_percentage'],
            risk_description=risk_result['risk_description'],
            bmi=risk_data.bmi,
            recommendations=recommendations,
            calculation_id=f"calc_{uuid.uuid4().hex[:12]}",
            timestamp=datetime.now()
        )
        
        return ApiResponse(
            success=True,
            data=result_data.dict()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "CALCULATION_ERROR",
                    "message": f"Ошибка при расчёте риска: {str(e)}"
                }
            }
        )

@router.get("/educational-content", response_model=ApiResponse)
async def get_educational_content(category: SymptomType = None):
    """
    Получить образовательный контент по симптомам инсульта
    """
    try:
        content = recommendation_generator.get_educational_content()
        
        # Фильтрация по категории если указана
        if category:
            if category == SymptomType.TYPICAL:
                filtered_content = {
                    "typical_symptoms": content["typical_symptoms"],
                    "emergency_contacts": content["emergency_contacts"]
                }
            elif category == SymptomType.ATYPICAL:
                filtered_content = {
                    "atypical_symptoms": content["atypical_symptoms"],
                    "emergency_contacts": content["emergency_contacts"]
                }
            else:
                filtered_content = content
        else:
            filtered_content = content
        
        return ApiResponse(
            success=True,
            data=filtered_content
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "CONTENT_ERROR",
                    "message": f"Ошибка при получении контента: {str(e)}"
                }
            }
        )

@router.post("/anonymous-session", response_model=ApiResponse)
async def create_anonymous_session(device_info: Dict):
    """
    Создать анонимную сессию (для MVP - заглушка)
    """
    try:
        session_id = f"anon_{uuid.uuid4().hex[:16]}"
        
        return ApiResponse(
            success=True,
            data={
                "session_id": session_id,
                "expires_at": (datetime.now().timestamp() + 86400),  # 24 часа
                "data_retention_hours": 24,
                "message": "Сессия создана. Данные будут удалены через 24 часа."
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "SESSION_ERROR",
                    "message": f"Ошибка при создании сессии: {str(e)}"
                }
            }
        )

@router.get("/risk-factors", response_model=ApiResponse)
async def get_risk_factors_info():
    """
    Получить информацию о факторах риска
    """
    factors_info = {
        "factors": [
            {
                "name": "Артериальное давление",
                "description": "Давление выше 130/85 мм рт. ст.",
                "impact": "Высокое",
                "control_tips": [
                    "Измеряйте АД утром и вечером",
                    "Ограничьте соль до 5 г/день",
                    "Регулярная физическая активность"
                ]
            },
            {
                "name": "Курение",
                "description": "Любое количество сигарет",
                "impact": "Очень высокое",
                "control_tips": [
                    "Немедленно прекратите курение",
                    "Обратитесь за помощью к врачу",
                    "Используйте никотинозаместительную терапию"
                ]
            },
            {
                "name": "Сахарный диабет",
                "description": "Уровень глюкозы натощак > 7 ммоль/л",
                "impact": "Высокое",
                "control_tips": [
                    "Контролируйте уровень сахара",
                    "Соблюдайте диету",
                    "Принимайте назначенные препараты"
                ]
            },
            {
                "name": "Ожирение",
                "description": "ИМТ > 30 кг/м²",
                "impact": "Среднее",
                "control_tips": [
                    "Снижайте вес на 5-10% от текущего",
                    "Увеличьте физическую активность",
                    "Сбалансированное питание"
                ]
            },
            {
                "name": "Мерцательная аритмия",
                "description": "Нерегулярное сердцебиение",
                "impact": "Очень высокое",
                "control_tips": [
                    "Регулярный контроль ЭКГ",
                    "Приём антикоагулянтов по назначению врача",
                    "Избегайте алкоголя и кофеина"
                ]
            }
        ]
    }
    
    return ApiResponse(success=True, data=factors_info)
