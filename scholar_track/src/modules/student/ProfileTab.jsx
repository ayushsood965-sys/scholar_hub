import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { 
  User, BookOpen, UserCheck, ShieldAlert, ShieldCheck, 
  Upload, FileText, CheckCircle, Save, Camera, HelpCircle, RefreshCw 
} from 'lucide-react';

const ProfileTab = ({ thesis, onRefreshThesis }) => {
  const { user, updateProfile, uploadAvatar, uploadProfileDocument, fetchMe } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingNonPhd, setIsEditingNonPhd] = useState(false);
  const [subTab, setSubTab] = useState('general'); // general | academic | guide
  const [registering, setRegistering] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState('');
  const [selectedFileNames, setSelectedFileNames] = useState({});

  const api = useApi();
  const toast = useToast();

  // Basic Non-PhD fields
  const [nonPhdForm, setNonPhdForm] = useState({
    enrollmentNumber: '',
    semesterId: '',
    degreeNameId: '',
    degreeTypeId: '',
    isPhD: true,
  });

  // Masters lists for non-PhD
  const [semesters, setSemesters] = useState([]);
  const [degreeNames, setDegreeNames] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);

  // PhD Fields
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [nationality, setNationality] = useState('Indian');
  const [admissionDate, setAdmissionDate] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [phdMode, setPhdMode] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [areaOfInterest, setAreaOfInterest] = useState('');
  const [academicBackground, setAcademicBackground] = useState('');
  const [thesisTitle, setThesisTitle] = useState('');
  const [thesisSummary, setThesisSummary] = useState('');
  const [thesisKeywords, setThesisKeywords] = useState('');
  const [academicSession, setAcademicSession] = useState('');
  const [degreeType, setDegreeType] = useState('Ph.D.');
  const [sessions, setSessions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [preferredGuideId, setPreferredGuideId] = useState('');

  // PhD Qualifications edit modes
  const [editModes, setEditModes] = useState({
    general: false,
    class10: false,
    class12: false,
    graduation: false,
    postGraduation: false,
    netJrf: false,
    other: false
  });

  // PhD qualifications state variables
  const [class10Roll, setClass10Roll] = useState('');
  const [class10Board, setClass10Board] = useState('');
  const [class10School, setClass10School] = useState('');
  const [class10Marks, setClass10Marks] = useState('');
  const [class10Total, setClass10Total] = useState('');
  const [class10Percentage, setClass10Percentage] = useState('');

  const [class12Roll, setClass12Roll] = useState('');
  const [class12Board, setClass12Board] = useState('');
  const [class12School, setClass12School] = useState('');
  const [class12Marks, setClass12Marks] = useState('');
  const [class12Total, setClass12Total] = useState('');
  const [class12Percentage, setClass12Percentage] = useState('');

  const [gradRoll, setGradRoll] = useState('');
  const [gradDegree, setGradDegree] = useState('');
  const [gradCollege, setGradCollege] = useState('');
  const [gradUniversity, setGradUniversity] = useState('');
  const [gradMarks, setGradMarks] = useState('');
  const [gradTotal, setGradTotal] = useState('');
  const [gradPercentage, setGradPercentage] = useState('');

  const [pgRoll, setPgRoll] = useState('');
  const [pgDegree, setPgDegree] = useState('');
  const [pgCollege, setPgCollege] = useState('');
  const [pgUniversity, setPgUniversity] = useState('');
  const [pgMarks, setPgMarks] = useState('');
  const [pgTotal, setPgTotal] = useState('');
  const [pgPercentage, setPgPercentage] = useState('');

  const [netJrfQualified, setNetJrfQualified] = useState('');
  const [netJrfCertNumber, setNetJrfCertNumber] = useState('');
  const [netJrfRoll, setNetJrfRoll] = useState('');
  const [netJrfRank, setNetJrfRank] = useState('');
  const [netJrfScore, setNetJrfScore] = useState('');
  const [netJrfIssueDate, setNetJrfIssueDate] = useState('');

  const [otherDetails, setOtherDetails] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      const u = res.data;
      setProfile(u);

      const isPhDVal = u.profile?.isPhD !== undefined ? u.profile.isPhD : true;

      setNonPhdForm({
        enrollmentNumber: u.profile?.enrollmentNumber || '',
        semesterId: u.profile?.semesterId?._id || '',
        degreeNameId: u.profile?.degreeNameId?._id || '',
        degreeTypeId: u.profile?.degreeTypeId?._id || '',
        isPhD: isPhDVal,
      });

      if (isPhDVal) {
        // Initialize PhD fields
        setDob(u.profile?.dob ? u.profile.dob.split('T')[0] : '');
        setGender(u.profile?.gender || '');
        setCategory(u.profile?.category || '');
        setFatherName(u.profile?.fatherName || '');
        setMotherName(u.profile?.motherName || '');
        setNationality(u.profile?.nationality || 'Indian');
        setAdmissionDate(u.profile?.admissionDate ? u.profile.admissionDate.split('T')[0] : '');
        setEnrollmentNumber(u.profile?.enrollmentNumber || '');
        setPhdMode(u.profile?.phdMode || '');
        setSpecialization(u.profile?.specialization || '');
        setPhoneNumber(u.profile?.phoneNumber || '');
        setAddress(u.profile?.address || '');
        setAreaOfInterest(u.profile?.areaOfInterest || '');
        setAcademicBackground(u.profile?.academicBackground || '');
        setPreferredGuideId(u.profile?.preferredGuideId || '');
        setThesisTitle(u.profile?.thesisTitle || '');
        setThesisSummary(u.profile?.thesisSummary || '');
        setThesisKeywords(u.profile?.thesisKeywords || '');
        setAcademicSession(u.profile?.academicSession || '');
        setDegreeType(u.profile?.degreeType || 'Ph.D.');

        const q = u.profile?.qualifications || {};
        setClass10Roll(q.class10?.rollNo || '');
        setClass10Board(q.class10?.board || '');
        setClass10School(q.class10?.school || '');
        setClass10Marks(q.class10?.marksObtained || '');
        setClass10Total(q.class10?.totalMarks || '');
        setClass10Percentage(q.class10?.percentage || '');

        setClass12Roll(q.class12?.rollNo || '');
        setClass12Board(q.class12?.board || '');
        setClass12School(q.class12?.school || '');
        setClass12Marks(q.class12?.marksObtained || '');
        setClass12Total(q.class12?.totalMarks || '');
        setClass12Percentage(q.class12?.percentage || '');

        setGradRoll(q.graduation?.rollNo || '');
        setGradDegree(q.graduation?.degree || '');
        setGradCollege(q.graduation?.college || '');
        setGradUniversity(q.graduation?.university || '');
        setGradMarks(q.graduation?.marksObtained || '');
        setGradTotal(q.graduation?.totalMarks || '');
        setGradPercentage(q.graduation?.percentage || '');

        setPgRoll(q.postGraduation?.rollNo || '');
        setPgDegree(q.postGraduation?.degree || '');
        setPgCollege(q.postGraduation?.college || '');
        setPgUniversity(q.postGraduation?.university || '');
        setPgMarks(q.postGraduation?.marksObtained || '');
        setPgTotal(q.postGraduation?.totalMarks || '');
        setPgPercentage(q.postGraduation?.percentage || '');

        setNetJrfQualified(
          q.netJrf?.qualified === true ? 'YES' : 
          q.netJrf?.qualified === false ? 'NO' : ''
        );
        setNetJrfCertNumber(q.netJrf?.certNumber || '');
        setNetJrfRoll(q.netJrf?.rollNo || '');
        setNetJrfRank(q.netJrf?.rank || '');
        setNetJrfScore(q.netJrf?.score || '');
        setNetJrfIssueDate(q.netJrf?.issueDate ? q.netJrf.issueDate.split('T')[0] : '');

        setOtherDetails(q.other?.details || '');

        // Set edit modes
        setEditModes({
          general: !thesis && (!u.profile?.dob || !u.profile?.phdMode),
          class10: !thesis && !q.class10?.rollNo,
          class12: !thesis && !q.class12?.rollNo,
          graduation: !thesis && !q.graduation?.rollNo,
          postGraduation: !thesis && !q.postGraduation?.rollNo,
          netJrf: !thesis && (q.netJrf?.qualified === undefined || (q.netJrf?.qualified === true && !q.netJrf?.rollNo)),
          other: !thesis && !q.other?.details
        });
      }
    } catch (err) {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [thesis]);

  // Load masters for non-PhD students or PhD academic sessions/faculty dropdowns
  useEffect(() => {
    const fetchMastersData = async () => {
      try {
        const [semRes, nameRes, typeRes, sessRes, facRes] = await Promise.all([
          api.get('/attendance/masters/semesters').catch(() => ({ data: [] })),
          api.get('/attendance/masters/degree-names').catch(() => ({ data: [] })),
          api.get('/attendance/masters/degree-types').catch(() => ({ data: [] })),
          api.get('/attendance/sessions').catch(() => ({ data: [] })),
          api.get('/auth/faculty').catch(() => ({ data: [] }))
        ]);
        setSemesters(semRes.data);
        setDegreeNames(nameRes.data);
        setDegreeTypes(typeRes.data);
        setSessions(sessRes.data);

        // Filter supervisors in the student's department
        if (user?.department) {
          const deptFaculty = facRes.data.filter(f => f.department === user.department);
          setFaculties(deptFaculty);
        }
      } catch (e) {
        console.error('Error fetching masters config', e);
      }
    };
    if (user) fetchMastersData();
  }, [user]);

  const handleNonPhdSave = async () => {
    try {
      await api.put('/auth/profile', { profile: nonPhdForm });
      toast.success('Academic profile details saved successfully');
      setIsEditingNonPhd(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating academic details');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setAvatarLoading(true);
      await uploadAvatar(file);
      toast.success('Avatar updated successfully');
      fetchProfile();
    } catch (err) {
      toast.error('Failed to upload profile picture');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleDocUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSelectedFileNames(prev => ({ ...prev, [docType]: file.name }));
      setUploadingDoc(docType);
      const res = await uploadProfileDocument(file, docType);
      if (res.success) {
        toast.success('Certificate uploaded successfully!');
        fetchProfile();
      } else {
        toast.error('Upload failed: ' + res.message);
      }
    } catch (err) {
      toast.error('Error uploading document');
    } finally {
      setUploadingDoc('');
    }
  };

  // PhD Section Save
  const saveSection = async (sectionKey) => {
    setLoading(true);
    let sectionData = {};
    if (sectionKey === 'general') {
      if (phoneNumber) {
        const cleanedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
        const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
        if (!indianPhoneRegex.test(cleanedPhone)) {
          toast.error('Please enter a valid 10-digit Indian phone number.');
          setLoading(false);
          return;
        }
      }
      sectionData = {
        dob, gender, category, fatherName, motherName, nationality,
        admissionDate, enrollmentNumber, phdMode, specialization,
        phoneNumber, address, areaOfInterest, academicBackground,
        thesisTitle, thesisSummary, thesisKeywords, academicSession, degreeType: 'Ph.D.'
      };
    } else if (sectionKey === 'class10') {
      if (!class10Roll.trim() || !class10Board.trim() || !class10School.trim() || !class10Marks.trim() || !class10Total.trim() || !class10Percentage.trim()) {
        toast.error('Please fill in all Class 10 details.');
        setLoading(false);
        return;
      }
      sectionData = {
        class10: {
          rollNo: class10Roll, board: class10Board, school: class10School,
          marksObtained: class10Marks, totalMarks: class10Total, percentage: class10Percentage,
          certificateUrl: profile?.profile?.qualifications?.class10?.certificateUrl
        }
      };
    } else if (sectionKey === 'class12') {
      if (!class12Roll.trim() || !class12Board.trim() || !class12School.trim() || !class12Marks.trim() || !class12Total.trim() || !class12Percentage.trim()) {
        toast.error('Please fill in all Class 12 details.');
        setLoading(false);
        return;
      }
      sectionData = {
        class12: {
          rollNo: class12Roll, board: class12Board, school: class12School,
          marksObtained: class12Marks, totalMarks: class12Total, percentage: class12Percentage,
          certificateUrl: profile?.profile?.qualifications?.class12?.certificateUrl
        }
      };
    } else if (sectionKey === 'graduation') {
      if (!gradRoll.trim() || !gradDegree.trim() || !gradCollege.trim() || !gradUniversity.trim() || !gradMarks.trim() || !gradTotal.trim() || !gradPercentage.trim()) {
        toast.error('Please fill in all Graduation details.');
        setLoading(false);
        return;
      }
      sectionData = {
        graduation: {
          rollNo: gradRoll, degree: gradDegree, college: gradCollege, university: gradUniversity,
          marksObtained: gradMarks, totalMarks: gradTotal, percentage: gradPercentage,
          certificateUrl: profile?.profile?.qualifications?.graduation?.certificateUrl
        }
      };
    } else if (sectionKey === 'postGraduation') {
      if (!pgRoll.trim() || !pgDegree.trim() || !pgCollege.trim() || !pgUniversity.trim() || !pgMarks.trim() || !pgTotal.trim() || !pgPercentage.trim()) {
        toast.error('Please fill in all Post Graduation details.');
        setLoading(false);
        return;
      }
      sectionData = {
        postGraduation: {
          rollNo: pgRoll, degree: pgDegree, college: pgCollege, university: pgUniversity,
          marksObtained: pgMarks, totalMarks: pgTotal, percentage: pgPercentage,
          certificateUrl: profile?.profile?.qualifications?.postGraduation?.certificateUrl
        }
      };
    } else if (sectionKey === 'netJrf') {
      sectionData = {
        netJrf: {
          qualified: netJrfQualified === 'YES',
          certNumber: netJrfCertNumber, rollNo: netJrfRoll, rank: netJrfRank, score: netJrfScore,
          issueDate: netJrfIssueDate,
          certificateUrl: profile?.profile?.qualifications?.netJrf?.certificateUrl
        }
      };
    } else if (sectionKey === 'other') {
      sectionData = {
        other: {
          details: otherDetails,
          certificateUrl: profile?.profile?.qualifications?.other?.certificateUrl
        }
      };
    }

    try {
      let payload = {};
      if (sectionKey === 'general') {
        payload = { ...sectionData };
      } else {
        // Nested qualifications merge
        payload = {
          qualifications: {
            ...profile?.profile?.qualifications,
            ...sectionData
          }
        };
      }
      await updateProfile(payload);
      toast.success('Section saved successfully');
      setEditModes(prev => ({ ...prev, [sectionKey]: false }));
      fetchProfile();
    } catch (err) {
      toast.error('Failed to save details');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileRegistrationSubmit = async () => {
    // 1. Details Validation
    if (
      !dob || !gender || !category || !fatherName || !motherName || !nationality || 
      !admissionDate || !enrollmentNumber || !phdMode || !specialization || 
      !phoneNumber || !address || !areaOfInterest ||
      !thesisTitle || !thesisSummary || !thesisKeywords || !academicSession
    ) {
      toast.error('Please fill in all the general and Ph.D. details before submitting.');
      return;
    }

    // 2. Qualifications Validation
    const q = profile?.profile?.qualifications || {};
    if (
      !class10Roll || !q.class10?.certificateUrl ||
      !class12Roll || !q.class12?.certificateUrl ||
      !gradRoll || !q.graduation?.certificateUrl ||
      !pgRoll || !q.postGraduation?.certificateUrl
    ) {
      toast.error('Please fill in all qualifications and upload their certificates (PDF) first.');
      return;
    }

    if (netJrfQualified === 'YES') {
      if (!netJrfCertNumber || !q.netJrf?.certificateUrl) {
        toast.error('Please upload your NET JRF award letter certificate.');
        return;
      }
    }

    // 3. Preferred Supervisor Validation
    if (!preferredGuideId) {
      toast.error('Please select your preferred Ph.D. supervisor/guide preference.');
      return;
    }

    const confirmSubmit = window.confirm(
      "⚠️ CONFIRM PROFILE SUBMISSION ⚠️\n\n" +
      "Once you submit this profile, all fields will be locked to read-only mode and you will not be able to modify any details during HOD verification.\n\n" +
      "Are you absolutely sure you want to submit your profile for HOD approval now?"
    );

    if (!confirmSubmit) return;

    try {
      setRegistering(true);
      // Create thesis dossier with status: REGISTRATION_PENDING
      await api.post('/thesis', {});
      toast.success('PhD profile registration submitted to HOD successfully!');
      if (onRefreshThesis) await onRefreshThesis();
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting PhD profile');
    } finally {
      setRegistering(false);
    }
  };

  const getDocBadge = (docType, certUrl) => {
    if (!certUrl) {
      return <span style={{ fontSize: '0.75rem', background: '#FEE2E2', color: '#DC2626', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>⚠️ Certificate Missing</span>;
    }
    return (
      <a 
        href={`http://localhost:5000${certUrl}`} 
        target="_blank" 
        rel="noopener noreferrer" 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}
      >
        <FileText size={12} /> Certificate Uploaded
      </a>
    );
  };

  const getUploadButton = (docType, certUrl) => {
    if (!!thesis) return null;
    const isUploading = uploadingDoc === docType;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px', 
          background: 'var(--color-primary)', color: 'white', padding: '8px 12px', 
          borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, width: 'fit-content'
        }}>
          <Upload size={14} /> {isUploading ? 'Uploading...' : certUrl ? 'Re-upload PDF' : 'Upload PDF'}
          <input type="file" accept=".pdf,image/*" onChange={e => handleDocUpload(e, docType)} style={{ display: 'none' }} disabled={isUploading} />
        </label>
        {selectedFileNames[docType] && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Selected: {selectedFileNames[docType]}</span>
        )}
      </div>
    );
  };

  if (loading) return <SkeletonLoader count={1} height={400} />;

  const availableDegreeNames = degreeNames.filter(d => d.degreeTypeId?._id === nonPhdForm.degreeTypeId);

  return (
    <div className="glass-panel p-xl">
      {/* PhD Status Alert Banner */}
      {nonPhdForm.isPhD && (
        <div style={{ marginBottom: '24px' }}>
          {!thesis && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderLeft: '4px solid var(--status-late)',
              padding: '16px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <ShieldAlert style={{ color: 'var(--status-late)', flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--status-late)', display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>
                  PhD Registration Required
                </strong>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  Please complete the 3 sections below (General, Qualifications, Supervisor Preference) and click <strong>Submit PhD Profile for HOD Approval</strong> to register.
                </p>
              </div>
            </div>
          )}

          {thesis && thesis.status === 'REGISTRATION_PENDING' && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderLeft: '4px solid var(--status-late)',
              padding: '16px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <RefreshCw className="spin-animation" style={{ color: 'var(--status-late)', flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--status-late)', display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>
                  Awaiting HOD Verification & Approval
                </strong>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  Your profile dossier has been successfully submitted. Once your department HOD assigns your supervisor and approves, your portal will unlock.
                </p>
              </div>
            </div>
          )}

          {thesis && thesis.status !== 'REGISTRATION_PENDING' && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderLeft: '4px solid var(--status-present)',
              padding: '16px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <ShieldCheck style={{ color: 'var(--status-present)', flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--status-present)', display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>
                  Dossier Approved & Verified
                </strong>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                  Institutional PhD Registration verified. Assigned Supervisor: <strong>{thesis.supervisorId?.name || 'Assigned'}</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header and edit/save control for Non-PhD OR PhD toggles */}
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Academic Profile</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your registration fields and credentials.</p>
        </div>
        
        {/* Toggle between PhD and Non-PhD during onboarding only if not registered yet */}
        {!thesis && !profile?.profileCompleted && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Is PhD Student?</label>
            <select 
              className="form-input" 
              style={{ width: '80px', padding: '6px 12px' }}
              value={nonPhdForm.isPhD ? 'true' : 'false'}
              onChange={async (e) => {
                const val = e.target.value === 'true';
                setNonPhdForm({ ...nonPhdForm, isPhD: val });
                // Instantly update on user record
                await api.put('/auth/profile', { profile: { ...nonPhdForm, isPhD: val } });
                fetchProfile();
              }}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        )}

        {/* Edit controls for non-PhD */}
        {!nonPhdForm.isPhD && (
          !isEditingNonPhd ? (
            <button className="btn btn-outline" onClick={() => setIsEditingNonPhd(true)}>Edit Details</button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setIsEditingNonPhd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleNonPhdSave}>Save Details</button>
            </div>
          )
        )}
      </div>

      {/* ─── RENDER NON-PhD FORM ─── */}
      {!nonPhdForm.isPhD && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" disabled value={profile?.name || ''} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" disabled value={profile?.email || ''} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Enrollment Number</label>
            <input 
              className="form-input" 
              disabled={!isEditingNonPhd} 
              value={isEditingNonPhd ? nonPhdForm.enrollmentNumber : (profile?.profile?.enrollmentNumber || 'N/A')}
              onChange={e => setNonPhdForm({...nonPhdForm, enrollmentNumber: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Degree Type</label>
            {isEditingNonPhd ? (
              <select className="form-input" value={nonPhdForm.degreeTypeId} onChange={e => setNonPhdForm({...nonPhdForm, degreeTypeId: e.target.value, degreeNameId: ''})}>
                <option value="">Select Type...</option>
                {degreeTypes.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            ) : (
              <input className="form-input" disabled value={profile?.profile?.degreeTypeId?.name || 'N/A'} />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Degree Name</label>
            {isEditingNonPhd ? (
              <select className="form-input" value={nonPhdForm.degreeNameId} onChange={e => setNonPhdForm({...nonPhdForm, degreeNameId: e.target.value})} disabled={!nonPhdForm.degreeTypeId}>
                <option value="">Select Degree...</option>
                {availableDegreeNames.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            ) : (
              <input className="form-input" disabled value={profile?.profile?.degreeNameId?.name || 'N/A'} />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Current Semester</label>
            {isEditingNonPhd ? (
              <select className="form-input" value={nonPhdForm.semesterId} onChange={e => setNonPhdForm({...nonPhdForm, semesterId: e.target.value})}>
                <option value="">Select Semester...</option>
                {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            ) : (
              <input className="form-input" disabled value={profile?.profile?.semesterId?.name || 'N/A'} />
            )}
          </div>
        </div>
      )}

      {/* ─── RENDER PhD FORM ─── */}
      {nonPhdForm.isPhD && (
        <div>
          {/* Sub Tab Header */}
          <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--color-border-solid)', marginBottom: '24px', paddingBottom: '12px' }}>
            <button 
              className={`tab-btn ${subTab === 'general' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', color: subTab === 'general' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: subTab === 'general' ? 'bold' : '500', cursor: 'pointer' }}
              onClick={() => setSubTab('general')}
            >
              1. General Details
            </button>
            <button 
              className={`tab-btn ${subTab === 'academic' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', color: subTab === 'academic' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: subTab === 'academic' ? 'bold' : '500', cursor: 'pointer' }}
              onClick={() => setSubTab('academic')}
            >
              2. Academic Qualifications
            </button>
            <button 
              className={`tab-btn ${subTab === 'guide' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', color: subTab === 'guide' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: subTab === 'guide' ? 'bold' : '500', cursor: 'pointer' }}
              onClick={() => setSubTab('guide')}
            >
              3. Advisor Preference
            </button>
          </div>

          <form onSubmit={e => { e.preventDefault(); saveSection(subTab); }}>
            {/* TAB 1: General Details */}
            {subTab === 'general' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>PhD Admission & Personal Fields</h3>
                  {!thesis && !editModes.general && (
                    <button className="btn btn-sm btn-outline" type="button" onClick={() => setEditModes({ ...editModes, general: true })}>
                      ✏️ Edit General Info
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" disabled value={profile?.name || ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Login Username</label>
                    <input className="form-input" disabled value={profile?.username || ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department (Institutional)</label>
                    <input className="form-input" disabled value={profile?.department || ''} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Enrollment Number</label>
                    <input 
                      className="form-input" 
                      disabled={!editModes.general || !!thesis} 
                      value={enrollmentNumber} 
                      onChange={e => setEnrollmentNumber(e.target.value)} 
                      placeholder="Enrollment Number"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Academic Session</label>
                    {editModes.general && !thesis ? (
                      <select className="form-input" value={academicSession} onChange={e => setAcademicSession(e.target.value)}>
                        <option value="">Select Session...</option>
                        {sessions.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                      </select>
                    ) : (
                      <input className="form-input" disabled value={academicSession || 'N/A'} />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Degree Type</label>
                    <input className="form-input" disabled value="Ph.D." />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Ph.D. Mode</label>
                    {editModes.general && !thesis ? (
                      <select className="form-input" value={phdMode} onChange={e => setPhdMode(e.target.value)}>
                        <option value="">Select Mode...</option>
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                      </select>
                    ) : (
                      <input className="form-input" disabled value={phdMode || 'N/A'} />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      disabled={!editModes.general || !!thesis} 
                      value={dob} 
                      onChange={e => setDob(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    {editModes.general && !thesis ? (
                      <select className="form-input" value={gender} onChange={e => setGender(e.target.value)}>
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <input className="form-input" disabled value={gender || 'N/A'} />
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    {editModes.general && !thesis ? (
                      <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                        <option value="">Select Category...</option>
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                      </select>
                    ) : (
                      <input className="form-input" disabled value={category || 'N/A'} />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nationality</label>
                    <input 
                      className="form-input" 
                      disabled={!editModes.general || !!thesis} 
                      value={nationality} 
                      onChange={e => setNationality(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admission Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      disabled={!editModes.general || !!thesis} 
                      value={admissionDate} 
                      onChange={e => setAdmissionDate(e.target.value)} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Father's Name</label>
                    <input 
                      className="form-input" 
                      disabled={!editModes.general || !!thesis} 
                      value={fatherName} 
                      onChange={e => setFatherName(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mother's Name</label>
                    <input 
                      className="form-input" 
                      disabled={!editModes.general || !!thesis} 
                      value={motherName} 
                      onChange={e => setMotherName(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                      className="form-input" 
                      disabled={!editModes.general || !!thesis} 
                      value={phoneNumber} 
                      onChange={e => setPhoneNumber(e.target.value)} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Specialization</label>
                    <input 
                      className="form-input" 
                      disabled={!editModes.general || !!thesis} 
                      value={specialization} 
                      onChange={e => setSpecialization(e.target.value)} 
                      placeholder="e.g. Image Processing, Machine Learning"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Address</label>
                    <input 
                      className="form-input" 
                      disabled={!editModes.general || !!thesis} 
                      value={address} 
                      onChange={e => setAddress(e.target.value)} 
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border-solid)', marginTop: '24px', paddingTop: '20px' }}>
                  <h4 style={{ color: 'var(--color-primary)', fontSize: '0.95rem', marginBottom: '16px' }}>Tentative Thesis Parameters</h4>
                  <div className="form-group">
                    <label className="form-label">Thesis Title / Broad Area of Interest</label>
                    <input 
                      className="form-input" 
                      disabled={!editModes.general || !!thesis} 
                      value={thesisTitle} 
                      onChange={e => setThesisTitle(e.target.value)} 
                      placeholder="Enter research proposal title"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Short Abstract / Focus Area</label>
                      <textarea 
                        className="form-input" 
                        disabled={!editModes.general || !!thesis} 
                        value={thesisSummary} 
                        onChange={e => setThesisSummary(e.target.value)} 
                        rows="3"
                        placeholder="Write a brief abstract of your proposed PhD research"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Keywords (Comma separated)</label>
                      <textarea 
                        className="form-input" 
                        disabled={!editModes.general || !!thesis} 
                        value={thesisKeywords} 
                        onChange={e => setThesisKeywords(e.target.value)} 
                        rows="3"
                        placeholder="e.g. deep learning, computer vision, cnn"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Academic Qualifications */}
            {subTab === 'academic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 10th */}
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ color: 'var(--text-primary)' }}>Class 10th / Secondary Details</h4>
                    {getDocBadge('class10', profile?.profile?.qualifications?.class10?.certificateUrl)}
                  </div>
                  {!editModes.class10 ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <div>Roll: <strong>{class10Roll}</strong> | Board: <strong>{class10Board}</strong> | School: <strong>{class10School}</strong> | Marks: <strong>{class10Marks}/{class10Total}</strong> ({class10Percentage}%)</div>
                      {!thesis && <button className="btn btn-sm btn-outline" type="button" onClick={() => setEditModes({...editModes, class10: true})}>Edit</button>}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                        <input className="form-input" placeholder="Roll No" value={class10Roll} onChange={e => setClass10Roll(e.target.value)} />
                        <input className="form-input" placeholder="Board" value={class10Board} onChange={e => setClass10Board(e.target.value)} />
                        <input className="form-input" placeholder="School" value={class10School} onChange={e => setClass10School(e.target.value)} />
                        <input className="form-input" placeholder="Marks" type="number" value={class10Marks} onChange={e => setClass10Marks(e.target.value)} />
                        <input className="form-input" placeholder="Total Marks" type="number" value={class10Total} onChange={e => setClass10Total(e.target.value)} />
                        <input className="form-input" placeholder="%" value={class10Percentage} onChange={e => setClass10Percentage(e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                        {getUploadButton('class10', profile?.profile?.qualifications?.class10?.certificateUrl)}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {profile?.profile?.qualifications?.class10?.rollNo && <button className="btn btn-sm btn-secondary" type="button" onClick={() => setEditModes({...editModes, class10: false})}>Cancel</button>}
                          <button className="btn btn-sm btn-primary" type="button" onClick={() => saveSection('class10')}>Save Class 10</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 12th */}
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ color: 'var(--text-primary)' }}>Class 12th / Higher Secondary Details</h4>
                    {getDocBadge('class12', profile?.profile?.qualifications?.class12?.certificateUrl)}
                  </div>
                  {!editModes.class12 ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <div>Roll: <strong>{class12Roll}</strong> | Board: <strong>{class12Board}</strong> | School: <strong>{class12School}</strong> | Marks: <strong>{class12Marks}/{class12Total}</strong> ({class12Percentage}%)</div>
                      {!thesis && <button className="btn btn-sm btn-outline" type="button" onClick={() => setEditModes({...editModes, class12: true})}>Edit</button>}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                        <input className="form-input" placeholder="Roll No" value={class12Roll} onChange={e => setClass12Roll(e.target.value)} />
                        <input className="form-input" placeholder="Board" value={class12Board} onChange={e => setClass12Board(e.target.value)} />
                        <input className="form-input" placeholder="School" value={class12School} onChange={e => setClass12School(e.target.value)} />
                        <input className="form-input" placeholder="Marks" type="number" value={class12Marks} onChange={e => setClass12Marks(e.target.value)} />
                        <input className="form-input" placeholder="Total Marks" type="number" value={class12Total} onChange={e => setClass12Total(e.target.value)} />
                        <input className="form-input" placeholder="%" value={class12Percentage} onChange={e => setClass12Percentage(e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                        {getUploadButton('class12', profile?.profile?.qualifications?.class12?.certificateUrl)}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {profile?.profile?.qualifications?.class12?.rollNo && <button className="btn btn-sm btn-secondary" type="button" onClick={() => setEditModes({...editModes, class12: false})}>Cancel</button>}
                          <button className="btn btn-sm btn-primary" type="button" onClick={() => saveSection('class12')}>Save Class 12</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Graduation */}
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ color: 'var(--text-primary)' }}>Graduation Details</h4>
                    {getDocBadge('graduation', profile?.profile?.qualifications?.graduation?.certificateUrl)}
                  </div>
                  {!editModes.graduation ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <div>Roll: <strong>{gradRoll}</strong> | Degree: <strong>{gradDegree}</strong> | College: <strong>{gradCollege} ({gradUniversity})</strong> | Marks: <strong>{gradMarks}/{gradTotal}</strong> ({gradPercentage}%)</div>
                      {!thesis && <button className="btn btn-sm btn-outline" type="button" onClick={() => setEditModes({...editModes, graduation: true})}>Edit</button>}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '10px' }}>
                        <input className="form-input" placeholder="Roll No" value={gradRoll} onChange={e => setGradRoll(e.target.value)} />
                        <input className="form-input" placeholder="Degree (e.g. B.Tech)" value={gradDegree} onChange={e => setGradDegree(e.target.value)} />
                        <input className="form-input" placeholder="College" value={gradCollege} onChange={e => setGradCollege(e.target.value)} />
                        <input className="form-input" placeholder="University" value={gradUniversity} onChange={e => setGradUniversity(e.target.value)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        <input className="form-input" placeholder="Marks / CGPA" type="number" step="0.01" value={gradMarks} onChange={e => setGradMarks(e.target.value)} />
                        <input className="form-input" placeholder="Total Max Marks" type="number" step="0.01" value={gradTotal} onChange={e => setGradTotal(e.target.value)} />
                        <input className="form-input" placeholder="Percentage / CGPA %" value={gradPercentage} onChange={e => setGradPercentage(e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                        {getUploadButton('graduation', profile?.profile?.qualifications?.graduation?.certificateUrl)}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {profile?.profile?.qualifications?.graduation?.rollNo && <button className="btn btn-sm btn-secondary" type="button" onClick={() => setEditModes({...editModes, graduation: false})}>Cancel</button>}
                          <button className="btn btn-sm btn-primary" type="button" onClick={() => saveSection('graduation')}>Save Graduation</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PG */}
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ color: 'var(--text-primary)' }}>Post Graduation Details</h4>
                    {getDocBadge('postGraduation', profile?.profile?.qualifications?.postGraduation?.certificateUrl)}
                  </div>
                  {!editModes.postGraduation ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <div>Roll: <strong>{pgRoll}</strong> | Degree: <strong>{pgDegree}</strong> | College: <strong>{pgCollege} ({pgUniversity})</strong> | Marks: <strong>{pgMarks}/{pgTotal}</strong> ({pgPercentage}%)</div>
                      {!thesis && <button className="btn btn-sm btn-outline" type="button" onClick={() => setEditModes({...editModes, postGraduation: true})}>Edit</button>}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '10px' }}>
                        <input className="form-input" placeholder="Roll No" value={pgRoll} onChange={e => setPgRoll(e.target.value)} />
                        <input className="form-input" placeholder="Degree (e.g. M.Tech)" value={pgDegree} onChange={e => setPgDegree(e.target.value)} />
                        <input className="form-input" placeholder="College" value={pgCollege} onChange={e => setPgCollege(e.target.value)} />
                        <input className="form-input" placeholder="University" value={pgUniversity} onChange={e => setPgUniversity(e.target.value)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        <input className="form-input" placeholder="Marks / CGPA" type="number" step="0.01" value={pgMarks} onChange={e => setPgMarks(e.target.value)} />
                        <input className="form-input" placeholder="Total Max Marks" type="number" step="0.01" value={pgTotal} onChange={e => setPgTotal(e.target.value)} />
                        <input className="form-input" placeholder="Percentage / CGPA %" value={pgPercentage} onChange={e => setPgPercentage(e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                        {getUploadButton('postGraduation', profile?.profile?.qualifications?.postGraduation?.certificateUrl)}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {profile?.profile?.qualifications?.postGraduation?.rollNo && <button className="btn btn-sm btn-secondary" type="button" onClick={() => setEditModes({...editModes, postGraduation: false})}>Cancel</button>}
                          <button className="btn btn-sm btn-primary" type="button" onClick={() => saveSection('postGraduation')}>Save Post Graduation</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* NET JRF */}
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ color: 'var(--text-primary)' }}>National Entrance Exams (NET / JRF / GATE)</h4>
                    {getDocBadge('netJrf', profile?.profile?.qualifications?.netJrf?.certificateUrl)}
                  </div>
                  {!editModes.netJrf ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <div>Qualified: <strong>{netJrfQualified}</strong> {netJrfQualified === 'YES' && `| Cert No: ${netJrfCertNumber} | Roll: ${netJrfRoll} | AIR: ${netJrfRank} | Date: ${netJrfIssueDate}`}</div>
                      {!thesis && <button className="btn btn-sm btn-outline" type="button" onClick={() => setEditModes({...editModes, netJrf: true})}>Edit</button>}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
                        <select className="form-input" value={netJrfQualified} onChange={e => setNetJrfQualified(e.target.value)}>
                          <option value="">Qualified NET JRF?</option>
                          <option value="YES">Yes</option>
                          <option value="NO">No</option>
                        </select>
                        {netJrfQualified === 'YES' && (
                          <>
                            <input className="form-input" placeholder="Award Letter Number" value={netJrfCertNumber} onChange={e => setNetJrfCertNumber(e.target.value)} />
                            <input className="form-input" placeholder="Roll No" value={netJrfRoll} onChange={e => setNetJrfRoll(e.target.value)} />
                          </>
                        )}
                      </div>
                      {netJrfQualified === 'YES' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
                          <input className="form-input" placeholder="All India Rank" value={netJrfRank} onChange={e => setNetJrfRank(e.target.value)} />
                          <input className="form-input" placeholder="Normalized Score" value={netJrfScore} onChange={e => setNetJrfScore(e.target.value)} />
                          <input className="form-input" type="date" value={netJrfIssueDate} onChange={e => setNetJrfIssueDate(e.target.value)} />
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                        {netJrfQualified === 'YES' && getUploadButton('netJrf', profile?.profile?.qualifications?.netJrf?.certificateUrl)}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {profile?.profile?.qualifications?.netJrf?.qualified !== undefined && <button className="btn btn-sm btn-secondary" type="button" onClick={() => setEditModes({...editModes, netJrf: false})}>Cancel</button>}
                          <button className="btn btn-sm btn-primary" type="button" onClick={() => saveSection('netJrf')}>Save NET JRF</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Advisor Preference */}
            {subTab === 'guide' && (
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Institutional Advisor & Guide Preference</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Please select your preferred supervisor from the registered faculty directory of {user?.department || 'your department'}.
                </p>

                <div className="form-group" style={{ maxWidth: '400px' }}>
                  <label className="form-label">Preferred Supervisor / Guide</label>
                  <select 
                    className="form-input"
                    value={preferredGuideId}
                    onChange={e => setPreferredGuideId(e.target.value)}
                    disabled={!!thesis}
                  >
                    <option value="">Select Preferred Guide...</option>
                    {faculties.map(fac => (
                      <option key={fac._id} value={fac._id}>
                        {fac.name} ({fac.subRole || 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>

                {preferredGuideId && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    padding: '16px',
                    borderRadius: '8px',
                    marginTop: '20px',
                    color: 'var(--status-present)',
                    fontSize: '0.88rem'
                  }}>
                    ✓ Selected Preference: <strong>{faculties.find(f => f._id === preferredGuideId)?.name}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Save Buttons & Dossier Submit */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--color-border-solid)' }}>
              {/* Individual tab save button (if editing and not submitted yet) */}
              {!thesis && !(subTab === 'general' && !editModes.general) && subTab !== 'academic' && (
                <button type="submit" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} disabled={loading}>
                  <Save size={16} /> Save Section Details
                </button>
              )}

              {/* Guide save button */}
              {!thesis && subTab === 'guide' && preferredGuideId && (
                <button type="button" className="btn btn-secondary" onClick={() => saveSection('general')} disabled={loading}>
                  <Save size={16} /> Save Guide Preference
                </button>
              )}

              {/* Dossier Submit Button */}
              {!thesis && (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  style={{ 
                    marginLeft: 'auto', 
                    background: '#059669', 
                    borderColor: '#059669',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
                  }}
                  onClick={handleProfileRegistrationSubmit}
                  disabled={registering}
                >
                  🚀 Submit PhD Profile for HOD Approval
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
