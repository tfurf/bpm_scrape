# bpm_scrape

Blood pressure monitor logger web app - a mobile-friendly web application for capturing and logging blood pressure readings.

## Features

- 📷 **Camera Integration**: Take photos of your blood pressure monitor directly from your phone
- 📊 **Data Logging**: Record systolic, diastolic, pulse, and notes with timestamps
- 📱 **Mobile-Friendly**: Optimized UI for smartphone usage
- 💾 **Local Storage**: All data saved locally in JSON format
- 📈 **Export to Google Sheets**: Prepare data for easy export to Google Sheets
- 🗑️ **Manage Entries**: View and delete historical readings

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/tfurf/bpm_scrape.git
cd bpm_scrape
```

2. Install dependencies for both server and client:
```bash
npm run install-all
```

3. Create environment configuration (optional):
```bash
cp .env.example .env
```

## Running the Application

### Development Mode

Run both server and client concurrently:
```bash
npm run dev
```

Or run them separately:

**Server only:**
```bash
npm run server
```

**Client only:**
```bash
npm run client
```

### Production Mode

1. Build the React client:
```bash
npm run build
```

2. Start the server:
```bash
npm run server
```

## Accessing on Your Phone

1. Find your computer's local IP address:
   - **macOS/Linux**: Run `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - **Windows**: Run `ipconfig` and look for IPv4 Address

2. Start the development server with `npm run dev`

3. On your phone (connected to the same network), open:
   - For development: `http://YOUR_IP_ADDRESS:3000`
   - For production: `http://YOUR_IP_ADDRESS:5000`

4. Grant camera permissions when prompted

## Usage

### Taking a Reading

1. Click "New Reading" tab
2. Tap "📷 Take Photo of Monitor" to capture an image (optional)
3. Enter your blood pressure values:
   - Systolic (top number)
   - Diastolic (bottom number)
   - Pulse rate
4. Add any notes (optional)
5. Tap "💾 Save Reading"

### Viewing History

1. Click "View Logs" tab
2. Browse all your readings sorted by date
3. Delete entries by tapping the 🗑️ icon

### Exporting to Google Sheets

1. Go to "View Logs" tab
2. Tap "📊 Export to Google Sheets"
3. Tap "📋 Copy to Clipboard"
4. Open your Google Sheet
5. Paste the data

## Data Storage

All readings are stored locally in `logs/bp_logs.json`. Each entry includes:
- Unique ID
- Systolic, diastolic, and pulse values
- Timestamp
- Optional notes
- Optional photo (base64 encoded)

## Project Structure

```
bpm_scrape/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.js         # Main application component
│   │   ├── App.css        # Styles
│   │   └── index.js       # Entry point
│   └── package.json
├── server/                 # Express backend
│   └── index.js           # API server
├── logs/                   # Data storage
│   └── bp_logs.json       # JSON database
├── package.json           # Root package config
└── README.md
```

## API Endpoints

- `GET /api/logs` - Retrieve all log entries
- `POST /api/logs` - Create a new log entry
- `DELETE /api/logs/:id` - Delete a log entry
- `POST /api/export/sheets` - Prepare data for Google Sheets export
- `GET /api/health` - Health check endpoint

## Security Notes

- This app is designed for home network use only
- No authentication is implemented by default
- No rate limiting is implemented (suitable for single-user home network use)
- For production use on public networks, consider adding:
  - User authentication and authorization
  - Rate limiting on API endpoints
  - HTTPS/TLS encryption
  - Input validation and sanitization
- Camera access requires HTTPS on most browsers (except localhost)
- Data is stored locally in plain text JSON format

## Future Enhancements

- Full Google Sheets OAuth integration
- Data visualization with charts
- Export to CSV
- Reminders for taking readings
- Multi-user support with authentication

## Troubleshooting

**Camera not working:**
- Ensure you're accessing via HTTPS or localhost
- Check browser camera permissions
- Try using a different browser (Chrome/Safari recommended)

**Cannot connect from phone:**
- Verify both devices are on the same network
- Check firewall settings
- Ensure the server is bound to 0.0.0.0 (not 127.0.0.1)

## License

MIT

