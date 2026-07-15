import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Trash2, X, Plus, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LeaveRulesTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    leaveName: '', leaveCode: '', maxDaysLimitType: 'year', maxDaysLimit: 10,
    documentUploadRule: 'none', includeHolidays: false, countsAsPresent: false,
    minDaysPerRequest: 1, advanceNoticeDays: 0, allowHalfDay: false, applicableGender: 'All'
  });
  const [seeding, setSeeding] = useState(false);
  const api = useApi();
  const toast = useToast();

  const handleSeedLeaveRules = async () => {
    if (!window.confirm('This will delete all current leave rules and seed standard UGC/HPU student leave rules. Do you want to proceed?')) return;
    const password = window.prompt('Please enter the seeding password:');
    if (!password) return;
    setSeeding(true);
    try {
      const res = await api.post('/attendance/leave-types/seed', { seedingPassword: password });
      toast.success(res.data.message || 'Leave rules seeded successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to seed leave rules');
    } finally {
      setSeeding(false);
    }
  };

  const fetchData = async () => {
    try {
      const res = await api.get('/attendance/leave-types');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load leave types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/attendance/leave-types/${editId}`, formData);
        toast.success('Leave Type updated');
      } else {
        await api.post('/attendance/leave-types', formData);
        toast.success('Leave Type created');
      }
      setFormOpen(false);
      setEditId(null);
      setFormData({
        leaveName: '', leaveCode: '', maxDaysLimitType: 'year', maxDaysLimit: 10,
        documentUploadRule: 'none', includeHolidays: false, countsAsPresent: false,
        minDaysPerRequest: 1, advanceNoticeDays: 0, allowHalfDay: false, applicableGender: 'All'
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving leave type');
    }
  };

  const handleEdit = (row) => {
    setEditId(row._id);
    setFormData({
      leaveName: row.leaveName,
      leaveCode: row.leaveCode,
      maxDaysLimitType: row.maxDaysLimitType || 'year',
      maxDaysLimit: row.maxDaysLimit,
      documentUploadRule: row.documentUploadRule || 'none',
      includeHolidays: !!row.includeHolidays,
      countsAsPresent: !!row.countsAsPresent,
      minDaysPerRequest: row.minDaysPerRequest || 1,
      advanceNoticeDays: row.advanceNoticeDays || 0,
      allowHalfDay: !!row.allowHalfDay,
      applicableGender: row.applicableGender || 'All'
    });
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditId(null);
    setFormData({
      leaveName: '', leaveCode: '', maxDaysLimitType: 'year', maxDaysLimit: 10,
      documentUploadRule: 'none', includeHolidays: false, countsAsPresent: false,
      minDaysPerRequest: 1, advanceNoticeDays: 0, allowHalfDay: false, applicableGender: 'All'
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/attendance/leave-types/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const columns = [
    { header: 'Leave Name', accessor: 'leaveName' },
    { header: 'Code', accessor: 'leaveCode' },
    { header: 'Limit', accessor: (row) => row.maxDaysLimit !== null ? `${row.maxDaysLimit} days per ${row.maxDaysLimitType}` : 'Unlimited' },
    { header: 'Doc Rule', accessor: (row) => row.documentUploadRule.toUpperCase() },
    { header: 'Count Holidays', accessor: (row) => row.includeHolidays ? 'Yes' : 'No' },
    { header: 'Gender', accessor: 'applicableGender' },
    { header: 'Counts As Present', accessor: (row) => row.countsAsPresent ? 'Yes' : 'No' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex gap-sm">
          <button className="btn btn-sm btn-outline" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }} onClick={() => handleEdit(row)}>
            <Edit2 size={16} />
          </button>
          <button className="btn btn-sm btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={() => handleDelete(row._id)}>
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Leave Rules</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure allowed leave types.</p>
        </div>
        {!formOpen && (
          <div className="flex gap-md">
            <button className="btn btn-secondary" onClick={handleSeedLeaveRules} disabled={seeding}>
              {seeding ? 'Seeding...' : 'Seed Leave Rules'}
            </button>
            <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
              <Plus size={16} /> Add Leave Type
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="inline-form-card">
              <div className="inline-form-header">
                <span className="inline-form-title">
                  {editId ? <Edit2 size={18} /> : <Plus size={18} />} {editId ? 'Edit Leave Type' : 'Add Leave Type'}
                </span>
                <button className="inline-form-close" onClick={handleCloseForm}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Leave Name</label>
                    <input className="form-input" required value={formData.leaveName} onChange={e => setFormData({...formData, leaveName: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Leave Code (e.g. CL, ML, DL)</label>
                    <input className="form-input" required value={formData.leaveCode} onChange={e => setFormData({...formData, leaveCode: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Limit Type</label>
                    <select className="form-input" value={formData.maxDaysLimitType} onChange={e => setFormData({...formData, maxDaysLimitType: e.target.value})}>
                      <option value="semester">Per Semester</option>
                      <option value="year">Per Year</option>
                    </select>
                  </div>
                </div>

                <div className="grid-3" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Max Days Limit (0 for none/unlimited)</label>
                    <input type="number" className="form-input" value={formData.maxDaysLimit || ''} onChange={e => setFormData({...formData, maxDaysLimit: e.target.value ? parseInt(e.target.value, 10) : null})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Document Upload Rule</label>
                    <select className="form-input" value={formData.documentUploadRule} onChange={e => setFormData({...formData, documentUploadRule: e.target.value})}>
                      <option value="none">None</option>
                      <option value="optional">Optional</option>
                      <option value="mandatory">Mandatory</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Applicable Gender</label>
                    <select className="form-input" value={formData.applicableGender} onChange={e => setFormData({...formData, applicableGender: e.target.value})}>
                      <option value="All">All</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid-3" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Min Days Per Request</label>
                    <input type="number" min="1" className="form-input" value={formData.minDaysPerRequest} onChange={e => setFormData({...formData, minDaysPerRequest: parseInt(e.target.value, 10) || 1})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Advance Notice Required (Days)</label>
                    <input type="number" min="0" className="form-input" value={formData.advanceNoticeDays} onChange={e => setFormData({...formData, advanceNoticeDays: parseInt(e.target.value, 10) || 0})} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '24px', margin: '20px 0 20px 0', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: 0 }}>
                    <input type="checkbox" id="incHoli" checked={formData.includeHolidays} onChange={e => setFormData({...formData, includeHolidays: e.target.checked})} />
                    <label htmlFor="incHoli" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Count Holidays & Sundays in Leave Period</label>
                  </div>
                  <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: 0 }}>
                    <input type="checkbox" id="presentReq" checked={formData.countsAsPresent} onChange={e => setFormData({...formData, countsAsPresent: e.target.checked})} />
                    <label htmlFor="presentReq" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Counts as Present (Credit Attendance)</label>
                  </div>
                  <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: 0 }}>
                    <input type="checkbox" id="halfDayReq" checked={formData.allowHalfDay} onChange={e => setFormData({...formData, allowHalfDay: e.target.checked})} />
                    <label htmlFor="halfDayReq" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Allow Half-Day Requests</label>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleCloseForm}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editId ? 'Update Leave Type' : 'Save Leave Type'}</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default LeaveRulesTab;
