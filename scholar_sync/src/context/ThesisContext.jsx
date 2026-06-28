import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_URL } from '../config';

export const ThesisContext = createContext();

const API = API_URL;

export const ThesisProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [thesis, setThesis] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [allTheses, setAllTheses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Scholar: fetch own thesis
  const fetchMyThesis = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/thesis/me`, getAuthHeader());
      setThesis(data.thesis);
      setMilestones(data.milestones);
    } catch (err) {
      if (err.response?.status === 404) {
        setThesis(null);
        setMilestones([]);
      } else {
        setError(err.response?.data?.message || 'Error fetching thesis');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Scholar: create thesis registration
  const createThesis = async (formData) => {
    const { data } = await axios.post(`${API}/thesis`, formData, getAuthHeader());
    setThesis(data);
    return data;
  };

  // Scholar: submit milestone document
  const submitMilestone = async (milestoneId, file, title = '', abstract = '') => {
    const form = new FormData();
    form.append('document', file);
    if (title) form.append('title', title);
    if (abstract) form.append('abstract', abstract);
    const { data } = await axios.post(`${API}/milestones/${milestoneId}/submit`, form, {
      ...getAuthHeader(),
      headers: { ...getAuthHeader().headers, 'Content-Type': 'multipart/form-data' },
    });
    // Refresh student thesis and milestones state to reflect changes instantly
    try {
      const { data: updatedData } = await axios.get(`${API}/thesis/me`, getAuthHeader());
      setThesis(updatedData.thesis);
      setMilestones(updatedData.milestones);
    } catch (e) {
      setMilestones(prev => prev.map(m => m._id === milestoneId ? data : m));
    }
    return data;
  };

  // Admin: fetch all theses
  const fetchAllTheses = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      
      // 1. Fetch first chunk (10 items)
      params.set('limit', '10');
      const { data: firstTen } = await axios.get(`${API}/thesis/all?${params.toString()}`, getAuthHeader());
      setAllTheses(firstTen);
      setLoading(false); // Stop loading indicator immediately

      // 2. Fetch remaining data in background
      params.delete('limit');
      params.set('skip', '10');
      const { data: rest } = await axios.get(`${API}/thesis/all?${params.toString()}`, getAuthHeader());
      if (rest && rest.length > 0) {
        setAllTheses(prev => {
          const existingIds = new Set(prev.map(t => t._id.toString()));
          const uniqueRest = rest.filter(t => !existingIds.has(t._id.toString()));
          return [...prev, ...uniqueRest];
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
      setLoading(false);
    }
  }, []);

  // Admin/Faculty: fetch single thesis
  const fetchThesisById = async (id) => {
    const { data } = await axios.get(`${API}/thesis/${id}`, getAuthHeader());
    return data;
  };

  // Admin actions
  const verifyEnrollment = async (id) => {
    const { data } = await axios.put(`${API}/thesis/${id}/verify`, {}, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };
  const assignSupervisor = async (id, supervisorId) => {
    const { data } = await axios.put(`${API}/thesis/${id}/assign`, { supervisorId }, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };
  const clearCoursework = async (id) => {
    const { data } = await axios.put(`${API}/thesis/${id}/coursework`, {}, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };
  const awardDegree = async (id, note) => {
    const { data } = await axios.put(`${API}/thesis/${id}/award`, { note }, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };
  const updateAuditLog = async (id, action, note) => {
    const { data } = await axios.put(`${API}/thesis/${id}/audit`, { action, note }, getAuthHeader());
    return data;
  };

  // Faculty actions
  const fetchAssignedTheses = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch first chunk (10 items)
      const { data: firstTen } = await axios.get(`${API}/thesis/assigned?limit=10`, getAuthHeader());
      setAllTheses(firstTen);
      setLoading(false); // Stop loading indicator immediately

      // 2. Fetch remaining in the background
      const { data: rest } = await axios.get(`${API}/thesis/assigned?skip=10`, getAuthHeader());
      if (rest && rest.length > 0) {
        setAllTheses(prev => {
          const existingIds = new Set(prev.map(t => t._id.toString()));
          const uniqueRest = rest.filter(t => !existingIds.has(t._id.toString()));
          return [...prev, ...uniqueRest];
        });
      }
    } catch (err) { 
      setError(err.message); 
      setLoading(false);
    }
  }, []);

  const fetchDeptTheses = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch first chunk (10 items)
      const { data: firstTen } = await axios.get(`${API}/thesis/dept?limit=10`, getAuthHeader());
      setAllTheses(firstTen);
      setLoading(false); // Stop loading indicator immediately

      // 2. Fetch remaining in the background
      const { data: rest } = await axios.get(`${API}/thesis/dept?skip=10`, getAuthHeader());
      if (rest && rest.length > 0) {
        setAllTheses(prev => {
          const existingIds = new Set(prev.map(t => t._id.toString()));
          const uniqueRest = rest.filter(t => !existingIds.has(t._id.toString()));
          return [...prev, ...uniqueRest];
        });
      }
    } catch (err) { 
      setError(err.message); 
      setLoading(false);
    }
  }, []);

  const drcApprove = async (id) => {
    const { data } = await axios.put(`${API}/thesis/${id}/drc`, {}, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };
  const scheduleSeminar = async (id, payload) => {
    const { data } = await axios.put(`${API}/thesis/${id}/schedule-seminar`, payload, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };
  const seminarClear = async (id) => {
    const { data } = await axios.put(`${API}/thesis/${id}/seminar`, {}, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };
  const finalApprove = async (id) => {
    const { data } = await axios.put(`${API}/thesis/${id}/final-approve`, {}, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };
  const reviewMilestone = async (milestoneId, action, comment) => {
    const { data } = await axios.put(`${API}/milestones/${milestoneId}/review`, { action, comment }, getAuthHeader());
    return data;
  };

  const dispatchThesis = async (id, payload) => {
    const { data } = await axios.put(`${API}/thesis/${id}/dispatch`, payload, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };
  const scheduleViva = async (id, payload) => {
    const { data } = await axios.put(`${API}/thesis/${id}/schedule-viva`, payload, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };
  const recordViva = async (id, payload) => {
    const { data } = await axios.put(`${API}/thesis/${id}/record-viva`, payload, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };
  const transferScholar = async (id, payload) => {
    const body = typeof payload === 'object' ? payload : { targetUserId: payload };
    const { data } = await axios.put(`${API}/thesis/${id}/transfer`, body, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };
  const forcePreSubmission = async (id) => {
    const { data } = await axios.put(`${API}/thesis/${id}/force-pre-submission`, {}, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };

  const schedulePreSubmissionSeminar = async (id, payload) => {
    const { data } = await axios.put(`${API}/thesis/${id}/pre-submission/schedule`, payload, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };

  const recordPreSubmissionSeminarOutcome = async (id, payload) => {
    const { data } = await axios.put(`${API}/thesis/${id}/pre-submission/record-outcome`, payload, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };

  const submitCourseworkDetails = async (payload) => {
    const formData = new FormData();
    formData.append('researchEthics', JSON.stringify(payload.researchEthics));
    formData.append('researchMethodology', JSON.stringify(payload.researchMethodology));
    formData.append('elective', JSON.stringify(payload.elective));
    formData.append('others', JSON.stringify(payload.others));
    if (payload.proof) {
      formData.append('proof', payload.proof);
    }
    const { data } = await axios.put(`${API}/thesis/me/coursework/submit`, formData, {
      ...getAuthHeader(),
      headers: { ...getAuthHeader().headers, 'Content-Type': 'multipart/form-data' },
    });
    setThesis(data);
    return data;
  };

  const approveCourseworkFaculty = async (id) => {
    const { data } = await axios.put(`${API}/thesis/${id}/coursework/approve-faculty`, {}, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };

  const rejectCourseworkFaculty = async (id, remarks) => {
    const { data } = await axios.put(`${API}/thesis/${id}/coursework/reject-faculty`, { remarks }, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };

  const approveCourseworkHOD = async (id) => {
    const { data } = await axios.put(`${API}/thesis/${id}/coursework/approve-hod`, {}, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };

  const rejectCourseworkHOD = async (id, remarks) => {
    const { data } = await axios.put(`${API}/thesis/${id}/coursework/reject-hod`, { remarks }, getAuthHeader());
    setAllTheses(prev => prev.map(t => t._id === id ? data : t));
    return data;
  };

  return (
    <ThesisContext.Provider value={{
      thesis, milestones, allTheses, loading, error,
      fetchMyThesis, createThesis, submitMilestone,
      fetchAllTheses, fetchThesisById, verifyEnrollment, assignSupervisor,
      clearCoursework, awardDegree, updateAuditLog,
      fetchAssignedTheses, fetchDeptTheses, drcApprove, scheduleSeminar, seminarClear, finalApprove, reviewMilestone,
      dispatchThesis, scheduleViva, recordViva, transferScholar, forcePreSubmission,
      submitCourseworkDetails, approveCourseworkFaculty, rejectCourseworkFaculty,
      approveCourseworkHOD, rejectCourseworkHOD,
      schedulePreSubmissionSeminar, recordPreSubmissionSeminarOutcome
    }}>
      {children}
    </ThesisContext.Provider>
  );
};
