import React, { useState } from 'react';
import { Plus, X, Trash2, Eye, Download, Pencil } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { useLocalStorage } from '../hooks/useLocalStorage';

const Indent = () => {
  const [indentData, setIndentData] = useLocalStorage('hr_indents', []);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState(null);
  
  const [departmentName, setDepartmentName] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [items, setItems] = useState([
    { product: '', qty: '', unit: '', expectedDate: '', remarks: '' }
  ]);
  
  const [activeTab, setActiveTab] = useState('Department Head');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editIndentNumber, setEditIndentNumber] = useState(null);
  const [editTimestamp, setEditTimestamp] = useState(null);
  const [editStatus, setEditStatus] = useState(null);

  const generateIndentNumber = () => {
    const nextId = indentData.length + 1;
    return `P-IND-${String(nextId).padStart(3, '0')}`;
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Automatically add a new row if the user types anything in the last row
    if (index === newItems.length - 1 && value.toString().trim() !== '') {
      newItems.push({ product: '', qty: '', unit: '', expectedDate: '', remarks: '' });
    }
    
    setItems(newItems);
  };

  const handleAddRow = () => {
    setItems([...items, { product: '', qty: '', unit: '', expectedDate: '', remarks: '' }]);
  };
  
  const handleRemoveRow = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Filter out empty rows
    const validItems = items.filter(item => item.product.trim() !== '');
    if (validItems.length === 0) {
      toast.error('Please add at least one material item');
      return;
    }

    if (!departmentName.trim()) {
      toast.error('Department name is required');
      return;
    }

    const timestamp = isEditing ? editTimestamp : new Date().toLocaleString('en-GB');
    const indentNumber = isEditing ? editIndentNumber : generateIndentNumber();
    const status = isEditing ? editStatus : 'Pending';

    const newIndent = {
      timestamp,
      indentNumber,
      departmentName,
      issuedBy,
      approvedBy,
      items: validItems,
      status
    };

    if (isEditing) {
      const updatedData = indentData.map(item => item.indentNumber === indentNumber ? newIndent : item);
      setIndentData(updatedData);
      toast.success('Indent updated successfully!');
    } else {
      setIndentData([newIndent, ...indentData]);
      toast.success('Indent submitted successfully!');
    }
    
    handleCancel();
  };

  const handleCancel = () => {
    setItems([
      { product: '', qty: '', unit: '', expectedDate: '', remarks: '' }
    ]);
    setIsEditing(false);
    setEditIndentNumber(null);
    setEditTimestamp(null);
    setEditStatus(null);
    setDepartmentName('');
    setIssuedBy('');
    setApprovedBy('');
    setShowModal(false);
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setEditIndentNumber(item.indentNumber);
    setEditTimestamp(item.timestamp);
    setEditStatus(item.status);
    setDepartmentName(item.departmentName || '');
    setIssuedBy(item.issuedBy || '');
    setApprovedBy(item.approvedBy || '');
    
    // Ensure there is at least one empty row at the end for adding new items easily
    const loadedItems = item.items && item.items.length > 0 ? [...item.items] : [];
    loadedItems.push({ product: '', qty: '', unit: '', expectedDate: '', remarks: '' });
    setItems(loadedItems);
    
    setShowModal(true);
  };

  const handleDelete = (indentNumber) => {
    if (!window.confirm('Are you sure you want to delete this indent?')) return;
    setIndentData(indentData.filter(item => item.indentNumber !== indentNumber));
    toast.success('Indent deleted successfully');
  };

  const generatePDF = () => {
    if (!selectedIndent) return;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text('Material Details', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99);
    doc.text(`Indent No: ${selectedIndent.indentNumber}`, 14, 32);
    doc.text(`Date: ${selectedIndent.timestamp}`, 14, 38);
    
    const tableColumn = ["#", "Product / Material", "Qty", "Unit", "Expected Date", "Remarks"];
    const tableRows = [];

    if (selectedIndent.items && selectedIndent.items.length > 0) {
      selectedIndent.items.forEach((item, idx) => {
        const itemData = [
          idx + 1,
          item.product,
          item.qty,
          item.unit || '-',
          item.expectedDate ? new Date(item.expectedDate).toLocaleDateString() : '-',
          item.remarks || '-'
        ];
        tableRows.push(itemData);
      });
    }

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 }
    });

    doc.save(`${selectedIndent.indentNumber}.pdf`);
  };

  const handleUpdateStatus = (indentNumber, newStatus) => {
    const updatedData = indentData.map(item => {
      if (item.indentNumber === indentNumber) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    setIndentData(updatedData);
    toast.success(`Indent ${newStatus} successfully!`);
  };

  const filteredData = indentData.filter(item => {
    if (activeTab === 'Department Head') return item.status === 'Pending';
    if (activeTab === 'HR') return ['Approved', 'Rejected', 'Done', 'Not Done'].includes(item.status);
    return true;
  });

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Product Indents</h1>
          <p className="page-subtitle">Manage material and supply indents.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Create Indent
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('Department Head')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'Department Head' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'Department Head' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Department Head
        </button>
        <button
          onClick={() => setActiveTab('HR')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'HR' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'HR' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          HR
        </button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Indent No</th>
                <th>Date</th>
                <th>Department</th>
                <th>Total Items</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No material indents found in this section.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{item.indentNumber}</td>
                    <td>{item.timestamp}</td>
                    <td>{item.departmentName || '-'}</td>
                    <td>{item.items ? item.items.length : 0} items</td>
                    <td>
                      {activeTab === 'Department Head' ? (
                        <select 
                          value={item.status}
                          onChange={(e) => {
                            if (e.target.value === 'Approved' || e.target.value === 'Rejected') {
                              handleUpdateStatus(item.indentNumber, e.target.value);
                            }
                          }}
                          style={{ padding: '6px', fontSize: '0.85rem' }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approve</option>
                          <option value="Rejected">Reject</option>
                        </select>
                      ) : (
                        <select 
                          value={item.status}
                          onChange={(e) => handleUpdateStatus(item.indentNumber, e.target.value)}
                          style={{ padding: '6px', fontSize: '0.85rem' }}
                        >
                          <option value="Approved">Approved</option>
                          <option value="Done">Done</option>
                          <option value="Not Done">Not Done</option>
                          {item.status === 'Rejected' && <option value="Rejected">Rejected</option>}
                        </select>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => setSelectedIndent(item)}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {activeTab === 'Department Head' && (
                          <>
                            <button 
                              onClick={() => handleEdit(item)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                              title="Edit Indent"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.indentNumber)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                              title="Delete Indent"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Indent Modal */}
      {selectedIndent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--primary-color)', padding: '4px 12px', borderRadius: '4px', fontSize: '1rem' }}>
                  {selectedIndent.indentNumber}
                </span>
                Indent Details
              </h2>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={generatePDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                  <Download size={16} /> PDF
                </button>
                <button onClick={() => setSelectedIndent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Date</p>
                <p style={{ fontWeight: 600, margin: 0 }}>{selectedIndent.timestamp}</p>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Department</p>
                <p style={{ fontWeight: 600, margin: 0 }}>{selectedIndent.departmentName || '-'}</p>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-main)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Items</p>
                <p style={{ fontWeight: 600, margin: 0 }}>{selectedIndent.items?.length || 0}</p>
              </div>
            </div>

            <h3 style={{ marginBottom: '16px' }}>Requested Materials</h3>
            <table style={{ marginBottom: '24px' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product / Material</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Expected Date</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {selectedIndent.items && selectedIndent.items.length > 0 ? (
                  selectedIndent.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 500 }}>{item.product}</td>
                      <td style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{item.qty}</td>
                      <td>{item.unit || '-'}</td>
                      <td>{item.expectedDate ? new Date(item.expectedDate).toLocaleDateString() : '-'}</td>
                      <td>{item.remarks || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>No items found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{isEditing ? 'Edit Material Indent' : 'Create Material Indent'}</h2>
              <button onClick={handleCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px 0 0 0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="form-group" style={{ maxWidth: '300px' }}>
                <label>Department Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" required value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} placeholder="e.g. IT, HR, Sales" />
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Product / Material</th>
                      <th style={{ width: '100px' }}>Qty</th>
                      <th style={{ width: '100px' }}>Unit</th>
                      <th style={{ width: '160px' }}>Expected Date</th>
                      <th>Remarks</th>
                      <th style={{ width: '60px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{index + 1}</td>
                        <td>
                          <input type="text" value={item.product} onChange={e => handleItemChange(index, 'product', e.target.value)} placeholder="Enter material..." style={{ border: 'none', background: 'transparent' }} />
                        </td>
                        <td>
                          <input type="number" value={item.qty} onChange={e => handleItemChange(index, 'qty', e.target.value)} min="1" placeholder="0" style={{ border: 'none', background: 'transparent' }} />
                        </td>
                        <td>
                          <input type="text" value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} placeholder="e.g. Kg" style={{ border: 'none', background: 'transparent' }} />
                        </td>
                        <td>
                          <input type="date" value={item.expectedDate} onChange={e => handleItemChange(index, 'expectedDate', e.target.value)} style={{ border: 'none', background: 'transparent' }} />
                        </td>
                        <td>
                          <input type="text" value={item.remarks} onChange={e => handleItemChange(index, 'remarks', e.target.value)} placeholder="Remarks..." style={{ border: 'none', background: 'transparent' }} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button type="button" onClick={() => handleRemoveRow(index)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button type="button" onClick={handleAddRow} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}>
                  <Plus size={16} /> Add New Row
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={handleCancel} className="btn-primary" style={{ backgroundColor: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {isEditing ? 'Update Request' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Indent;