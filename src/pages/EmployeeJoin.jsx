import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function EmployeeJoin() {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    joiningDate: ''
  });

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('department');
          
        if (error) throw error;
        
        if (data) {
          const uniqueDeps = [...new Set(data.map(d => d.department).filter(Boolean))];
          setDepartments(uniqueDeps);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    }
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current count to generate EMP ID
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
        
      if (countError) throw countError;

      const nextId = count ? count + 1 : 1;
      const empId = `EMP${String(nextId).padStart(3, '0')}`;

      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          employee_id: empId,
          user_name: formData.name,
          email_id: formData.email,
          number: parseInt(formData.phone.replace(/\D/g, ''), 10) || null,
          department: formData.department,
          designation: formData.designation
        }]);

      if (insertError) throw insertError;

      alert(`Employee ${formData.name} Onboarded Successfully as ${empId}!`);
      
      setFormData({
        name: '', email: '', phone: '', department: '', designation: '', joiningDate: ''
      });
    } catch (error) {
      console.error('Error inserting employee:', error);
      alert('Failed to onboard employee: ' + error.message);
    } finally {
      setLoading(false);
    }
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
                {departments.map((dep, idx) => (
                  <option key={idx} value={dep}>{dep}</option>
                ))}
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
          <button type="submit" className="btn-primary" style={{ marginTop: '16px' }} disabled={loading}>
            {loading ? 'Onboarding...' : 'Onboard Employee'}
          </button>
        </form>
      </div>
    </div>
  );
}
