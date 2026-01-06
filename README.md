# bpm_scrape

Blood pressure monitor logger web app - a mobile-friendly web application for capturing and logging blood pressure readings.

## Features

- 📷 **Camera Integration**: Take photos of your blood pressure monitor directly from your phone
- 🔍 **Automatic OCR**: Automatically extract readings from photos using Tesseract.js OCR
- 📊 **Data Logging**: Record systolic, diastolic, pulse, and notes with timestamps
- 📱 **Mobile-Friendly**: Optimized UI for smartphone usage
- 💾 **Local Storage**: All data saved locally in JSON format
- 📈 **Export to Google Sheets**: Prepare data for easy export to Google Sheets
- 🗑️ **Manage Entries**: View and delete historical readings
- ✏️ **Manual Override**: Edit OCR results before saving

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

## Deployment

### Docker & Kubernetes (k3s)

For production deployment on Kubernetes/k3s, see **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed instructions.

#### Option 1: Helm Chart (Recommended)

```bash
# Build and import image
docker build -t bpm-scrape:latest .
docker save bpm-scrape:latest | sudo k3s ctr images import -

# Install with Helm
helm install bpm-scrape ./helm/bpm-scrape --namespace bpm-scrape --create-namespace

# Or with custom values
helm install bpm-scrape ./helm/bpm-scrape -f ./helm/bpm-scrape/values-home.yaml
```

See **[helm/bpm-scrape/README.md](helm/bpm-scrape/README.md)** for complete Helm documentation.

#### Option 2: Direct kubectl

```bash
# Build and import image
docker build -t bpm-scrape:latest .
docker save bpm-scrape:latest | sudo k3s ctr images import -

# Deploy with kubectl
kubectl apply -f k8s/
```

## Usage

### Taking a Reading with OCR

1. Click "New Reading" tab
2. Tap "📷 Take Photo of Monitor" to capture an image
3. **The app automatically processes the image with OCR** and extracts:
   - Systolic pressure (top number)
   - Diastolic pressure (bottom number)
   - Pulse/heart rate
4. **Verify the extracted values** - OCR may not be 100% accurate
5. Edit any incorrect values manually
6. Add any notes (optional)
7. Tap "💾 Save Reading"

**OCR Tips for Best Results:**
- Ensure good lighting when taking the photo
- Keep the camera steady and in focus
- Position the monitor display clearly in frame
- Avoid glare or reflections on the screen
- If OCR fails, you can manually enter the values

### Manual Entry (Without Photo)

You can also skip the photo and enter values directly into the form fields.

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

**OCR not detecting values:**
- Ensure good lighting and clear focus when taking photo
- Avoid glare or shadows on the monitor screen
- Take photo straight-on, not at an angle
- Use the "Re-process Image" button to try OCR again
- If OCR continues to fail, manually enter the values

**Cannot connect from phone:**
- Verify both devices are on the same network
- Check firewall settings
- Ensure the server is bound to 0.0.0.0 (not 127.0.0.1)

## How OCR Works

The app uses [Tesseract.js](https://tesseract.projectnaptha.com/), an open-source OCR engine, to extract text from blood pressure monitor photos. The system:

1. Captures the image from your camera
2. Processes it with Tesseract OCR engine
3. Searches for common blood pressure patterns like:
   - "120/80" format
   - "SYS 120 DIA 80" labels
   - "PULSE 72" or "HR 72" indicators
4. Validates ranges (systolic: 60-250, diastolic: 40-150, pulse: 30-220)
5. Auto-fills the form fields with detected values

**Note:** OCR accuracy depends on image quality, monitor display clarity, and text format. Always verify extracted values before saving.

## License

MIT

