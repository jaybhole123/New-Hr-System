import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function PayrollProcess() {
  const [activeTab, setActiveTab] = useState('Run_Payroll');

  const [employees] = useLocalStorage('hr_employees', []);
  const [salaries, setSalaries] = useLocalStorage('hr_salaries', {});
  const [settings] = useLocalStorage('hr_deduction_settings', { pf: 12, esic: 0.75, ptax: 200 });
  const [, setProcessedPayroll] = useLocalStorage('hr_processed_payroll', []);

  const [processing, setProcessing] = useState(false);
  const activeEmployees = employees.filter(emp => emp.status === 'Active');

  // Salary Structure state
  const [selectedEmp, setSelectedEmp] = useState('');
  const [formData, setFormData] = useState({ 
    basic: 0, 
    hra: 0, 
    allowances: 0,
    otherDeductions: 0,
    paymentStatus: 'Pending',
    bankAccount: ''
  });

  const handleProcess = () => {
    setProcessing(true);
    
    // Simulate complex calculation
    setTimeout(() => {
      const results = activeEmployees.map(emp => {
        const sal = salaries[emp.id] || { 
          basic: 0, hra: 0, allowances: 0, otherDeductions: 0, paymentStatus: 'Pending', bankAccount: ''
        };
        const gross = sal.basic + sal.hra + sal.allowances;
        
        // Add OT & Bonus from Salary Structure (now merged into allowances per user request)
        const empOt = 0;
        const empBonus = 0;
        const totalEarnings = gross;

        // Deductions
        const pfDeduction = sal.basic * (settings.pf / 100);
        const esicDeduction = 0; // Removed ESIC for now since not in user's requested fields
        const empAdv = 0; 
        const empOtherDeductions = sal.otherDeductions || 0;
        const totalDeductions = pfDeduction + settings.ptax + empOtherDeductions;

        const net = totalEarnings - totalDeductions;

        return {
          id: emp.id,
          name: emp.name,
          gross: totalEarnings,
          deductions: totalDeductions,
          net: net > 0 ? net : 0,
          breakdown: { sal, empOt, empBonus, pfDeduction, esicDeduction, ptax: settings.ptax, empAdv, empOtherDeductions }
        };
      });

      setProcessedPayroll(results);
      setProcessing(false);
      alert('Payroll Processed Successfully for July 2026!');
    }, 2000);
  };

  // Salary Structure Handlers
  const handleSelectChange = (e) => {
    const empId = e.target.value;
    setSelectedEmp(empId);
    if(salaries[empId]) {
      setFormData({
        basic: salaries[empId].basic || 0,
        hra: salaries[empId].hra || 0,
        allowances: salaries[empId].allowances || 0,
        otherDeductions: salaries[empId].otherDeductions || 0,
        paymentStatus: salaries[empId].paymentStatus || 'Pending',
        bankAccount: salaries[empId].bankAccount || ''
      });
    } else {
      setFormData({ basic: 0, hra: 0, allowances: 0, otherDeductions: 0, paymentStatus: 'Pending', bankAccount: '' });
    }
  };

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.name === 'paymentStatus' || e.target.name === 'bankAccount' ? e.target.value : Number(e.target.value)});
  };

  const handleSaveStructure = () => {
    if(!selectedEmp) return alert('Select an employee first.');
    setSalaries({
      ...salaries,
      [selectedEmp]: formData
    });
    alert('Salary structure saved successfully!');
  };

  const grossSalary = formData.basic + formData.hra + formData.allowances;
  const pfAmount = formData.basic * (settings.pf / 100);
  const profTax = selectedEmp ? settings.ptax : 0;
  const totalDeductions = pfAmount + profTax + formData.otherDeductions;
  const netSalary = selectedEmp ? Math.max(0, grossSalary - totalDeductions) : 0;
  
  const selectedEmpData = employees.find(e => e.id === selectedEmp) || {};

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Salary Structure</h1>
        <p className="page-subtitle">Define and manage employee salary structures and deductions.</p>
      </div>

      <div className="card fade-in">
        <h3 style={{ marginBottom: '16px' }}>Define Salary Structure</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Employee Name</label>
            <select value={selectedEmp} onChange={handleSelectChange}>
              <option value="">-- Select Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.id} - {emp.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Designation</label>
            <input type="text" value={selectedEmp ? (selectedEmpData.designation || 'N/A') : 'Select an employee'} disabled style={{ opacity: 0.7 }} />
          </div>
        </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginTop: '16px' }}>
            <div className="form-group">
              <label>Basic Salary (₹)</label>
              <input type="number" name="basic" value={formData.basic} onChange={handleChange} disabled={!selectedEmp} />
            </div>
            <div className="form-group">
              <label>HRA (₹)</label>
              <input type="number" name="hra" value={formData.hra} onChange={handleChange} disabled={!selectedEmp} />
            </div>
            <div className="form-group">
              <label>Allowances (₹)</label>
              <input type="number" name="allowances" value={formData.allowances} onChange={handleChange} disabled={!selectedEmp} />
            </div>
            <div className="form-group">
              <label>Gross Salary (₹)</label>
              <input type="number" value={grossSalary.toFixed(2)} disabled style={{ opacity: 0.8, backgroundColor: 'rgba(59, 130, 246, 0.05)', fontWeight: 600, color: 'var(--primary-color)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginTop: '16px' }}>
            <div className="form-group">
              <label>PF (₹)</label>
              <input type="number" value={pfAmount.toFixed(2)} disabled style={{ opacity: 0.7 }} />
            </div>
            <div className="form-group">
              <label>Prof. Tax (₹)</label>
              <input type="number" value={profTax} disabled style={{ opacity: 0.7 }} />
            </div>
            <div className="form-group">
              <label>Other Deduct. (₹)</label>
              <input type="number" name="otherDeductions" value={formData.otherDeductions} onChange={handleChange} disabled={!selectedEmp} />
            </div>
            <div className="form-group">
              <label>Total Deduct. (₹)</label>
              <input type="number" value={totalDeductions.toFixed(2)} disabled style={{ opacity: 0.8, backgroundColor: 'rgba(239, 68, 68, 0.05)', fontWeight: 600, color: 'var(--danger)' }} />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginTop: '16px' }}>
            <div className="form-group">
              <label>Net Salary (₹)</label>
              <input type="number" value={netSalary.toFixed(2)} disabled style={{ opacity: 0.9, backgroundColor: 'rgba(16, 185, 129, 0.1)', fontWeight: 700, color: 'var(--success)' }} />
            </div>
            <div className="form-group">
              <label>Payment Status</label>
              <select name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} disabled={!selectedEmp}>
                <option value="Pending">Pending</option>
                <option value="Processed">Processed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            <div className="form-group">
              <label>Bank A/c No.</label>
              <input type="text" name="bankAccount" value={formData.bankAccount} onChange={handleChange} placeholder="Enter Account No." disabled={!selectedEmp} />
            </div>
          </div>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button className="btn-primary" onClick={handleSaveStructure} disabled={!selectedEmp}>Save Structure</button>
          </div>
        </div>
    </div>
  );
}
