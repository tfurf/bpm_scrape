const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logsFile = path.join(logsDir, 'bp_logs.json');

// Initialize logs file if it doesn't exist
if (!fs.existsSync(logsFile)) {
  fs.writeFileSync(logsFile, JSON.stringify([], null, 2));
}

// Helper function to read logs
function readLogs() {
  try {
    const data = fs.readFileSync(logsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading logs:', error);
    return [];
  }
}

// Helper function to write logs
function writeLogs(logs) {
  try {
    fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing logs:', error);
    return false;
  }
}

// GET all logs
app.get('/api/logs', (req, res) => {
  const logs = readLogs();
  res.json(logs);
});

// POST new log entry
app.post('/api/logs', (req, res) => {
  const { systolic, diastolic, pulse, timestamp, notes, imageData } = req.body;
  
  if (!systolic || !diastolic || !pulse) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const logs = readLogs();
  const newEntry = {
    id: Date.now().toString(),
    systolic: parseInt(systolic),
    diastolic: parseInt(diastolic),
    pulse: parseInt(pulse),
    timestamp: timestamp || new Date().toISOString(),
    notes: notes || '',
    imageData: imageData || null,
    createdAt: new Date().toISOString()
  };

  logs.push(newEntry);
  
  if (writeLogs(logs)) {
    res.status(201).json(newEntry);
  } else {
    res.status(500).json({ error: 'Failed to save log' });
  }
});

// DELETE log entry
app.delete('/api/logs/:id', (req, res) => {
  const { id } = req.params;
  const logs = readLogs();
  const filteredLogs = logs.filter(log => log.id !== id);
  
  if (logs.length === filteredLogs.length) {
    return res.status(404).json({ error: 'Log entry not found' });
  }

  if (writeLogs(filteredLogs)) {
    res.json({ message: 'Log deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

// Google Sheets export endpoint
app.post('/api/export/sheets', async (req, res) => {
  try {
    const { spreadsheetId, credentials } = req.body;
    
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Spreadsheet ID is required' });
    }

    const logs = readLogs();
    
    // For now, return the logs in a format ready for sheets
    // Full Google Sheets API integration requires OAuth setup
    const exportData = logs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.systolic,
      log.diastolic,
      log.pulse,
      log.notes
    ]);

    res.json({
      message: 'Data prepared for export',
      headers: ['Timestamp', 'Systolic', 'Diastolic', 'Pulse', 'Notes'],
      data: exportData,
      instructions: 'Copy this data and paste into your Google Sheet, or configure Google Sheets API credentials'
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Access from your phone using your computer's IP address on port ${PORT}`);
});
