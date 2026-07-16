import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function EmployeeJoin() {
  const [employees, setEmployees] = useLocalStorage('hr_employees', [
    { id: 'EMP001', name: 'John Doe', department: 'IT', designation: 'Software Engineer', status: 'Active' },
    { id: 'EMP002', name: 'Jane Smith', department: 'HR', designation: 'HR Manager', status: 'Active' },
    { id: 'EMP003', name: 'Michael Johnson', department: 'Finance', designation: 'Accountant', status: 'On Leave' },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    joiningDate: ''
  });

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newEmp = {
      id: `EMP${String(employees.length + 1).padStart(3, '0')}`,
      name: formData.name,
      department: formData.department,
      designation: formData.designation,
      status: 'Active',
      ...formData
    };
    
    setEmployees([...employees, newEmp]);
    alert(`Employee ${newEmp.name} Onboarded Successfully as ${newEmp.id}!`);
    
    setFormData({
      name: '', email: '', phone: '', department: '', designation: '', joiningDate: ''
    });
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Employee Join</h1>
        <p className="page-subtitle">Onboard a new employee to the organization.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john.doe@company.com" />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+1 234 567 8900" />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select name="department" value={formData.department} onChange={handleChange} required>
                <option value="">Select Department</option>
                <option value="IT">IT & Engineering</option>
                <option value="HR">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Sales">Sales & Marketing</option>
              </select>
            </div>
            <div className="form-group">
              <label>Designation</label>
              <input type="text" name="designation" value={formData.designation} onChange={handleChange} required placeholder="Software Engineer" />
            </div>
            <div className="form-group">
              <label>Date of Joining</label>
              <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} required />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>Onboard Employee</button>
        </form>
      </div>
    </div>
  );
}
