import React, { useState, useEffect, useRef } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Trash2, X, Plus, Pencil, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DegreeNameMasterTab = () => {
  const [data, setData] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ degreeTypeId: '', departmentId: '', name: '', code: '' });
  const [deptSearch, setDeptSearch] = useState('');
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const deptDropdownRef = useRef(null);
  const api = useApi();
  const toast = useToast();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target)) {
        setIsDeptOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const [resNames, resTypes, resDepts] = await Promise.all([
        api.get('/attendance/masters/degree-names'),
        api.get('/attendance/masters/degree-types'),
        api.get('/departments')
      ]);
      setData(resNames.data);
      setDegreeTypes(resTypes.data);
      setDepartments(resDepts.data);
      if (resTypes.data.length > 0) {
        setFormData(prev => ({ ...prev, degreeTypeId: resTypes.data[0]._id }));
      }
    } catch (err) {
      toast.error('Failed to load degree names');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ degreeTypeId: degreeTypes[0]?._id || '', departmentId: '', name: '', code: '' });
    setDeptSearch('');
    setIsDeptOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/attendance/masters/degree-names/${editingId}`, formData);
        toast.success('Degree Name updated');
      } else {
        await api.post('/attendance/masters/degree-names', formData);
        toast.success('Degree Name created');
      }
      setFormOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving degree name');
    }
  };

  const handleEdit = (row) => {
    setEditingId(row._id);
    setFormData({
      degreeTypeId: row.degreeTypeId?._id || '',
      departmentId: row.departmentId?._id || '',
      name: row.name || '',
      code: row.code || ''
    });
    setFormOpen(true);
  };

  const handleSeedAllMasters = async () => {
    if (!window.confirm('This will seed the complete list of departments, degree types, and degree names. Duplicate entries will be prevented. Do you want to proceed?')) return;
    setSeeding(true);
    try {
      const res = await api.post('/attendance/masters/seed-all');
      toast.success(res.data.message || 'Master data seeded successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to seed master data');
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/attendance/masters/degree-names/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(deptSearch.toLowerCase()))
  );

  const selectedDeptName = departments.find(d => d._id === formData.departmentId)?.name || '';

  const columns = [
    { header: 'Degree Type', accessor: (row) => row.degreeTypeId?.name || 'N/A' },
    {
      header: 'Department',
      accessor: (row) => {
        if (!row.departmentId) return 'N/A';
        return (
          <span>
            {row.departmentId.name}
            {row.departmentId.faculty && (
              <span style={{ color: '#EF4444', fontWeight: '500', marginLeft: '8px' }}>
                ({row.departmentId.faculty})
              </span>
            )}
          </span>
        );
      }
    },
    { header: 'Degree Name', accessor: 'name' },
    { header: 'Code', accessor: 'code' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-sm btn-outline" style={{ color: '#3B82F6', borderColor: '#3B82F6' }} onClick={() => handleEdit(row)} title="Edit">
            <Pencil size={15} />
          </button>
          <button className="btn btn-sm btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={() => handleDelete(row._id)} title="Delete">
            <Trash2 size={15} />
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
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Degree Names</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>e.g. M.Sc. Computer Science, B.Tech ECE</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!formOpen && (
            <>
              <button className="btn btn-outline" onClick={handleSeedAllMasters} disabled={seeding}>
                {seeding ? 'Seeding...' : 'Seed Master Data'}
              </button>
              <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
                <Plus size={16} /> Add Degree Name
              </button>
            </>
          )}
        </div>
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
                  {editingId ? <Pencil size={18} /> : <Plus size={18} />} {editingId ? 'Edit Degree Name' : 'Add Degree Name'}
                </span>
                <button className="inline-form-close" onClick={() => { setFormOpen(false); resetForm(); }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid-4">
                  <div className="form-group">
                    <label className="form-label">Degree Type</label>
                    <select className="form-input" required value={formData.degreeTypeId} onChange={e => setFormData({...formData, degreeTypeId: e.target.value})}>
                      <option value="">Select Type...</option>
                      {degreeTypes.map(t => <option key={t._id} value={t._id}>{t.name} ({t.code})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <div style={{ position: 'relative' }} ref={deptDropdownRef}>
                      <div
                        className="form-input"
                        onClick={() => setIsDeptOpen(!isDeptOpen)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      >
                        <span style={{ color: selectedDeptName ? 'inherit' : '#9CA3AF' }}>
                          {selectedDeptName || 'Select Department...'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>▼</span>
                      </div>
                      {isDeptOpen && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                          background: 'var(--bg-card, #fff)', border: '1px solid var(--border-color, #e5e7eb)',
                          borderRadius: 'var(--radius, 8px)', marginTop: '4px', maxHeight: '250px', overflowY: 'auto',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
                        }}>
                          <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'var(--bg-secondary, #f3f4f6)', borderRadius: '6px' }}>
                              <Search size={14} color="#6B7280" />
                              <input
                                type="text"
                                placeholder="Search department..."
                                value={deptSearch}
                                onChange={e => setDeptSearch(e.target.value)}
                                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.85rem', color: 'var(--text-primary)' }}
                                autoFocus
                                onClick={e => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            {filteredDepartments.length > 0 ? (
                              filteredDepartments.map(d => (
                                <div
                                  key={d._id}
                                  onClick={() => {
                                    setFormData({ ...formData, departmentId: d._id });
                                    setIsDeptOpen(false);
                                    setDeptSearch('');
                                  }}
                                  style={{
                                    padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem',
                                    background: formData.departmentId === d._id ? 'var(--color-primary, #3b82f6)' : 'transparent',
                                    color: formData.departmentId === d._id ? '#fff' : 'var(--text-primary)'
                                  }}
                                  onMouseEnter={e => {
                                    if (formData.departmentId !== d._id) e.target.style.background = 'var(--bg-hover, #f3f4f6)';
                                  }}
                                  onMouseLeave={e => {
                                    if (formData.departmentId !== d._id) e.target.style.background = 'transparent';
                                  }}
                                >
                                  {d.name} {d.code ? `(${d.code})` : ''}
                                </div>
                              ))
                            ) : (
                              <div style={{ padding: '10px', color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                                No departments found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Name (e.g. B.Tech Computer Science)</label>
                    <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Code (e.g. BTECH-CS)</label>
                    <input className="form-input" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update Degree Name' : 'Save Degree Name'}</button>
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

export default DegreeNameMasterTab;
