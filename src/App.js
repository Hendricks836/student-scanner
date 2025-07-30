// React component for checking Grade 12 students in/out during lunch with alerts, CSV export, scan modes, and automatic end-of-day reset
import React, { useState, useEffect, useRef } from 'react';

// Mocked roster from spreadsheet
const roster = {
  "771571": { name: "Favour Ahonle", grade: 12 },
  "773997": { name: "Jaylynn Alayon-Gonzalez", grade: 12 },
  "1824776": { name: "Daniel Alcocer", grade: 12 },
  "1899529": { name: "Macey Aldridge", grade: 12 },
  "1871912": { name: "King Alexander", grade: 12 },
  // Add the rest as needed...
};

const MAX_OUT_TIME_MINUTES = 45;
const RESET_HOUR = 17;
const RESET_MINUTE = 0;

const beep = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.type = 'sine';
  oscillator.frequency.value = 800;
  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.2);
  oscillator.stop(ctx.currentTime + 0.2);
};

const StudentScanner = () => {
  const [students, setStudents] = useState({});
  const [message, setMessage] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [scanMode, setScanMode] = useState('out');
  const [manualID, setManualID] = useState('');

  const handleScan = (data) => {
    if (data) {
      beep();
      processScan(data);
    }
  };

  const processScan = (data) => {
    const now = new Date();
    const studentInfo = roster[data];

    if (!studentInfo) {
      setMessage(`Scan rejected: Student ID ${data} not found in roster.`);
      return;
    }

    if (scanMode === 'out') {
      if (studentInfo.grade !== 12) {
        setMessage(`Scan rejected: ${studentInfo.name} is not in Grade 12.`);
        return;
      }

      const current = students[data];
      const updatedStudents = { ...students };

      if (!current || current.status === 'On Campus') {
        updatedStudents[data] = {
          ...studentInfo,
          status: 'Off Campus',
          timeOut: now,
        };
        setMessage(`${studentInfo.name} marked OFF CAMPUS at ${now.toLocaleTimeString()}`);
      } else {
        setMessage(`${studentInfo.name} is already marked OFF CAMPUS.`);
      }

      setStudents(updatedStudents);
    } else if (scanMode === 'in') {
      const current = students[data];
      const updatedStudents = { ...students };

      updatedStudents[data] = {
        ...studentInfo,
        status: 'On Campus',
        timeOut: current?.timeOut || null,
        timeIn: now,
      };
      setMessage(`${studentInfo.name} marked ON CAMPUS at ${now.toLocaleTimeString()}`);

      setStudents(updatedStudents);
    }
  };

  const handleManualSubmit = () => {
    if (manualID.trim() !== '') {
      handleScan(manualID.trim());
      setManualID('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  };

  const exportLogs = () => {
    const headers = ['Student ID', 'Name', 'Status', 'Date', 'Time Out', 'Time In', 'Duration (mins)'];
    const rows = Object.entries(students).map(([id, info]) => {
      const timeOut = info.timeOut ? new Date(info.timeOut) : null;
      const timeIn = info.timeIn ? new Date(info.timeIn) : null;
      const duration = timeOut && timeIn ? Math.floor((timeIn - timeOut) / 60000) : '';
      const date = timeOut ? timeOut.toLocaleDateString() : '';

      return [
        id,
        info.name,
        info.status,
        date,
        timeOut ? timeOut.toLocaleTimeString() : '',
        timeIn ? timeIn.toLocaleTimeString() : '',
        duration
      ];
    });

    const csvContent = [headers, ...rows]
      .map(e => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lunch_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  useEffect(() => {
    const alertInterval = setInterval(() => {
      const now = new Date();
      const newAlerts = [];

      Object.entries(students).forEach(([id, info]) => {
        if (info.status === 'Off Campus') {
          const diffMinutes = Math.floor((now - new Date(info.timeOut)) / 60000);
          if (diffMinutes > MAX_OUT_TIME_MINUTES) {
            newAlerts.push(`${info.name} has been off campus for ${diffMinutes} minutes.`);
          }
        }
      });

      setAlerts(newAlerts);
    }, 60000);

    return () => clearInterval(alertInterval);
  }, [students]);

  useEffect(() => {
    const resetInterval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === RESET_HOUR && now.getMinutes() === RESET_MINUTE) {
        exportLogs();
        setStudents({});
        setAlerts([]);
        setMessage('End of day reset completed and logs exported.');
      }
    }, 60000);

    return () => clearInterval(resetInterval);
  }, [students]);

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Lunch Period Scanner</h1>

      <div className="mb-4">
        <table className="table-auto border border-gray-300">
          <thead>
            <tr>
              <th colSpan="2" className="bg-gray-200 px-4 py-2 text-left font-bold">Scan Mode:</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 font-semibold border-t border-gray-300">Check Students Out</td>
              <td className="px-4 py-2 border-t border-gray-300">
                <input
                  type="radio"
                  name="scanMode"
                  value="out"
                  checked={scanMode === 'out'}
                  onChange={() => setScanMode('out')}
                  className="form-radio h-4 w-4 text-green-600"
                />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-semibold border-t border-gray-300">Check Students In</td>
              <td className="px-4 py-2 border-t border-gray-300">
                <input
                  type="radio"
                  name="scanMode"
                  value="in"
                  checked={scanMode === 'in'}
                  onChange={() => setScanMode('in')}
                  className="form-radio h-4 w-4 text-green-600"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={manualID}
          onChange={(e) => {
            const value = e.target.value;
            setManualID(value);
            if (value.length >= 6) {
              setTimeout(() => {
                handleScan(value);
                setManualID('');
              }, 100);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Scan or Enter Student ID"
          className="border border-gray-300 rounded px-2 py-1"
          autoFocus
        />
        <button
          onClick={handleManualSubmit}
          className="px-4 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Submit ID
        </button>
      </div>

      <div className="text-green-700 font-medium mb-2">{message}</div>

      {alerts.length > 0 && (
        <div className="mt-4 text-red-600">
          <h2 className="text-lg font-semibold">Alerts</h2>
          <ul className="list-disc ml-6">
            {alerts.map((alert, idx) => (
              <li key={idx}>{alert}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Currently Off Campus</h2>
        <ul className="list-disc ml-6">
          {Object.entries(students)
            .filter(([_, info]) => info.status === 'Off Campus')
            .map(([id, info]) => {
              const diff = Math.floor((new Date() - new Date(info.timeOut)) / 60000);
              return (
                <li key={id}>{info.name} — Out at {new Date(info.timeOut).toLocaleTimeString()} ({diff} mins ago)</li>
              );
            })}
        </ul>
      </div>

      <button
        onClick={exportLogs}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Export Daily Log (CSV)
      </button>
    </div>
  );
};

export default StudentScanner;
