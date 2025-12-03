import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  SectionList,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getEducationalContent } from '../services/api';
import EmergencyButton from '../components/EmergencyButton';
import DisclaimerBanner from '../components/DisclaimerBanner';

type Symptom = {
  code: string;
  title: string;
  description: string;
  icon: string;
  emergency_level: string;
};

type Contact = {
  name: string;
  number: string;
  description: string;
};

const EducationScreen = () => {
  const [typicalSymptoms, setTypicalSymptoms] = useState<Symptom[]>([]);
  const [atypicalSymptoms, setAtypicalSymptoms] = useState<Symptom[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'typical' | 'atypical'>('typical');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const result = await getEducationalContent();
      
      if (result.success) {
        setTypicalSymptoms(result.data.typical_symptoms);
        setAtypicalSymptoms(result.data.atypical_symptoms);
        setEmergencyContacts(result.data.emergency_contacts);
      } else {
        Alert.alert('Ошибка', 'Не удалось загрузить информацию о симптомах');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Проверьте подключение к интернету');
    } finally {
      setLoading(false);
    }
  };

  const handleCallEmergency = (number: string) => {
    Alert.alert(
      `Позвонить ${number}?`,
      'Этот номер предназначен для экстренных случаев.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Позвонить', onPress: () => Linking.openURL(`tel:${number}`) },
      ]
    );
  };

  const renderSymptomCard = (symptom: Symptom) => (
    <View key={symptom.code} style={styles.symptomCard}>
      <View style={styles.symptomHeader}>
        <Text style={styles.symptomIcon}>{symptom.icon}</Text>
        <View style={styles.symptomTitleContainer}>
          <Text style={styles.symptomTitle}>{symptom.title}</Text>
          <View style={[
            styles.emergencyBadge,
            symptom.emergency_level === 'high' && styles.emergencyBadgeHigh,
            symptom.emergency_level === 'critical' && styles.emergencyBadgeCritical,
          ]}>
            <Text style={styles.emergencyBadgeText}>
              {symptom.emergency_level === 'critical' ? 'Критично' :
               symptom.emergency_level === 'high' ? 'Высоко' : 'Средне'}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.symptomDescription}>{symptom.description}</Text>
    </View>
  );

  const renderEmergencyContact = (contact: Contact) => (
    <TouchableOpacity
      key={contact.number}
      style={styles.contactCard}
      onPress={() => handleCallEmergency(contact.number)}
    >
      <View style={styles.contactIcon}>
        <Ionicons name="call" size={24} color="#FF3B30" />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactNumber}>{contact.number}</Text>
        <Text style={styles.contactDescription}>{contact.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  const sections = [
    {
      title: 'Экстренные контакты',
      data: emergencyContacts,
      renderItem: ({ item }: { item: Contact }) => renderEmergencyContact(item),
    },
    {
      title: activeTab === 'typical' ? 'Типичные симптомы (FAST+)' : 'Атипичные симптомы',
      data: activeTab === 'typical' ? typicalSymptoms : atypicalSymptoms,
      renderItem: ({ item }: { item: Symptom }) => renderSymptomCard(item),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Симптомы инсульта</Text>
        <Text style={styles.subtitle}>
          Знание симптомов может спасти жизнь
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'typical' && styles.tabActive]}
          onPress={() => setActiveTab('typical')}
        >
          <Text style={[styles.tabText, activeTab === 'typical' && styles.tabTextActive]}>
            Типичные
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'atypical' && styles.tabActive]}
          onPress={() => setActiveTab('atypical')}
        >
          <Text style={[styles.tabText, activeTab === 'atypical' && styles.tabTextActive]}>
            Атипичные
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="medical" size={48} color="#007AFF" />
          <Text style={styles.loadingText}>Загрузка информации...</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => item.code || item.number + index}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}

      <View style={styles.importantNote}>
        <Ionicons name="information-circle" size={24} color="#FF9500" />
        <Text style={styles.importantNoteText}>
          При появлении любого из этих симптомов немедленно звоните 103 или 112
        </Text>
      </View>

      <EmergencyButton />

      <DisclaimerBanner />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 24,
    marginBottom: 12,
  },
  symptomCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  symptomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  symptomIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  symptomTitleContainer: {
    flex: 1,
  },
  symptomTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  emergencyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  emergencyBadgeHigh: {
    backgroundColor: '#FF3B30',
  },
  emergencyBadgeCritical: {
    backgroundColor: '#FF3B30',
  },
  emergencyBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  symptomDescription: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  contactNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginVertical: 4,
  },
  contactDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  importantNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  importantNoteText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default EducationScreen;
