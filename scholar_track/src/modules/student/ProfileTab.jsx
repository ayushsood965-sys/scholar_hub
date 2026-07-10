import React, { useState, useEffect, useContext, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import { motion } from 'framer-motion';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { 
  User, BookOpen, UserCheck, ShieldAlert, ShieldCheck, 
  Upload, FileText, CheckCircle, Save, Camera, HelpCircle, RefreshCw, Lock
} from 'lucide-react';

const ProfileTab = ({ thesis, onRefreshThesis }) => {
  const { user, updateProfile, uploadAvatar, uploadProfileDocument, fetchMe } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingNonPhd, setIsEditingNonPhd] = useState(false);
  const [subTab, setSubTab] = useState('general'); // general | academic | guide
  const [guideUnlocked, setGuideUnlocked] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState('');
  const [selectedFileNames, setSelectedFileNames] = useState({});
  const [pendingFiles, setPendingFiles] = useState({});

  const api = useApi();
  const toast = useToast();

  const [degreeTypeId, setDegreeTypeId] = useState('');
  const [degreeNameId, setDegreeNameId] = useState('');
  const [isPhD, setIsPhD] = useState(false);

  // Masters lists for non-PhD
  const [degreeNames, setDegreeNames] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);

  // HPU ERP Admission No.
  const [erpAdmissionNo, setErpAdmissionNo] = useState('');

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
  const [degreeType, setDegreeType] = useState('');
  const [sessions, setSessions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [genders, setGenders] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [preferredGuideId, setPreferredGuideId] = useState('');

  // PhD Qualifications edit modes
  const [editModes, setEditModes] = useState({
    general: false,
    class10: false,
    class12: false,
    graduation: false,
    postGraduation: false,
    otherQuals: false,
    netJrf: false,
    other: false,
    guide: false
  });

  const isEditingAcademic = !!(
    editModes.class10 ||
    editModes.class12 ||
    editModes.graduation ||
    editModes.postGraduation ||
    editModes.otherQuals ||
    editModes.netJrf
  );

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
  const [otherQuals, setOtherQuals] = useState([]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      const u = res.data;
      setProfile(u);

      const isPhDVal = u.profile?.isPhD !== undefined ? u.profile.isPhD : false;
      setIsPhD(isPhDVal);

      // Initialize fields for everyone
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
      setDegreeType(u.profile?.degreeType || (isPhDVal ? 'Ph.D.' : ''));
      setDegreeTypeId(u.profile?.degreeTypeId?._id || u.profile?.degreeTypeId || '');
      setDegreeNameId(u.profile?.degreeNameId?._id || u.profile?.degreeNameId || '');
      setErpAdmissionNo(u.profile?.erpAdmissionNo || '');

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
      setOtherQuals(prev => {
        const dbQuals = q.otherQuals || [];
        if (!prev || prev.length === 0) return dbQuals;
        const merged = prev.map((localRow, idx) => {
          if (idx < dbQuals.length) {
            return {
              ...dbQuals[idx],
              ...localRow,
              certificateUrl: dbQuals[idx]?.certificateUrl || localRow.certificateUrl
            };
          }
          return localRow;
        });
        if (dbQuals.length > prev.length) {
          merged.push(...dbQuals.slice(prev.length));
        }
        return merged;
      });

      // Set edit modes
      const thesisActive = thesis && thesis.status !== 'REJECTED' ? thesis : null;
      setEditModes({
        general: !thesisActive && (!u.profile?.dob || (isPhDVal && !u.profile?.phdMode)),
        class10: !thesisActive && !q.class10?.rollNo,
        class12: !thesisActive && !q.class12?.rollNo,
        graduation: !thesisActive && !q.graduation?.rollNo,
        postGraduation: !thesisActive && !q.postGraduation?.rollNo,
        otherQuals: false,
        netJrf: !thesisActive && (q.netJrf?.qualified === true && !q.netJrf?.rollNo),
        other: false,
        guide: !thesisActive && !u.profile?.preferredGuideId
      });
      if (u.profile?.preferredGuideId || thesisActive) {
        setGuideUnlocked(true);
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
        const [nameRes, typeRes, sessRes, facRes, cgRes] = await Promise.all([
          api.get('/attendance/public/masters/degree-names').catch(() => ({ data: [] })),
          api.get('/attendance/public/masters/degree-types').catch(() => ({ data: [] })),
          api.get('/attendance/public/sessions').catch(() => ({ data: [] })),
          api.get('/auth/faculty').catch(() => ({ data: [] })),
          api.get('/attendance/public/masters/category-gender').catch(() => ({ data: [] }))
        ]);
        setDegreeNames(nameRes.data);
        setDegreeTypes(typeRes.data);
        setSessions(sessRes.data);
        setCategories(cgRes.data.filter(d => d.type === 'CATEGORY'));
        setGenders(cgRes.data.filter(d => d.type === 'GENDER'));

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

  useEffect(() => {
    if (isPhD && degreeTypes.length > 0 && !degreeTypeId) {
      const phdType = degreeTypes.find(t => t.code === 'PHD' || t.name?.toLowerCase()?.includes('phd'));
      if (phdType) {
        setDegreeTypeId(phdType._id);
      }
    }
  }, [isPhD, degreeTypes, degreeTypeId]);

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

  const handleDocUpload = (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFileNames(prev => ({ ...prev, [docType]: file.name }));
    setPendingFiles(prev => ({ ...prev, [docType]: file }));
  };

  const handleCancel = (sectionKey) => {
    setEditModes(prev => ({ ...prev, [sectionKey]: false }));
    setPendingFiles(prev => {
      const next = { ...prev };
      delete next[sectionKey];
      if (sectionKey === 'otherQuals') {
        Object.keys(next).forEach(k => {
          if (k.startsWith('otherQuals_')) delete next[k];
        });
      }
      return next;
    });
    setSelectedFileNames(prev => {
      const next = { ...prev };
      delete next[sectionKey];
      if (sectionKey === 'otherQuals') {
        Object.keys(next).forEach(k => {
          if (k.startsWith('otherQuals_')) delete next[k];
        });
      }
      return next;
    });
  };

  const handleRemoveRow = (sectionKey, index) => {
    const list = sectionKey === 'otherQuals' ? otherQuals : [];
    const setList = sectionKey === 'otherQuals' ? setOtherQuals : () => {};
    const prefix = sectionKey === 'otherQuals' ? 'otherQuals_' : 'fellowship_';

    const updatedList = [...list];
    updatedList.splice(index, 1);
    setList(updatedList);

    setPendingFiles(prev => {
      const next = {};
      Object.keys(prev).forEach(key => {
        if (key.startsWith(prefix)) {
          const idx = parseInt(key.split('_')[1], 10);
          if (idx < index) {
            next[key] = prev[key];
          } else if (idx > index) {
            next[`${prefix}${idx - 1}`] = prev[key];
          }
        } else {
          next[key] = prev[key];
        }
      });
      return next;
    });

    setSelectedFileNames(prev => {
      const next = {};
      Object.keys(prev).forEach(key => {
        if (key.startsWith(prefix)) {
          const idx = parseInt(key.split('_')[1], 10);
          if (idx < index) {
            next[key] = prev[key];
          } else if (idx > index) {
            next[`${prefix}${idx - 1}`] = prev[key];
          }
        } else {
          next[key] = prev[key];
        }
      });
      return next;
    });
  };

  // PhD Section Save
  const saveSection = async (sectionKey) => {
    setLoading(true);

    let tempQualifications = profile?.profile?.qualifications || {};

    // --- STEP 1: Validate Text Input Fields ---
    if (sectionKey === 'class10') {
      if (!class10Roll.trim() || !class10Board.trim() || !class10School.trim() || !class10Marks.trim() || !class10Total.trim() || !class10Percentage.trim()) {
        toast.error('Please fill in all Class 10 details.');
        setLoading(false);
        return;
      }
    } else if (sectionKey === 'class12') {
      if (!class12Roll.trim() || !class12Board.trim() || !class12School.trim() || !class12Marks.trim() || !class12Total.trim() || !class12Percentage.trim()) {
        toast.error('Please fill in all Class 12 details.');
        setLoading(false);
        return;
      }
    } else if (sectionKey === 'graduation') {
      if (!gradRoll.trim() || !gradDegree.trim() || !gradCollege.trim() || !gradUniversity.trim() || !gradMarks.trim() || !gradTotal.trim() || !gradPercentage.trim()) {
        toast.error('Please fill in all Graduation details.');
        setLoading(false);
        return;
      }
    } else if (sectionKey === 'postGraduation') {
      if (!pgRoll.trim() || !pgDegree.trim() || pgCollege.trim() === '' || pgUniversity.trim() === '' || pgMarks.trim() === '' || pgTotal.trim() === '' || pgPercentage.trim() === '') {
        toast.error('Please fill in all Post Graduation details.');
        setLoading(false);
        return;
      }
    } else if (sectionKey === 'netJrf') {
      if (!netJrfQualified) {
        toast.error('Please select whether you qualified for NET JRF.');
        setLoading(false);
        return;
      }
      if (netJrfQualified === 'YES') {
        if (!netJrfCertNumber.trim() || !netJrfRoll.trim() || !netJrfRank.trim() || !netJrfScore.trim() || !netJrfIssueDate.trim()) {
          toast.error('Please fill in all NET JRF details before saving.');
          setLoading(false);
          return;
        }
      }
    }

    // --- STEP 2: Validate Certificate Selection ---
    if (['class10', 'class12', 'graduation', 'postGraduation'].includes(sectionKey)) {
      const hasCert = tempQualifications[sectionKey]?.certificateUrl || pendingFiles[sectionKey];
      if (!hasCert) {
        toast.error(`Please select a certificate PDF to upload for ${sectionKey.replace(/([A-Z])/g, ' $1').toUpperCase()}`);
        setLoading(false);
        return;
      }
    } else if (sectionKey === 'netJrf' && netJrfQualified === 'YES') {
      const hasCert = tempQualifications.netJrf?.certificateUrl || pendingFiles.netJrf;
      if (!hasCert) {
        toast.error('Please select a certificate PDF to upload for NET JRF');
        setLoading(false);
        return;
      }
    }

    // --- STEP 3: Upload Pending Certificate ---
    if (['class10', 'class12', 'graduation', 'postGraduation', 'netJrf'].includes(sectionKey)) {
      if (pendingFiles[sectionKey]) {
        setUploadingDoc(sectionKey);
        const uploadRes = await uploadProfileDocument(pendingFiles[sectionKey], sectionKey);
        setUploadingDoc('');
        if (!uploadRes.success) {
          toast.error(`Certificate upload failed: ${uploadRes.message}`);
          setLoading(false);
          return;
        }
        tempQualifications = uploadRes.user?.profile?.qualifications || {};
        setPendingFiles(prev => {
          const next = { ...prev };
          delete next[sectionKey];
          return next;
        });
      }
    }

    // --- STEP 4: Format Payload & Send Update ---
    let sectionData = {};
    if (sectionKey === 'general') {
      if (!dob) { toast.error('Date of Birth is required.'); setLoading(false); return; }
      if (!fatherName || !fatherName.trim()) { toast.error("Father's Name is required."); setLoading(false); return; }
      if (!motherName || !motherName.trim()) { toast.error("Mother's Name is required."); setLoading(false); return; }
      if (!nationality || !nationality.trim()) { toast.error('Nationality is required.'); setLoading(false); return; }
      if (!phoneNumber || !phoneNumber.trim()) { toast.error('Phone Number is required.'); setLoading(false); return; }
      if (!address || !address.trim()) { toast.error('Residential Address is required.'); setLoading(false); return; }
      if (!academicSession) { toast.error('Academic Session is required.'); setLoading(false); return; }
      if (!degreeTypeId) { toast.error('Degree Type is required.'); setLoading(false); return; }
      if (!degreeNameId) { toast.error('Degree Name is required.'); setLoading(false); return; }

      const cleanedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
      const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
      if (!indianPhoneRegex.test(cleanedPhone)) {
        toast.error('Please enter a valid 10-digit Indian phone number.');
        setLoading(false);
        return;
      }

      if (isPhD) {
        if (!admissionDate) { toast.error('Date of Admission is required.'); setLoading(false); return; }
        if (!phdMode) { toast.error('Mode of Ph.D. is required.'); setLoading(false); return; }
        if (!specialization || !specialization.trim()) { toast.error('Area of Specialization is required.'); setLoading(false); return; }
        if (!areaOfInterest || !areaOfInterest.trim()) { toast.error('Area of Research Interest is required.'); setLoading(false); return; }
        if (!thesisTitle || !thesisTitle.trim()) { toast.error('Thesis Title is required.'); setLoading(false); return; }
        if (!thesisSummary || !thesisSummary.trim()) { toast.error('Thesis Summary is required.'); setLoading(false); return; }
        if (!thesisKeywords || !thesisKeywords.trim()) { toast.error('Thesis Keywords are required.'); setLoading(false); return; }
      }
      sectionData = {
        dob, gender, category, fatherName, motherName, nationality,
        admissionDate, enrollmentNumber, phdMode, specialization,
        phoneNumber, address, areaOfInterest, academicBackground,
        thesisTitle, thesisSummary, thesisKeywords, academicSession,
        degreeTypeId, degreeNameId, isPhD, erpAdmissionNo, preferredGuideId,
        degreeType: isPhD ? 'Ph.D.' : (degreeTypes.find(t => t._id === degreeTypeId)?.name || ''),
        degreeName: degreeNames.find(n => n._id === degreeNameId)?.name || '',
      };
    } else if (sectionKey === 'class10') {
      sectionData = {
        class10: {
          rollNo: class10Roll, board: class10Board, school: class10School,
          marksObtained: class10Marks, totalMarks: class10Total, percentage: class10Percentage,
          certificateUrl: tempQualifications?.class10?.certificateUrl
        }
      };
    } else if (sectionKey === 'class12') {
      sectionData = {
        class12: {
          rollNo: class12Roll, board: class12Board, school: class12School,
          marksObtained: class12Marks, totalMarks: class12Total, percentage: class12Percentage,
          certificateUrl: tempQualifications?.class12?.certificateUrl
        }
      };
    } else if (sectionKey === 'graduation') {
      sectionData = {
        graduation: {
          rollNo: gradRoll, degree: gradDegree, college: gradCollege, university: gradUniversity,
          marksObtained: gradMarks, totalMarks: gradTotal, percentage: gradPercentage,
          certificateUrl: tempQualifications?.graduation?.certificateUrl
        }
      };
    } else if (sectionKey === 'postGraduation') {
      sectionData = {
        postGraduation: {
          rollNo: pgRoll, degree: pgDegree, college: pgCollege, university: pgUniversity,
          marksObtained: pgMarks, totalMarks: pgTotal, percentage: pgPercentage,
          certificateUrl: tempQualifications?.postGraduation?.certificateUrl
        }
      };
    } else if (sectionKey === 'netJrf') {
      sectionData = {
        netJrf: {
          qualified: netJrfQualified === 'YES',
          certNumber: netJrfCertNumber, rollNo: netJrfRoll, rank: netJrfRank, score: netJrfScore,
          issueDate: netJrfIssueDate,
          certificateUrl: tempQualifications?.netJrf?.certificateUrl
        }
      };
    } else if (sectionKey === 'other') {
      sectionData = {
        other: {
          details: otherDetails,
          certificateUrl: tempQualifications?.other?.certificateUrl
        }
      };
    }

    try {
      let payload = {};
      if (sectionKey === 'general') {
        payload = { ...sectionData };
      } else {
        payload = {
          qualifications: {
            ...profile?.profile?.qualifications,
            ...sectionData
          }
        };
      }
      await updateProfile(payload);
      if (sectionKey === 'general') {
        setIsPersonalInfoSavedState(true);
        if (!isPersonalInfoSavedState) {
          toast.success('Personal details saved successfully! Proceeding to Academic Qualifications.');
          setTimeout(() => {
            scrollToSection('education', true);
          }, 100);
        } else {
          toast.success('Personal details updated successfully!');
        }
      } else {
        toast.success('Section saved successfully');
      }
      setEditModes(prev => ({ ...prev, [sectionKey]: false }));
      fetchProfile();
    } catch (err) {
      toast.error('Failed to save details');
    } finally {
      setLoading(false);
    }
  };

  const saveSectionRow = async (sectionKey, rowIndex) => {
    setLoading(true);

    let tempQualifications = profile?.profile?.qualifications || {};

    if (sectionKey === 'otherQuals') {
      const o = otherQuals[rowIndex];
      if (!o || !o.type || !o.rollNo || !o.board || !o.school || !o.marksObtained || !o.totalMarks || !o.percentage) {
        toast.error(`Please fill in all details for Qualification #${rowIndex + 1} before saving.`);
        setLoading(false);
        return;
      }
      if (o.type === 'Other' && !o.otherType) {
        toast.error(`Please specify the qualification type for Qualification #${rowIndex + 1}.`);
        setLoading(false);
        return;
      }
      const key = `otherQuals_${rowIndex}`;
      const hasCert = tempQualifications?.otherQuals?.[rowIndex]?.certificateUrl || o.certificateUrl || pendingFiles[key];
      if (!hasCert) {
        toast.error(`Please select a certificate PDF to upload for Qualification #${rowIndex + 1}`);
        setLoading(false);
        return;
      }

      // Upload pending certificate if exists
      let finalCertUrl = tempQualifications?.otherQuals?.[rowIndex]?.certificateUrl || o.certificateUrl || '';
      if (pendingFiles[key]) {
        setUploadingDoc(key);
        const uploadRes = await uploadProfileDocument(pendingFiles[key], key);
        setUploadingDoc('');
        if (!uploadRes.success) {
          toast.error(`Certificate upload failed for Qualification #${rowIndex + 1}: ${uploadRes.message}`);
          setLoading(false);
          return;
        }
        tempQualifications = uploadRes.user?.profile?.qualifications || {};
        finalCertUrl = tempQualifications?.otherQuals?.[rowIndex]?.certificateUrl || '';
        setPendingFiles(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }

      // Construct payload array with only valid rows to prevent saving incomplete ones
      const listToSave = [];
      otherQuals.forEach((item, idx) => {
        const isCurrent = idx === rowIndex;
        const cert = isCurrent ? finalCertUrl : (item.certificateUrl || '');
        
        const hasFields = item.type && item.rollNo && item.board && item.school && item.marksObtained && item.totalMarks && item.percentage;
        const hasSpecific = item.type !== 'Other' || item.otherType;
        
        if (isCurrent || (hasFields && hasSpecific && cert)) {
          listToSave.push({
            type: isCurrent ? o.type : item.type,
            otherType: isCurrent ? o.otherType : item.otherType,
            rollNo: isCurrent ? o.rollNo : item.rollNo,
            board: isCurrent ? o.board : item.board,
            school: isCurrent ? o.school : item.school,
            marksObtained: isCurrent ? o.marksObtained : item.marksObtained,
            totalMarks: isCurrent ? o.totalMarks : item.totalMarks,
            percentage: isCurrent ? o.percentage : item.percentage,
            certificateUrl: cert
          });
        }
      });

      const payload = {
        qualifications: {
          ...profile?.profile?.qualifications,
          otherQuals: listToSave
        }
      };

      try {
        await updateProfile(payload);
        toast.success(`Qualification #${rowIndex + 1} saved successfully!`);
        fetchProfile();
      } catch (err) {
        toast.error('Failed to save details');
      } finally {
        setLoading(false);
      }
    }
  };

  const saveSectionList = async (sectionKey) => {
    setLoading(true);
    let tempQualifications = profile?.profile?.qualifications || {};

    const list = sectionKey === 'otherQuals' ? otherQuals : [];
    const keyPrefix = sectionKey === 'otherQuals' ? 'otherQuals_' : '';

    // 1. Validation
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const key = `${keyPrefix}${i}`;
      
      if (sectionKey === 'otherQuals') {
        if (!item.type || !item.rollNo || !item.board || !item.school || !item.marksObtained || !item.totalMarks || !item.percentage) {
          toast.error(`Please fill in all details for Qualification #${i + 1} or remove the row before saving.`);
          setLoading(false);
          return;
        }
        if (item.type === 'Other' && !item.otherType) {
          toast.error(`Please specify the qualification type for Qualification #${i + 1}.`);
          setLoading(false);
          return;
        }
        const hasCert = tempQualifications?.otherQuals?.[i]?.certificateUrl || item.certificateUrl || pendingFiles[key];
        if (!hasCert) {
          toast.error(`Please select a certificate PDF to upload for Qualification #${i + 1}`);
          setLoading(false);
          return;
        }
      }
    }

    // 2. Upload pending files
    const uploadedUrls = {};
    for (let i = 0; i < list.length; i++) {
      const key = `${keyPrefix}${i}`;
      if (pendingFiles[key]) {
        setUploadingDoc(key);
        const uploadRes = await uploadProfileDocument(pendingFiles[key], key);
        setUploadingDoc('');
        if (!uploadRes.success) {
          toast.error(`Certificate upload failed for item #${i + 1}: ${uploadRes.message}`);
          setLoading(false);
          return;
        }
        tempQualifications = uploadRes.user?.profile?.qualifications || {};
        uploadedUrls[i] = tempQualifications?.[sectionKey]?.[i]?.certificateUrl || '';
        setPendingFiles(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    }

    // 3. Construct list to save
    const listToSave = [];
    list.forEach((item, i) => {
      const cert = uploadedUrls[i] || item.certificateUrl || '';
      if (sectionKey === 'otherQuals') {
        listToSave.push({
          type: item.type,
          otherType: item.otherType,
          rollNo: item.rollNo,
          board: item.board,
          school: item.school,
          marksObtained: item.marksObtained,
          totalMarks: item.totalMarks,
          percentage: item.percentage,
          certificateUrl: cert
        });
      }
    });

    const payload = {
      qualifications: {
        ...profile?.profile?.qualifications,
        [sectionKey]: listToSave
      }
    };

    try {
      await updateProfile(payload);
      toast.success(`${sectionKey === 'otherQuals' ? 'Other Qualifications' : 'Fellowships'} saved successfully!`);
      setEditModes(prev => ({ ...prev, [sectionKey]: false }));
      fetchProfile();
    } catch (err) {
      toast.error('Failed to save details');
    } finally {
      setLoading(false);
    }
  };

  const validateAcademicQualifications = () => {
    const q = profile?.profile?.qualifications;
    if (!q) return 'No academic qualifications record found. Please enter and save Class 10, Class 12, Graduation, and Post Graduation details.';

    if (!class10Roll || !class10Board || !class10School || !class10Marks || !class10Total || !class10Percentage || !q?.class10?.certificateUrl) {
      return 'Please complete and save Class 10 Details including certificate upload.';
    }
    if (!class12Roll || !class12Board || !class12School || !class12Marks || !class12Total || !class12Percentage || !q?.class12?.certificateUrl) {
      return 'Please complete and save Class 12 Details including certificate upload.';
    }
    if (!gradRoll || !gradDegree || !gradCollege || !gradUniversity || !gradMarks || !gradTotal || !gradPercentage || !q?.graduation?.certificateUrl) {
      return 'Please complete and save Graduation Details including certificate upload.';
    }
    if (!pgRoll || !pgDegree || !pgCollege || !pgUniversity || !pgMarks || !pgTotal || !pgPercentage || !q?.postGraduation?.certificateUrl) {
      return 'Please complete and save Post Graduation Details including certificate upload.';
    }
    if (netJrfQualified === 'YES') {
      if (!netJrfCertNumber || !netJrfRoll || !netJrfRank || !netJrfScore || !netJrfIssueDate || !q?.netJrf?.certificateUrl) {
        return 'Please complete and save NET JRF Details including certificate upload.';
      }
    }
    return null;
  };

  const handleProceedToGuide = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const errorMsg = validateAcademicQualifications();
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    setLoading(true);

    const payload = {
      qualifications: {
        ...profile?.profile?.qualifications,
        class10: {
          rollNo: class10Roll,
          board: class10Board,
          school: class10School,
          marksObtained: class10Marks,
          totalMarks: class10Total,
          percentage: class10Percentage,
          certificateUrl: profile?.profile?.qualifications?.class10?.certificateUrl
        },
        class12: {
          rollNo: class12Roll,
          board: class12Board,
          school: class12School,
          marksObtained: class12Marks,
          totalMarks: class12Total,
          percentage: class12Percentage,
          certificateUrl: profile?.profile?.qualifications?.class12?.certificateUrl
        },
        graduation: {
          rollNo: gradRoll,
          degree: gradDegree,
          college: gradCollege,
          university: gradUniversity,
          marksObtained: gradMarks,
          totalMarks: gradTotal,
          percentage: gradPercentage,
          certificateUrl: profile?.profile?.qualifications?.graduation?.certificateUrl
        },
        postGraduation: {
          rollNo: pgRoll,
          degree: pgDegree,
          college: pgCollege,
          university: pgUniversity,
          marksObtained: pgMarks,
          totalMarks: pgTotal,
          percentage: pgPercentage,
          certificateUrl: profile?.profile?.qualifications?.postGraduation?.certificateUrl
        },
        netJrf: {
          qualified: netJrfQualified === 'YES',
          certNumber: netJrfCertNumber,
          rollNo: netJrfRoll,
          rank: netJrfRank,
          score: netJrfScore,
          issueDate: netJrfIssueDate,
          certificateUrl: profile?.profile?.qualifications?.netJrf?.certificateUrl
        },
        otherQuals: otherQuals.map((o, i) => ({
          ...o,
          certificateUrl: profile?.profile?.qualifications?.otherQuals?.[i]?.certificateUrl || o.certificateUrl || ''
        }))
      }
    };

    try {
      await updateProfile(payload);
      toast.success('Academic qualifications saved successfully!');
      setEditModes(prev => ({
        ...prev,
        class10: false,
        class12: false,
        graduation: false,
        postGraduation: false,
        otherQuals: false,
        netJrf: false
      }));
      setGuideUnlocked(true);
      fetchProfile();
      if (isPhD) {
        setTimeout(() => {
          scrollToSection('supervisor', true);
        }, 100);
      }
    } catch (err) {
      toast.error('Failed to save academic qualifications');
    } finally {
      setLoading(false);
    }
  };

  const saveGuidePreference = async () => {
    if (!preferredGuideId) {
      toast.error('Please select your preferred supervisor/guide.');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({ preferredGuideId });
      toast.success('Guide preference saved. Submit your profile to HOD for verification now.');
      setEditModes(prev => ({ ...prev, guide: false }));
      fetchProfile();
    } catch (err) {
      toast.error('Failed to save guide preference');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileRegistrationSubmit = async () => {
    if (isPhD) {
      if (
        !dob || !gender || !category || !fatherName || !motherName || !nationality || 
        !admissionDate || !phdMode || !specialization || 
        !phoneNumber || !address || !areaOfInterest ||
        !thesisTitle || !thesisSummary || !thesisKeywords || !academicSession ||
        !degreeTypeId
      ) {
        toast.error('Please fill in all the general and Ph.D. details before submitting.');
        return;
      }

      // 2. Qualifications Validation
      const q = profile?.profile?.qualifications || {};
      if (
        !class10Roll || !q.class10?.certificateUrl ||
        !class12Roll || !q.class12?.certificateUrl
      ) {
        toast.error('Please fill in Class 10th and Class 12th details and upload their certificates (PDF) first.');
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
    } else {
      // Non-PhD student validation
      if (
        !dob || !gender || !category || !fatherName || !motherName || 
        !phoneNumber || !address || !academicSession ||
        !degreeTypeId
      ) {
        toast.error('Please fill in all general details before submitting.');
        return;
      }

      // Qualifications Validation
      const q = profile?.profile?.qualifications || {};
      if (
        !class10Roll || !q.class10?.certificateUrl ||
        !class12Roll || !q.class12?.certificateUrl
      ) {
        toast.error('Please fill in Class 10th and Class 12th details and upload their certificates (PDF) first.');
        return;
      }
    }

    const confirmSubmit = window.confirm(
      "⚠️ CONFIRM PROFILE SUBMISSION ⚠️\n\n" +
      "Once you submit this profile, all fields will be locked to read-only mode and you will not be able to modify any details during HOD verification.\n\n" +
      "Are you absolutely sure you want to submit your profile for HOD approval now?"
    );

    if (!confirmSubmit) return;

    try {
      setRegistering(true);
      if (isPhD) {
        // Create thesis dossier with status: REGISTRATION_PENDING
        await api.post('/thesis', {});
        toast.success('PhD profile registration submitted to HOD successfully!');
      } else {
        // Non-PhD: call updateProfile with profileCompleted: true
        await updateProfile({ profileCompleted: true });
        toast.success('Profile submitted to HOD for verification successfully!');
      }
      if (onRefreshThesis) await onRefreshThesis();
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting profile');
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
        href={`${API_BASE_URL}${certUrl}`} 
        target="_blank" 
        rel="noopener noreferrer" 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}
      >
        <FileText size={12} /> Certificate Uploaded
      </a>
    );
  };

  const getUploadButton = (docType, certUrl) => {
    if (isSubmitted) return null;
    const isUploading = uploadingDoc === docType;

    // Determine edit mode for this specific docType
    let isEditingThisDoc = false;
    if (docType === 'class10') isEditingThisDoc = editModes.class10;
    else if (docType === 'class12') isEditingThisDoc = editModes.class12;
    else if (docType === 'graduation') isEditingThisDoc = editModes.graduation;
    else if (docType === 'postGraduation') isEditingThisDoc = editModes.postGraduation;
    else if (docType.startsWith('otherQuals_')) isEditingThisDoc = editModes.otherQuals;
    else if (docType === 'netJrf') isEditingThisDoc = editModes.netJrf;

    const isDisabled = isUploading || !isEditingThisDoc;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px', 
          background: isDisabled ? '#9CA3AF' : 'var(--color-primary)', color: 'white', padding: '8px 12px', 
          borderRadius: '6px', cursor: isDisabled ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 600, width: 'fit-content'
        }}>
          <Upload size={14} /> {isUploading ? 'Uploading...' : certUrl ? 'Re-upload PDF' : 'Upload PDF'}
          {!isDisabled && <input type="file" accept=".pdf,image/*" onChange={e => handleDocUpload(e, docType)} style={{ display: 'none' }} />}
        </label>
        {selectedFileNames[docType] && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Selected: {selectedFileNames[docType]}</span>
        )}
      </div>
    );
  };


  const [isPersonalInfoSavedState, setIsPersonalInfoSavedState] = useState(false);
  useEffect(() => {
    if (profile?.profile) {
      const saved = isPhD ? !!profile.profile.dob : (!!profile.profile.phoneNumber && !!profile.profile.address);
      setIsPersonalInfoSavedState(saved);
    }
  }, [profile, isPhD]);

  const thesisActive = thesis && thesis.status !== 'REJECTED' ? thesis : null;
  const isSubmitted = !!thesisActive || !!profile?.profileCompleted;
  const isVerifiedPhD = thesisActive && thesisActive.enrollmentVerified === true;
  const isPersonalInfoSaved = isPhD ? !!profile?.profile?.dob : (!!profile?.profile?.phoneNumber && !!profile?.profile?.address);

  // Active section track & timeline navigation refs
  const [activeSection, setActiveSection] = useState('personal');
  const sectionRefs = {
    personal: useRef(null),
    education: useRef(null),
    supervisor: useRef(null)
  };
  const mobileBarRef = useRef(null);
  const milestonePlaceholderRef = useRef(null);
  const [isStuck, setIsStuck] = useState(false);
  const isAutoScrollingRef = useRef(false);
  const lastWheelTimeRef = useRef(0);

  const milestoneItems = [
    { key: 'personal', label: 'Personal Info', Icon: User },
    { key: 'education', label: 'Academic Qualifications', Icon: BookOpen }
  ];
  if (isPhD) {
    milestoneItems.push({ key: 'supervisor', label: 'Supervisor Preference', Icon: UserCheck });
  }

  const responsiveStyles = `
    .profile-layout-container {
      display: flex;
      gap: 28px;
      max-width: 1280px;
      margin: 0 auto;
      padding: 12px;
      position: relative;
    }

    .card, .clay-card, .glass-transparent {
      transition: border-color 0.25s ease, box-shadow 0.25s ease !important;
      border: 2px solid #e5e7eb !important;
    }

    .card.active-card, .clay-card.active-card, .glass-transparent.active-card {
      border-color: #1A5A3B !important;
      box-shadow: 0 6px 20px rgba(26, 90, 59, 0.12) !important;
    }
    
    .timeline-sidebar-panel {
      width: 260px;
      flex-shrink: 0;
      display: block;
    }

    .profile-details-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-width: 0;
    }

    .mobile-milestones-bar {
      display: none;
    }

    .mobile-milestone-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: none;
      border: none;
      color: #64748b;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
      flex-shrink: 0;
      text-decoration: none;
    }

    .mobile-milestone-link.active {
      color: #1A5A3B;
      position: relative;
    }

    .mobile-milestone-link.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: #1A5A3B;
      border-radius: 3px;
    }

    @media (max-width: 1024px) {
      .timeline-sidebar-panel {
        display: none;
      }
      
      .mobile-milestones-bar {
        display: flex;
        position: sticky;
        top: 68px;
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        padding: 0 16px;
        gap: 16px;
        overflow-x: auto;
        z-index: 100;
        margin: -12px -12px 16px -12px;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }

      .mobile-milestones-bar.is-stuck {
        position: fixed;
        left: 0;
        right: 0;
        width: 100%;
        margin: 0;
        box-shadow: 0 4px 10px rgba(0,0,0,0.06);
      }
    }
  `;

  // Dynamic Scroll Sentinel
  useEffect(() => {
    const checkSticky = () => {
      if (milestonePlaceholderRef.current) {
        const rect = milestonePlaceholderRef.current.getBoundingClientRect();
        // Sticky boundary in ScholarTrack is 68px from viewport top
        setIsStuck(rect.top <= 68);
      }
    };

    const dashboardArea = document.querySelector('.dashboard-area');
    if (dashboardArea) {
      dashboardArea.addEventListener('scroll', checkSticky);
    }
    window.addEventListener('scroll', checkSticky);
    window.addEventListener('resize', checkSticky);

    checkSticky();

    return () => {
      if (dashboardArea) {
        dashboardArea.removeEventListener('scroll', checkSticky);
      }
      window.removeEventListener('scroll', checkSticky);
      window.removeEventListener('resize', checkSticky);
    };
  }, []);

  // Auto-scroll mobile milestones navigation row to keep active tab centered
  useEffect(() => {
    if (activeSection && mobileBarRef.current) {
      const activeEl = mobileBarRef.current.querySelector(`.mobile-milestone-link[data-key="${activeSection}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeSection]);

  // Synchronize active-card highlighting border on activeSection change
  useEffect(() => {
    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (ref.current) {
        if (key === activeSection) {
          ref.current.classList.add('active-card');
        } else {
          ref.current.classList.remove('active-card');
        }
      }
    });
  }, [activeSection]);

  // Bind click event listeners to section elements to set activeSection on click
  useEffect(() => {
    const clickListeners = [];
    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (ref.current) {
        const handler = () => {
          if (key === 'education' && !isPersonalInfoSavedState) return;
          if (key === 'supervisor' && !guideUnlocked) return;
          setActiveSection(key);
        };
        ref.current.addEventListener('click', handler);
        clickListeners.push({ element: ref.current, handler });
      }
    });

    return () => {
      clickListeners.forEach(({ element, handler }) => {
        element.removeEventListener('click', handler);
      });
    };
  }, [isPersonalInfoSavedState, guideUnlocked]);

  const scrollToSection = (key, force = false) => {
    if (!force) {
      if (key === 'education' && !isPersonalInfoSavedState) {
        return;
      }
      if (key === 'supervisor' && !guideUnlocked) {
        return;
      }
    }
    setActiveSection(key);
    isAutoScrollingRef.current = true;
    sectionRefs[key].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 850);
  };

  const filteredDegreeTypes = isVerifiedPhD 
    ? degreeTypes.filter(t => t.code === 'PHD' || t.name?.toLowerCase()?.includes('phd'))
    : degreeTypes;

  const availableDegreeNames = degreeNames.filter(d => d.degreeTypeId?._id === degreeTypeId || d.degreeTypeId === degreeTypeId);

  const isGeneralInfoComplete = () => {
    const baseFields = !!(
      dob && gender && category && fatherName && motherName && nationality &&
      phoneNumber && address && academicSession && degreeTypeId && degreeNameId
    );
    if (!isPhD) {
      return baseFields;
    }
    return !!(
      baseFields &&
      admissionDate && phdMode && specialization &&
      areaOfInterest && thesisTitle && thesisSummary && thesisKeywords
    );
  };

  const isAcademicQualificationsComplete = () => {
    const q = profile?.profile?.qualifications;
    if (!q) return false;

    const class10Ok = !!(class10Roll && class10Board && class10School && class10Marks && class10Total && class10Percentage && q?.class10?.certificateUrl);
    const class12Ok = !!(class12Roll && class12Board && class12School && class12Marks && class12Total && class12Percentage && q?.class12?.certificateUrl);

    return class10Ok && class12Ok;
  };

  const hasAnySavedQualification = !!(
    profile?.profile?.qualifications?.class10?.rollNo ||
    profile?.profile?.qualifications?.class12?.rollNo ||
    profile?.profile?.qualifications?.graduation?.rollNo ||
    profile?.profile?.qualifications?.postGraduation?.rollNo ||
    (profile?.profile?.qualifications?.otherQuals && profile?.profile?.qualifications?.otherQuals.length > 0)
  );

  const class10Saved = !!(
    profile?.profile?.qualifications?.class10?.rollNo &&
    profile?.profile?.qualifications?.class10?.certificateUrl
  );
  const class12Saved = !!(
    profile?.profile?.qualifications?.class12?.rollNo &&
    profile?.profile?.qualifications?.class12?.certificateUrl
  );
  const canProceedToGuide = class10Saved && class12Saved;
  const canSubmit = isPersonalInfoSavedState && class10Saved && class12Saved && (!isPhD || !!preferredGuideId);

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div style={{ padding: '24px', position: 'relative' }}>
      <style>{responsiveStyles}</style>

      {/* Registration/Verification Status Banner */}
      <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {profile?.profile?.rejectionRemarks && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderLeft: '4px solid #EF4444',
            padding: '16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <ShieldAlert style={{ color: '#EF4444', flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#EF4444', display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>
                Status: Request rejected and awaiting resubmission by the candidate.
              </strong>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Your registration details were sent back by the HOD with the following remarks:
                <br />
                <strong style={{ color: '#0f172a' }}>"{profile.profile.rejectionRemarks}"</strong>
              </p>
            </div>
          </div>
        )}

        {isPhD ? (
          <>
            {!thesisActive && (
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
                borderLeft: '4px solid #F59E0B',
                padding: '16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <RefreshCw className="animate-spin" style={{ color: '#F59E0B', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#F59E0B', display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>
                    Registration Pending Approval
                  </strong>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    Your registration dossier has been submitted and is pending verification/approval by the Department HOD.
                  </p>
                </div>
              </div>
            )}

            {thesis && thesis.status === 'APPROVED' && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderLeft: '4px solid #10B981',
                padding: '16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <ShieldCheck style={{ color: '#10B981', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#10B981', display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>
                    Registration Approved
                  </strong>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    Congratulations! Your Ph.D. registration is officially approved. You can now log/track your milestones.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {!profile?.profileCompleted ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
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
                      Profile Completion Required
                    </strong>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                      Please complete your profile details and submit them for HOD verification.
                    </p>
                  </div>
                </div>
              </div>
            ) : profile?.isVerified ? (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderLeft: '4px solid #10B981',
                padding: '16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <ShieldCheck style={{ color: '#10B981', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#10B981', display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>
                    Profile Verified by HOD
                  </strong>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    Your profile has been verified and approved by the HOD. No further action is needed.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderLeft: '4px solid #F59E0B',
                padding: '16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <RefreshCw className="animate-spin" style={{ color: '#F59E0B', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#F59E0B', display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>
                    Profile Submitted — Pending HOD Verification
                  </strong>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    Your profile has been submitted and is awaiting verification by the Department HOD. You will be notified once it is approved.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Main Split Layout Container */}
      <div className="profile-layout-container">
        
        {/* Left Side: Milestones Sidebar Panel */}
        <div className="timeline-sidebar-panel">
          <div style={{
            position: 'sticky',
            top: '92px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <h4 style={{ color: '#1e293b', fontSize: '0.95rem', fontWeight: 700, marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              Profile Progress
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
              {/* Stepper Vertical Track */}
              <div style={{
                position: 'absolute',
                left: '15px',
                top: '12px',
                bottom: '12px',
                width: '2px',
                background: '#e2e8f0'
              }} />

              {milestoneItems.map((item) => {
                const isActive = activeSection === item.key;
                const isCompleted = 
                  (item.key === 'personal' && isGeneralInfoComplete() && isPersonalInfoSavedState) ||
                  (item.key === 'education' && isAcademicQualificationsComplete()) ||
                  (item.key === 'supervisor' && !!preferredGuideId);
                  
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => scrollToSection(item.key)}
                    style={{
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      padding: '4px 0',
                      outline: 'none',
                      zIndex: 2
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isActive ? '#1A5A3B' : isCompleted ? '#e6f4ea' : '#f8fafc',
                      border: `2px solid ${isActive ? '#1A5A3B' : isCompleted ? '#10b981' : '#cbd5e1'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActive ? '#ffffff' : isCompleted ? '#10b981' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      transition: 'all 0.25s'
                    }}>
                      <item.Icon size={14} />
                    </div>
                    <div>
                      <span style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#1A5A3B' : '#475569',
                        transition: 'all 0.25s'
                      }}>
                        {item.label}
                      </span>
                      <span style={{
                        display: 'block',
                        fontSize: '0.7rem',
                        color: isCompleted ? '#10b981' : '#94a3b8'
                      }}>
                        {isCompleted ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Scrollable Details Cards */}
        <div className="profile-details-column">
          
          <div ref={milestonePlaceholderRef} />

          {/* Sticky Mobile Sub-navbar */}
          <div className={`mobile-milestones-bar ${isStuck ? 'is-stuck' : ''}`} ref={mobileBarRef}>
            {milestoneItems.map((item) => {
              const isActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  data-key={item.key}
                  className={`mobile-milestone-link ${isActive ? 'active' : ''}`}
                  onClick={() => scrollToSection(item.key)}
                >
                  <item.Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={e => { e.preventDefault(); }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* SECTION 1: Personal Info */}
              <div ref={sectionRefs.personal} className="card p-lg clay-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>
                    <User style={{ color: 'var(--color-primary)' }} /> 1. Personal & Admission Info
                  </h3>
                  {!isSubmitted && !editModes.general && (
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
                      disabled={!editModes.general || isSubmitted} 
                      value={enrollmentNumber} 
                      onChange={e => setEnrollmentNumber(e.target.value)} 
                      placeholder="Enrollment Number (optional)"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">HPU ERP Admission No.</label>
                    <input 
                      className="form-input" 
                      disabled={!editModes.general || isSubmitted} 
                      value={erpAdmissionNo} 
                      onChange={e => setErpAdmissionNo(e.target.value)} 
                      placeholder="H248808080"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Academic Session</label>
                    {editModes.general && !isSubmitted && !academicSession ? (
                      <select className="form-input" value={academicSession} onChange={e => setAcademicSession(e.target.value)}>
                        <option value="">Select Session...</option>
                        {sessions.map(s => <option key={s._id} value={s.name || s.sessionName}>{s.name || s.sessionName}</option>)}
                      </select>
                    ) : (
                      <input className="form-input" disabled value={academicSession || 'N/A'} />
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Degree Type</label>
                    {editModes.general && !isSubmitted && !degreeTypeId ? (
                      <select 
                        className="form-input" 
                        value={degreeTypeId} 
                        onChange={e => {
                          const selectedId = e.target.value;
                          setDegreeTypeId(selectedId);
                          setDegreeNameId('');
                          const selectedType = degreeTypes.find(t => t._id === selectedId);
                          const isSelectedPhD = selectedType ? (selectedType.code === 'PHD' || selectedType.name?.toLowerCase()?.includes('phd')) : false;
                          setIsPhD(isSelectedPhD);
                        }}
                        disabled={isVerifiedPhD}
                      >
                        <option value="">Select Type...</option>
                        {filteredDegreeTypes.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                    ) : (
                      <input className="form-input" disabled value={degreeTypes.find(t => t._id === degreeTypeId)?.name || (isPhD ? 'Ph.D.' : 'N/A')} />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Degree Name</label>
                    {editModes.general && !isSubmitted && !degreeNameId ? (
                      <select 
                        className="form-input" 
                        value={degreeNameId} 
                        onChange={e => setDegreeNameId(e.target.value)}
                        disabled={isPhD && availableDegreeNames.length === 0}
                      >
                        {isPhD && availableDegreeNames.length === 0 ? (
                          <option value="">Ph.D. Research</option>
                        ) : (
                          <>
                            <option value="">Select Degree...</option>
                            {availableDegreeNames.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                          </>
                        )}
                      </select>
                    ) : (
                      <input className="form-input" disabled value={degreeNames.find(n => n._id === degreeNameId)?.name || (isPhD ? 'Ph.D. Research' : 'N/A')} />
                    )}
                  </div>
                  {isPhD && (
                    <div className="form-group">
                      <label className="form-label">Ph.D. Mode</label>
                      {editModes.general && !isSubmitted ? (
                        <select className="form-input" value={phdMode} onChange={e => setPhdMode(e.target.value)}>
                          <option value="">Select Mode...</option>
                          <option value="Full Time">Full Time</option>
                          <option value="Part Time">Part Time</option>
                        </select>
                      ) : (
                        <input className="form-input" disabled value={phdMode || 'N/A'} />
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      disabled={!editModes.general || isSubmitted} 
                      value={dob} 
                      onChange={e => setDob(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <input className="form-input" disabled value={gender || 'N/A'} style={{ background: '#F1F5F9', color: '#64748B', cursor: 'not-allowed' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input className="form-input" disabled value={category || 'N/A'} style={{ background: '#F1F5F9', color: '#64748B', cursor: 'not-allowed' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Father's Name</label>
                    <input 
                      className="form-input" 
                      disabled={!editModes.general || isSubmitted} 
                      value={fatherName} 
                      onChange={e => setFatherName(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mother's Name</label>
                    <input 
                      className="form-input" 
                      disabled={!editModes.general || isSubmitted} 
                      value={motherName} 
                      onChange={e => setMotherName(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                      className="form-input" 
                      disabled={!editModes.general || isSubmitted} 
                      value={phoneNumber} 
                      onChange={e => setPhoneNumber(e.target.value)} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isPhD ? '1fr 2fr' : '1fr', gap: '20px', marginTop: '12px' }}>
                  {isPhD && (
                    <div className="form-group">
                      <label className="form-label">Specialization</label>
                      <input 
                        className="form-input" 
                        disabled={!editModes.general || isSubmitted} 
                        value={specialization} 
                        onChange={e => setSpecialization(e.target.value)} 
                        placeholder="e.g. Image Processing, Machine Learning"
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Contact Address</label>
                    <textarea 
                      className="form-input" 
                      disabled={!editModes.general || isSubmitted} 
                      value={address} 
                      onChange={e => setAddress(e.target.value)} 
                      rows={3}
                      style={{ fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>
                </div>

                {isPhD && (
                  <div style={{ borderTop: '1px solid var(--color-border-solid)', marginTop: '24px', paddingTop: '20px' }}>
                    <h4 style={{ color: 'var(--color-primary)', fontSize: '0.95rem', marginBottom: '16px' }}>Tentative Thesis Parameters</h4>
                    <div className="form-group">
                      <label className="form-label">Thesis Title / Broad Area of Interest</label>
                      <input 
                        className="form-input" 
                        disabled={!editModes.general || isSubmitted} 
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
                          disabled={!editModes.general || isSubmitted} 
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
                          disabled={!editModes.general || isSubmitted} 
                          value={thesisKeywords} 
                          onChange={e => setThesisKeywords(e.target.value)} 
                          rows="3"
                          placeholder="e.g. deep learning, computer vision, cnn"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!isSubmitted && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
                    {!editModes.general ? (
                      <button className="btn btn-primary" type="button" onClick={() => setEditModes({ ...editModes, general: true })}>
                        ✏️ Edit General Info
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-secondary" type="button" onClick={() => handleCancel('general')}>Cancel</button>
                        <button className="btn btn-primary" type="button" onClick={() => saveSection('general')} disabled={loading}>
                          <Save size={16} /> {!isPersonalInfoSavedState ? 'Save Personal Info & Proceed to Academic Qualifications' : 'Save General Details'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 2: Academic Qualifications */}
              <div 
                ref={sectionRefs.education} 
                className="card p-lg clay-card" 
                style={{ 
                  position: 'relative',
                  opacity: (isPersonalInfoSavedState || isSubmitted) ? 1 : 0.5,
                  pointerEvents: (isPersonalInfoSavedState || isSubmitted) ? 'auto' : 'none'
                }}
              >
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '20px' }}>
                  <BookOpen style={{ color: 'var(--color-primary)' }} /> 2. Academic Qualifications
                </h3>

                {/* LOCK OVERLAY */}
                {!isPersonalInfoSavedState && !isSubmitted && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(4px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10, borderRadius: '12px', textAlign: 'center', padding: '20px'
                  }}>
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444',
                      width: '56px', height: '56px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
                    }}>
                      <Lock size={24} />
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem' }}>Academic Qualifications Locked</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>Please complete and save Personal Info first.</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Class 10th */}
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Class 10th / Secondary Details</h4>
                      {getDocBadge('class10', profile?.profile?.qualifications?.class10?.certificateUrl)}
                    </div>
                    {!editModes.class10 ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <div>Roll: <strong>{class10Roll || '—'}</strong> | Board: <strong>{class10Board || '—'}</strong> | School: <strong>{class10School || '—'}</strong> | Marks: <strong>{class10Marks || '0'}/{class10Total || '0'}</strong> ({class10Percentage || '0'}%)</div>
                        {!isSubmitted && (
                          <button 
                            className="btn btn-sm btn-outline" 
                            type="button" 
                            disabled={!isEditingAcademic} 
                            onClick={() => isEditingAcademic && setEditModes({...editModes, class10: true})}
                            style={{
                              background: !isEditingAcademic ? '#e5e7eb' : '',
                              color: !isEditingAcademic ? '#9ca3af' : '',
                              borderColor: !isEditingAcademic ? '#e5e7eb' : '',
                              cursor: !isEditingAcademic ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Edit
                          </button>
                        )}
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
                            {profile?.profile?.qualifications?.class10?.rollNo && <button className="btn btn-sm btn-secondary" type="button" onClick={() => handleCancel('class10')}>Cancel</button>}
                            <button 
                              className="btn btn-sm btn-primary" 
                              type="button" 
                              onClick={() => saveSection('class10')}
                              disabled={loading || !isEditingAcademic}
                              style={{
                                background: (loading || !isEditingAcademic) ? '#9CA3AF' : '',
                                borderColor: (loading || !isEditingAcademic) ? '#9CA3AF' : '',
                                cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer'
                              }}
                            >
                              Save Class 10
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Class 12th */}
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Class 12th / Higher Secondary Details</h4>
                      {getDocBadge('class12', profile?.profile?.qualifications?.class12?.certificateUrl)}
                    </div>
                    {!editModes.class12 ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <div>Roll: <strong>{class12Roll || '—'}</strong> | Board: <strong>{class12Board || '—'}</strong> | School: <strong>{class12School || '—'}</strong> | Marks: <strong>{class12Marks || '0'}/{class12Total || '0'}</strong> ({class12Percentage || '0'}%)</div>
                        {!isSubmitted && (
                          <button 
                            className="btn btn-sm btn-outline" 
                            type="button" 
                            disabled={!isEditingAcademic} 
                            onClick={() => isEditingAcademic && setEditModes({...editModes, class12: true})}
                            style={{
                              background: !isEditingAcademic ? '#e5e7eb' : '',
                              color: !isEditingAcademic ? '#9ca3af' : '',
                              borderColor: !isEditingAcademic ? '#e5e7eb' : '',
                              cursor: !isEditingAcademic ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Edit
                          </button>
                        )}
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
                            {profile?.profile?.qualifications?.class12?.rollNo && <button className="btn btn-sm btn-secondary" type="button" onClick={() => handleCancel('class12')}>Cancel</button>}
                            <button 
                              className="btn btn-sm btn-primary" 
                              type="button" 
                              onClick={() => saveSection('class12')}
                              disabled={loading || !isEditingAcademic}
                              style={{
                                background: (loading || !isEditingAcademic) ? '#9CA3AF' : '',
                                borderColor: (loading || !isEditingAcademic) ? '#9CA3AF' : '',
                                cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer'
                              }}
                            >
                              Save Class 12
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Graduation */}
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Graduation Details</h4>
                      {getDocBadge('graduation', profile?.profile?.qualifications?.graduation?.certificateUrl)}
                    </div>
                    {!editModes.graduation ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <div>Roll: <strong>{gradRoll || '—'}</strong> | Degree: <strong>{gradDegree || '—'}</strong> | College: <strong>{gradCollege || '—'} ({gradUniversity || '—'})</strong> | Marks: <strong>{gradMarks || '0'}/{gradTotal || '0'}</strong> ({gradPercentage || '0'}%)</div>
                        {!isSubmitted && (
                          <button 
                            className="btn btn-sm btn-outline" 
                            type="button" 
                            disabled={!isEditingAcademic} 
                            onClick={() => isEditingAcademic && setEditModes({...editModes, graduation: true})}
                            style={{
                              background: !isEditingAcademic ? '#e5e7eb' : '',
                              color: !isEditingAcademic ? '#9ca3af' : '',
                              borderColor: !isEditingAcademic ? '#e5e7eb' : '',
                              cursor: !isEditingAcademic ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Edit
                          </button>
                        )}
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
                            {profile?.profile?.qualifications?.graduation?.rollNo && <button className="btn btn-sm btn-secondary" type="button" onClick={() => handleCancel('graduation')}>Cancel</button>}
                            <button 
                              className="btn btn-sm btn-primary" 
                              type="button" 
                              onClick={() => saveSection('graduation')}
                              disabled={loading || !isEditingAcademic}
                              style={{
                                background: (loading || !isEditingAcademic) ? '#9CA3AF' : '',
                                borderColor: (loading || !isEditingAcademic) ? '#9CA3AF' : '',
                                cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer'
                              }}
                            >
                              Save Graduation
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PG */}
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Post Graduation Details</h4>
                      {getDocBadge('postGraduation', profile?.profile?.qualifications?.postGraduation?.certificateUrl)}
                    </div>
                    {!editModes.postGraduation ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <div>Roll: <strong>{pgRoll || '—'}</strong> | Degree: <strong>{pgDegree || '—'}</strong> | College: <strong>{pgCollege || '—'} ({pgUniversity || '—'})</strong> | Marks: <strong>{pgMarks || '0'}/{pgTotal || '0'}</strong> ({pgPercentage || '0'}%)</div>
                        {!isSubmitted && (
                          <button 
                            className="btn btn-sm btn-outline" 
                            type="button" 
                            disabled={!isEditingAcademic} 
                            onClick={() => isEditingAcademic && setEditModes({...editModes, postGraduation: true})}
                            style={{
                              background: !isEditingAcademic ? '#e5e7eb' : '',
                              color: !isEditingAcademic ? '#9ca3af' : '',
                              borderColor: !isEditingAcademic ? '#e5e7eb' : '',
                              cursor: !isEditingAcademic ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Edit
                          </button>
                        )}
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
                            {profile?.profile?.qualifications?.postGraduation?.rollNo && <button className="btn btn-sm btn-secondary" type="button" onClick={() => handleCancel('postGraduation')}>Cancel</button>}
                            <button 
                              className="btn btn-sm btn-primary" 
                              type="button" 
                              onClick={() => saveSection('postGraduation')}
                              disabled={loading || !isEditingAcademic}
                              style={{
                                background: (loading || !isEditingAcademic) ? '#9CA3AF' : '',
                                borderColor: (loading || !isEditingAcademic) ? '#9CA3AF' : '',
                                cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer'
                              }}
                            >
                              Save Post Graduation
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Other Qualifications */}
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Other Qualifications</h4>
                    </div>
                    {!editModes.otherQuals ? (
                      <div>
                        {otherQuals.length > 0 ? otherQuals.map((o, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Qualification Type</span>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{o.type === 'Other' ? o.otherType : o.type || '—'}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Roll Number</span>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{o.rollNo || '—'}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Board / University</span>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{o.board || '—'}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Institution / School</span>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{o.school || '—'}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Marks Obtained / Total</span>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{o.marksObtained || '0'} / {o.totalMarks || '0'}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Percentage (%)</span>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{o.percentage || '—'}</strong>
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                              {getDocBadge(`otherQuals_${i}`, profile?.profile?.qualifications?.otherQuals?.[i]?.certificateUrl)}
                            </div>
                          </div>
                        )) : (
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>No other qualifications added.</div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                          <button
                            className="btn btn-sm btn-outline"
                            type="button"
                            disabled={isSubmitted || !isEditingAcademic}
                            onClick={() => !isSubmitted && isEditingAcademic && setEditModes(prev => ({ ...prev, otherQuals: true }))}
                            style={{
                              background: (!isEditingAcademic) ? '#e5e7eb' : '',
                              color: (!isEditingAcademic) ? '#9ca3af' : '',
                              borderColor: (!isEditingAcademic) ? '#e5e7eb' : '',
                              cursor: (!isEditingAcademic) ? 'not-allowed' : 'pointer'
                            }}
                          >
                            ✏️ Edit / Add Other Qualifications
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {otherQuals.map((o, i) => (
                          <div key={i} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Qualification #{i + 1}</strong>
                              <button className="btn btn-sm btn-danger" type="button" onClick={() => handleRemoveRow('otherQuals', i)} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Remove</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                              <div className="form-group">
                                <label className="form-label">Qualification Type</label>
                                <select className="form-input" value={o.type || ''} onChange={e => { const updated = [...otherQuals]; updated[i].type = e.target.value; setOtherQuals(updated); }}>
                                  <option value="">Select Option...</option>
                                  <option value="Certificate">Certificate</option>
                                  <option value="Diploma">Diploma</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              {o.type === 'Other' && (
                                <div className="form-group">
                                  <label className="form-label">Please Specify Qualification</label>
                                  <input type="text" className="form-input" placeholder="Specify..." value={o.otherType || ''} onChange={e => { const updated = [...otherQuals]; updated[i].otherType = e.target.value; setOtherQuals(updated); }} />
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                              <div className="form-group">
                                <label className="form-label">Roll Number</label>
                                <input type="text" className="form-input" placeholder="Roll Number" value={o.rollNo || ''} onChange={e => { const updated = [...otherQuals]; updated[i].rollNo = e.target.value; setOtherQuals(updated); }} />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Board / University</label>
                                <input type="text" className="form-input" placeholder="e.g. CBSE / Delhi University" value={o.board || ''} onChange={e => { const updated = [...otherQuals]; updated[i].board = e.target.value; setOtherQuals(updated); }} />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Institution / School Name</label>
                                <input type="text" className="form-input" placeholder="Institution Name" value={o.school || ''} onChange={e => { const updated = [...otherQuals]; updated[i].school = e.target.value; setOtherQuals(updated); }} />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Marks Obtained</label>
                                <input type="number" step="0.01" className="form-input" placeholder="Marks" value={o.marksObtained || ''} onChange={e => { const updated = [...otherQuals]; updated[i].marksObtained = e.target.value; setOtherQuals(updated); }} />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                              <div className="form-group">
                                <label className="form-label">Total Max Marks</label>
                                <input type="number" step="0.01" className="form-input" placeholder="Total scale" value={o.totalMarks || ''} onChange={e => { const updated = [...otherQuals]; updated[i].totalMarks = e.target.value; setOtherQuals(updated); }} />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Percentage (%)</label>
                                <input type="text" className="form-input" placeholder="e.g. 85%" value={o.percentage || ''} onChange={e => { const updated = [...otherQuals]; updated[i].percentage = e.target.value; setOtherQuals(updated); }} />
                              </div>
                              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {getUploadButton(`otherQuals_${i}`, o.certificateUrl)}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={() => saveSectionRow('otherQuals', i)}
                                  disabled={loading || !isEditingAcademic}
                                  style={{
                                    height: '38px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: (loading || !isEditingAcademic) ? '#9CA3AF' : '',
                                    borderColor: (loading || !isEditingAcademic) ? '#9CA3AF' : '',
                                    cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  💾 Save
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button className="btn btn-outline" type="button" onClick={() => setOtherQuals([...otherQuals, { type: '', otherType: '', rollNo: '', board: '', school: '', marksObtained: '', totalMarks: '', percentage: '' }])} style={{ width: '100%', marginBottom: '16px', borderStyle: 'dashed' }}>+ Add More Qualification</button>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            type="button"
                            onClick={() => { setOtherQuals(profile?.profile?.qualifications?.otherQuals || []); handleCancel('otherQuals'); }}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            type="button"
                            onClick={() => saveSectionList('otherQuals')}
                            disabled={loading || !isEditingAcademic}
                            style={{
                              background: (loading || !isEditingAcademic) ? '#9CA3AF' : '',
                              borderColor: (loading || !isEditingAcademic) ? '#9CA3AF' : '',
                              cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer'
                            }}
                          >
                            💾 Save & Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* NET JRF */}
                  {isPhD && (
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>National Entrance Exams (NET / JRF / GATE)</h4>
                        {getDocBadge('netJrf', profile?.profile?.qualifications?.netJrf?.certificateUrl)}
                      </div>
                      {!editModes.netJrf ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <div>Qualified: <strong>{netJrfQualified || '—'}</strong> {netJrfQualified === 'YES' && `| Cert No: ${netJrfCertNumber || '—'} | Roll: ${netJrfRoll || '—'} | AIR: ${netJrfRank || '—'} | Date: ${netJrfIssueDate || '—'}`}</div>
                          {!isSubmitted && (
                            <button 
                              className="btn btn-sm btn-outline" 
                              type="button" 
                              disabled={!isEditingAcademic} 
                              onClick={() => isEditingAcademic && setEditModes({...editModes, netJrf: true})}
                              style={{
                                background: !isEditingAcademic ? '#e5e7eb' : '',
                                color: !isEditingAcademic ? '#9ca3af' : '',
                                borderColor: !isEditingAcademic ? '#e5e7eb' : '',
                                cursor: !isEditingAcademic ? 'not-allowed' : 'pointer'
                              }}
                            >
                              Edit
                            </button>
                          )}
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
                              {profile?.profile?.qualifications?.netJrf?.qualified !== undefined && <button className="btn btn-sm btn-secondary" type="button" onClick={() => handleCancel('netJrf')}>Cancel</button>}
                              <button 
                                className="btn btn-sm btn-primary" 
                                type="button" 
                                onClick={() => saveSection('netJrf')}
                                disabled={loading || !isEditingAcademic}
                                style={{
                                  background: (loading || !isEditingAcademic) ? '#9CA3AF' : '',
                                  borderColor: (loading || !isEditingAcademic) ? '#9CA3AF' : '',
                                  cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer'
                                }}
                              >
                                Save NET JRF
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {!isSubmitted && (
                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                    {!isEditingAcademic ? (
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={() => {
                          setEditModes(prev => ({
                            ...prev,
                            class10: true,
                            class12: true,
                            graduation: true,
                            postGraduation: true,
                            otherQuals: true,
                            netJrf: true
                          }));
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 24px',
                          fontWeight: '600'
                        }}
                      >
                        ✏️ Edit Academic Qualifications
                      </button>
                    ) : (
                      <button
                        className="btn btn-success"
                        type="button"
                        onClick={handleProceedToGuide}
                        disabled={loading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 24px',
                          background: '#10B981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '600',
                          cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isPhD ? '💾 Save Academic Qualifications & Move to Preferred Supervisor' : '💾 Save Academic Qualifications'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 3: Advisor Preference (PhD Only) */}
              {isPhD && (
                <div ref={sectionRefs.supervisor} className="card p-lg clay-card">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '16px' }}>
                    <UserCheck style={{ color: 'var(--color-primary)' }} /> 3. Institutional Advisor & Guide Preference
                  </h3>
                  {!canProceedToGuide && !isSubmitted ? (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px dashed #EF4444',
                      padding: '20px',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'center'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>🔒</span>
                      <strong style={{ color: '#EF4444', fontSize: '0.95rem' }}>Supervisor Selection Locked</strong>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, maxWidth: '400px' }}>
                        Please fill and save both Class 10 and Class 12 qualifications (including certificate uploads) to unlock supervisor selection.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                        Please select your preferred supervisor from the registered faculty directory of {user?.department || 'your department'}.
                      </p>

                      <div className="form-group" style={{ maxWidth: '400px' }}>
                        <label className="form-label">Preferred Supervisor / Guide</label>
                        <select 
                          className="form-input"
                          value={preferredGuideId}
                          onChange={e => setPreferredGuideId(e.target.value)}
                          disabled={isSubmitted || !editModes.guide}
                        >
                          <option value="">Select Preferred Guide...</option>
                          {faculties.map(fac => (
                            <option key={fac._id} value={fac._id}>
                              {fac.name} ({(fac.role === 'HOD' || fac.subRole === 'HOD') ? 'HOD' : (fac.subRole || 'Faculty')})
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

                      {!isSubmitted && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                          {!editModes.guide ? (
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => setEditModes(prev => ({ ...prev, guide: true }))}
                            >
                              ✏️ Edit Guide Preference
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={saveGuidePreference}
                              disabled={loading}
                            >
                              <Save size={16} /> Save Guide Preference
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Dossier Submit Footer */}
              {!isSubmitted && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  marginTop: '16px', 
                  padding: '24px', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                }}>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    style={{ 
                      background: canSubmit ? '#059669' : '#9CA3AF', 
                      borderColor: canSubmit ? '#059669' : '#9CA3AF',
                      boxShadow: canSubmit ? '0 4px 12px rgba(5, 150, 105, 0.2)' : 'none',
                      cursor: canSubmit ? 'pointer' : 'not-allowed',
                      padding: '12px 32px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: '8px'
                    }}
                    onClick={handleProfileRegistrationSubmit}
                    disabled={registering || !canSubmit}
                  >
                    {isPhD ? '🚀 Submit PhD Profile for HOD Approval' : '🚀 Submit Profile for HOD Verification'}
                  </button>
                </div>
              )}

            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
export default ProfileTab;
