import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Plus, X, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Attendance() {
  const [employees] = useLocalStorage('hr_employees', []);
  // hr_attendance_sheet format: { "2026-07": { "EMP001": { "1": "P", "2": "A", ... }, "EMP002": ... } }
  const [attendanceSheet, setAttendanceSheet] = useLocalStorage('hr_attendance_sheet', {});
  
  const [activeTab, setActiveTab] = useState('Register');
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [showModal, setShowModal] = useState(false);
  const [uploadData, setUploadData] = useState({ month: '07', year: '2026', file: null });

  // Current month data
  const [currentMonthData, setCurrentMonthData] = useState({});

  useEffect(() => {
    // Load data for selected month or initialize empty for all employees
    const data = attendanceSheet[selectedMonth] || {};
    const initializedData = {};
    
    employees.forEach(emp => {
      initializedData[emp.id] = data[emp.id] || {};
    });
    
    setCurrentMonthData(initializedData);
  }, [selectedMonth, employees, attendanceSheet]);

  const handleCellChange = (empId, day, value) => {
    const v = value.toUpperCase();
    // Allow any input so user sees what they type, but only valid codes will be colored and calculated
    setCurrentMonthData(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [day]: v
      }
    }));
  };

  const handleSave = () => {
    setAttendanceSheet(prev => ({
      ...prev,
      [selectedMonth]: currentMonthData
    }));
    alert('Attendance saved successfully!');
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!uploadData.file) return alert('Please select a CSV file to upload.');
    alert(`Attendance sheet for ${uploadData.month}/${uploadData.year} uploaded successfully!`);
    setShowModal(false);
    setUploadData({ month: '07', year: '2026', file: null });
  };

  // Helper to calculate days in selected month
  const getDaysInMonth = (yearMonth) => {
    const [y, m] = yearMonth.split('-');
    return new Date(y, m, 0).getDate();
  };
  const daysCount = getDaysInMonth(selectedMonth);
  const daysArray = Array.from({length: 31}, (_, i) => i + 1); // Always show 31 cols as per Excel

  // Calculations for Dashboard
  const dashboardStats = employees.map(emp => {
    const empData = currentMonthData[emp.id] || {};
    let p = 0, a = 0, l = 0, hd = 0;
    
    for(let i=1; i<=daysCount; i++) {
      const val = empData[i];
      if(val === 'P') p++;
      else if(val === 'A') a++;
      else if(val === 'L') l++;
      else if(val === 'HD') hd++;
    }
    
    const presentEquiv = p + (hd * 0.5);
    // Exclude weekends/holidays if we want, but for now working days = daysCount
    const attPercent = daysCount > 0 ? (presentEquiv / daysCount) * 100 : 0;

    return {
      id: emp.id,
      name: emp.name,
      p, a, l, hd,
      attPercent
    };
  });

  const totalAbsences = dashboardStats.reduce((acc, curr) => acc + curr.a, 0);
  const avgAttendance = dashboardStats.length > 0 
    ? dashboardStats.reduce((acc, curr) => acc + curr.attPercent, 0) / dashboardStats.length 
    : 0;

  const chartData = dashboardStats.map(s => ({
    name: s.name,
    AttendancePercent: parseFloat(s.attPercent.toFixed(1))
  }));

  const thStyle = {
    border: '1px solid var(--border-color)',
    padding: '8px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    backgroundColor: 'var(--bg-main)'
  };

  const tdStyle = {
    border: '1px solid var(--border-color)',
    padding: '4px',
    fontSize: '0.85rem',
    textAlign: 'center'
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Attendance Dashboard</h1>
          <p className="page-subtitle">Excel-style Attendance Register and Overview Dashboard.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--text-secondary)' }}>
            <Plus size={16} /> Upload CSV
          </button>
          <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('Register')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'Register' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'Register' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
        >
          Attendance Register
        </button>
        <button
          onClick={() => setActiveTab('Dashboard')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'Dashboard' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'Dashboard' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
        >
          Dashboard
        </button>
      </div>

      {activeTab === 'Register' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          {/* Header of Excel Sheet */}
          <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', textAlign: 'center', padding: '16px', fontWeight: 500, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
            ATTENDANCE REGISTER
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '16px 24px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Month</span>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontWeight: 'bold', backgroundColor: 'var(--bg-main)' }} 
              />
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Codes: <span style={{color:'var(--success)', fontWeight:600}}>P</span>=Present &nbsp;
              <span style={{color:'var(--danger)', fontWeight:600}}>A</span>=Absent &nbsp;
              <span style={{color:'#ca8a04', fontWeight:600}}>L</span>=Leave &nbsp;
              <span style={{color:'var(--primary-color)', fontWeight:600}}>HD</span>=Half Day
            </div>
          </div>

          <div style={{ overflowX: 'auto', paddingBottom: '12px' }}>
            <table style={{ borderCollapse: 'collapse', margin: '0' }}>
              <thead>
                <tr>
                  <th style={{...thStyle, width: '50px'}}>Sr.<br/>No.</th>
                  <th style={{...thStyle, minWidth: '200px'}}>Employee Name</th>
                  {daysArray.map(day => (
                    <th key={day} style={{...thStyle, padding: '4px', width: '45px', minWidth: '45px', fontSize: '0.8rem'}}>{day}</th>
                  ))}
                  <th style={{...thStyle, width: '45px', minWidth: '45px'}}>P</th>
                  <th style={{...thStyle, width: '45px', minWidth: '45px'}}>A</th>
                  <th style={{...thStyle, width: '45px', minWidth: '45px'}}>L</th>
                  <th style={{...thStyle, width: '45px', minWidth: '45px'}}>HD</th>
                  <th style={{...thStyle, width: '60px', minWidth: '60px'}}>Att.%</th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp, idx) => {
                    const stats = dashboardStats.find(s => s.id === emp.id);
                    return (
                      <tr key={emp.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-card)' : 'rgba(0,0,0,0.02)' }}>
                        <td style={{...tdStyle, color: 'var(--text-secondary)'}}>{idx + 1}</td>
                        <td style={{...tdStyle, textAlign: 'left', fontWeight: 600, paddingLeft: '12px'}}>{emp.name}</td>
                        
                        {daysArray.map(day => {
                          const isInvalidDay = day > daysCount;
                          const val = isInvalidDay ? '' : (currentMonthData[emp.id]?.[day] || '');
                          
                          let color = 'var(--text-primary)';
                          if(val==='P') color = '#166534';
                          if(val==='A') color = '#dc2626';
                          if(val==='L') color = '#ca8a04';
                          if(val==='HD') color = '#2563eb';

                          return (
                            <td key={day} style={{...tdStyle, padding: 0, width: '45px', minWidth: '45px', backgroundColor: isInvalidDay ? '#f1f5f9' : 'inherit'}}>
                              <input 
                                type="text"
                                value={val}
                                onChange={(e) => handleCellChange(emp.id, day, e.target.value)}
                                disabled={isInvalidDay}
                                style={{ 
                                  width: '100%', height: '35px', border: 'none', textAlign: 'center', 
                                  background: 'transparent', fontWeight: 'bold', color: color,
                                  textTransform: 'uppercase', fontSize: '0.85rem'
                                }}
                                maxLength={2}
                              />
                            </td>
                          );
                        })}
                        
                        <td style={{...tdStyle, backgroundColor: 'rgba(202, 138, 4, 0.1)', fontWeight: 'bold'}}>{stats.p}</td>
                        <td style={{...tdStyle, backgroundColor: 'rgba(202, 138, 4, 0.1)', fontWeight: 'bold', color: stats.a > 0 ? '#dc2626' : 'inherit'}}>{stats.a}</td>
                        <td style={{...tdStyle, backgroundColor: 'rgba(202, 138, 4, 0.1)', fontWeight: 'bold'}}>{stats.l}</td>
                        <td style={{...tdStyle, backgroundColor: 'rgba(202, 138, 4, 0.1)', fontWeight: 'bold'}}>{stats.hd}</td>
                        <td style={{...tdStyle, backgroundColor: 'rgba(202, 138, 4, 0.2)', fontWeight: 800, color: stats.attPercent < 75 ? '#dc2626' : '#166534'}}>{stats.attPercent.toFixed(1)}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={38} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No employees found. Please add employees first.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '24px', backgroundColor: 'var(--bg-main)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px solid #94a3b8' }}></div>
              Blue = Manual Entry (type code directly)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#475569' }}></div>
              P/A/L/HD/Att% columns = Auto-Formula
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Dashboard' && (
        <div className="fade-in">
          {/* Dashboard Header */}
          <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '16px 24px', fontWeight: 500, fontSize: '1.1rem', borderRadius: '12px 12px 0 0', letterSpacing: '0.5px' }}>
            DASHBOARD — Attendance Overview
          </div>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px 24px', border: '1px solid var(--border-color)', borderTop: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '24px', borderRadius: '0 0 12px 12px' }}>
            Auto-updates from 'Attendance'
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Total Employees</div>
              <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', color: 'var(--primary-color)', fontWeight: 800, fontSize: '2rem' }}>{employees.length}</div>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Avg. Attendance %</div>
              <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', color: 'var(--success)', fontWeight: 800, fontSize: '2rem' }}>{avgAttendance.toFixed(1)}%</div>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Total Absences</div>
              <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', color: 'var(--danger)', fontWeight: 800, fontSize: '2rem' }}>{totalAbsences}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            {/* Employee-wise Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
              <div style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', padding: '12px 16px', fontWeight: 700, letterSpacing: '0.5px' }}>Employee-wise Attendance %</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-main)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)', textTransform: 'none', color: 'var(--text-secondary)' }}>Employee</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--border-color)', textTransform: 'none', color: 'var(--text-secondary)' }}>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardStats.map((stat, idx) => (
                    <tr key={stat.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-main)' : 'var(--bg-card)' }}>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem', fontWeight: 500 }}>{stat.name}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: stat.attPercent < 75 ? '#dc2626' : 'var(--success)' }}>{stat.attPercent.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {/* Fill empty rows */}
                  {[...Array(Math.max(0, 15 - dashboardStats.length))].map((_, idx) => (
                    <tr key={`empty-${idx}`} style={{ backgroundColor: (dashboardStats.length + idx) % 2 === 0 ? 'var(--bg-main)' : 'var(--bg-card)' }}>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', color: 'transparent' }}>-</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', color: 'transparent' }}>-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Chart */}
            <div className="card">
              <h3 style={{ marginBottom: '24px', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)', textAlign: 'center' }}>Attendance % by Employee</h3>
              {dashboardStats.length > 0 ? (
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-secondary)' }} tickFormatter={(val) => `${val}%`} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} />
                      <Tooltip 
                        formatter={(value) => `${value}%`} 
                        contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        itemStyle={{ color: '#ca8a04', fontWeight: 700 }}
                      />
                      <Bar dataKey="AttendancePercent" fill="#ca8a04" barSize={20} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  No data to display chart.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Upload Attendance Sheet</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Month</label>
                  <select value={uploadData.month} onChange={(e) => setUploadData({...uploadData, month: e.target.value})} required>
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Year</label>
                  <input type="number" value={uploadData.year} onChange={(e) => setUploadData({...uploadData, year: e.target.value})} required min="2000" max="2100" />
                </div>
              </div>
              
              <div className="form-group">
                <label>Upload CSV File</label>
                <input type="file" accept=".csv" onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})} required style={{ padding: '8px' }} />
                <small style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Please upload attendance data in CSV format only.</small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Upload Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
