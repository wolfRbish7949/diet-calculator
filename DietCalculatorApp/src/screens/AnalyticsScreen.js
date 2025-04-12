import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const chartWidth = width - 40;

const AnalyticsScreen = () => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [students, setStudents] = useState([]);
  
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadRecords();
    }
  }, [isFocused]);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const storedRecords = await AsyncStorage.getItem('dietRecords');
      const parsedRecords = storedRecords !== null ? JSON.parse(storedRecords) : [];
      setRecords(parsedRecords);
      
      // Extract unique students
      const uniqueStudents = [...new Set(parsedRecords.map(record => record.studentName))];
      setStudents(uniqueStudents);
      
      // Set default student
      if (uniqueStudents.length > 0 && !selectedStudent) {
        setSelectedStudent(uniqueStudents[0]);
      }
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter records for selected student
  const getFilteredRecords = () => {
    if (!selectedStudent) return [];
    return records.filter(record => record.studentName === selectedStudent);
  };

  // Data for meal distribution pie chart
  const getMealDistributionData = () => {
    const filteredRecords = getFilteredRecords();
    
    // Group charges by meal type
    const mealCharges = {
      Breakfast: 0,
      Lunch: 0,
      Dinner: 0
    };
    
    filteredRecords.forEach(record => {
      if (mealCharges.hasOwnProperty(record.mealTime)) {
        mealCharges[record.mealTime] += record.charge;
      }
    });
    
    // Create data for pie chart
    return Object.keys(mealCharges).map((key, index) => {
      const colors = ['#FF6384', '#36A2EB', '#FFCE56'];
      return {
        name: key,
        amount: mealCharges[key],
        color: colors[index],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12
      };
    });
  };

  // Data for weekly expenses bar chart
  const getWeeklyData = () => {
    const filteredRecords = getFilteredRecords();
    const currentDate = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayLabels = [];
    const dayValues = [];
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(currentDate.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayOfWeek = days[date.getDay()];
      dayLabels.push(dayOfWeek);
      
      // Format date for comparison
      const dateString = date.toISOString().split('T')[0];
      
      // Sum charges for this day
      const dayTotal = filteredRecords
        .filter(record => record.date === dateString)
        .reduce((sum, record) => sum + record.charge, 0);
      
      dayValues.push(dayTotal);
    }
    
    return {
      labels: dayLabels,
      datasets: [
        {
          data: dayValues
        }
      ]
    };
  };

  // Data for monthly expenses line chart
  const getMonthlyData = () => {
    const filteredRecords = getFilteredRecords();
    const currentDate = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabels = [];
    const monthValues = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      monthLabels.push(`${month}`);
      
      // Get month boundaries
      const monthStart = new Date(year, date.getMonth(), 1);
      const monthEnd = new Date(year, date.getMonth() + 1, 0);
      
      // Sum charges for this month
      const monthTotal = filteredRecords
        .filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= monthStart && recordDate <= monthEnd;
        })
        .reduce((sum, record) => sum + record.charge, 0);
      
      monthValues.push(monthTotal);
    }
    
    return {
      labels: monthLabels,
      datasets: [
        {
          data: monthValues,
          color: (opacity = 1) => `rgba(0, 113, 188, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
  };

  // Calculate total expenses
  const getTotalExpenses = () => {
    const filteredRecords = getFilteredRecords();
    return filteredRecords.reduce((sum, record) => sum + record.charge, 0);
  };

  // Calculate average daily expense
  const getAverageDailyExpense = () => {
    const filteredRecords = getFilteredRecords();
    if (filteredRecords.length === 0) return 0;
    
    // Get unique dates
    const uniqueDates = [...new Set(filteredRecords.map(record => record.date))];
    
    // Calculate average
    return getTotalExpenses() / uniqueDates.length;
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(0, 113, 188, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0071bc" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Expense Analytics</Text>
      </View>
      
      {students.length > 0 ? (
        <>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Select Student:</Text>
            <Picker
              selectedValue={selectedStudent}
              onValueChange={(itemValue) => setSelectedStudent(itemValue)}
              style={styles.picker}
            >
              {students.map(student => (
                <Picker.Item key={student} label={student} value={student} />
              ))}
            </Picker>
          </View>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={styles.summaryValue}>₹{getTotalExpenses().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Daily Average</Text>
              <Text style={styles.summaryValue}>₹{getAverageDailyExpense().toFixed(2)}</Text>
            </View>
          </View>
          
          {getFilteredRecords().length > 0 ? (
            <>
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Meal Distribution</Text>
                <PieChart
                  data={getMealDistributionData()}
                  width={chartWidth}
                  height={180}
                  chartConfig={chartConfig}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
              
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Weekly Expenses</Text>
                <BarChart
                  data={getWeeklyData()}
                  width={chartWidth}
                  height={220}
                  chartConfig={chartConfig}
                  fromZero
                  showValuesOnTopOfBars
                />
              </View>
              
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Monthly Trend</Text>
                <LineChart
                  data={getMonthlyData()}
                  width={chartWidth}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  fromZero
                />
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No data available for {selectedStudent}. Add some records to see analytics.
              </Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No records found. Add some diet records to see analytics.
          </Text>
        </View>
      )}
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
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0071bc',
    textAlign: 'center'
  },
  pickerContainer: {
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
  pickerLabel: {
    fontSize: 16,
    marginBottom: 8
  },
  picker: {
    height: 50,
    marginTop: -8
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1
  },
  summaryLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0071bc'
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    alignItems: 'center'
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#4d4d4d'
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24
  }
});

export default AnalyticsScreen; 