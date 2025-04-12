import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  View, 
  Text, 
  StatusBar,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Create tab navigator
const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Records') {
                iconName = focused ? 'clipboard-text' : 'clipboard-text-outline';
              } else if (route.name === 'Analytics') {
                iconName = focused ? 'chart-pie' : 'chart-pie';
              } else if (route.name === 'Settings') {
                iconName = focused ? 'cog' : 'cog-outline';
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#0071bc',
            tabBarInactiveTintColor: 'gray',
            headerShown: true,
            headerTitleStyle: {
              fontWeight: 'bold',
              color: '#0071bc'
            }
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Diet Calculator' }} />
          <Tab.Screen name="Records" component={RecordsScreen} options={{ title: 'Diet Records' }} />
          <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
};

export default App; 