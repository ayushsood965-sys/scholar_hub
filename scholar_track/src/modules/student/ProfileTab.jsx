import React, { useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../../config';
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
      setEditModes({
        general: !thesis && (!u.profile?.dob || (isPhDVal && !u.profile?.phdMode)),
        class10: !thesis && !q.class10?.rollNo,
        class12: !thesis && !q.class12?.rollNo,
        graduation: !thesis && !q.graduation?.rollNo,
        postGraduation: !thesis && !q.postGraduation?.rollNo,
        otherQuals: !thesis && !q.otherQuals,
        netJrf: !thesis && (q.netJrf?.qualified === undefined || (q.netJrf?.qualified === true && !q.netJrf?.rollNo)),
        other: !thesis && !q.other?.details
      });
      if (u.profile?.preferredGuideId || thesis) {
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
          api.get('/attendance/masters/degree-names').catch(() => ({ data: [] })),
          api.get('/attendance/masters/degree-types').catch(() => ({ data: [] })),
          api.get('/attendance/sessions').catch(() => ({ data: [] })),
          api.get('/auth/faculty').catch(() => ({ data: [] })),
          api.get('/attendance/masters/category-gender').catch(() => ({ data: [] }))
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
      const phdType = degreeTypes.find(t => t.code === 'PHD' || t.name?.toLowerCase().includes('phd'));
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
        thesisTitle, thesisSummary, thesisKeywords, academicSession,
        degreeTypeId, degreeNameId, isPhD, erpAdmissionNo,
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
      toast.success('Section saved successfully');
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
        !class12Roll || !q.class12?.certificateUrl ||
        !gradRoll || !q.graduation?.certificateUrl ||
        !q.postGraduation?.certificateUrl || !pgRoll
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
        !class12Roll || !q.class12?.certificateUrl ||
        !gradRoll || !q.graduation?.certificateUrl
      ) {
        toast.error('Please fill in 10th, 12th, and Graduation qualifications and upload their certificates (PDF) first.');
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

  const isSubmitted = !!thesis || !!profile?.profileCompleted;
  const isVerifiedPhD = thesis && thesis.enrollmentVerified === true;

  const filteredDegreeTypes = isVerifiedPhD 
    ? degreeTypes.filter(t => t.code === 'PHD' || t.name?.toLowerCase().includes('phd'))
    : degreeTypes;

  const availableDegreeNames = degreeNames.filter(d => d.degreeTypeId?._id === degreeTypeId || d.degreeTypeId === degreeTypeId);

  const handleProceedToGuide = () => {
    setGuideUnlocked(true);
    setSubTab('guide');
    toast.success('Qualifications verified! Proceeding to Advisor Preference.');
  };

  const isGeneralInfoComplete = () => {
    if (!isPhD) {
      return !!(academicSession && degreeTypeId && phoneNumber && address);
    }
    return !!(
      dob && gender && category && fatherName && motherName && nationality &&
      admissionDate && phdMode && specialization &&
      phoneNumber && address && areaOfInterest &&
      thesisTitle && thesisSummary && thesisKeywords && academicSession &&
      degreeTypeId
    );
  };

  const isAcademicQualificationsComplete = () => {
    const q = profile?.profile?.qualifications;
    if (!q) return false;

    const class10Ok = !!(class10Roll && class10Board && class10School && class10Marks && class10Total && class10Percentage && q?.class10?.certificateUrl);
    const class12Ok = !!(class12Roll && class12Board && class12School && class12Marks && class12Total && class12Percentage && q?.class12?.certificateUrl);
    const gradOk = !!(gradRoll && gradDegree && gradCollege && gradUniversity && gradMarks && gradTotal && gradPercentage && q?.graduation?.certificateUrl);
    const pgOk = !!(pgRoll && pgDegree && pgCollege && pgUniversity && pgMarks && pgTotal && pgPercentage && q?.postGraduation?.certificateUrl);

    if (!class10Ok || !class12Ok || !gradOk || !pgOk) return false;

    if (isPhD) {
      if (netJrfQualified === 'YES') {
        const netJrfOk = !!(netJrfCertNumber && netJrfRoll && netJrfRank && netJrfScore && netJrfIssueDate && q?.netJrf?.certificateUrl);
        if (!netJrfOk) return false;
      }
    }

    return true;
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

  return (
    <div className="glass-transparent p-xl">
      {/* Registration/Verification Status Banner */}
      <div style={{ marginBottom: '24px' }}>
        {isPhD ? (
          <>
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
          </>
        ) : (
          <>
            {!profile?.profileCompleted && (
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
                    Please complete the General and Academic details sections below and click <strong>Submit Profile for HOD Verification</strong>.
                  </p>
                </div>
              </div>
            )}

            {profile?.profileCompleted && !profile?.isVerified && (
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
                    Awaiting HOD Verification
                  </strong>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    Your profile has been submitted for HOD verification. Once verified, your portal will unlock.
                  </p>
                </div>
              </div>
            )}

            {profile?.profileCompleted && profile?.isVerified && (
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
                    Profile Verified by HOD
                  </strong>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    Your profile has been successfully verified by the HOD.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Header and edit/save control for Non-PhD OR PhD toggles */}
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Academic Profile</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your registration fields and credentials.</p>
        </div>
        
      </div>

      <div>
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
            {(thesis || profile?.profileCompleted || isGeneralInfoComplete()) ? (
              <button 
                className={`tab-btn ${subTab === 'academic' ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', color: subTab === 'academic' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: subTab === 'academic' ? 'bold' : '500', cursor: 'pointer' }}
                onClick={() => setSubTab('academic')}
              >
                2. Academic Qualifications
              </button>
            ) : (
              <button 
                disabled
                style={{ background: 'none', border: 'none', color: 'var(--text-muted, #9CA3AF)', fontWeight: '500', cursor: 'not-allowed', opacity: 0.6 }}
                title="Complete and save General Details to unlock"
              >
                🔒 2. Academic Qualifications
              </button>
            )}
            {isPhD && (
              (thesis || guideUnlocked || (isGeneralInfoComplete() && isAcademicQualificationsComplete())) ? (
                <button 
                  className={`tab-btn ${subTab === 'guide' ? 'active' : ''}`}
                  style={{ background: 'none', border: 'none', color: subTab === 'guide' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: subTab === 'guide' ? 'bold' : '500', cursor: 'pointer' }}
                  onClick={() => setSubTab('guide')}
                >
                  3. Advisor Preference
                </button>
              ) : (
                <button 
                  disabled
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted, #9CA3AF)', fontWeight: '500', cursor: 'not-allowed', opacity: 0.6 }}
                  title="Complete academic qualifications to unlock"
                >
                  🔒 3. Advisor Preference
                </button>
              )
            )}
          </div>

          <form onSubmit={e => { e.preventDefault(); saveSection(subTab); }}>
            {/* TAB 1: General Details */}
            {subTab === 'general' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>PhD Admission & Personal Fields</h3>
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
                          const isSelectedPhD = selectedType ? (selectedType.code === 'PHD' || selectedType.name?.toLowerCase().includes('phd')) : false;
                          setIsPhD(isSelectedPhD);
                          if (!isSelectedPhD && subTab === 'guide') {
                            setSubTab('general');
                          }
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
                    {editModes.general && !isSubmitted ? (
                      <select className="form-input" value={gender} onChange={e => setGender(e.target.value)}>
                        <option value="">Select...</option>
                        {genders.map(g => <option key={g._id} value={g.value}>{g.label}</option>)}
                      </select>
                    ) : (
                      <input className="form-input" disabled value={gender || 'N/A'} />
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    {editModes.general && !isSubmitted ? (
                      <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                        <option value="">Select Category...</option>
                        {categories.map(c => <option key={c._id} value={c.value}>{c.label}</option>)}
                      </select>
                    ) : (
                      <input className="form-input" disabled value={category || 'N/A'} />
                    )}
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
                      {!isSubmitted && <button className="btn btn-sm btn-outline" type="button" onClick={() => setEditModes({...editModes, class10: true})}>Edit</button>}
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
                      {!isSubmitted && <button className="btn btn-sm btn-outline" type="button" onClick={() => setEditModes({...editModes, class12: true})}>Edit</button>}
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
                      {!isSubmitted && <button className="btn btn-sm btn-outline" type="button" onClick={() => setEditModes({...editModes, graduation: true})}>Edit</button>}
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
                      {!isSubmitted && <button className="btn btn-sm btn-outline" type="button" onClick={() => setEditModes({...editModes, postGraduation: true})}>Edit</button>}
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
                          <button className="btn btn-sm btn-primary" type="button" onClick={() => saveSection('postGraduation')}>Save Post Graduation</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Other Qualifications Card */}
                <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', marginTop: '20px' }}>
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
                          disabled={isSubmitted}
                          onClick={() => !isSubmitted && setEditModes(prev => ({ ...prev, otherQuals: true }))}
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
                                disabled={loading}
                                style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '4px' }}
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
                          disabled={loading}
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
                      <h4 style={{ color: 'var(--text-primary)' }}>National Entrance Exams (NET / JRF / GATE)</h4>
                      {getDocBadge('netJrf', profile?.profile?.qualifications?.netJrf?.certificateUrl)}
                    </div>
                    {!editModes.netJrf ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <div>Qualified: <strong>{netJrfQualified}</strong> {netJrfQualified === 'YES' && `| Cert No: ${netJrfCertNumber} | Roll: ${netJrfRoll} | AIR: ${netJrfRank} | Date: ${netJrfIssueDate}`}</div>
                        {!isSubmitted && <button className="btn btn-sm btn-outline" type="button" onClick={() => setEditModes({...editModes, netJrf: true})}>Edit</button>}
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
                            <button className="btn btn-sm btn-primary" type="button" onClick={() => saveSection('netJrf')}>Save NET JRF</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isPhD && hasAnySavedQualification && (
              <div style={{ marginTop: '32px', padding: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleProceedToGuide}
                  disabled={!canProceedToGuide}
                  style={{
                    background: canProceedToGuide ? '#059669' : '#9CA3AF',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    cursor: canProceedToGuide ? 'pointer' : 'not-allowed',
                    boxShadow: canProceedToGuide ? '0 4px 6px -1px rgba(5, 150, 105, 0.2)' : 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {canProceedToGuide ? '🔓' : '🔒'} Save & Proceed to Supervisor Selection
                </button>
                {!canProceedToGuide && (
                  <span style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 500 }}>
                    * Please fill and save both Class 10 and Class 12 qualifications (including certificates) to unlock supervisor selection.
                  </span>
                )}
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
                    disabled={isSubmitted}
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
              </div>
            )}

            {/* Save Buttons & Dossier Submit */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--color-border-solid)' }}>
              {/* Individual tab save button (if editing and not submitted yet) */}
              {!isSubmitted && !(subTab === 'general' && !editModes.general) && subTab !== 'academic' && (
                <button type="submit" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} disabled={loading}>
                  <Save size={16} /> Save Section Details
                </button>
              )}

              {/* Guide save button */}
              {!isSubmitted && subTab === 'guide' && preferredGuideId && (
                <button type="button" className="btn btn-secondary" onClick={() => saveSection('general')} disabled={loading}>
                  <Save size={16} /> Save Guide Preference
                </button>
              )}

              {/* Dossier Submit Button */}
              {!isSubmitted && (
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
                  {isPhD ? '🚀 Submit PhD Profile for HOD Approval' : '🚀 Submit Profile for HOD Verification'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
