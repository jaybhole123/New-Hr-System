import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function BankTransfer() {
  const [employees] = useLocalStorage('hr_employees', []);
  const [salaries] = useLocalStorage('hr_salaries', {});
  const [settings] = useLocalStorage('hr_deduction_settings', { pf: 12, esic: 0.75, ptax: 200 });

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
      net: net > 0 ? net : 0,
      bankAccount: sal.bankAccount || '',
      paymentStatus: sal.paymentStatus || 'Pending'
    };
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Bank Transfer</h1>
        <p className="page-subtitle">Generate CSV/Excel reports for bank salary uploads.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>Bank Advice Report - July 2026</h3>
          <button className="btn-primary" style={{ backgroundColor: 'var(--success)' }} disabled={records.length === 0}>
            Download Bank CSV
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Beneficiary Name</th>
                <th>Account Number</th>
                <th>Amount (₹)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? records.map(rec => (
                <tr key={rec.id}>
                  <td style={{ fontWeight: 500 }}>{rec.name}</td>
                  <td style={{ letterSpacing: '1px', fontFamily: 'monospace' }}>{rec.bankAccount || 'Not Provided'}</td>
                  <td style={{ fontWeight: 700 }}>₹ {rec.net.toLocaleString(undefined, {maximumFractionDigits:2})}</td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', backgroundColor: rec.paymentStatus === 'Processed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: rec.paymentStatus === 'Processed' ? 'var(--success)' : '#d97706' }}>
                      {rec.paymentStatus === 'Processed' ? 'Transferred' : 'Pending'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" style={{textAlign: 'center', padding: '24px'}}>No active employees found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
