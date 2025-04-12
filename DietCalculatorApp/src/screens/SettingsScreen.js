import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as MailComposer from 'expo-mail-composer';
import * as FileSystem from 'expo-file-system';
import XLSX from 'xlsx';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = () => {
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAutoEmailEnabled, setIsAutoEmailEnabled] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState(false);
  const [showAIGuide, setShowAIGuide] = useState(false);
  
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadSettings();
      checkEmailAvailability();
    }
  }, [isFocused]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const savedName = await AsyncStorage.getItem('currentStudent');
      const savedEmail = await AsyncStorage.getItem('currentEmail');
      const darkMode = await AsyncStorage.getItem('darkMode');
      const autoEmail = await AsyncStorage.getItem('autoEmail');
      
      if (savedName !== null) {
        setStudentName(savedName);
      }
      
      if (savedEmail !== null) {
        setStudentEmail(savedEmail);
      }
      
      if (darkMode !== null) {
        setIsDarkMode(darkMode === 'true');
      }
      
      if (autoEmail !== null) {
        setIsAutoEmailEnabled(autoEmail === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailAvailability = async () => {
    const isAvailable = await MailComposer.isAvailableAsync();
    setIsEmailAvailable(isAvailable);
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('currentStudent', studentName);
      await AsyncStorage.setItem('currentEmail', studentEmail);
      await AsyncStorage.setItem('darkMode', isDarkMode.toString());
      await AsyncStorage.setItem('autoEmail', isAutoEmailEnabled.toString());
      
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Confirm Clear Data',
      'Are you sure you want to clear all data? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all data from AsyncStorage
              await AsyncStorage.removeItem('dietRecords');
              
              // Keep user settings
              Alert.alert('Success', 'All diet records have been cleared');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const sendMonthlyReport = async () => {
    if (!isEmailAvailable) {
      Alert.alert('Error', 'Email is not available on this device');
      return;
    }

    if (!studentEmail) {
      Alert.alert('Error', 'Please enter your email address in the settings');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get all records for the current student
      const storedRecords = await AsyncStorage.getItem('dietRecords');
      const records = storedRecords !== null ? JSON.parse(storedRecords) : [];
      
      const studentRecords = records.filter(record => 
        record.studentName === studentName
      );
      
      if (studentRecords.length === 0) {
        Alert.alert('No Data', 'There are no records to send');
        setIsLoading(false);
        return;
      }
      
      // Get current month's records
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const monthlyRecords = studentRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= monthStart;
      });
      
      // Create Excel file
      const worksheetData = [
        ['Date', 'Meal Time', 'Charge (₹)']
      ];
      
      monthlyRecords.forEach(record => {
        worksheetData.push([
          new Date(record.date).toLocaleDateString(),
          record.mealTime,
          record.charge
        ]);
      });
      
      // Add total row
      const total = monthlyRecords.reduce((sum, record) => sum + record.charge, 0);
      worksheetData.push(['Total', '', total]);
      
      // Create worksheet and workbook
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
      
      // Convert to binary string
      const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
      
      // Convert to array buffer
      const buffer = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < wbout.length; i++) {
        view[i] = wbout.charCodeAt(i) & 0xFF;
      }
      
      // Write to file
      const monthName = today.toLocaleString('default', { month: 'long' });
      const fileName = `${studentName.replace(/\s+/g, '_')}_${monthName}_Report.xlsx`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Send email
      await MailComposer.composeAsync({
        recipients: [studentEmail],
        subject: `Hostel Mess Diet Report - ${monthName}`,
        body: `Dear ${studentName},\n\nPlease find attached your mess diet charges report for ${monthName}.\n\nTotal Charges: ₹${total.toFixed(2)}\n\nRegards,\nHostel Mess Administration`,
        attachments: [filePath]
      });
      
      Alert.alert('Success', 'Monthly report has been sent to your email');
    } catch (error) {
      console.error('Error sending report:', error);
      Alert.alert('Error', 'Failed to send monthly report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:rj19bishnoi29@gmail.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+917976709249');
  };

  const AIGuideModal = () => (
    <Modal
      visible={showAIGuide}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAIGuide(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Guide</Text>
            <TouchableOpacity onPress={() => setShowAIGuide(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.guideContent}>
            <View style={styles.guideSection}>
              <Text style={styles.guideTitle}>📊 Understanding Your Dashboard</Text>
              <Text style={styles.guideText}>
                Your dashboard shows your meal records and expenses. Here's how to use it:
              </Text>
              <Text style={styles.guideBullet}>• View your daily meal charges</Text>
              <Text style={styles.guideBullet}>• Check the mess schedule for today</Text>
              <Text style={styles.guideBullet}>• Track your total expenses</Text>
              <View style={styles.guideTip}>
                <Text style={styles.guideTipText}>💡 Tip: Tap on any meal card to see the detailed menu!</Text>
              </View>
            </View>

            <View style={styles.guideSection}>
              <Text style={styles.guideTitle}>📝 Managing Records</Text>
              <Text style={styles.guideText}>
                You can filter and export your records:
              </Text>
              <Text style={styles.guideBullet}>• Use the filter dropdown to view specific time periods</Text>
              <Text style={styles.guideBullet}>• Export your records to Excel for offline access</Text>
              <Text style={styles.guideBullet}>• View detailed analytics of your expenses</Text>
              <View style={styles.guideTip}>
                <Text style={styles.guideTipText}>💡 Tip: Regular checking of your records helps in better expense management!</Text>
              </View>
            </View>

            <View style={styles.guideSection}>
              <Text style={styles.guideTitle}>📱 Mobile App Features</Text>
              <Text style={styles.guideText}>
                Our mobile app offers additional features:
              </Text>
              <Text style={styles.guideBullet}>• Push notifications for meal updates</Text>
              <Text style={styles.guideBullet}>• Offline access to your records</Text>
              <Text style={styles.guideBullet}>• Quick access to mess schedule</Text>
              <View style={styles.guideTip}>
                <Text style={styles.guideTipText}>💡 Tip: Enable notifications for the best experience!</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0071bc" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Student Name</Text>
          <TextInput
            style={styles.input}
            value={studentName}
            onChangeText={setStudentName}
            placeholder="Enter your name"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={studentEmail}
            onChangeText={setStudentEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>
              Enable dark theme for the app
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            trackColor={{ false: '#d9d9d9', true: '#0071bc' }}
            thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Automatic Email Reports</Text>
            <Text style={styles.settingDescription}>
              Send monthly reports to your email automatically
            </Text>
          </View>
          <Switch
            value={isAutoEmailEnabled}
            onValueChange={setIsAutoEmailEnabled}
            trackColor={{ false: '#d9d9d9', true: '#0071bc' }}
            thumbColor={isAutoEmailEnabled ? '#FFFFFF' : '#FFFFFF'}
            disabled={!isEmailAvailable}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={sendMonthlyReport}
          disabled={!isEmailAvailable}
        >
          <Icon name="email-send" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Send Monthly Report</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]}
          onPress={clearAllData}
        >
          <Icon name="delete" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <TouchableOpacity style={styles.contactCard} onPress={handleEmailPress}>
          <Ionicons name="mail" size={24} color="#4FB3FF" />
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>rj19bishnoi29@gmail.com</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactCard} onPress={handlePhonePress}>
          <Ionicons name="call" size={24} color="#4FB3FF" />
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Phone</Text>
            <Text style={styles.contactValue}>+91 7976709249</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.aiGuideButton}
        onPress={() => setShowAIGuide(true)}
      >
        <Ionicons name="help-circle" size={24} color="white" />
        <Text style={styles.aiGuideButtonText}>AI Guide</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={saveSettings}
      >
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
      
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Diet Calculator v1.0.0</Text>
        <Text style={styles.appCopyright}>
          © 2023 Hostel Mess Administration
        </Text>
      </View>
      
      <AIGuideModal />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#0071bc'
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#4d4d4d'
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    borderRadius: 4,
    fontSize: 16
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4
  },
  settingDescription: {
    fontSize: 14,
    color: '#757575',
    maxWidth: '80%'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0071bc',
    padding: 16,
    borderRadius: 4,
    marginBottom: 12
  },
  dangerButton: {
    backgroundColor: '#F44336'
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12
  },
  saveButton: {
    backgroundColor: '#0071bc',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
    margin: 16
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  appInfo: {
    alignItems: 'center',
    margin: 16
  },
  appVersion: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4
  },
  appCopyright: {
    fontSize: 12,
    color: '#9e9e9e'
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1F5FE',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  contactInfo: {
    marginLeft: 15,
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FB3FF',
  },
  aiGuideButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#7ED957',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiGuideButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F9FF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4FB3FF',
  },
  guideContent: {
    flex: 1,
  },
  guideSection: {
    marginBottom: 20,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FB3FF',
    marginBottom: 10,
  },
  guideText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  guideBullet: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    marginBottom: 5,
  },
  guideTip: {
    backgroundColor: '#EBFAE2',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  guideTipText: {
    fontSize: 14,
    color: '#333',
  },
});

export default SettingsScreen; 