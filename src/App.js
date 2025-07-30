import React, { useState, useEffect } from 'react';
import './App.css';
import { saveAs } from 'file-saver';

function App() {
  const [studentId, setStudentId] = useState('');
  const [scanMode, setScanMode] = useState('out');
  const [offCampusStudents, setOffCampusStudents] = useState(() => {
    const saved = localStorage.getItem('offCampusStudents');
    return saved ? JSON.parse(saved) : [];
  });
  const [log, setLog] = useState(() => {
    const saved = localStorage.getItem('log');
    return saved ? JSON.parse(saved) : [];
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    localStorage.setItem('offCampusStudents', JSON.stringify(offCampusStudents));
  }, [offCampusStudents]);

  useEffect(() => {
    localStorage.setItem('log', JSON.stringify(log));
  }, [log]);

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
        updatedLog.push({ id, time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), action: 'Checked Out' });
        setMessage(`${id} checked out at ${timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
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
        updatedLog.push({
          id,
          time: returnTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          action: 'Checked In',
          duration,
          outTime: new Date(studentEntry.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
        setMessage(`${id} checked in at ${returnTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
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
    const header = 'Student ID,Check Out Time,Returned,Return Time,Duration\n';

    const checkedOutMap = {};
    log.forEach(entry => {
      if (entry.action === 'Checked Out') {
        checkedOutMap[entry.id] = entry.time;
      }
    });

    const includedIds = new Set();

    const rows = log
      .filter(entry => {
        if (entry.action === 'Checked In') {
          includedIds.add(entry.id);
          return true;
        }
        return !includedIds.has(entry.id);
      })
      .map(entry => {
        if (entry.action === 'Checked In') {
          const returned = 'Yes';
          const returnTime = entry.time;
          const outTime = entry.outTime || checkedOutMap[entry.id] || '';
          const duration = entry.duration || '';
          return `${entry.id},${outTime},${returned},${returnTime},${duration}`;
        } else {
          return `${entry.id},${entry.time},No,,`;
        }
      }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'daily_log.csv');
  };

  const resetLog = () => {
    const confirmed = window.confirm("Are you sure you want to reset the log? This action cannot be undone.");
    if (!confirmed) return;

    setStudentId('');
    setScanMode('out');
    setOffCampusStudents([]);
    setLog([]);
    setMessage('Log has been reset.');
    setTimeout(() => setMessage(''), 3000);
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
      <table className="log-table">
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
          {offCampusStudents.map(({ id, outTime }) => (
            <tr key={id}>
              <td>{id}</td>
              <td>{new Date(outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
              <td>No</td>
              <td>-</td>
              <td>-</td>
            </tr>
          ))}
          {log.filter(entry => entry.action === 'Checked In').map((entry, idx) => {
            const outLog = log.find(l => l.id === entry.id && l.action === 'Checked Out');
            const durationParts = entry.duration?.match(/(\d+)hr(\d+)min/);
            const hours = parseInt(durationParts?.[1] || '0', 10);
            const durationStyle = hours >= 1 ? { backgroundColor: 'red', color: 'white' } : {};
            return (
              <tr key={`in-${idx}`}>
                <td>{entry.id}</td>
                <td>{entry.outTime || outLog?.time || '-'}</td>
                <td>Yes</td>
                <td>{entry.time}</td>
                <td style={durationStyle}>{entry.duration}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button onClick={exportCSV}>Export Daily Log (CSV)</button>
      <button onClick={resetLog} style={{ marginLeft: '10px' }}>Reset Log</button>
    </div>
  );
}

export default App;
