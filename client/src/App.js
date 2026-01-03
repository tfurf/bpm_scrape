import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [logs, setLogs] = useState([]);
  const [formData, setFormData] = useState({
    systolic: '',
    diastolic: '',
    pulse: '',
    notes: ''
  });
  const [capturedImage, setCapturedImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [view, setView] = useState('form'); // 'form' or 'logs'
  const [exportData, setExportData] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      const data = await response.json();
      setLogs(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.systolic || !formData.diastolic || !formData.pulse) {
      alert('Please fill in systolic, diastolic, and pulse values');
      return;
    }

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
          imageData: capturedImage
        }),
      });

      if (response.ok) {
        setFormData({ systolic: '', diastolic: '', pulse: '', notes: '' });
        setCapturedImage(null);
        fetchLogs();
        alert('Blood pressure reading saved!');
      } else {
        alert('Failed to save reading');
      }
    } catch (error) {
      console.error('Error saving log:', error);
      alert('Error saving reading');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/logs/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLogs();
        alert('Entry deleted successfully');
      } else {
        alert('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting log:', error);
      alert('Error deleting entry');
    }
  };

  const handleExportToSheets = async () => {
    try {
      const response = await fetch('/api/export/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: 'your-spreadsheet-id'
        }),
      });

      const data = await response.json();
      setExportData(data);
      alert('Export data prepared! See the export section below.');
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error preparing export');
    }
  };

  const copyExportData = () => {
    if (!exportData) return;
    
    const text = [
      exportData.headers.join('\t'),
      ...exportData.data.map(row => row.join('\t'))
    ].join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      alert('Data copied to clipboard! Paste into your Google Sheet.');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🩺 Blood Pressure Monitor</h1>
      </header>

      <nav className="nav-tabs">
        <button 
          className={view === 'form' ? 'active' : ''} 
          onClick={() => setView('form')}
        >
          New Reading
        </button>
        <button 
          className={view === 'logs' ? 'active' : ''} 
          onClick={() => setView('logs')}
        >
          View Logs ({logs.length})
        </button>
      </nav>

      {view === 'form' && (
        <div className="form-container">
          <div className="camera-section">
            {!showCamera && !capturedImage && (
              <button className="camera-btn" onClick={startCamera}>
                📷 Take Photo of Monitor
              </button>
            )}

            {showCamera && (
              <div className="camera-view">
                <video ref={videoRef} autoPlay playsInline />
                <div className="camera-controls">
                  <button onClick={captureImage}>📸 Capture</button>
                  <button onClick={stopCamera}>❌ Cancel</button>
                </div>
              </div>
            )}

            {capturedImage && (
              <div className="captured-image">
                <img src={capturedImage} alt="Captured monitor" />
                <button onClick={() => setCapturedImage(null)}>🔄 Retake</button>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          <form onSubmit={handleSubmit} className="bp-form">
            <h2>Enter Blood Pressure Reading</h2>
            
            <div className="form-group">
              <label htmlFor="systolic">Systolic (mmHg)</label>
              <input
                type="number"
                id="systolic"
                name="systolic"
                value={formData.systolic}
                onChange={handleInputChange}
                placeholder="120"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="diastolic">Diastolic (mmHg)</label>
              <input
                type="number"
                id="diastolic"
                name="diastolic"
                value={formData.diastolic}
                onChange={handleInputChange}
                placeholder="80"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="pulse">Pulse (bpm)</label>
              <input
                type="number"
                id="pulse"
                name="pulse"
                value={formData.pulse}
                onChange={handleInputChange}
                placeholder="72"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (optional)</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any additional notes..."
                rows="3"
              />
            </div>

            <button type="submit" className="submit-btn">
              💾 Save Reading
            </button>
          </form>
        </div>
      )}

      {view === 'logs' && (
        <div className="logs-container">
          <div className="logs-header">
            <h2>Reading History</h2>
            <button className="export-btn" onClick={handleExportToSheets}>
              📊 Export to Google Sheets
            </button>
          </div>

          {exportData && (
            <div className="export-data">
              <h3>Export Data Ready</h3>
              <p>{exportData.instructions}</p>
              <button onClick={copyExportData}>📋 Copy to Clipboard</button>
              <pre className="export-preview">
                {exportData.headers.join('\t') + '\n' + 
                 exportData.data.slice(0, 3).map(row => row.join('\t')).join('\n') +
                 (exportData.data.length > 3 ? '\n...' : '')}
              </pre>
            </div>
          )}

          {logs.length === 0 ? (
            <p className="no-logs">No readings yet. Add your first reading!</p>
          ) : (
            <div className="logs-list">
              {logs.map(log => (
                <div key={log.id} className="log-entry">
                  <div className="log-header">
                    <span className="log-date">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(log.id)}
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="log-values">
                    <div className="value">
                      <span className="label">Systolic:</span>
                      <span className="number">{log.systolic}</span>
                    </div>
                    <div className="value">
                      <span className="label">Diastolic:</span>
                      <span className="number">{log.diastolic}</span>
                    </div>
                    <div className="value">
                      <span className="label">Pulse:</span>
                      <span className="number">{log.pulse}</span>
                    </div>
                  </div>
                  {log.notes && (
                    <div className="log-notes">
                      <strong>Notes:</strong> {log.notes}
                    </div>
                  )}
                  {log.imageData && (
                    <div className="log-image">
                      <img src={log.imageData} alt="Monitor reading" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
