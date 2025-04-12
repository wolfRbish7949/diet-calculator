// DOM Elements
const dietForm = document.getElementById('diet-form');
const studentNameInput = document.getElementById('student-name');
const studentEmailInput = document.getElementById('student-email');
const dateInput = document.getElementById('date');
const mealTimeInput = document.getElementById('meal-time');
const chargeInput = document.getElementById('charge');
const recordsBody = document.getElementById('records-body');
const totalChargeElement = document.getElementById('total-charge');
const filterPeriod = document.getElementById('filter-period');
const exportBtn = document.getElementById('export-btn');
const emailBtn = document.getElementById('email-btn');
const emailModal = document.getElementById('email-modal');
const closeModalBtn = document.querySelector('.close');
const confirmEmailBtn = document.getElementById('confirm-email');
const cancelEmailBtn = document.getElementById('cancel-email');
const emailDisplay = document.getElementById('email-display');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');

// Initialize data
let dietRecords = JSON.parse(localStorage.getItem('dietRecords')) || [];
let currentStudent = localStorage.getItem('currentStudent') || '';
let currentEmail = localStorage.getItem('currentEmail') || '';
let searchQuery = '';

// Set default date to today
dateInput.valueAsDate = new Date();

// Update UI with stored student data
if (currentStudent) {
    studentNameInput.value = currentStudent;
}
if (currentEmail) {
    studentEmailInput.value = currentEmail;
}

// Event Listeners
dietForm.addEventListener('submit', addDietRecord);
filterPeriod.addEventListener('change', filterRecords);
exportBtn.addEventListener('click', exportToExcel);
emailBtn.addEventListener('click', openEmailModal);
closeModalBtn.addEventListener('click', closeEmailModal);
confirmEmailBtn.addEventListener('click', sendEmailReport);
cancelEmailBtn.addEventListener('click', closeEmailModal);
searchBtn.addEventListener('click', searchRecords);
clearSearchBtn.addEventListener('click', clearSearch);
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchRecords();
    }
});

// Display initial records
updateRecordsDisplay();
renderCharts();

// Functions
function addDietRecord(e) {
    e.preventDefault();
    
    const studentName = studentNameInput.value;
    const studentEmail = studentEmailInput.value;
    const date = dateInput.value;
    const mealTime = mealTimeInput.value;
    const charge = parseFloat(chargeInput.value);
    
    const newRecord = {
        id: Date.now(),
        studentName,
        studentEmail,
        date,
        mealTime,
        charge
    };
    
    dietRecords.push(newRecord);
    
    // Save data
    saveData();
    
    // Reset form
    mealTimeInput.value = '';
    chargeInput.value = '';
    dateInput.valueAsDate = new Date();
    
    // Update UI
    updateRecordsDisplay();
    renderCharts();
    
    // Show success message
    showNotification('Diet record added successfully!', 'success');
}

