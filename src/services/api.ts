import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Типы данных
export interface RiskData {
  age: number;
  gender: 'male' | 'female';
  height_cm: number;
  weight_kg: number;
  family_history: boolean;
  lifestyle: 'active' | 'sedentary' | 'inactive';
  smoking: 'current' | 'former' | 'never';
  high_bp: boolean;
  diabetes: boolean;
  palpitations: 'often' | 'rarely' | 'never';
  shortness_of_breath: 'often' | 'rarely' | 'never';
  dizziness: 'often' | 'rarely' | 'never';
  atrial_fibrillation: boolean;
  ldl_cholesterol?: number;
}

export interface RiskResult {
  risk_category: 'low' | 'moderate' | 'high';
  risk_percentage: number;
  risk_description: string;
  timeframe_months: number;
  bmi?: number;
  recommendations: {
    general: string;
    actions: Array<{
      priority: number;
      title: string;
      description: string;
      frequency: string;
    }>;
    emergency_advice: string;
  };
  disclaimer: string;
  calculation_id: string;
  timestamp: string;
}

export interface SymptomItem {
  code: string;
  title: string;
  description: string;
  icon: string;
  emergency_level: string;
}

export interface EmergencyContact {
  name: string;
  number: string;
  description: string;
}

export interface EducationalContent {
  typical_symptoms: SymptomItem[];
  atypical_symptoms: SymptomItem[];
  emergency_contacts: EmergencyContact[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface AnonymousSession {
  session_id: string;
  expires_at: number;
  data_retention_hours: number;
  message: string;
}

// Конфигурация API
const API_CONFIG = {
  // Для разработки
  BASE_URL_DEV: 'http://localhost:8000/api',
  // Для продакшена (замените на ваш URL)
  BASE_URL_PROD: 'https://api.moy-risk.ru/api',
  
  // Таймауты
  TIMEOUT: 10000, // 10 секунд
  
  // Повторные попытки
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 секунда
};

// Определяем базовый URL в зависимости от окружения
const getBaseUrl = (): string => {
  if (__DEV__) {
    // Для iOS симулятора
    if (Platform.OS === 'ios') {
      return 'http://localhost:8000/api';
    }
    // Для Android эмулятора
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8000/api';
    }
    return API_CONFIG.BASE_URL_DEV;
  }
  return API_CONFIG.BASE_URL_PROD;
};

// Ключи для AsyncStorage
const STORAGE_KEYS = {
  SESSION_ID: '@moy_risk_session_id',
  LAST_RESULT: '@moy_risk_last_result',
  API_CACHE: '@moy_risk_api_cache',
};

class ApiService {
  private static instance: ApiService;
  private api: AxiosInstance;
  private sessionId: string | null = null;

  private constructor() {
    this.api = axios.create({
      baseURL: getBaseUrl(),
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': `MoyRiskApp/1.0.0 (${Platform.OS})`,
      },
    });

    this.setupInterceptors();
    this.initializeSession();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        // Добавляем сессию если есть
        if (this.sessionId) {
          config.headers['X-Session-Id'] = this.sessionId;
        }

