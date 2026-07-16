import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function EmployeeMaster() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, employee_id, user_name, department, designation, Designation, status, created_at')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this employee?')) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        setEmployees(employees.filter(emp => emp.id !== id));
        toast.success('Employee deleted successfully');
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error('Failed to delete employee');
      }
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Employee Master</h1>
        <p className="page-subtitle">View and manage all employee records.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Search employees..." 
            style={{ maxWidth: '300px' }} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn-primary">Export CSV</button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredEmployees = employees.filter(emp => {
                  const query = searchQuery.toLowerCase();
                  return (
                    (emp.employee_id && emp.employee_id.toLowerCase().includes(query)) ||
                    (emp.user_name && emp.user_name.toLowerCase().includes(query)) ||
                    (emp.department && emp.department.toLowerCase().includes(query)) ||
                    (emp.designation && emp.designation.toLowerCase().includes(query)) ||
                    (emp.Designation && emp.Designation.toLowerCase().includes(query))
                  );
                });

                return filteredEmployees.length > 0 ? filteredEmployees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.employee_id}</td>
                  <td style={{ fontWeight: 500 }}>{emp.user_name}</td>
                  <td>{emp.department}</td>
                  <td>{emp.Designation || emp.designation}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem',
                      backgroundColor: emp.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: emp.status === 'Active' ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {emp.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <button style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginRight: '10px' }}>Edit</button>
                    <button onClick={() => handleDelete(emp.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>No employees found.</td>
                </tr>
              )
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