function updateRecordsDisplay() {
    // Filter records based on selection
    const filteredRecords = getFilteredRecords();
    
    // Clear table
    recordsBody.innerHTML = '';
    
    if (filteredRecords.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" style="text-align: center;">No records found</td>`;
        recordsBody.appendChild(row);
        totalChargeElement.textContent = '₹0.00';
        return;
    }
    
    // Add records to table
    filteredRecords.forEach(record => {
        const row = document.createElement('tr');
        
        const formattedDate = new Date(record.date).toLocaleDateString();
        
        row.innerHTML = `
            <td>${record.studentName}</td>
            <td>${record.studentEmail}</td>
            <td>${formattedDate}</td>
            <td>${record.mealTime}</td>
            <td>₹${record.charge.toFixed(2)}</td>
            <td>
                <button class="action-btn" onclick="deleteRecord(${record.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
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
    
    // Get all records first
    let records = dietRecords;
    
    // Apply search filter if exists
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        records = records.filter(record => 
            record.studentName.toLowerCase().includes(query) || 
            record.studentEmail.toLowerCase().includes(query)
        );
    } 
    // If no search query, filter by current student
    else {
        records = records.filter(record => 
            record.studentName === studentNameInput.value
        );
    }
    
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

function deleteRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        dietRecords = dietRecords.filter(record => record.id !== id);
        saveData();
        updateRecordsDisplay();
        renderCharts();
        showNotification('Record deleted successfully!', 'success');
    }
}

function saveData() {
    localStorage.setItem('dietRecords', JSON.stringify(dietRecords));
    localStorage.setItem('currentStudent', studentNameInput.value);
    localStorage.setItem('currentEmail', studentEmailInput.value);
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
    const filteredRecords = getFilteredRecords();
    
    if (filteredRecords.length === 0) {
        showNotification('No records to export!', 'error');
        return;
    }
    
    // Create worksheet data
    const worksheetData = [
        ['Student Name', 'Date', 'Meal Time', 'Charge (₹)']
    ];
    
    filteredRecords.forEach(record => {
        worksheetData.push([
            record.studentName,
            new Date(record.date).toLocaleDateString(),
            record.mealTime,
            record.charge
        ]);
    });
    
    // Add total row
    const total = filteredRecords.reduce((sum, record) => sum + record.charge, 0);
    worksheetData.push(['Total', '', '', total]);
    
    // Create workbook
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Diet Records');
    
    // Generate filename
    const studentName = studentNameInput.value.replace(/\s+/g, '_');
    const period = filterPeriod.value;
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${studentName}_mess_charges_${period}_${timestamp}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
    showNotification('Excel file exported successfully!', 'success');
}

function openEmailModal() {
    const email = studentEmailInput.value;
    
    if (!email) {
        showNotification('Please enter your email address!', 'error');
        return;
    }
    
    if (getFilteredRecords().length === 0) {
        showNotification('No records to send!', 'error');
        return;
    }
    
    emailDisplay.textContent = email;
    emailModal.style.display = 'flex';
}

function closeEmailModal() {
    emailModal.style.display = 'none';
}

function sendEmailReport() {
    const email = studentEmailInput.value;
    const studentName = studentNameInput.value;
    const filteredRecords = getFilteredRecords();
    const period = filterPeriod.options[filterPeriod.selectedIndex].text;
    
    if (filteredRecords.length === 0) {
        closeEmailModal();
        showNotification('No records to send!', 'error');
        return;
    }
    
    // Create table for email
    let tableHtml = `
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <tr style="background-color: #e6f3fa;">
                <th>Date</th>
                <th>Meal Time</th>
                <th>Charge (₹)</th>
            </tr>
    `;
    
    filteredRecords.forEach(record => {
        tableHtml += `
            <tr>
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td>${record.mealTime}</td>
                <td>₹${record.charge.toFixed(2)}</td>
            </tr>
        `;
    });
    
    const total = filteredRecords.reduce((sum, record) => sum + record.charge, 0);
    
    tableHtml += `
        <tr style="font-weight: bold;">
            <td colspan="2">Total</td>
            <td>₹${total.toFixed(2)}</td>
        </tr>
    </table>
    `;
    
    // Email content
    const subject = `Hostel Mess Diet Charges - ${period}`;
    const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0071bc;">Hostel Mess Diet Report</h2>
            <p>Dear ${studentName},</p>
            <p>Here is your mess diet charges report for ${period}:</p>
            ${tableHtml}
            <p style="margin-top: 20px;">Thank you for using our Hostel Mess Diet Calculator!</p>
        </div>
    `;
    
    // Use Email.js service (this is a mock - in a real app you'd configure Email.js)
    emailjs.send("service_id", "template_id", {
        to_email: email,
        subject: subject,
        message_html: body
    })
    .then(() => {
        closeEmailModal();
        showNotification('Report sent to your email!', 'success');
    })
    .catch(error => {
        console.error('Email error:', error);
        closeEmailModal();
        showNotification('Failed to send email. Please try again later.', 'error');
    });
    
    // For demo purposes, we'll just close the modal and show success
    closeEmailModal();
    showNotification('Report sent to your email! (Demo)', 'success');
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

function searchRecords() {
    searchQuery = searchInput.value.trim();
    if (searchQuery) {
        showNotification(`Searching for "${searchQuery}"`, 'success');
    }
    updateRecordsDisplay();
    renderCharts();
}

function clearSearch() {
    searchInput.value = '';
    searchQuery = '';
    updateRecordsDisplay();
    renderCharts();
    showNotification('Search cleared', 'success');
}

// Add this to make delete function available globally
window.deleteRecord = deleteRecord; 