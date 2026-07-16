import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function Payslip() {
  const [employees] = useLocalStorage('hr_employees', []);
  const [salaries] = useLocalStorage('hr_salaries', {});
  const [settings] = useLocalStorage('hr_deduction_settings', { pf: 12, esic: 0.75, ptax: 200 });
  const [selectedEmp, setSelectedEmp] = useState('');

  const activeEmployees = employees.filter(emp => emp.status === 'Active');

  const records = activeEmployees.map(emp => {
    const sal = salaries[emp.id] || { basic: 0, hra: 0, allowances: 0, otherDeductions: 0, paymentStatus: 'Pending', bankAccount: '' };
    const gross = sal.basic + sal.hra + sal.allowances;
    
    // Deductions
    const pfDeduction = sal.basic * (settings.pf / 100);
    const ptax = settings.ptax;
    const otherDeduct = sal.otherDeductions || 0;
    const totalDeductions = pfDeduction + ptax + otherDeduct;
    
    const net = gross - totalDeductions;

    return {
      id: emp.id,
      name: emp.name,
      gross,
      deductions: totalDeductions,
      net: net > 0 ? net : 0,
      bankAccount: sal.bankAccount || '',
      breakdown: {
        sal,
        pfDeduction,
        ptax,
        empOtherDeductions: otherDeduct
      }
    };
  });

  const payrollData = records.find(r => r.id === selectedEmp) || {
    bankAccount: '-',
    breakdown: {
      sal: { basic: 0, hra: 0, allowances: 0 },
      pfDeduction: 0,
      ptax: 0,
      empOtherDeductions: 0
    },
    gross: 0,
    deductions: 0,
    net: 0
  };
  const empDetails = employees.find(e => e.id === selectedEmp) || {
    name: '---',
    id: '---',
    designation: '---',
    department: '---'
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Payslip Generation</h1>
        <p className="page-subtitle">View, download, and email employee payslips.</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="form-group" style={{ maxWidth: '300px' }}>
          <label>Select Employee</label>
          <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}>
            <option value="">-- Select --</option>
            {records.map(r => <option key={r.id} value={r.id}>{r.id} - {r.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Company Tech Solutions</h2>
            <p style={{ color: 'var(--text-secondary)' }}>123 Business Park, Tech City, 400001</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ color: 'var(--primary-color)' }}>PAYSLIP</h2>
            <p style={{ fontWeight: 500 }}>July 2026</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div>
            <p><strong>Employee Name:</strong> {empDetails.name}</p>
            <p><strong>Employee ID:</strong> {empDetails.id}</p>
            <p><strong>Designation:</strong> {empDetails.designation}</p>
          </div>
          <div>
            <p><strong>Bank Account:</strong> {payrollData.bankAccount || '-'}</p>
            <p><strong>Department:</strong> {empDetails.department}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Earnings</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Basic</span><span>₹ {payrollData.breakdown.sal.basic}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>HRA</span><span>₹ {payrollData.breakdown.sal.hra}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Allowances</span><span>₹ {payrollData.breakdown.sal.allowances}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontWeight: 700 }}><span>Total Earnings</span><span>₹ {payrollData.gross.toLocaleString(undefined, {maximumFractionDigits:2})}</span></div>
          </div>
          <div>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Deductions</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>PF</span><span>₹ {payrollData.breakdown.pfDeduction.toLocaleString(undefined, {maximumFractionDigits:2})}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Professional Tax</span><span>₹ {payrollData.breakdown.ptax}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Other Deductions</span><span>₹ {payrollData.breakdown.empOtherDeductions}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontWeight: 700 }}><span>Total Deductions</span><span>₹ {payrollData.deductions.toLocaleString(undefined, {maximumFractionDigits:2})}</span></div>
          </div>
        </div>

        <div style={{ marginTop: '32px', backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>Net Pay</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>₹ {payrollData.net.toLocaleString(undefined, {maximumFractionDigits:2})}</span>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)' }} disabled={!selectedEmp}>Email Payslip</button>
          <button className="btn-primary" disabled={!selectedEmp}>Download PDF</button>
        </div>
      </div>
    </div>
  );
}
