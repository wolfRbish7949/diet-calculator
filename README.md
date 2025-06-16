# diet kal-C

Hostel Mess Diet Calculator
A simple web application for hostel students to track their mess diet charges and generate reports.

## Features

- Record daily meal charges (breakfast, lunch, dinner)
- Filter records by day, week, or month
- Visualize expenses with charts
- Export records to Excel
- Email reports to students
- Store data locally in the browser

## How to Use

1. Open `index.html` in a web browser
2. Enter your name and email
3. Add meal records with date, meal time, and charge
4. View your records in the table
5. Use the filter dropdown to see specific time periods
6. Export data to Excel or email reports as needed
7. View expense analytics in charts

## Technical Details

This app uses:
- HTML5, CSS3, and JavaScript
- Chart.js for data visualization
- SheetJS for Excel export
- SMTP.js for email functionality (demo mode)
- Local storage for data persistence

## Important Note

This is a client-side application that stores all data in your browser's local storage. No data is sent to any server except when you explicitly use the email feature (which is in demo mode).

## Future Enhancements

- User authentication
- Cloud data storage
- Mobile app version
- Admin panel for mess managers

## Setup for Email Functionality

To enable actual email functionality, you'll need to:

1. Sign up for an email service like EmailJS
2. Get your service ID and template ID
3. Replace the placeholder IDs in the `sendEmailReport` function in `script.js`

```javascript
emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
    to_email: email,
    subject: subject,
    message_html: body
})
``` 
