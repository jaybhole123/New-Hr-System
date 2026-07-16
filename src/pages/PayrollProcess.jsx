import React, { useState, useEffect } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { supabase } from '../lib/supabase';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PayrollProcess() {
  const [activeTab, setActiveTab] = useState('Run_Payroll');

  const [employees] = useEmployees();
  
  const [salaries, setSalaries] = useState({});
  const [settings, setSettings] = useState({ pf: 12, esic: 0.75, ptax: 200 });
  const [processedPayroll, setProcessedPayroll] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [savingStructure, setSavingStructure] = useState(false);
  
  const activeEmployees = employees.filter(emp => emp.status === 'Active');

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    try {
      const [salariesRes, settingsRes, processedRes] = await Promise.all([
        supabase.from('salary_structures').select('*'),
        supabase.from('payroll_settings').select('*').limit(1).single(),
        supabase.from('processed_payroll').select('*')
      ]);

      if (salariesRes.error) throw salariesRes.error;
      
      const salMap = {};
      if (salariesRes.data) {
        salariesRes.data.forEach(s => {
          salMap[s.employee_id] = {
            basic: s.basic || 0,
            hra: s.hra || 0,
            allowances: s.allowances || 0,
            profTax: s.prof_tax || 0,
            otherDeductions: s.other_deductions || 0,
            paymentStatus: s.payment_status || 'Pending',
            bankAccount: s.bank_account || '',
            pfApplicable: s.pf_applicable !== false // default true
          };
        });
      }
      setSalaries(salMap);

      if (settingsRes.data) {
        setSettings({
          pf: settingsRes.data.pf_percentage || 12,
          ptax: settingsRes.data.ptax_amount || 200,
          esic: 0.75
        });
      }
      
      if (processedRes.data) {
        setProcessedPayroll(processedRes.data);
      }
    } catch (err) {
      console.error('Error fetching payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Salary Structure state
  const [selectedEmp, setSelectedEmp] = useState('');
  const [formData, setFormData] = useState({ 
    basic: 0, 
    hra: 0, 
    allowances: 0,
    profTax: 0,
    otherDeductions: 0,
    paymentStatus: 'Pending',
    bankAccount: '',
    pfApplicable: true
  });

  const handleProcess = async () => {
    setProcessing(true);
    
    try {
      const currentMonthYear = 'July 2026';
      
      const results = activeEmployees.map(emp => {
        const sal = salaries[emp.id] || { 
          basic: 0, hra: 0, allowances: 0, otherDeductions: 0, paymentStatus: 'Pending', bankAccount: '', pfApplicable: true
        };
        const gross = sal.basic + sal.hra + sal.allowances;
        const totalEarnings = gross;

        const pfDeduction = sal.pfApplicable ? (sal.basic * (settings.pf / 100)) : 0;
        const empProfTax = sal.profTax || 0;
        const empOtherDeductions = sal.otherDeductions || 0;
        const totalDeductions = pfDeduction + empProfTax + empOtherDeductions;

        const net = totalEarnings - totalDeductions;

        return {
          employee_id: emp.id,
          month_year: currentMonthYear,
          gross: totalEarnings,
          deductions: totalDeductions,
          net: net > 0 ? net : 0,
          breakdown: { sal, pfDeduction, ptax: empProfTax, empOtherDeductions }
        };
      });

      const { error } = await supabase.from('processed_payroll').upsert(results, { onConflict: 'employee_id,month_year' });
      if (error) throw error;
      
      toast.success(`Payroll Processed Successfully for ${currentMonthYear}!`);
    } catch (err) {
      console.error('Error processing payroll:', err);
      toast.error('Failed to process payroll. Did you run the SQL query?');
    } finally {
      setProcessing(false);
    }
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
        profTax: salaries[empId].profTax || 0,
        otherDeductions: salaries[empId].otherDeductions || 0,
        paymentStatus: salaries[empId].paymentStatus || 'Pending',
        bankAccount: salaries[empId].bankAccount || '',
        pfApplicable: salaries[empId].pfApplicable !== false
      });
    } else {
      setFormData({ basic: 0, hra: 0, allowances: 0, profTax: 0, otherDeductions: 0, paymentStatus: 'Pending', bankAccount: '', pfApplicable: true });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({...formData, [name]: checked});
    } else if (name === 'paymentStatus' || name === 'bankAccount') {
      setFormData({...formData, [name]: value});
    } else {
      setFormData({...formData, [name]: value === '' ? '' : Number(value)});
    }
  };

  const handleSaveStructure = async () => {
    if(!selectedEmp) return toast.error('Select an employee first.');
    setSavingStructure(true);
    
    try {
      const upsertData = {
        employee_id: selectedEmp,
        basic: Number(formData.basic) || 0,
        hra: Number(formData.hra) || 0,
        allowances: Number(formData.allowances) || 0,
        prof_tax: Number(formData.profTax) || 0,
        other_deductions: Number(formData.otherDeductions) || 0,
        payment_status: formData.paymentStatus,
        bank_account: formData.bankAccount,
        pf_applicable: formData.pfApplicable
      };

      const { error } = await supabase.from('salary_structures').upsert(upsertData, { onConflict: 'employee_id' });
      if (error) throw error;

      setSalaries({
        ...salaries,
        [selectedEmp]: formData
      });
      toast.success('Salary structure saved successfully!');
    } catch (err) {
      console.error('Error saving structure:', err);
      toast.error('Failed to save structure. Did you run the SQL query?');
    } finally {
      setSavingStructure(false);
    }
  };

  const basicVal = Number(formData.basic) || 0;
  const hraVal = Number(formData.hra) || 0;
  const allowancesVal = Number(formData.allowances) || 0;
  const profTaxVal = Number(formData.profTax) || 0;
  const otherDeductVal = Number(formData.otherDeductions) || 0;

  const grossSalary = basicVal + hraVal + allowancesVal;
  const pfAmount = formData.pfApplicable ? (basicVal * (settings.pf / 100)) : 0;
  const totalDeductions = pfAmount + profTaxVal + otherDeductVal;
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
              <input type="number" name="basic" value={formData.basic === 0 && formData.basic !== '' ? '' : formData.basic} onChange={handleChange} disabled={!selectedEmp} />
            </div>
            <div className="form-group">
              <label>HRA (₹)</label>
              <input type="number" name="hra" value={formData.hra === 0 && formData.hra !== '' ? '' : formData.hra} onChange={handleChange} disabled={!selectedEmp} />
            </div>
            <div className="form-group">
              <label>Allowances (₹)</label>
              <input type="number" name="allowances" value={formData.allowances === 0 && formData.allowances !== '' ? '' : formData.allowances} onChange={handleChange} disabled={!selectedEmp} />
            </div>
            
            <div className="form-group">
              <label>PF Option</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: selectedEmp ? 'pointer' : 'not-allowed', userSelect: 'none', backgroundColor: formData.pfApplicable ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '10px 16px', borderRadius: '8px', width: '100%', transition: 'all 0.3s', margin: 0 }}>
                <input type="checkbox" name="pfApplicable" checked={formData.pfApplicable} onChange={handleChange} disabled={!selectedEmp} style={{ width: '18px', height: '18px', margin: 0 }} />
                <span style={{ fontWeight: 600, color: formData.pfApplicable ? 'var(--primary-color)' : 'var(--danger)' }}>
                  {formData.pfApplicable ? 'With PF (Deduct PF)' : 'Without PF (No PF)'}
                </span>
              </label>
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
              <input type="number" name="profTax" value={formData.profTax === 0 && formData.profTax !== '' ? '' : formData.profTax} onChange={handleChange} disabled={!selectedEmp} />
            </div>
            <div className="form-group">
              <label>Other Deduct. (₹)</label>
              <input type="number" name="otherDeductions" value={formData.otherDeductions === 0 && formData.otherDeductions !== '' ? '' : formData.otherDeductions} onChange={handleChange} disabled={!selectedEmp} />
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
            <button className="btn-primary" onClick={handleSaveStructure} disabled={!selectedEmp || savingStructure} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {savingStructure ? <Loader size={16} className="spin" /> : null}
              Save Structure
            </button>
          </div>
        </div>
    </div>
  );
}
