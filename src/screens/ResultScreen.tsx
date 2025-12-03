import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { RootStackParamList } from '../navigation/AppNavigator';
import EmergencyButton from '../components/EmergencyButton';
import DisclaimerBanner from '../components/DisclaimerBanner';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

const ResultScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<ResultScreenRouteProp>();
  const { calculationResult } = route.params;

  const getRiskColor = () => {
    switch (calculationResult.risk_category) {
      case 'low':
        return '#34C759'; // Зелёный
      case 'moderate':
        return '#FF9500'; // Оранжевый
      case 'high':
        return '#FF3B30'; // Красный
      default:
        return '#8E8E93';
    }
  };

  const getRiskIcon = () => {
    switch (calculationResult.risk_category) {
      case 'low':
        return 'checkmark-circle';
      case 'moderate':
        return 'warning';
      case 'high':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const handleShare = async () => {
    try {
      const message = `Мой риск инсульта: ${calculationResult.risk_percentage}% (${calculationResult.risk_description})\n\n${calculationResult.recommendations.general}`;
      
      await Share.share({
        message,
        title: 'Результат оценки риска инсульта',
      });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось поделиться результатом');
    }
  };

  const handleCallDoctor = () => {
    Alert.alert(
      'Запись к врачу',
      'Рекомендуем записаться на приём к терапевту или неврологу для консультации.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Позвонить', onPress: () => Linking.openURL('tel:103') },
      ]
    );
  };

  const handleLearnMore = () => {
    navigation.navigate('Education' as never);
  };

  const handleNewAssessment = () => {
    navigation.navigate('Questionnaire' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Результат оценки</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.riskCard}>
          <View style={styles.riskHeader}>
            <Ionicons 
              name={getRiskIcon()} 
              size={48} 
              color={getRiskColor()} 
            />
            <View style={styles.riskInfo}>
              <Text style={styles.riskCategory}>
                {calculationResult.risk_description}
              </Text>
              <Text style={styles.timeframe}>
                Риск в ближайшие {calculationResult.timeframe_months} месяцев
              </Text>
            </View>
          </View>

          <View style={styles.riskPercentageContainer}>
            <Text style={[styles.riskPercentage, { color: getRiskColor() }]}>
              {calculationResult.risk_percentage}%
            </Text>
            <Text style={styles.riskPercentageLabel}>вероятность</Text>
          </View>

          <Text style={styles.riskDescription}>
            {calculationResult.recommendations.general}
          </Text>

          {calculationResult.bmi && (
            <View style={styles.bmiContainer}>
              <Text style={styles.bmiLabel}>Ваш ИМТ:</Text>
              <Text style={styles.bmiValue}>{calculationResult.bmi}</Text>
              <Text style={styles.bmiCategory}>
                {calculationResult.bmi < 18.5 ? 'Недостаточный вес' :
                 calculationResult.bmi < 25 ? 'Нормальный вес' :
                 calculationResult.bmi < 30 ? 'Избыточный вес' : 'Ожирение'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.recommendationsCard}>
          <Text style={styles.sectionTitle}>Персонализированные рекомендации</Text>
          
          {calculationResult.recommendations.actions.map((action: any, index: number) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationHeader}>
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityText}>{action.priority}</Text>
                </View>
                <Text style={styles.recommendationTitle}>{action.title}</Text>
              </View>
              <Text style={styles.recommendationDescription}>
                {action.description}
              </Text>
              <View style={styles.frequencyTag}>
                <Ionicons name="time-outline" size={14} color="#8E8E93" />
                <Text style={styles.frequencyText}>{action.frequency}</Text>
              </View>
            </View>
          ))}
        </View>

        {calculationResult.risk_category === 'high' && (
          <View style={styles.emergencyCard}>
            <Ionicons name="warning" size={32} color="#FF3B30" />
            <Text style={styles.emergencyTitle}>Требуется срочная оценка</Text>
            <Text style={styles.emergencyText}>
              {calculationResult.recommendations.emergency_advice}
            </Text>
            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={handleCallDoctor}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.emergencyButtonText}>Записаться к врачу</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Дальнейшие действия</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLearnMore}
          >
            <Ionicons name="book-outline" size={24} color="#007AFF" />
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Изучить симптомы</Text>
              <Text style={styles.actionDescription}>
                Узнайте типичные и атипичные признаки инсульта
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleNewAssessment}
          >
            <Ionicons name="refresh-outline" size={24} color="#007AFF" />
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Повторить оценку</Text>
              <Text style={styles.actionDescription}>
                Пройти анкету заново через 1-3 месяца
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Linking.openURL('https://www.insult.ru')}
          >
            <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Полезные ресурсы</Text>
              <Text style={styles.actionDescription}>
                Сайты и организации по профилактике инсульта
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
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
    paddingBottom: 100,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  shareButton: {
    padding: 4,
  },
  riskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginTop: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  riskInfo: {
    marginLeft: 12,
    flex: 1,
  },
  riskCategory: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  timeframe: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  riskPercentageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  riskPercentage: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  riskPercentageLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  riskDescription: {
    fontSize: 16,
    color: '#1C1C1E',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  bmiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bmiLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 4,
  },
  bmiValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 8,
  },
  bmiCategory: {
    fontSize: 14,
    color: '#8E8E93',
  },
  recommendationsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  recommendationItem: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
    marginBottom: 8,
  },
  frequencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  frequencyText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  emergencyCard: {
    backgroundColor: '#FFECEC',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 12,
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#1C1C1E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  actionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  actionDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
});

export default ResultScreen;
