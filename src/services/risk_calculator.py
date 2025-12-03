import numpy as np
from typing import Dict, Tuple
from src.api.models import RiskData, RiskCategory

class StrokeRiskCalculator:
    """Калькулятор риска инсульта на 6 месяцев"""
    
    # Веса факторов риска (основано на исследованиях)
    RISK_WEIGHTS = {
        'age': {
            '35-44': 1.0,
            '45-54': 1.3,
            '55-65': 1.7
        },
        'gender': {
            'male': 1.1,
            'female': 1.0
        },
        'high_bp': 2.5,
        'diabetes': 1.8,
        'current_smoking': 2.0,
        'former_smoking': 1.3,
        'atrial_fibrillation': 3.0,
        'sedentary_lifestyle': 1.4,
        'inactive_lifestyle': 1.8,
        'family_history': 1.5,
        'ldl_above_3': 1.2,
        'symptoms_often': 2.0,
        'symptoms_rarely': 1.3,
        'bmi_above_30': 1.4,
        'bmi_25_30': 1.2
    }
    
    @staticmethod
    def calculate_framingham_base(risk_data: RiskData) -> float:
        """Базовый риск по Фрамингемской шкале (10 лет)"""
        base_score = 0
        
        # Возраст
        if risk_data.age < 45:
            base_score += 0
        elif 45 <= risk_data.age < 55:
            base_score += 2
        elif 55 <= risk_data.age < 65:
            base_score += 4
        else:
            base_score += 6
        
        # Пол
        if risk_data.gender == 'male':
            base_score += 1
        
        # Давление
        if risk_data.high_bp:
            base_score += 2
        
        # Диабет
        if risk_data.diabetes:
            base_score += 2
        
        # Курение
        if risk_data.smoking == 'current':
            base_score += 3
        elif risk_data.smoking == 'former':
            base_score += 1
        
        # Конвертация в вероятность (упрощённо)
        # В реальном приложении использовать оригинальные таблицы Фрамингема
        base_probability = min(20.0, base_score * 2.5)
        return base_probability
    
    @staticmethod
    def calculate_abcd2_adjustment(risk_data: RiskData) -> float:
        """Коррекция на краткосрочный риск (модифицированная ABCD²)"""
        adjustment = 1.0
        
        # Возраст ≥60 лет
        if risk_data.age >= 60:
            adjustment *= 1.3
        
        # Давление ≥140/90
        if risk_data.high_bp:
            adjustment *= 1.5
        
        # Клинические симптомы
        symptoms_score = 0
        if risk_data.palpitations == 'often':
            symptoms_score += 1
        if risk_data.dizziness == 'often':
            symptoms_score += 1
        if risk_data.shortness_of_breath == 'often':
            symptoms_score += 1
        
        if symptoms_score >= 2:
            adjustment *= 1.8
        elif symptoms_score == 1:
            adjustment *= 1.3
        
        return adjustment
    
    @staticmethod
    def calculate_interstroke_correction(risk_data: RiskData) -> float:
        """Коррекция по INTERSTROKE факторам"""
        correction = 1.0
        
        # Образ жизни
        if risk_data.lifestyle == 'sedentary':
            correction *= 1.3
        elif risk_data.lifestyle == 'inactive':
            correction *= 1.5
        
        # Семейный анамнез
        if risk_data.family_history:
            correction *= 1.4
        
        # Фибрилляция предсердий
        if risk_data.atrial_fibrillation:
            correction *= 2.0
        
        # Высокий холестерин
        if risk_data.ldl_cholesterol and risk_data.ldl_cholesterol > 3.0:
            correction *= 1.3
        
        # Ожирение (ИМТ > 30)
        bmi = risk_data.bmi
        if bmi > 30:
            correction *= 1.4
        elif bmi > 25:
            correction *= 1.2
        
        return correction
    
    def calculate_risk(self, risk_data: RiskData) -> Dict:
        """Основной метод расчёта риска"""
        # 1. Базовый 10-летний риск
        ten_year_risk = self.calculate_framingham_base(risk_data)
        
        # 2. Конвертация в 6-месячный риск
        six_month_risk = (ten_year_risk / 10) * 0.5
        
        # 3. Применение коррекций
        abcd2_adjustment = self.calculate_abcd2_adjustment(risk_data)
        interstroke_correction = self.calculate_interstroke_correction(risk_data)
        
        adjusted_risk = six_month_risk * abcd2_adjustment * interstroke_correction
        
        # 4. Гарантируем разумные пределы
        adjusted_risk = min(15.0, max(0.1, adjusted_risk))
        
        # 5. Категоризация
        if adjusted_risk < 1.0:
            category = RiskCategory.LOW
            description = "Низкий риск"
        elif adjusted_risk <= 3.0:
            category = RiskCategory.MODERATE
            description = "Умеренный риск"
        else:
            category = RiskCategory.HIGH
            description = "Высокий риск"
        
        return {
            'risk_percentage': round(adjusted_risk, 1),
            'risk_category': category,
            'risk_description': description,
            'components': {
                'framingham_base': ten_year_risk,
                'abcd2_adjustment': abcd2_adjustment,
                'interstroke_correction': interstroke_correction
            }
        }

# Синглтон инстанс калькулятора
risk_calculator = StrokeRiskCalculator()
