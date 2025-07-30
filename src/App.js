import React, { useState } from 'react';
import './App.css';
import { saveAs } from 'file-saver';

function App() {
  const [studentId, setStudentId] = useState('');
  const [scanMode, setScanMode] = useState('out');
  const [offCampusStudents, setOffCampusStudents] = useState([]);
  const [log, setLog] = useState([]);
  const [message, setMessage] = useState('');

  const handleIdSubmit = (idOverride) => {
    const id = idOverride || studentId.trim();
    if (!id) return;

    const timestamp = new Date();
    let updatedOffCampus = [...offCampusStudents];
    let updatedLog = [...log];
    let duplicate = false;

    if (scanMode === 'out') {
      if (!offCampusStudents.find(entry => entry.id === id)) {
        updatedOffCampus.push({ id, outTime: timestamp });
        updatedLog.push({ id, time: timestamp.toLocaleString(), action: 'Checked Out' });
        setMessage(`${id} checked out at ${timestamp.toLocaleString()}`);
      } else {
        duplicate = true;
      }
    } else {
      const studentEntry = offCampusStudents.find(entry => entry.id === id);
      if (studentEntry) {
        const returnTime = timestamp;
        const durationMs = returnTime - new Date(studentEntry.outTime);
        const minutes = Math.floor((durationMs / 1000 / 60) % 60);
        const hours = Math.floor(durationMs / 1000 / 60 / 60);
        const duration = `${hours}hr${minutes.toString().padStart(2, '0')}min`;

        updatedOffCampus = updatedOffCampus.filter(entry => entry.id !== id);
        updatedLog.push({ id, time: returnTime.toLocaleString(), action: 'Checked In', duration });
        setMessage(`${id} checked in at ${returnTime.toLocaleString()}`);
      } else {
        duplicate = true;
      }
    }

    if (duplicate) {
      setMessage(`Duplicate scan detected: ${id} already ${scanMode === 'out' ? 'off campus' : 'on campus'}`);
    }

    setOffCampusStudents(updatedOffCampus);
    setLog(updatedLog);
    setStudentId('');

    setTimeout(() => setMessage(''), 3000);
  };

  const exportCSV = () => {
    const header = 'Student ID,Time,Action,Duration\n';
    const rows = log.map(entry => `${entry.id},${entry.time},${entry.action},${entry.duration || ''}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'daily_log.csv');
  };

  return (
    <div className="App">
      <h1>Lunch Period Scanner</h1>
      <div style={{ fontWeight: 'bold' }}>Scan Mode:</div>
      <table style={{ marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td>Check Students Out</td>
            <td>
              <input
                type="radio"
                checked={scanMode === 'out'}
                onChange={() => setScanMode('out')}
              />
            </td>
          </tr>
          <tr>
            <td>Check Students In</td>
            <td>
              <input
                type="radio"
                checked={scanMode === 'in'}
                onChange={() => setScanMode('in')}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <input
        type="text"
        value={studentId}
        onChange={e => setStudentId(e.target.value)}
        placeholder="Scan or Enter Student ID"
        onKeyDown={e => e.key === 'Enter' && handleIdSubmit()}
      />
      <button onClick={() => handleIdSubmit()}>Submit ID</button>
      {message && <div style={{ marginTop: '10px', color: 'blue' }}>{message}</div>}
      <h2>Currently Off Campus</h2>
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Checked Out</th>
            <th>Returned</th>
            <th>Return Time</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {offCampusStudents.map(({ id, outTime }) => {
            return (
              <tr key={id}>
                <td>{id}</td>
                <td>{new Date(outTime).toLocaleString()}</td>
                <td>❌</td>
                <td>-</td>
                <td>-</td>
              </tr>
            );
          })}
          {log.filter(entry => entry.action === 'Checked In').map((entry, idx) => {
            const outLog = log.find(l => l.id === entry.id && l.action === 'Checked Out');
            const durationParts = entry.duration.match(/(\d+)hr(\d+)min/);
            const hours = parseInt(durationParts?.[1] || '0', 10);
            const durationStyle = hours >= 1 ? { backgroundColor: 'red', color: 'white' } : {};

            return (
              <tr key={`in-${idx}`}>
                <td>{entry.id}</td>
                <td>{outLog?.time || '-'}</td>
                <td>✅</td>
                <td>{entry.time}</td>
                <td style={durationStyle}>{entry.duration}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button onClick={exportCSV}>Export Daily Log (CSV)</button>
    </div>
  );
}

export default App;
