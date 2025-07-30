import React, { useState } from 'react';
import './App.css';
import { saveAs } from 'file-saver';

function App() {
  const [studentId, setStudentId] = useState('');
  const [scanMode, setScanMode] = useState('out');
  const [offCampusStudents, setOffCampusStudents] = useState([]);
  const [log, setLog] = useState([]);

  const handleIdSubmit = (idOverride) => {
    const id = idOverride || studentId.trim();
    if (!id) return;

    const timestamp = new Date().toLocaleString();
    let updatedOffCampus = [...offCampusStudents];
    let updatedLog = [...log];

    if (scanMode === 'out') {
      if (!offCampusStudents.includes(id)) {
        updatedOffCampus.push(id);
        updatedLog.push({ id, time: timestamp, action: 'Checked Out' });
      }
    } else {
      updatedOffCampus = updatedOffCampus.filter(sid => sid !== id);
      updatedLog.push({ id, time: timestamp, action: 'Checked In' });
    }

    setOffCampusStudents(updatedOffCampus);
    setLog(updatedLog);
    setStudentId('');
  };

  const exportCSV = () => {
    const header = 'Student ID,Time,Action\n';
    const rows = log.map(entry => `${entry.id},${entry.time},${entry.action}`).join('\n');
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
      <h2>Currently Off Campus</h2>
      <ul>
        {offCampusStudents.map(id => (
          <li key={id}>{id}</li>
        ))}
      </ul>
      <button onClick={exportCSV}>Export Daily Log (CSV)</button>
    </div>
  );
}

export default App;
