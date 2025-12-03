import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Checkbox from 'expo-checkbox';

const DisclaimerScreen = () => {
  const navigation = useNavigation();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);

  const allAgreed = agreedToTerms && agreedToPrivacy && agreedToDisclaimer;

  const handleContinue = () => {
    if (allAgreed) {
      navigation.navigate('Questionnaire' as never);
    }
  };

  const handleOpenTerms = () => {
    // В реальном приложении открыть URL с условиями использования
    // Linking.openURL('https://ваш-сайт/terms');
    alert('Условия использования (будет добавлено в будущем)');
  };

  const handleOpenPrivacy = () => {
    // Linking.openURL('https://ваш-сайт/privacy');
    alert('Политика конфиденциальности (будет добавлено в будущем)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="warning" size={48} color="#FF9500" />
          <Text style={styles.title}>Важная информация</Text>
          <Text style={styles.subtitle}>
            Пожалуйста, внимательно прочитайте перед использованием
          </Text>
        </View>

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>⚠️ ВНИМАНИЕ</Text>
          <Text style={styles.disclaimerText}>
            Это приложение НЕ является медицинским диагностическим инструментом 
            и НЕ предназначено для постановки диагноза или замены консультации 
            квалифицированного медицинского специалиста.
          </Text>
        </View>

        <View style={styles.agreementSection}>
          <View style={styles.checkboxRow}>
            <Checkbox
              value={agreedToDisclaimer}
              onValueChange={setAgreedToDisclaimer}
              color={agreedToDisclaimer ? '#007AFF' : undefined}
              style={styles.checkbox}
            />
            <Text style={styles.checkboxLabel}>
              Я понимаю, что это приложение предоставляет только 
              <Text style={styles.highlight}> информационные и просветительские</Text> 
              материалы и не заменяет медицинскую консультацию.
            </Text>
          </View>

          <View style={styles.checkboxRow}>
            <Checkbox
              value={agreedToTerms}
              onValueChange={setAg
