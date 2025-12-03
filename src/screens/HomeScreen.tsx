import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import EmergencyButton from '../components/EmergencyButton';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { calculateRisk, getEducationalContent } from '../services/api';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [lastResult, setLastResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleStartQuestionnaire = () => {
    // Сначала показываем дисклеймер
    navigation.navigate('Disclaimer' as never);
  };

  const handleShowLastResult = () => {
    if (lastResult) {
      navigation.navigate('Result' as never, {
        riskData: lastResult.riskData,
        calculationResult: lastResult.result
      });
    }
  };

  const handleQuickTest = async () => {
    setLoading(true);
    try {
      // Тестовые данные для быстрой проверки
      const testData = {
        age: 45,
        gender: 'male' as const,
        height_cm: 175,
        weight_kg: 75,
        family_history: false,
        lifestyle: 'sedentary' as const,
        smoking: 'never' as const,
        high_bp: false,
        diabetes: false,
        palpitations: 'rarely' as const,
        shortness_of_breath: 'never' as const,
        dizziness: 'rarely' as const,
        atrial_fibrillation: false,
        ldl_cholesterol: 2.5,
      };

      const result = await calculateRisk(testData);
      
      if (result.success) {
        navigation.navigate('Result' as never, {
          riskData: testData,
          calculationResult: result.data
        });
      } else {
        Alert.alert('Ошибка', result.error?.message || 'Не удалось рассчитать риск');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Проверьте подключение к интернету');
    } finally {
      setLoading(false);
    }
  };

  const handleLearnSymptoms = () => {
    navigation.navigate('Education' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Мой Риск</Text>
          <Text style={styles.subtitle}>
            Оценка риска инсульта на 6 месяцев
          </Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="medical" size={48} color="#007AFF" />
          <Text style={styles.cardTitle}>Оцените ваш риск</Text>
          <Text style={styles.cardDescription}>
            Пройдите быструю анкету из 12 вопросов и получите персонализированные рекомендации
          </Text>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleStartQuestionnaire}
            disabled={loading}
          >
            <Ionicons name="clipboard" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {loading ? 'Загрузка...' : 'Начать оценку'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleQuickTest}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Быстрая проверка</Text>
          </TouchableOpacity>
        </View>

        {lastResult && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Последний результат</Text>
            <View style={styles.resultPreview}>
              <View style={[
                styles.riskBadge,
                { backgroundColor: lastResult.result.risk_category === 'high' ? '#FF3B30' : 
                                   lastResult.result.risk_category === 'moderate' ? '#FF9500' : '#34C759' }
              ]}>
                <Text style={styles.riskBadgeText}>
                  {lastResult.result.risk_percentage}%
                </Text>
              </View>
              <View style={styles.resultDetails}>
                <Text style={styles.resultCategory}>
                  {lastResult.result.risk_description}
                </Text>
                <Text style={styles.resultDate}>
                  {new Date(lastResult.timestamp).toLocaleDateString('ru-RU')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.outlineButton]}
              onPress={handleShowLastResult}
            >
              <Text style={styles.outlineButtonText}>Показать подробности</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Ionicons name="warning" size={48} color="#FF9500" />
          <Text style={styles.cardTitle}>Знайте симптомы</Text>
          <Text style={styles.cardDescription}>
            Распознавание ранних признаков может спасти жизнь
          </Text>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleLearnSymptoms}
          >
            <Ionicons name="book" size={20} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Изучить симптомы</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Важно знать</Text>
          <View style={styles.statItem}>
            <Ionicons name="time" size={20} color="#FF3B30" />
            <Text style={styles.statText}>
              В России инсульт случается каждые 2 минуты
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={styles.statText}>
              80% случаев можно предотвратить
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="alert-circle" size={20} color="#FF9500" />
            <Text style={styles.statText}>
              Более 50% людей не распознают первые признаки
            </Text>
          </View>
        </View>

        <EmergencyButton />
      </ScrollView>

      <DisclaimerBanner />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 12,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 8,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C7C7CC',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  outlineButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  riskBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  riskBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultDetails: {
    flex: 1,
  },
  resultCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  resultDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 12,
    flex: 1,
  },
});

export default HomeScreen;