        // Добавляем timestamp для предотвращения кеширования
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now(),
          };
        }

        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error: AxiosError) => {
        console.error('API Response Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message,
        });

        // Обработка специфических ошибок
        if (error.response) {
          switch (error.response.status) {
            case 401:
              // Сессия истекла, создаем новую
              await this.createSession();
              break;
            case 404:
              Alert.alert('Ошибка', 'Сервис временно недоступен');
              break;
            case 500:
              Alert.alert('Ошибка сервера', 'Пожалуйста, попробуйте позже');
              break;
            default:
              Alert.alert('Ошибка', 'Что-то пошло не так');
          }
        } else if (error.request) {
          // Нет ответа от сервера
          Alert.alert(
            'Нет подключения',
            'Проверьте интернет-соединение и попробуйте снова'
          );
        }

        return Promise.reject(error);
      }
    );
  }

  private async initializeSession(): Promise<void> {
    try {
      // Пытаемся получить сохранённую сессию
      const savedSession = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_ID);
      
      if (savedSession) {
        this.sessionId = savedSession;
        console.log('Session restored:', this.sessionId);
      } else {
        // Создаем новую сессию
        await this.createSession();
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      await this.createSession();
    }
  }

  private async createSession(): Promise<void> {
    try {
      const response = await this.api.post<ApiResponse<AnonymousSession>>('/anonymous-session', {
        device_id: this.getDeviceId(),
        platform: Platform.OS,
      });

      if (response.data.success && response.data.data) {
        this.sessionId = response.data.data.session_id;
        await AsyncStorage.setItem(STORAGE_KEYS.SESSION_ID, this.sessionId);
        console.log('New session created:', this.sessionId);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      // Генерируем локальную сессию как fallback
      this.sessionId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  private getDeviceId(): string {
    // В реальном приложении используйте реальный device ID
    // Для MVP используем комбинацию платформы и случайной строки
    return `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Основные методы API

  /**
   * Рассчитать риск инсульта
   */
  public async calculateRisk(riskData: RiskData): Promise<ApiResponse<RiskResult>> {
    try {
      const response = await this.api.post<ApiResponse<RiskResult>>(
        '/calculate-risk',
        riskData
      );

      // Сохраняем результат локально
      if (response.data.success && response.data.data) {
        await this.saveLastResult(riskData, response.data.data);
      }

      return response.data;
    } catch (error: any) {
      return this.handleApiError(error);
    }
  }

  /**
   * Получить образовательный контент
   */
  public async getEducationalContent(
    category?: 'typical' | 'atypical'
  ): Promise<ApiResponse<EducationalContent>> {
    try {
      const params = category ? { category } : undefined;
      const cacheKey = `education_${category || 'all'}`;
      
      // Проверяем кеш
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.api.get<ApiResponse<EducationalContent>>(
        '/educational-content',
        { params }
      );

      // Кешируем результат
      if (response.data.success) {
        await this.saveToCache(cacheKey, response.data);
      }

      return response.data;
    } catch (error: any) {
      // В случае ошибки возвращаем запасные данные
      return this.getFallbackEducationalContent(category);
    }
  }

  /**
   * Получить информацию о факторах риска
   */
  public async getRiskFactors(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get<ApiResponse>('/risk-factors');
      return response.data;
    } catch (error: any) {
      return this.handleApiError(error);
    }
  }

  /**
   * Проверить доступность сервера
   */
  public async checkServerHealth(): Promise<boolean> {
    try {
      const response = await this.api.get('/health', {
        timeout: 5000, // Быстрая проверка
      });
      return response.status === 200;
    } catch (error) {
      console.log('Server health check failed:', error);
      return false;
    }
  }

  /**
   * Получить последний сохранённый результат
   */
  public async getLastResult(): Promise<{
    riskData: RiskData;
    result: RiskResult;
    timestamp: number;
  } | null> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.LAST_RESULT);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error getting last result:', error);
      return null;
    }
  }

  /**
   * Сохранить результат локально
   */
  private async saveLastResult(riskData: RiskData, result: RiskResult): Promise<void> {
    try {
      const data = {
        riskData,
        result,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_RESULT, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving last result:', error);
    }
  }

  /**
   * Очистить историю
   */
  public async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_RESULT);
      await AsyncStorage.removeItem(STORAGE_KEYS.API_CACHE);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  /**
   * Утилиты для кеширования
   */
  private async saveToCache(key: string, data: any): Promise<void> {
    try {
      const cache = await this.getCache();
      cache[key] = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.API_CACHE, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  private async getFromCache(key: string): Promise<any | null> {
    try {
      const cache = await this.getCache();
      const cachedItem = cache[key];
      
      if (cachedItem) {
        // Проверяем срок жизни кеша (1 час)
        const isExpired = Date.now() - cachedItem.timestamp > 60 * 60 * 1000;
        if (!isExpired) {
          return cachedItem.data;
        }
        // Удаляем просроченный кеш
        delete cache[key];
        await AsyncStorage.setItem(STORAGE_KEYS.API_CACHE, JSON.stringify(cache));
      }
      return null;
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  }

  private async getCache(): Promise<Record<string, any>> {
    try {
      const cache = await AsyncStorage.getItem(STORAGE_KEYS.API_CACHE);
      return cache ? JSON.parse(cache) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Обработка ошибок API
   */
  private handleApiError(error: any): ApiResponse {
    console.error('API Error:', error);
    
    // Если это axios error
    if (error.isAxiosError) {
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Время ожидания истекло. Проверьте подключение к интернету.',
          },
        };
      }
      
      if (!error.response) {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Нет подключения к интернету. Проверьте ваше соединение.',
          },
        };
      }
      
      // Ошибка от сервера
      return {
        success: false,
        error: {
          code: `HTTP_${error.response.status}`,
          message: error.response.data?.error?.message || 'Ошибка сервера',
          details: error.response.data,
        },
      };
    }
    
    // Другие ошибки
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'Произошла неизвестная ошибка',
      },
    };
  }

  /**
   * Запасной образовательный контент (на случай если API недоступен)
   */
  private getFallbackEducationalContent(
    category?: 'typical' | 'atypical'
  ): ApiResponse<EducationalContent> {
    const fallbackContent: EducationalContent = {
      typical_symptoms: [
        {
          code: 'FAST_F',
          title: 'Лицо (Face)',
          description: 'Асимметрия лица, опущение уголка рта, невозможность улыбнуться равномерно',
          icon: '😐',
          emergency_level: 'high',
        },
        {
          code: 'FAST_A',
          title: 'Руки (Arms)',
          description: 'Слабость или онемение в одной руке, невозможность поднять обе руки одновременно',
          icon: '💪',
          emergency_level: 'high',
        },
        {
          code: 'FAST_S',
          title: 'Речь (Speech)',
          description: 'Нарушение речи, невнятная или спутанная речь, невозможность повторить простую фразу',
          icon: '🗣️',
          emergency_level: 'high',
        },
      ],
      atypical_symptoms: [
        {
          code: 'ATYP_1',
          title: 'Икота + тошнота',
          description: 'Упорная икота с тошнотой, особенно у женщин',
          icon: '🤢',
          emergency_level: 'medium',
        },
        {
          code: 'ATYP_2',
          title: 'Внезапная агрессия/апатия',
          description: 'Резкое изменение поведения без видимой причины',
          icon: '😠',
          emergency_level: 'medium',
        },
      ],
      emergency_contacts: [
        {
          name: 'Скорая помощь',
          number: '103',
          description: 'Единый номер скорой помощи по России',
        },
        {
          name: 'Экстренная служба',
          number: '112',
          description: 'Единый номер всех экстренных служб',
        },
      ],
    };

    let filteredContent = fallbackContent;
    if (category === 'typical') {
      filteredContent = {
        typical_symptoms: fallbackContent.typical_symptoms,
        atypical_symptoms: [],
        emergency_contacts: fallbackContent.emergency_contacts,
      };
    } else if (category === 'atypical') {
      filteredContent = {
        typical_symptoms: [],
        atypical_symptoms: fallbackContent.atypical_symptoms,
        emergency_contacts: fallbackContent.emergency_contacts,
      };
    }

    return {
      success: true,
      data: filteredContent,
    };
  }

  /**
   * Валидация данных перед отправкой
   */
  public validateRiskData(data: RiskData): string[] {
    const errors: string[] = [];

    // Проверка обязательных полей
    if (!data.age || data.age < 35 || data.age > 65) {
      errors.push('Возраст должен быть от 35 до 65 лет');
    }

    if (!data.gender) {
      errors.push('Укажите пол');
    }

    if (!data.height_cm || data.height_cm < 100 || data.height_cm > 250) {
      errors.push('Рост должен быть от 100 до 250 см');
    }

    if (!data.weight_kg || data.weight_kg < 30 || data.weight_kg > 300) {
      errors.push('Вес должен быть от 30 до 300 кг');
    }

    if (!data.lifestyle) {
      errors.push('Укажите уровень физической активности');
    }

    if (!data.smoking) {
      errors.push('Укажите статус курения');
    }

    if (!data.palpitations) {
      errors.push('Укажите частоту учащённого сердцебиения');
    }

    if (!data.shortness_of_breath) {
      errors.push('Укажите частоту ощущения нехватки воздуха');
    }

    if (!data.dizziness) {
      errors.push('Укажите частоту головокружения');
    }

    // Проверка холестерина если указан
    if (data.ldl_cholesterol !== undefined) {
      if (data.ldl_cholesterol < 0 || data.ldl_cholesterol > 10) {
        errors.push('ЛПНП холестерин должен быть от 0 до 10 ммоль/л');
      }
    }

    return errors;
  }

  /**
   * Утилита для форматирования ошибок для отображения пользователю
   */
  public formatErrors(errors: string[]): string {
    if (errors.length === 0) return '';
    
    if (errors.length === 1) {
      return errors[0];
    }
    
    return `Найдены ошибки:\n• ${errors.join('\n• ')}`;
  }
}

// Создаем и экспортируем инстанс API
export const apiService = ApiService.getInstance();

// Экспорт отдельных функций для удобства использования
export const calculateRisk = (data: RiskData) => apiService.calculateRisk(data);
export const getEducationalContent = (category?: 'typical' | 'atypical') => 
  apiService.getEducationalContent(category);
export const getRiskFactors = () => apiService.getRiskFactors();
export const checkServerHealth = () => apiService.checkServerHealth();
export const getLastResult = () => apiService.getLastResult();
export const clearHistory = () => apiService.clearHistory();
export const validateRiskData = (data: RiskData) => apiService.validateRiskData(data);
export const formatErrors = (errors: string[]) => apiService.formatErrors(errors);

// Экспорт типов для использования в других файлах
export type { 
  RiskData, 
  RiskResult, 
  SymptomItem, 
  EmergencyContact, 
  EducationalContent, 
  ApiResponse 
};
