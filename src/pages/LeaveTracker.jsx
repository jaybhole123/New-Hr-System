import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Plus, X, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function LeaveTracker() {
  const [employees] = useLocalStorage('hr_employees', []);
  
  // Format: { "EMP001": { cl: 12, sl: 12, el: 15 }, ... }
  const [leaveAllotments, setLeaveAllotments] = useLocalStorage('hr_leave_allotments', {});
  
  // Format: [{ id: 1, empId: 'EMP001', type: 'CL', from: '2026-07-01', to: '2026-07-02', days: 2, status: 'Approved', reason: 'Fever' }, ...]
  const [leaveRequests, setLeaveRequests] = useLocalStorage('hr_leave_requests', []);

  const [activeTab, setActiveTab] = useState('Balance');
  const [showModal, setShowModal] = useState(false);
  const [newRequest, setNewRequest] = useState({ empId: '', type: 'CL', from: '', to: '', reason: '' });

  // Helper to calculate days between dates
  const calculateDays = (from, to) => {
    if (!from || !to) return 0;
    const date1 = new Date(from);
    const date2 = new Date(to);
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    return diffDays;
  };

  const handleAllotmentChange = (empId, type, val) => {
    const value = parseInt(val) || 0;
    setLeaveAllotments(prev => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || { cl: 0, sl: 0, el: 0 }),
        [type]: value
      }
    }));
  };

  const submitRequest = (e) => {
    e.preventDefault();
    if (!newRequest.empId || !newRequest.from || !newRequest.to) {
      alert("Please fill all required fields");
      return;
    }
    const days = calculateDays(newRequest.from, newRequest.to);
    const req = {
      id: Date.now().toString(),
      ...newRequest,
      days,
      status: 'Pending'
    };
    setLeaveRequests([...leaveRequests, req]);
    setShowModal(false);
    setNewRequest({ empId: '', type: 'CL', from: '', to: '', reason: '' });
  };

  const updateRequestStatus = (reqId, newStatus) => {
    setLeaveRequests(leaveRequests.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
  };

  // Calculate taken leaves per employee
  const getTakenLeaves = (empId) => {
    const approved = leaveRequests.filter(r => r.empId === empId && r.status === 'Approved');
    const taken = { cl: 0, sl: 0, el: 0 };
    approved.forEach(r => {
      if(r.type === 'CL') taken.cl += r.days;
      if(r.type === 'SL') taken.sl += r.days;
      if(r.type === 'EL') taken.el += r.days;
    });
    return taken;
  };

  // Dashboard Stats
  const totalRequests = leaveRequests.length;
  const approvedRequests = leaveRequests.filter(r => r.status === 'Approved').length;
  const pendingRequests = leaveRequests.filter(r => r.status === 'Pending').length;

  let totalCLTaken = 0, totalSLTaken = 0, totalELTaken = 0;
  leaveRequests.filter(r => r.status === 'Approved').forEach(r => {
    if(r.type === 'CL') totalCLTaken += r.days;
    if(r.type === 'SL') totalSLTaken += r.days;
    if(r.type === 'EL') totalELTaken += r.days;
  });

  const chartData = [
    { name: 'Casual Leave', DaysTaken: totalCLTaken, fill: '#3b82f6' },
    { name: 'Sick Leave', DaysTaken: totalSLTaken, fill: '#ef4444' },
    { name: 'Earned Leave', DaysTaken: totalELTaken, fill: '#84cc16' },
  ];

  const thStyle = {
    border: '1px solid var(--border-color)',
    padding: '12px 10px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'none',
    whiteSpace: 'nowrap',
    backgroundColor: 'var(--bg-main)'
  };

  const tdStyle = {
    border: '1px solid var(--border-color)',
    padding: '10px 12px',
    fontSize: '0.9rem',
    textAlign: 'center'
  };

  const inputStyle = {
    width: '60px',
    height: '32px',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    textAlign: 'center',
    background: 'var(--bg-main)',
    color: 'var(--text-primary)',
    fontWeight: '600',
    outline: 'none'
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Leave Tracker</h1>
          <p className="page-subtitle">Manage Employee Leave Balance and Requests.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('Balance')}
          style={{
            padding: '12px 24px', background: 'none', border: 'none',
            borderBottom: activeTab === 'Balance' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'Balance' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s ease'
          }}
        >
          Leave Balance
        </button>
        <button
          onClick={() => setActiveTab('Requests')}
          style={{
            padding: '12px 24px', background: 'none', border: 'none',
            borderBottom: activeTab === 'Requests' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'Requests' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s ease'
          }}
        >
          Leave Requests
        </button>
        <button
          onClick={() => setActiveTab('Dashboard')}
          style={{
            padding: '12px 24px', background: 'none', border: 'none',
            borderBottom: activeTab === 'Dashboard' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'Dashboard' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s ease'
          }}
        >
          Dashboard
        </button>
      </div>

      {activeTab === 'Balance' && (
        <div className="card fade-in" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', textAlign: 'center', padding: '16px', fontWeight: 500, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
            LEAVE BALANCE
          </div>
          
          <div style={{ overflowX: 'auto', paddingBottom: '12px' }}>
            <table style={{ minWidth: '1000px', borderCollapse: 'collapse', margin: '0' }}>
              <thead>
                <tr>
                  <th colSpan="2" style={{ ...thStyle, borderBottom: 'none' }}></th>
                  <th colSpan="3" style={{ ...thStyle, backgroundColor: 'rgba(59, 130, 246, 0.05)', color: 'var(--primary-color)', padding: '10px', borderBottom: '2px solid var(--primary-color)' }}>Casual Leave (CL)</th>
                  <th colSpan="3" style={{ ...thStyle, backgroundColor: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', padding: '10px', borderBottom: '2px solid var(--danger)' }}>Sick Leave (SL)</th>
                  <th colSpan="3" style={{ ...thStyle, backgroundColor: 'rgba(16, 185, 129, 0.05)', color: 'var(--success)', padding: '10px', borderBottom: '2px solid var(--success)' }}>Earned Leave (EL)</th>
                  <th style={{ ...thStyle, borderBottom: 'none' }}></th>
                </tr>
                <tr>
                  <th style={{...thStyle, width: '60px'}}>Sr. No.</th>
                  <th style={{...thStyle, textAlign: 'left', minWidth: '200px'}}>Employee Name</th>
                  <th style={thStyle}>Allotted</th><th style={thStyle}>Taken</th><th style={thStyle}>Balance</th>
                  <th style={thStyle}>Allotted</th><th style={thStyle}>Taken</th><th style={thStyle}>Balance</th>
                  <th style={thStyle}>Allotted</th><th style={thStyle}>Taken</th><th style={thStyle}>Balance</th>
                  <th style={{...thStyle, backgroundColor: 'rgba(0,0,0,0.02)'}}>Total<br/>Balance</th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp, idx) => {
                    const allot = leaveAllotments[emp.id] || { cl: 0, sl: 0, el: 0 };
                    const taken = getTakenLeaves(emp.id);
                    const bal = {
                      cl: allot.cl - taken.cl,
                      sl: allot.sl - taken.sl,
                      el: allot.el - taken.el,
                    };
                    const totalBal = bal.cl + bal.sl + bal.el;

                    return (
                      <tr key={emp.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-card)' : 'rgba(0,0,0,0.02)' }}>
                        <td style={{...tdStyle, color: 'var(--text-secondary)'}}>{idx + 1}</td>
                        <td style={{...tdStyle, textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)'}}>{emp.name}</td>
                        
                        {/* CL */}
                        <td style={{...tdStyle, padding: '4px'}}>
                          <input type="number" value={allot.cl} onChange={e => handleAllotmentChange(emp.id, 'cl', e.target.value)} style={inputStyle} />
                        </td>
                        <td style={{...tdStyle, color: 'var(--text-secondary)'}}>{taken.cl}</td>
                        <td style={{...tdStyle, fontWeight: '700', color: bal.cl > 0 ? 'var(--primary-color)' : 'var(--text-primary)'}}>{bal.cl}</td>

                        {/* SL */}
                        <td style={{...tdStyle, padding: '4px'}}>
                          <input type="number" value={allot.sl} onChange={e => handleAllotmentChange(emp.id, 'sl', e.target.value)} style={inputStyle} />
                        </td>
                        <td style={{...tdStyle, color: 'var(--text-secondary)'}}>{taken.sl}</td>
                        <td style={{...tdStyle, fontWeight: '700', color: bal.sl > 0 ? 'var(--danger)' : 'var(--text-primary)'}}>{bal.sl}</td>

                        {/* EL */}
                        <td style={{...tdStyle, padding: '4px'}}>
                          <input type="number" value={allot.el} onChange={e => handleAllotmentChange(emp.id, 'el', e.target.value)} style={inputStyle} />
                        </td>
                        <td style={{...tdStyle, color: 'var(--text-secondary)'}}>{taken.el}</td>
                        <td style={{...tdStyle, fontWeight: '700', color: bal.el > 0 ? 'var(--success)' : 'var(--text-primary)'}}>{bal.el}</td>

                        <td style={{...tdStyle, fontWeight: 800, color: totalBal > 0 ? 'var(--success)' : 'var(--danger)', backgroundColor: 'rgba(0,0,0,0.02)'}}>{totalBal}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="12" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No employees found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '24px', backgroundColor: 'var(--bg-main)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}></div>
              Allotted = Manual Entry
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
              Taken/Balance = Auto (from 'Leave Requests' where Status = Approved)
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Requests' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} /> New Request
            </button>
          </div>
          
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', textAlign: 'center', padding: '16px', fontWeight: 500, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
              LEAVE REQUESTS
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0' }}>
                <thead>
                  <tr>
                    <th style={{...thStyle, width: '60px'}}>Sr. No.</th>
                    <th style={{...thStyle, textAlign: 'left'}}>Employee Name</th>
                    <th style={thStyle}>Leave<br/>Type</th>
                    <th style={thStyle}>From Date</th>
                    <th style={thStyle}>To Date</th>
                    <th style={thStyle}>No. of<br/>Days</th>
                    <th style={thStyle}>Status</th>
                    <th style={{...thStyle, textAlign: 'left'}}>Reason / Remarks</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.length > 0 ? (
                    leaveRequests.map((req, idx) => {
                      const emp = employees.find(e => e.id === req.empId);
                      return (
                        <tr key={req.id} style={{ backgroundColor: idx % 2 === 0 ? 'var(--bg-card)' : 'rgba(0,0,0,0.02)' }}>
                          <td style={tdStyle}>{idx + 1}</td>
                          <td style={{...tdStyle, textAlign: 'left', fontWeight: 600}}>{emp?.name || 'Unknown'}</td>
                          <td style={{...tdStyle, fontWeight: 'bold'}}>{req.type}</td>
                          <td style={tdStyle}>{req.from}</td>
                          <td style={tdStyle}>{req.to}</td>
                          <td style={{...tdStyle, fontWeight: 'bold'}}>{req.days}</td>
                          <td style={tdStyle}>
                            <span style={{ 
                              padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                              backgroundColor: req.status === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : req.status === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              color: req.status === 'Approved' ? '#166534' : req.status === 'Rejected' ? '#dc2626' : '#b45309'
                            }}>
                              {req.status}
                            </span>
                          </td>
                          <td style={{...tdStyle, textAlign: 'left'}}>{req.reason || '-'}</td>
                          <td style={tdStyle}>
                            {req.status === 'Pending' && (
                              <select 
                                onChange={(e) => {
                                  if (e.target.value) updateRequestStatus(req.id, e.target.value);
                                }}
                                style={{ padding: '4px', fontSize: '0.85rem' }}
                                defaultValue=""
                              >
                                <option value="" disabled>Action</option>
                                <option value="Approved">Approve</option>
                                <option value="Rejected">Reject</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No leave requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Dashboard' && (
        <div className="fade-in">
          <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '16px 24px', fontWeight: 500, fontSize: '1.1rem', borderRadius: '12px 12px 0 0', letterSpacing: '0.5px' }}>
            DASHBOARD — Leave Overview
          </div>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px 24px', border: '1px solid var(--border-color)', borderTop: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '24px', borderRadius: '0 0 12px 12px' }}>
            Auto-updates from 'Leave Requests'
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Total Requests</div>
              <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', color: '#b45309', fontWeight: 800, fontSize: '2rem' }}>{totalRequests}</div>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Approved</div>
              <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', color: 'var(--success)', fontWeight: 800, fontSize: '2rem' }}>{approvedRequests}</div>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Pending</div>
              <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', color: 'var(--danger)', fontWeight: 800, fontSize: '2rem' }}>{pendingRequests}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
              <div style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '12px 16px', fontWeight: 700, letterSpacing: '0.5px' }}>Leave Type Breakdown (Approved)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-main)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px', textAlign: 'left', textTransform: 'none', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Leave Type</th>
                    <th style={{ padding: '12px', textAlign: 'right', textTransform: 'none', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Days Taken</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem', fontWeight: 500 }}>Casual Leave</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem', textAlign: 'right', fontWeight: 600 }}>{totalCLTaken}</td>
                  </tr>
                  <tr style={{ backgroundColor: 'var(--bg-main)' }}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem', fontWeight: 500 }}>Sick Leave</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem', textAlign: 'right', fontWeight: 600 }}>{totalSLTaken}</td>
                  </tr>
                  <tr style={{ backgroundColor: 'var(--bg-card)' }}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem', fontWeight: 500 }}>Earned Leave</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem', textAlign: 'right', fontWeight: 600 }}>{totalELTaken}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '24px', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)', textAlign: 'center' }}>Leave Days by Type</h3>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                    <XAxis type="number" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} />
                    <Tooltip 
                      formatter={(value) => `${value} Days`} 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="DaysTaken" barSize={32} radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>New Leave Request</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={submitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label>Employee</label>
                <select value={newRequest.empId} onChange={e => setNewRequest({...newRequest, empId: e.target.value})} required>
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              
              <div className="form-group">
                <label>Leave Type</label>
                <select value={newRequest.type} onChange={e => setNewRequest({...newRequest, type: e.target.value})} required>
                  <option value="CL">Casual Leave (CL)</option>
                  <option value="SL">Sick Leave (SL)</option>
                  <option value="EL">Earned Leave (EL)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>From Date</label>
                  <input type="date" value={newRequest.from} onChange={e => setNewRequest({...newRequest, from: e.target.value})} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>To Date</label>
                  <input type="date" value={newRequest.to} onChange={e => setNewRequest({...newRequest, to: e.target.value})} required min={newRequest.from} />
                </div>
              </div>

              <div className="form-group">
                <label>Reason / Remarks</label>
                <textarea value={newRequest.reason} onChange={e => setNewRequest({...newRequest, reason: e.target.value})} rows="3" style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px' }}></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
