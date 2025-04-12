// DOM Elements
const studentForm = document.getElementById('student-form');
const studentNameInput = document.getElementById('student-name');
const studentEmailInput = document.getElementById('student-email');
const recordsBody = document.getElementById('records-body');
const totalChargeElement = document.getElementById('total-charge');
const filterPeriod = document.getElementById('filter-period');
const exportBtn = document.getElementById('export-btn');

// Initialize data
let dietRecords = JSON.parse(localStorage.getItem('dietRecords')) || [];
let currentStudent = localStorage.getItem('currentStudent') || '';
let currentEmail = localStorage.getItem('currentEmail') || '';

// Update UI with stored student data
if (currentStudent) {
    studentNameInput.value = currentStudent;
}
if (currentEmail) {
    studentEmailInput.value = currentEmail;
}

// Event Listeners
studentForm.addEventListener('submit', saveProfile);
filterPeriod.addEventListener('change', filterRecords);
exportBtn.addEventListener('click', exportToExcel);

// Display initial records
updateRecordsDisplay();
renderCharts();

// Functions
function saveProfile(e) {
    e.preventDefault();
    
    const studentName = studentNameInput.value;
    const studentEmail = studentEmailInput.value;
    
    // Save data
    localStorage.setItem('currentStudent', studentName);
    localStorage.setItem('currentEmail', studentEmail);
    
    // Update UI
    updateRecordsDisplay();
    renderCharts();
    
    // Show success message
    showNotification('Profile saved successfully!', 'success');
}

function updateRecordsDisplay() {
    // Filter records based on selection
    const filteredRecords = getFilteredRecords();
    
    // Clear table
    recordsBody.innerHTML = '';
    
    if (filteredRecords.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="3" style="text-align: center;">No records found</td>`;
        recordsBody.appendChild(row);
        totalChargeElement.textContent = '₹0.00';
        return;
    }
    
    // Add records to table
    filteredRecords.forEach(record => {
        const row = document.createElement('tr');
        
        const formattedDate = new Date(record.date).toLocaleDateString();
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${record.mealTime}</td>
            <td>₹${record.charge.toFixed(2)}</td>
        `;
        
        recordsBody.appendChild(row);
    });
    
    // Update total
    const total = filteredRecords.reduce((sum, record) => sum + record.charge, 0);
    totalChargeElement.textContent = `₹${total.toFixed(2)}`;
}

function getFilteredRecords() {
    const filter = filterPeriod.value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get current student's records only
    let records = dietRecords.filter(record => 
        record.studentName === studentNameInput.value
    );
    
    // Apply time filter
    switch (filter) {
        case 'day':
            return records.filter(record => {
                const recordDate = new Date(record.date);
                recordDate.setHours(0, 0, 0, 0);
                return recordDate.getTime() === today.getTime();
            });
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            return records.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= weekStart;
            });
        case 'month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            return records.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= monthStart;
            });
        default:
            return records;
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function exportToExcel() {
    alert("To export records, please contact the administration or log in as an administrator.");
}

function renderCharts() {
    renderMealDistributionChart();
    renderWeeklyExpensesChart();
}

function renderMealDistributionChart() {
    const records = dietRecords.filter(record => 
        record.studentName === studentNameInput.value
    );
    
    // Count meals by type
    const mealCounts = {
        'Breakfast': 0,
        'Lunch': 0,
        'Dinner': 0
    };
    
    // Sum charges by meal type
    const mealCharges = {
        'Breakfast': 0,
        'Lunch': 0,
        'Dinner': 0
    };
    
    records.forEach(record => {
        mealCounts[record.mealTime]++;
        mealCharges[record.mealTime] += record.charge;
    });
    
    const mealLabels = Object.keys(mealCounts);
    const mealData = Object.values(mealCharges);
    
    // Get canvas and destroy any existing chart
    const mealCanvas = document.getElementById('meal-chart');
    if (window.mealChart) {
        window.mealChart.destroy();
    }
    
    // Create new chart
    window.mealChart = new Chart(mealCanvas, {
        type: 'pie',
        data: {
            labels: mealLabels,
            datasets: [{
                data: mealData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            let value = context.formattedValue || '';
                            return `${label}: ₹${value}`;
                        }
                    }
                }
            }
        }
    });
}

function renderWeeklyExpensesChart() {
    const records = dietRecords.filter(record => 
        record.studentName === studentNameInput.value
    );
    
    // Get last 7 days
    const dates = [];
    const dailyCharges = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dateString = date.toISOString().split('T')[0];
        const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        dates.push(formattedDate);
        
        // Sum charges for this day
        const dayTotal = records
            .filter(record => record.date === dateString)
            .reduce((sum, record) => sum + record.charge, 0);
        
        dailyCharges.push(dayTotal);
    }
    
    // Get canvas and destroy any existing chart
    const weeklyCanvas = document.getElementById('weekly-chart');
    if (window.weeklyChart) {
        window.weeklyChart.destroy();
    }
    
    // Create new chart
    window.weeklyChart = new Chart(weeklyCanvas, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Daily Expenses',
                data: dailyCharges,
                backgroundColor: 'rgba(0, 113, 188, 0.7)',
                borderColor: 'rgba(0, 113, 188, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            let value = context.formattedValue || '';
                            return `${label}: ₹${value}`;
                        }
                    }
                }
            }
        }
    });
}

function filterRecords() {
    updateRecordsDisplay();
    renderCharts();
} 