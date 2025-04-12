import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

const RecordsScreen = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [totalCharge, setTotalCharge] = useState(0);
  
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadRecords();
    }
  }, [isFocused]);

  useEffect(() => {
    filterRecords();
  }, [records, filterPeriod, searchQuery]);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const storedRecords = await AsyncStorage.getItem('dietRecords');
      const parsedRecords = storedRecords !== null ? JSON.parse(storedRecords) : [];
      setRecords(parsedRecords);
    } catch (error) {
      console.error('Error loading records:', error);
      Alert.alert('Error', 'Failed to load records');
    } finally {
      setIsLoading(false);
    }
  };

  const filterRecords = () => {
    // Start with all records
    let filtered = [...records];
    
    // Apply search filter if exists
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        record.studentName.toLowerCase().includes(query) || 
        record.studentEmail.toLowerCase().includes(query)
      );
    }
    
    // Apply time period filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filterPeriod) {
      case 'day':
        filtered = filtered.filter(record => {
          const recordDate = new Date(record.date);
          recordDate.setHours(0, 0, 0, 0);
          return recordDate.getTime() === today.getTime();
        });
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        filtered = filtered.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= weekStart;
        });
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        filtered = filtered.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= monthStart;
        });
        break;
    }
    
    // Calculate total charge
    const total = filtered.reduce((sum, record) => sum + record.charge, 0);
    setTotalCharge(total);
    
    // Update filtered records
    setFilteredRecords(filtered);
  };

  const deleteRecord = (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this record?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedRecords = records.filter(record => record.id !== id);
              await AsyncStorage.setItem('dietRecords', JSON.stringify(updatedRecords));
              setRecords(updatedRecords);
              Alert.alert('Success', 'Record deleted successfully');
            } catch (error) {
              console.error('Error deleting record:', error);
              Alert.alert('Error', 'Failed to delete record');
            }
          }
        }
      ]
    );
  };

  const exportToExcel = async () => {
    if (filteredRecords.length === 0) {
      Alert.alert('No Data', 'There are no records to export');
      return;
    }

    try {
      // Prepare worksheet data
      const worksheetData = [
        ['Student Name', 'Email', 'Date', 'Meal Time', 'Charge (₹)']
      ];
      
      filteredRecords.forEach(record => {
        worksheetData.push([
          record.studentName,
          record.studentEmail,
          new Date(record.date).toLocaleDateString(),
          record.mealTime,
          record.charge
        ]);
      });
      
      // Add total row
      worksheetData.push(['Total', '', '', '', totalCharge]);
      
      // Create worksheet and workbook
      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Diet Records');
      
      // Convert to binary string
      const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
      
      // Convert to array buffer
      const buffer = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < wbout.length; i++) {
        view[i] = wbout.charCodeAt(i) & 0xFF;
      }
      
      // Write to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `diet_records_${timestamp}.xlsx`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error exporting records:', error);
      Alert.alert('Error', 'Failed to export records');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.recordItem}>
      <View style={styles.recordDetails}>
        <Text style={styles.studentName}>{item.studentName}</Text>
        <Text style={styles.recordEmail}>{item.studentEmail}</Text>
        <View style={styles.recordRow}>
          <View style={styles.recordColumn}>
            <Text style={styles.recordLabel}>Date:</Text>
            <Text style={styles.recordValue}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.recordColumn}>
            <Text style={styles.recordLabel}>Meal:</Text>
            <Text style={styles.recordValue}>{item.mealTime}</Text>
          </View>
          <View style={styles.recordColumn}>
            <Text style={styles.recordLabel}>Charge:</Text>
            <Text style={styles.recordValue}>₹{item.charge.toFixed(2)}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteRecord(item.id)}
      >
        <Icon name="delete" size={24} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setSearchQuery('')}
        >
          <Icon name="close-circle" size={20} color="#757575" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={filterPeriod}
            onValueChange={(itemValue) => setFilterPeriod(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="All Records" value="all" />
            <Picker.Item label="Today" value="day" />
            <Picker.Item label="This Week" value="week" />
            <Picker.Item label="This Month" value="month" />
          </Picker>
        </View>
        
        <TouchableOpacity
          style={styles.exportButton}
          onPress={exportToExcel}
        >
          <Icon name="file-export" size={20} color="#FFFFFF" />
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0071bc" />
        </View>
      ) : (
        <>
          <FlatList
            data={filteredRecords}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="clipboard-text-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyText}>No records found</Text>
              </View>
            }
          />
          
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>
              ₹{totalCharge.toFixed(2)}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16
  },
  clearButton: {
    padding: 8
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1
  },
  picker: {
    height: 50
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0071bc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContent: {
    padding: 16,
    paddingTop: 8
  },
  recordItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  recordDetails: {
    flex: 1
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0071bc',
    marginBottom: 4
  },
  recordEmail: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  recordColumn: {
    flex: 1
  },
  recordLabel: {
    fontSize: 14,
    color: '#757575'
  },
  recordValue: {
    fontSize: 16,
    fontWeight: '500'
  },
  deleteButton: {
    justifyContent: 'center',
    padding: 8
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 16
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0071bc'
  }
});

export default RecordsScreen; 