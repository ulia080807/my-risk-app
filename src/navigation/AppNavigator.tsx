import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import QuestionnaireScreen from '../screens/QuestionnaireScreen';
import ResultScreen from '../screens/ResultScreen';
import EducationScreen from '../screens/EducationScreen';
import DisclaimerScreen from '../screens/DisclaimerScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Questionnaire: undefined;
  Result: { 
    riskData: any; 
    calculationResult: any 
  };
  Disclaimer: undefined;
  EducationDetail: { symptom: any };
};

export type TabParamList = {
  Home: undefined;
  Education: undefined;
  History: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Education') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Оценка риска' }}
      />
      <Tab.Screen 
        name="Education" 
        component={EducationScreen} 
        options={{ title: 'Симптомы' }}
      />
      <Tab.Screen 
        name="History" 
        component={HomeScreen}  // Заглушка для истории
        options={{ title: 'История' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Disclaimer" 
        component={DisclaimerScreen} 
        options={{ title: 'Важная информация' }}
      />
      <Stack.Screen 
        name="Questionnaire" 
        component={QuestionnaireScreen} 
        options={{ title: 'Анкета' }}
      />
      <Stack.Screen 
        name="Result" 
        component={ResultScreen} 
        options={{ title: 'Результат' }}
      />
    </Stack.Navigator>
  );
}
