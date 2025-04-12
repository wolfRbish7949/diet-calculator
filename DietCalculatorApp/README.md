# Hostel Mess Diet Calculator - React Native App

A mobile application for hostel students to track their mess diet charges and generate reports.

## Features

- Record daily meal charges (breakfast, lunch, dinner)
- Filter records by day, week, or month
- Search for records by student name or email
- Visualize expenses with interactive charts
- Export records to Excel
- Email reports to students
- Dark mode support
- Cross-platform (Android & iOS)

## Screenshots

(Screenshots will be added here after building the app)

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, Mac only)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/diet-calculator-app.git
cd diet-calculator-app
```

1. Install dependencies:
```bash
npm install
# or
yarn install
```

1. Start the development server:
```bash
npm start
# or
yarn start
```

1. Use the Expo Go app on your device to scan the QR code displayed in the terminal, or run on an emulator:
```bash
npm run android
# or
npm run ios (Mac only)
```

## Building the App

### For Android:

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

1. Log in to your Expo account:
```bash
eas login
```

1. Configure the build:
```bash
eas build:configure
```

1. Build for Android:
```bash
eas build -p android
```

### For iOS (Mac only):

1. Build for iOS:
```bash
eas build -p ios
```

## Project Structure

```
diet-calculator-app/
├── App.js                  # Main application component
├── app.json                # Expo configuration
├── package.json            # Dependencies and scripts
├── assets/                 # App icons, splash screen, etc.
└── src/
    ├── screens/            # Screen components
    │   ├── HomeScreen.js   # Add diet records
    │   ├── RecordsScreen.js # View and manage records
    │   ├── AnalyticsScreen.js # Visualize expenses
    │   └── SettingsScreen.js # App settings
    └── components/         # Reusable components
```

## Libraries Used

- React Native
- Expo
- React Navigation
- AsyncStorage
- React Native Chart Kit
- XLSX.js
- React Native Vector Icons
- Expo Mail Composer

## License

MIT License

## Author

Your Name

## Acknowledgments

- Hostel Mess Administration
- React Native Community
- Expo Team