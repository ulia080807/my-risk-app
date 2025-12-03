# Спецификация API v1.0

## Базовый URL
`https://api.my-risk.ru/v1`

## Аутентификация
Все запросы требуют API ключ:
## Эндпоинты

### POST /assessment/calculate
Расчёт риска инсульта.

**Тело запроса:**
```json
{
  "user_data": {
    "age": 55,
    "gender": "male",
    "systolic_bp": 145,
    "diastolic_bp": 95,
    "has_diabetes": false,
    "is_smoker": true,
    "has_afib": false,
    "cholesterol_total": 5.2,
    "cholesterol_ldl": 3.4,
    "bmi": 28.5
  }
}

{
  "status": "success",
  "data": {
    "risk_score": 18.7,
    "risk_level": "moderate",
    "framingham_score": 12,
    "interpretation": "Умеренный риск инсульта",
    "recommendations": [
      {
        "priority": "high",
        "title": "Снизить давление",
        "description": "Целевое значение: <140/90 мм рт.ст."
      },
      {
        "priority": "medium",
        "title": "Бросить курить",
        "description": "Курение увеличивает риск в 2 раза"
      }
    ],
    "next_check_date": "2024-04-15"
  }
}
