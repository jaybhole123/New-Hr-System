import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Plus, X, Pencil, Trash2, Loader } from 'lucide-react';

export default function EmployeeMaster() {
  // Main state
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit state
  const [editingId, setEditingId] = useState(null);

  // Add state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  
  const initialFormData = {
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    joiningDate: '',
    baseSalary: '',
    address: '',
    aadharNo: '',
    panNo: '',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    branchName: '',
    fathersName: '',
    alternatePhone: '',
    maritalStatus: '',
    bloodGroup: '',
    healthIssues: '',
    photo: '',
    dateOfBirth: '',
    drivingLicence: '',
    experience: '',
    status: 'Active'
  };
  
  const [formData, setFormData] = useState(initialFormData);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, employee_id, user_name, department, designation, Designation, status, created_at, number, joining_date, fathers_name, experience')
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

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase.from('users').select('department');
      if (error) throw error;
      if (data) {
        const uniqueDeps = [...new Set(data.map(d => d.department).filter(Boolean))];
        setDepartments(uniqueDeps);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  // --- Handlers for Editing / Deleting ---
  const handleDelete = async (emp) => {
    if(window.confirm(`Are you sure you want to mark ${emp.user_name} as Inactive?`)) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ status: 'Inactive' })
          .eq('id', emp.id);
          
        if (error) throw error;
        setEmployees(employees.map(e => e.id === emp.id ? { ...e, status: 'Inactive' } : e));
        toast.success('Employee marked as Inactive successfully');
      } catch (error) {
        console.error('Error deactivating employee:', error);
        toast.error('Failed to deactivate employee');
      }
    }
  };

  const handleEdit = async (emp) => {
    // Optimistically open modal with partial data if we want, or just fetch full data first
    try {
      const toastId = toast.loading('Loading employee details...');
      const { data: fullEmp, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', emp.id)
        .single();
        
      toast.dismiss(toastId);
      
      if (error) throw error;
      
      setEditingId(fullEmp.id);
      setFormData({
        name: fullEmp.user_name || '',
        email: fullEmp.email_id || '',
        phone: fullEmp.number ? fullEmp.number.toString() : '',
        department: fullEmp.department || '',
        designation: fullEmp.Designation || fullEmp.designation || '',
        joiningDate: fullEmp.joining_date || '',
        baseSalary: fullEmp.base_salary || '',
        address: fullEmp.address || '',
        aadharNo: fullEmp.aadhar_no || '',
        panNo: fullEmp.pan_no || '',
        bankName: fullEmp.bank_name || '',
        accountNo: fullEmp.account_no || '',
        ifscCode: fullEmp.ifsc_code || '',
        branchName: fullEmp.branch_name || '',
        fathersName: fullEmp.fathers_name || '',
        alternatePhone: fullEmp.alternate_phone || '',
        maritalStatus: fullEmp.marital_status || '',
        bloodGroup: fullEmp.blood_group || '',
        healthIssues: fullEmp.health_issues || '',
        dateOfBirth: fullEmp.date_of_birth || '',
        drivingLicence: fullEmp.driving_licence || '',
        experience: fullEmp.experience || '',
        photo: fullEmp.photo || '',
        status: fullEmp.status || 'Active'
      });
      setPhotoPreview(fullEmp.photo || null);
      setIsAddModalOpen(true);
    } catch (err) {
      console.error('Error fetching full details:', err);
      toast.error('Failed to load employee details');
    }
  };

  // --- Handlers for Adding/Editing Employee ---
  const handleAddChange = (e) => {
    if (e.target.name === 'photoFile') {
      const file = e.target.files[0];
      setPhotoFile(file);
      if (file) {
        setPhotoPreview(URL.createObjectURL(file));
      } else {
        setPhotoPreview(null);
      }
    } else {
      setFormData({...formData, [e.target.name]: e.target.value});
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let uploadedPhotoUrl = formData.photo; // fallback if any string was there

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, photoFile);

        if (uploadError) {
          throw new Error('Photo upload failed. Have you created the "profiles" public bucket in Supabase? ' + uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);

        uploadedPhotoUrl = publicUrlData.publicUrl;
      }

      const employeeData = {
        user_name: formData.name,
        email_id: formData.email,
        number: parseInt(formData.phone.replace(/\D/g, ''), 10) || null,
        department: formData.department,
        designation: formData.designation,
        joining_date: formData.joiningDate,
        base_salary: Number(formData.baseSalary) || 0,
        address: formData.address,
        aadhar_no: formData.aadharNo,
        pan_no: formData.panNo,
        bank_name: formData.bankName,
        account_no: formData.accountNo,
        ifsc_code: formData.ifscCode,
        branch_name: formData.branchName,
        fathers_name: formData.fathersName,
        alternate_phone: formData.alternatePhone,
        marital_status: formData.maritalStatus,
        blood_group: formData.bloodGroup,
        health_issues: formData.healthIssues,
        date_of_birth: formData.dateOfBirth || null,
        driving_licence: formData.drivingLicence,
        experience: formData.experience,
        photo: uploadedPhotoUrl,
        status: formData.status
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('users')
          .update(employeeData)
          .eq('id', editingId);
          
        if (updateError) throw updateError;
        toast.success(`Employee ${formData.name} Updated Successfully!`);
      } else {
        // Get current count to generate EMP ID
        const { count, error: countError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
          
        if (countError) throw countError;

        const nextId = count ? count + 1 : 1;
        const empId = `EMP${String(nextId).padStart(3, '0')}`;
        employeeData.employee_id = empId;

        const { error: insertError } = await supabase
          .from('users')
          .insert([employeeData]);

        if (insertError) throw insertError;

        toast.success(`Employee ${formData.name} Onboarded Successfully as ${empId}!`);
      }
      
      setFormData(initialFormData);
      setPhotoFile(null);
      setPhotoPreview(null);
      setIsAddModalOpen(false);
      setEditingId(null);
      fetchEmployees(); // Refresh list
    } catch (error) {
      console.error('Error inserting employee:', error);
      toast.error('Failed to onboard employee: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">View and manage all employee records.</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => {
            setEditingId(null);
            setFormData(initialFormData);
            setPhotoFile(null);
            setPhotoPreview(null);
            setIsAddModalOpen(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Add New Employee
        </button>
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
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Date of Joining</th>
                <th>Experience</th>
                <th>Father's Name</th>
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
                  <td>{emp.number || '-'}</td>
                  <td>{emp.department}</td>
                  <td>{emp.Designation || emp.designation}</td>
                  <td>{emp.joining_date ? new Date(emp.joining_date).toLocaleDateString() : '-'}</td>
                  <td>{emp.experience || '-'}</td>
                  <td>{emp.fathers_name || '-'}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem',
                      backgroundColor: (!emp.status || emp.status.toLowerCase() === 'active') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: (!emp.status || emp.status.toLowerCase() === 'active') ? '#10b981' : '#ef4444',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {emp.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(emp)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginRight: '16px' }} title="Edit">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(emp)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} title="Mark Inactive">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    {loading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Loader size={20} className="spin" /> Loading employees...
                      </div>
                    ) : (
                      'No employees found.'
                    )}
                  </td>
                </tr>
              )
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Employee Modal (Add/Edit) */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button onClick={() => { setIsAddModalOpen(false); setEditingId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <h3 style={{ marginBottom: '16px', paddingBottom: '8px', color: 'var(--primary-color)' }}>Personal & Professional Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleAddChange} required placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleAddChange} required placeholder="john.doe@company.com" />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleAddChange} required placeholder="+1 234 567 8900" />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select name="department" value={formData.department} onChange={handleAddChange} required>
                    <option value="">Select Department</option>
                    {departments.map((dep, idx) => (
                      <option key={idx} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleAddChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <input type="text" name="designation" value={formData.designation} onChange={handleAddChange} required placeholder="Software Engineer" />
                </div>
                <div className="form-group">
                  <label>Base Salary (₹)</label>
                  <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleAddChange} required placeholder="50000" />
                </div>
                <div className="form-group">
                  <label>Experience</label>
                  <input type="text" name="experience" value={formData.experience} onChange={handleAddChange} placeholder="e.g. 2 Years / Fresher" />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleAddChange} required />
                </div>
                <div className="form-group">
                  <label>Date of Joining</label>
                  <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleAddChange} required />
                </div>
                <div className="form-group">
                  <label>Father's Name</label>
                  <input type="text" name="fathersName" value={formData.fathersName} onChange={handleAddChange} placeholder="Father's Name" />
                </div>
                <div className="form-group">
                  <label>Alternate Number</label>
                  <input type="tel" name="alternatePhone" value={formData.alternatePhone} onChange={handleAddChange} placeholder="e.g. +1 234 567 8901" />
                </div>
                <div className="form-group">
                  <label>Marital Status</label>
                  <select name="maritalStatus" value={formData.maritalStatus} onChange={handleAddChange}>
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Blood Group</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleAddChange}>
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label>Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {photoPreview ? (
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-color)' }}>
                        <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--bg-color, #f3f4f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color, #d1d5db)' }}>
                        <span style={{ fontSize: '24px' }}>👤</span>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ cursor: 'pointer', backgroundColor: 'var(--primary-color)', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '500', display: 'inline-block', textAlign: 'center', width: 'fit-content' }}>
                        Upload Image
                        <input type="file" name="photoFile" accept="image/*" onChange={handleAddChange} style={{ display: 'none' }} />
                      </label>
                      {photoFile && <small style={{ color: 'var(--success)' }}>Selected: {photoFile.name}</small>}
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Health Issues</label>
                  <input type="text" name="healthIssues" value={formData.healthIssues} onChange={handleAddChange} placeholder="Any health issues?" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Address</label>
                  <textarea name="address" value={formData.address} onChange={handleAddChange} required placeholder="Full Address" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical' }} rows="3" />
                </div>
              </div>

              <h3 style={{ marginTop: '32px', marginBottom: '16px', paddingBottom: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '24px', color: 'var(--primary-color)' }}>Identity Documents</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Aadhar Document (No.)</label>
                  <input type="text" name="aadharNo" value={formData.aadharNo} onChange={handleAddChange} required placeholder="1234 5678 9012" />
                </div>
                <div className="form-group">
                  <label>PAN Card No.</label>
                  <input type="text" name="panNo" value={formData.panNo} onChange={handleAddChange} required placeholder="ABCDE1234F" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="form-group">
                  <label>Driving Licence (No.)</label>
                  <input type="text" name="drivingLicence" value={formData.drivingLicence} onChange={handleAddChange} placeholder="e.g. MH1420110062821" style={{ textTransform: 'uppercase' }} />
                </div>
              </div>

              <h3 style={{ marginTop: '32px', marginBottom: '16px', paddingBottom: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '24px', color: 'var(--primary-color)' }}>Bank Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Bank Name</label>
                  <input type="text" name="bankName" value={formData.bankName} onChange={handleAddChange} required placeholder="e.g. HDFC Bank" />
                </div>
                <div className="form-group">
                  <label>Account Number</label>
                  <input type="text" name="accountNo" value={formData.accountNo} onChange={handleAddChange} required placeholder="123456789012" />
                </div>
                <div className="form-group">
                  <label>IFSC Code</label>
                  <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleAddChange} required placeholder="HDFC0001234" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="form-group">
                  <label>Branch Name</label>
                  <input type="text" name="branchName" value={formData.branchName} onChange={handleAddChange} required placeholder="e.g. Connaught Place" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '32px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => { setIsAddModalOpen(false); setEditingId(null); }} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Onboard Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
