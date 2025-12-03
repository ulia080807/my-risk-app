import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';

import { calculateRisk } from '../services/api';
import { validateRiskData } from '../utils/validators';
import { RiskData } from '../types';

const QuestionnaireScreen = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<RiskData>>({
    age: undefined,
    gender: undefined,
    height_cm: undefined,
    weight_kg: undefined,
    family_history: false,
    lifestyle: undefined,
    smoking: undefined,
    high_bp: false,
    diabetes: false,
    palpitations: undefined,
    shortness_of_breath: undefined,
    dizziness: undefined,
    atrial_fibrillation: false,
    ldl_cholesterol: undefined,
  });

  const totalSteps = 4;

  const handleInputChange = (field: keyof RiskData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    try {
      // Проверка обязательных полей
      const requiredFields = [
        'age', 'gender', 'height_cm', 'weight_kg', 
        'lifestyle', 'smoking', 'palpitations', 
        'shortness_of_breath', 'dizziness'
      ];

      const missingFields = requiredFields.filter(field => {
        const value = formData[field as keyof RiskData];
        return value === undefined || value === null || value === '';
      });

      if (missingFields.length > 0) {
        Alert.alert(
          'Не все поля заполнены',
          'Пожалуйста, заполните все обязательные поля (отмечены красной звездочкой)'
        );
        return;
      }

      setLoading(true);

      const riskData: RiskData = {
        age: Number(formData.age),
        gender: formData.gender as 'male' | 'female',
        height_cm: Number(formData.height_cm),
        weight_kg: Number(formData.weight_kg),
        family_history: Boolean(formData.family_history),
        lifestyle: formData.lifestyle as 'active' | 'sedentary' | 'inactive',
        smoking: formData.smoking as 'current' | 'former' | 'never',
        high_bp: Boolean(formData.high_bp),
        diabetes: Boolean(formData.diabetes),
        palpitations: formData.palpitations as 'often' | 'rarely' | 'never',
        shortness_of_breath: formData.shortness_of_breath as 'often' | 'rarely' | 'never',
        dizziness: formData.dizziness as 'often' | 'rarely' | 'never',
        atrial_fibrillation: Boolean(formData.atrial_fibrillation),
        ldl_cholesterol: formData.ldl_cholesterol ? Number(formData.ldl_cholesterol) : undefined,
      };

      // Валидация данных
      const validationErrors = validateRiskData(riskData);
      if (validationErrors.length > 0) {
        Alert.alert(
          'Ошибка валидации',
          validationErrors.map(err => err.message).join('\n')
        );
        setLoading(false);
        return;
      }

      // Отправка данных на сервер
      const result = await calculateRisk(riskData);

      if (result.success) {
        // Переход на экран результата
        navigation.navigate('Result' as never, {
          riskData,
          calculationResult: result.data
        });
      } else {
        Alert.alert('Ошибка', result.error?.message || 'Не удалось рассчитать риск');
      }
    } catch (error) {
      console.error('Error calculating risk:', error);
      Alert.alert('Ошибка', 'Проверьте подключение к интернету');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.sectionTitle}>Основная информация</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Возраст <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Введите возраст (35-65)"
          keyboardType="numeric"
          value={formData.age?.toString() || ''}
          onChangeText={value => handleInputChange('age', value)}
          maxLength={2}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Пол <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.gender}
            onValueChange={value => handleInputChange('gender', value)}
            style={styles.picker}
          >
            <Picker.Item label="Выберите пол" value={undefined} />
            <Picker.Item label="Мужской" value="male" />
            <Picker.Item label="Женский" value="female" />
          </Picker>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>
            Рост (см) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="175"
            keyboardType="numeric"
            value={formData.height_cm?.toString() || ''}
            onChangeText={value => handleInputChange('height_cm', value)}
            maxLength={3}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>
            Вес (кг) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="75"
            keyboardType="numeric"
            value={formData.weight_kg?.toString() || ''}
            onChangeText={value => handleInputChange('weight_kg', value)}
            maxLength={3}
          />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.sectionTitle}>Образ жизни и привычки</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Уровень физической активности <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.lifestyle}
            onValueChange={value => handleInputChange('lifestyle', value)}
            style={styles.picker}
          >
            <Picker.Item label="Выберите уровень активности" value={undefined} />
            <Picker.Item label="Активный (спорт 3+ раза в неделю)" value="active" />
            <Picker.Item label="Малоподвижный (сидячая работа)" value="sedentary" />
            <Picker.Item label="Неактивный (практически нет движения)" value="inactive" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Курение <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.smoking}
            onValueChange={value => handleInputChange('smoking', value)}
            style={styles.picker}
          >
            <Picker.Item label="Выберите статус курения" value={undefined} />
            <Picker.Item label="Курю сейчас" value="current" />
            <Picker.Item label="Курил(а) в прошлом" value="former" />
            <Picker.Item label="Никогда не курил(а)" value="never" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Холестерин ЛПНП (необязательно)</Text>
        <TextInput
          style={styles.input}
          placeholder="Введите значение (ммоль/л)"
          keyboardType="numeric"
          value={formData.ldl_cholesterol?.toString() || ''}
          onChangeText={value => handleInputChange('ldl_cholesterol', value)}
        />
        <Text style={styles.hint}>Норма: до 3.0 ммоль/л</Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.sectionTitle}>Здоровье и симптомы</Text>
      
      <View style={styles.toggleGroup}>
        <Text style={styles.label}>Повышенное давление (≥130/85)</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              formData.high_bp === true && styles.toggleButtonActive
            ]}
            onPress={() => handleInputChange('high_bp', true)}
          >
            <Text style={[
              styles.toggleButtonText,
              formData.high_bp === true && styles.toggleButtonTextActive
            ]}>
              Да
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              formData.high_bp === false && styles.toggleButtonActive
            ]}
            onPress={() => handleInputChange('high_bp', false)}
          >
            <Text style={[
              styles.toggleButtonText,
              formData.high_bp === false && styles.toggleButtonTextActive
            ]}>
              Нет
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.toggleGroup}>
        <Text style={styles.label}>Сахарный диабет</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              formData.diabetes === true && styles.toggleButtonActive
            ]}
            onPress={() => handleInputChange('diabetes', true)}
          >
            <Text style={[
              styles.toggleButtonText,
              formData.diabetes === true && styles.toggleButtonTextActive
            ]}>
              Да
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              formData.diabetes === false && styles.toggleButtonActive
            ]}
            onPress={() => handleInputChange('diabetes', false)}
          >
            <Text style={[
              styles.toggleButtonText,
              formData.diabetes === false && styles.toggleButtonTextActive
            ]}>
              Нет
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.toggleGroup}>
        <Text style={styles.label}>Инсульт у родственников</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              formData.family_history === true && styles.toggleButtonActive
            ]}
            onPress={() => handleInputChange('family_history', true)}
          >
            <Text style={[
              styles.toggleButtonText,
              formData.family_history === true && styles.toggleButtonTextActive
            ]}>
              Да
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              formData.family_history === false && styles.toggleButtonActive
            ]}
            onPress={() => handleInputChange('family_history', false)}
          >
            <Text style={[
              styles.toggleButtonText,
              formData.family_history === false && styles.toggleButtonTextActive
            ]}>
              Нет
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.toggleGroup}>
        <Text style={styles.label}>Мерцательная аритмия</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              formData.atrial_fibrillation === true && styles.toggleButtonActive
            ]}
            onPress={() => handleInputChange('atrial_fibrillation', true)}
          >
            <Text style={[
              styles.toggleButtonText,
              formData.atrial_fibrillation === true && styles.toggleButtonTextActive
            ]}>
              Да
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              formData.atrial_fibrillation === false && styles.toggleButtonActive
            ]}
            onPress={() => handleInputChange('atrial_fibrillation', false)}
          >
            <Text style={[
              styles.toggleButtonText,
              formData.atrial_fibrillation === false && styles.toggleButtonTextActive
            ]}>
              Нет
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View>
      <Text style={styles.sectionTitle}>Симптомы</Text>
      <Text style={styles.sectionSubtitle}>
        Как часто вы испытываете следующие симптомы?
      </Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Учащённое сердцебиение <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.palpitations}
            onValueChange={value => handleInputChange('palpitations', value)}
            style={styles.picker}
          >
            <Picker.Item label="Выберите частоту" value={undefined} />
            <Picker.Item label="Часто (несколько раз в неделю)" value="often" />
            <Picker.Item label="Редко (раз в месяц или реже)" value="rarely" />
            <Picker.Item label="Никогда" value="never" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Ощущение нехватки воздуха при нагрузке <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.shortness_of_breath}
            onValueChange={value => handleInputChange('shortness_of_breath', value)}
            style={styles.picker}
          >
            <Picker.Item label="Выберите частоту" value={undefined} />
            <Picker.Item label="Часто" value="often" />
            <Picker.Item label="Редко" value="rarely" />
            <Picker.Item label="Никогда" value="never" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Головокружение или обмороки <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.dizziness}
            onValueChange={value => handleInputChange('dizziness', value)}
            style={styles.picker}
          >
            <Picker.Item label="Выберите частоту" value={undefined} />
            <Picker.Item label="Часто" value="often" />
            <Picker.Item label="Редко" value="rarely" />
            <Picker.Item label="Никогда" value="never" />
          </Picker>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Шаг {step} из {totalSteps}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(step / totalSteps) * 100}%` }
            ]} 
          />
        </View>

        <ScrollView style={styles.content}>
          {renderStep()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, loading && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.nextButtonText}>
              {loading ? 'Обработка...' : step === totalSteps ? 'Завершить' : 'Далее'}
            </Text>
            {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
          </TouchableOpacity>
          
          <Text style={styles.footerNote}>
            <Text style={styles.required}>*</Text> Обязательные поля
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerPlaceholder: {
    width: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  toggleGroup: {
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#C7C7CC',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  footerNote: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default QuestionnaireScreen;
