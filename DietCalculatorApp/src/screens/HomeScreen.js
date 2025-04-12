import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const HomeScreen = () => {
  // State variables
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mealTime, setMealTime] = useState('');
  const [charge, setCharge] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  const isFocused = useIsFocused();

  // Load saved user data
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedName = await AsyncStorage.getItem('currentStudent');
        const savedEmail = await AsyncStorage.getItem('currentEmail');
        
        if (savedName !== null) {
          setStudentName(savedName);
        }
        
        if (savedEmail !== null) {
          setStudentEmail(savedEmail);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    
    if (isFocused) {
      loadSavedData();
    }
  }, [isFocused]);

  // Form validation
  useEffect(() => {
    setIsFormValid(
      studentName.trim() !== '' &&
      studentEmail.trim() !== '' &&
      mealTime !== '' &&
      charge.trim() !== ''
    );
  }, [studentName, studentEmail, date, mealTime, charge]);

  // Handle date change
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  // Save record
  const saveRecord = async () => {
    if (!isFormValid) {
      Alert.alert('Validation Error', 'Please fill all the required fields');
      return;
    }

    const newRecord = {
      id: Date.now().toString(),
      studentName,
      studentEmail,
      date: date.toISOString().split('T')[0],
      mealTime,
      charge: parseFloat(charge)
    };

    try {
      // Get existing records
      const storedRecords = await AsyncStorage.getItem('dietRecords');
      const records = storedRecords !== null ? JSON.parse(storedRecords) : [];
      
      // Add new record
      records.push(newRecord);
      
      // Save updated records
      await AsyncStorage.setItem('dietRecords', JSON.stringify(records));
      
      // Save current student data
      await AsyncStorage.setItem('currentStudent', studentName);
      await AsyncStorage.setItem('currentEmail', studentEmail);
      
      // Reset form partially
      setMealTime('');
      setCharge('');
      
      Alert.alert('Success', 'Diet record added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save record. Please try again.');
      console.error('Error saving record:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Add Diet Record</Text>
          
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
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {date.toLocaleDateString()}
              </Text>
              <Icon name="calendar" size={24} color="#0071bc" />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meal Time</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={mealTime}
                onValueChange={(itemValue) => setMealTime(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select Meal" value="" />
                <Picker.Item label="Breakfast" value="Breakfast" />
                <Picker.Item label="Lunch" value="Lunch" />
                <Picker.Item label="Dinner" value="Dinner" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Charge (₹)</Text>
            <TextInput
              style={styles.input}
              value={charge}
              onChangeText={setCharge}
              placeholder="Enter charge amount"
              keyboardType="numeric"
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.addButton,
              !isFormValid && styles.disabledButton
            ]}
            onPress={saveRecord}
            disabled={!isFormValid}
          >
            <Text style={styles.buttonText}>Add Record</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  formContainer: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0071bc',
    marginBottom: 20,
    textAlign: 'center'
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  picker: {
    height: 50
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    borderRadius: 4
  },
  dateText: {
    fontSize: 16
  },
  addButton: {
    backgroundColor: '#0071bc',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 16
  },
  disabledButton: {
    backgroundColor: '#b3b3b3'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default HomeScreen; 