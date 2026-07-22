import React, { useState, useEffect, useContext, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import { motion } from 'framer-motion';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { 
  User, BookOpen, UserCheck, ShieldAlert, ShieldCheck, Shield,
  Upload, FileText, CheckCircle, Save, Camera, HelpCircle, RefreshCw, Lock,
  Lightbulb, Briefcase, Award, Users, Bookmark, Folder, Copyright, Settings, Edit, Trash2, X, Plus, ExternalLink, Eye, EyeOff
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
  const [headerHeight, setHeaderHeight] = useState(68);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const headerEl = document.querySelector('.app-header') || document.querySelector('.header');
      if (headerEl) {
        setHeaderHeight(headerEl.offsetHeight);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('scroll', updateHeaderHeight);
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('scroll', updateHeaderHeight);
    };
  }, []);

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

  // --- Start of New Ph.D. Profile Sections states & handlers ---
  const [newExpertise, setNewExpertise] = useState('');
  const [expForm, setExpForm] = useState({ designation: '', organization: '', startDate: '', endDate: '', isPresent: false, description: '' });
  const [editingExpIndex, setEditingExpIndex] = useState(-1);
  const [showExpForm, setShowExpForm] = useState(false);
  const [awardForm, setAwardForm] = useState({ awardName: '', awardingBody: '', year: '', description: '' });
  const [editingAwardIndex, setEditingAwardIndex] = useState(-1);
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [memberForm, setMemberForm] = useState({ membershipName: '', organization: '', membershipType: 'Life Member', year: '' });
  const [editingMemberIndex, setEditingMemberIndex] = useState(-1);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [committeeForm, setCommitteeForm] = useState({ committeeName: '', role: '', organization: '', duration: '' });
  const [editingCommitteeIndex, setEditingCommitteeIndex] = useState(-1);
  const [showCommitteeForm, setShowCommitteeForm] = useState(false);
  const [projectForm, setProjectForm] = useState({ projectTitle: '', fundingAgency: '', amount: '', duration: '', role: 'Principal Investigator', status: 'Ongoing' });
  const [editingProjectIndex, setEditingProjectIndex] = useState(-1);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    dob: true,
    gender: true,
    category: true,
    nationality: true,
    fatherName: true,
    motherName: true,
    phoneNumber: true,
    address: true,
    class10: true,
    class10Doc: true,
    class12: true,
    class12Doc: true,
    graduation: true,
    graduationDoc: true,
    postGraduation: true,
    postGraduationDoc: true,
    mphil: true,
    mphilDoc: true,
    netJrf: true,
    netJrfDoc: true,
    specialization: true,
    areaOfInterest: true,
    thesisTitle: true,
    thesisSummary: true,
    expertise: true,
    experience: true,
    awards: true,
    publications: true,
    projects: true,
    ipr: true,
    thesesSupervised: true,
    officeRoom: true,
    yearsOfService: true,
    additionalResponsibilities: true
  });

  const [undertakingGeneral, setUndertakingGeneral] = useState(false);
  const [undertakingAcademic, setUndertakingAcademic] = useState(false);
  const [undertakingExpertise, setUndertakingExpertise] = useState(false);
  const [undertakingExperience, setUndertakingExperience] = useState(false);
  const [undertakingAwards, setUndertakingAwards] = useState(false);
  const [undertakingProjects, setUndertakingProjects] = useState(false);
  const [undertakingPublications, setUndertakingPublications] = useState(false);
  const [undertakingIpr, setUndertakingIpr] = useState(false);
  const [isEditingPrivacy, setIsEditingPrivacy] = useState(false);
  const [undertakingPrivacy, setUndertakingPrivacy] = useState(false);

  const [verifiedPubs, setVerifiedPubs] = useState([]);
  const [verifiedIprs, setVerifiedIprs] = useState([]);
  const [loadingPubsAndIprs, setLoadingPubsAndIprs] = useState(false);

  useEffect(() => {
    if (user?.profile?.privacySettings) {
      setPrivacySettings(prev => ({
        ...prev,
        ...user.profile.privacySettings
      }));
    }
  }, [user]);

  useEffect(() => {
    if (isVerifiedPhD && thesisActive?._id) {
      const fetchVerifiedData = async () => {
        setLoadingPubsAndIprs(true);
        try {
          const res = await api.get(`/publications/thesis/${thesisActive._id}`);
          const ips = res.data.filter(p => 
            (p.type === 'IPR' || p.type === 'PATENT') && p.status === 'VERIFIED'
          );
          const pubs = res.data.filter(p => 
            (p.type === 'JOURNAL' || p.type === 'CONFERENCE') && p.status === 'VERIFIED'
          );
          setVerifiedIprs(ips);
          setVerifiedPubs(pubs);
        } catch (err) {
          console.error("Error fetching candidate verified publications and IPRs:", err);
        } finally {
          setLoadingPubsAndIprs(false);
        }
      };
      fetchVerifiedData();
    }
  }, [user, thesisActive, isVerifiedPhD]);

  const triggerProfileUpdate = async (updatedFields, successMessage) => {
    setLoading(true);
    try {
      await updateProfile(updatedFields);
      toast.success(successMessage || 'Profile details updated successfully');
      await fetchMe();
      if (typeof fetchProfile === 'function') {
        await fetchProfile();
      }
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const expertiseList = user?.profile?.expertise || [];
  const experienceList = user?.profile?.experience || [];
  const awardsList = user?.profile?.awards || [];
  const membershipsList = user?.profile?.professionalBodies || [];
  const committeesList = user?.profile?.committees || [];
  const projectsList = user?.profile?.projects || [];
  const publicationsList = user?.profile?.publications || [];
  const iprList = user?.profile?.ipr || [];

  const handleAddExpertise = async (e) => {
    e.preventDefault();
    if (!newExpertise.trim()) return;
    const updated = [...expertiseList, newExpertise.trim()];
    await triggerProfileUpdate({ expertise: updated }, 'Area of expertise added');
    setNewExpertise('');
  };

  const handleDeleteExpertise = async (tag) => {
    const updated = expertiseList.filter(t => t !== tag);
    await triggerProfileUpdate({ expertise: updated }, 'Area of expertise removed');
  };

  const clearAllExpertise = async () => {
    await triggerProfileUpdate({ expertise: [] }, 'All expertise tags cleared');
  };

  const saveExperience = async (e) => {
    e.preventDefault();
    let updated;
    if (editingExpIndex === -1) {
      updated = [...experienceList, expForm];
    } else {
      updated = [...experienceList];
      updated[editingExpIndex] = expForm;
    }
    await triggerProfileUpdate({ experience: updated }, 'Experience details saved');
    setShowExpForm(false);
    setEditingExpIndex(-1);
    setExpForm({ designation: '', organization: '', startDate: '', endDate: '', isPresent: false, description: '' });
  };

  const deleteExperience = async (index) => {
    const updated = experienceList.filter((_, i) => i !== index);
    await triggerProfileUpdate({ experience: updated }, 'Experience entry deleted');
  };

  const clearAllExperience = async () => {
    await triggerProfileUpdate({ experience: [] }, 'All work experience details cleared');
  };

  const saveAward = async (e) => {
    e.preventDefault();
    let updated;
    if (editingAwardIndex === -1) {
      updated = [...awardsList, awardForm];
    } else {
      updated = [...awardsList];
      updated[editingAwardIndex] = awardForm;
    }
    await triggerProfileUpdate({ awards: updated }, 'Award entry saved');
    setShowAwardForm(false);
    setEditingAwardIndex(-1);
    setAwardForm({ awardName: '', awardingBody: '', year: '', description: '' });
  };

  const deleteAward = async (index) => {
    const updated = awardsList.filter((_, i) => i !== index);
    await triggerProfileUpdate({ awards: updated }, 'Award entry deleted');
  };

  const clearAllAwards = async () => {
    await triggerProfileUpdate({ awards: [] }, 'All honours & awards cleared');
  };

  const saveMember = async (e) => {
    e.preventDefault();
    let updated;
    if (editingMemberIndex === -1) {
      updated = [...membershipsList, memberForm];
    } else {
      updated = [...membershipsList];
      updated[editingMemberIndex] = memberForm;
    }
    await triggerProfileUpdate({ professionalBodies: updated }, 'Membership record saved');
    setShowMemberForm(false);
    setEditingMemberIndex(-1);
    setMemberForm({ membershipName: '', organization: '', membershipType: 'Life Member', year: '' });
  };

  const deleteMember = async (index) => {
    const updated = membershipsList.filter((_, i) => i !== index);
    await triggerProfileUpdate({ professionalBodies: updated }, 'Membership record deleted');
  };

  const clearAllMemberships = async () => {
    await triggerProfileUpdate({ professionalBodies: [] }, 'All professional body memberships cleared');
  };

  const saveCommittee = async (e) => {
    e.preventDefault();
    let updated;
    if (editingCommitteeIndex === -1) {
      updated = [...committeesList, committeeForm];
    } else {
      updated = [...committeesList];
      updated[editingCommitteeIndex] = committeeForm;
    }
    await triggerProfileUpdate({ committees: updated }, 'Committee details saved');
    setShowCommitteeForm(false);
    setEditingCommitteeIndex(-1);
    setCommitteeForm({ committeeName: '', role: '', organization: '', duration: '' });
  };

  const deleteCommittee = async (index) => {
    const updated = committeesList.filter((_, i) => i !== index);
    await triggerProfileUpdate({ committees: updated }, 'Committee details deleted');
  };

  const clearAllCommittees = async () => {
    await triggerProfileUpdate({ committees: [] }, 'All committee seat records cleared');
  };

  const saveProject = async (e) => {
    e.preventDefault();
    let updated;
    if (editingProjectIndex === -1) {
      updated = [...projectsList, projectForm];
    } else {
      updated = [...projectsList];
      updated[editingProjectIndex] = projectForm;
    }
    await triggerProfileUpdate({ projects: updated }, 'Project details saved');
    setShowProjectForm(false);
    setEditingProjectIndex(-1);
    setProjectForm({ projectTitle: '', fundingAgency: '', amount: '', duration: '', role: 'Principal Investigator', status: 'Ongoing' });
  };

  const deleteProject = async (index) => {
    const updated = projectsList.filter((_, i) => i !== index);
    await triggerProfileUpdate({ projects: updated }, 'Project entry deleted');
  };

  const clearAllProjects = async () => {
    await triggerProfileUpdate({ projects: [] }, 'All research projects cleared');
  };

  const savePrivacy = async (e) => {
    if (e) e.preventDefault();
    await triggerProfileUpdate({ privacySettings }, 'Privacy configuration updated');
    setUndertakingPrivacy(false);
    setIsEditingPrivacy(false);
  };

  const handleCancelPrivacy = () => {
    if (user?.profile?.privacySettings) {
      setPrivacySettings({
        dob: true,
        gender: true,
        category: true,
        nationality: true,
        fatherName: true,
        motherName: true,
        phoneNumber: true,
        address: true,
        class10: true,
        class10Doc: true,
        class12: true,
        class12Doc: true,
        graduation: true,
        graduationDoc: true,
        postGraduation: true,
        postGraduationDoc: true,
        mphil: true,
        mphilDoc: true,
        netJrf: true,
        netJrfDoc: true,
        specialization: true,
        areaOfInterest: true,
        thesisTitle: true,
        thesisSummary: true,
        expertise: true,
        experience: true,
        awards: true,
        publications: true,
        projects: true,
        ipr: true,
        thesesSupervised: true,
        officeRoom: true,
        yearsOfService: true,
        additionalResponsibilities: true,
        ...user.profile.privacySettings
      });
    }
    setUndertakingPrivacy(false);
    setIsEditingPrivacy(false);
  };
  // --- End of New Ph.D. Profile Sections states & handlers ---

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
  const isSubmitted = !!thesisActive || !!profile?.profileCompleted || !!user?.profileCompleted;
  const isVerifiedPhD = thesisActive && thesisActive.enrollmentVerified === true;
  const isPersonalInfoSaved = isPhD ? !!profile?.profile?.dob : (!!profile?.profile?.phoneNumber && !!profile?.profile?.address);

  // Active section track & timeline navigation refs
  const [activeSection, setActiveSection] = useState('personal');
  const sectionRefs = {
    personal: useRef(null),
    education: useRef(null),
    supervisor: useRef(null),
    expertise: useRef(null),
    experience: useRef(null),
    awards: useRef(null),
    memberships: useRef(null),
    committees: useRef(null),
    projects: useRef(null),
    publications: useRef(null),
    ipr: useRef(null),
    settings: useRef(null)
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
    if (isVerifiedPhD) {
      milestoneItems.push(
        { key: 'expertise', label: 'Expertise', Icon: Lightbulb },
        { key: 'experience', label: 'Experience', Icon: Briefcase },
        { key: 'awards', label: 'Awards', Icon: Award },
        { key: 'memberships', label: 'Professional Bodies', Icon: Users },
        { key: 'committees', label: 'Committees', Icon: Bookmark },
        { key: 'projects', label: 'Projects', Icon: Folder },
        { key: 'publications', label: 'Publications/Conferences', Icon: BookOpen },
        { key: 'ipr', label: 'Intellectual Property Rights', Icon: Copyright },
        { key: 'settings', label: 'Privacy Settings', Icon: Settings }
      );
    }
  }

  const responsiveStyles = `
    .profile-tab-wrapper-container {
      padding: 24px !important;
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    .profile-layout-container {
      display: flex;
      gap: 28px;
      max-width: 1280px;
      margin: 0 auto;
      padding: 12px;
      position: relative;
      width: 100%;
      box-sizing: border-box;
    }

    .card, .clay-card, .glass-transparent {
      transition: border-color 0.25s ease, box-shadow 0.25s ease !important;
      border: 2px solid #e5e7eb !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    .responsive-two-col-grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 16px !important;
    }
    .responsive-two-col-grid > div {
      min-width: 0 !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
    }

    .responsive-three-col-grid {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 20px !important;
    }
    .responsive-three-col-grid > div {
      min-width: 0 !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
    }

    .responsive-four-col-grid {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 10px !important;
    }
    .responsive-four-col-grid > div, .responsive-four-col-grid > input {
      min-width: 0 !important;
    }

    .responsive-six-col-grid {
      display: grid !important;
      grid-template-columns: repeat(6, 1fr) !important;
      gap: 10px !important;
    }
    .responsive-six-col-grid > div, .responsive-six-col-grid > input {
      min-width: 0 !important;
    }

    .responsive-thesis-params-grid {
      display: grid !important;
      grid-template-columns: 1fr 2fr !important;
      gap: 20px !important;
    }

    .responsive-abstract-keywords-grid {
      display: grid !important;
      grid-template-columns: 2fr 1fr !important;
      gap: 20px !important;
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
      .profile-tab-wrapper-container {
        padding: 8px !important;
      }

      .timeline-sidebar-panel {
        display: none !important;
      }
      
      .profile-layout-container {
        flex-direction: column !important;
        gap: 16px !important;
        padding: 8px !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
      }

      .mobile-milestones-bar {
        display: flex !important;
        position: sticky !important;
        top: var(--header-height, 68px) !important;
        background: #ffffff !important;
        border-bottom: 1px solid #e5e7eb !important;
        padding: 0 16px !important;
        gap: 16px !important;
        overflow-x: auto !important;
        z-index: 100 !important;
        margin: -12px -12px 16px -12px !important;
        scroll-behavior: smooth !important;
        -webkit-overflow-scrolling: touch !important;
        width: calc(100% + 24px) !important;
        max-width: calc(100% + 24px) !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
      }

      .mobile-milestones-bar.is-stuck {
        position: fixed !important;
        top: var(--header-height, 68px) !important;
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
        border-top: none !important;
        box-shadow: 0 4px 10px rgba(0,0,0,0.06) !important;
      }
    }

    @media (max-width: 768px) {
      .responsive-two-col-grid {
        grid-template-columns: 1fr !important;
      }
      .responsive-two-col-grid > div {
        grid-column: span 1 !important;
      }

      .responsive-three-col-grid {
        grid-template-columns: 1fr !important;
        gap: 12px !important;
      }
      .responsive-three-col-grid > div {
        grid-column: span 1 !important;
      }

      .responsive-four-col-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 10px !important;
      }

      .responsive-six-col-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 10px !important;
      }

      .responsive-thesis-params-grid {
        grid-template-columns: 1fr !important;
        gap: 12px !important;
      }

      .responsive-abstract-keywords-grid {
        grid-template-columns: 1fr !important;
        gap: 12px !important;
      }
    }
  `;

  // Dynamic Scroll Sentinel
  useEffect(() => {
    const checkSticky = () => {
      if (milestonePlaceholderRef.current) {
        const rect = milestonePlaceholderRef.current.getBoundingClientRect();
        setIsStuck(rect.top <= headerHeight + 2);
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
  }, [headerHeight]);

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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div 
        className="profile-tab-wrapper-container" 
        style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '100%', 
          boxSizing: 'border-box',
          '--header-height': `${headerHeight}px`
        }}
      >
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
                <strong style={{ color: 'var(--color-text-primary)' }}>"{profile.profile.rejectionRemarks}"</strong>
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
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <h4 style={{ color: '#1e293b', fontSize: '0.95rem', fontWeight: 700, marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
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

                <div className="responsive-three-col-grid">
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

                <div className="responsive-three-col-grid" style={{ marginTop: '12px' }}>
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

                <div className="responsive-three-col-grid" style={{ marginTop: '12px' }}>
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

                <div className="responsive-three-col-grid" style={{ marginTop: '12px' }}>
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
                    <input className="form-input" disabled value={gender || 'N/A'} style={{ background: 'var(--color-bg)', color: '#64748B', cursor: 'not-allowed' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input className="form-input" disabled value={category || 'N/A'} style={{ background: 'var(--color-bg)', color: '#64748B', cursor: 'not-allowed' }} />
                  </div>
                </div>

                <div className="responsive-three-col-grid" style={{ marginTop: '12px' }}>
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

                <div className="responsive-thesis-params-grid" style={{ gridTemplateColumns: isPhD ? '1fr 2fr' : '1fr', marginTop: '12px' }}>
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
                    <div className="responsive-abstract-keywords-grid" style={{ marginTop: '12px' }}>
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
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {!editModes.general ? (
                        <button className="btn btn-primary" type="button" onClick={() => setEditModes({ ...editModes, general: true })}>
                          ✏️ Edit General Info
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="btn btn-secondary" type="button" onClick={() => handleCancel('general')}>Cancel</button>
                          <button 
                            className="btn btn-primary" 
                            type="button" 
                            onClick={() => saveSection('general')} 
                            disabled={loading || !undertakingGeneral}
                            style={{ opacity: undertakingGeneral ? 1 : 0.5, cursor: undertakingGeneral ? 'pointer' : 'not-allowed' }}
                          >
                            <Save size={16} /> {!isPersonalInfoSavedState ? 'Save Personal Info & Proceed to Academic Qualifications' : 'Save General Details'}
                          </button>
                        </div>
                      )}
                    </div>
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
                        <div className="responsive-six-col-grid">
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
                        <div className="responsive-six-col-grid">
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
                        <div className="responsive-four-col-grid" style={{ marginBottom: '10px' }}>
                          <input className="form-input" placeholder="Roll No" value={gradRoll} onChange={e => setGradRoll(e.target.value)} />
                          <input className="form-input" placeholder="Degree (e.g. B.Tech)" value={gradDegree} onChange={e => setGradDegree(e.target.value)} />
                          <input className="form-input" placeholder="College" value={gradCollege} onChange={e => setGradCollege(e.target.value)} />
                          <input className="form-input" placeholder="University" value={gradUniversity} onChange={e => setGradUniversity(e.target.value)} />
                        </div>
                        <div className="responsive-three-col-grid">
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
                        <div className="responsive-four-col-grid" style={{ marginBottom: '10px' }}>
                          <input className="form-input" placeholder="Roll No" value={pgRoll} onChange={e => setPgRoll(e.target.value)} />
                          <input className="form-input" placeholder="Degree (e.g. M.Tech)" value={pgDegree} onChange={e => setPgDegree(e.target.value)} />
                          <input className="form-input" placeholder="College" value={pgCollege} onChange={e => setPgCollege(e.target.value)} />
                          <input className="form-input" placeholder="University" value={pgUniversity} onChange={e => setPgUniversity(e.target.value)} />
                        </div>
                        <div className="responsive-three-col-grid">
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
                            <div className="responsive-two-col-grid" style={{ gap: '12px', marginBottom: '12px' }}>
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
                            <div className="responsive-four-col-grid" style={{ gap: '12px', marginBottom: '12px' }}>
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
                            <div className="responsive-four-col-grid" style={{ gap: '12px', alignItems: 'flex-end' }}>
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
                          <div className="responsive-three-col-grid" style={{ marginBottom: '10px' }}>
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
                            <div className="responsive-three-col-grid" style={{ marginBottom: '10px' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', width: '100%' }}>
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
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontWeight: '600' }}
                      >
                        ✏️ Edit Academic Qualifications
                      </button>
                    ) : (
                      <button
                        className="btn btn-success"
                        type="button"
                        onClick={handleProceedToGuide}
                        disabled={loading || !undertakingAcademic}
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
                          cursor: (loading || !undertakingAcademic) ? 'not-allowed' : 'pointer',
                          opacity: undertakingAcademic ? 1 : 0.5
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

          {isPhD && isVerifiedPhD && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
              {/* 4. AREA OF EXPERTISE */}
              <div ref={sectionRefs.expertise} className="card p-lg clay-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lightbulb size={20} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Area of Expertise</h3>
                  </div>
                  {expertiseList.length > 0 && (
                    <button type="button" onClick={clearAllExpertise} className="btn btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}>
                      <Trash2 size={14} /> Clear All
                    </button>
                  )}
                </div>

                <form onSubmit={handleAddExpertise} style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. DNA Profiling, Cyber Forensics, Cryptography" 
                    value={newExpertise}
                    onChange={e => setNewExpertise(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 16px' }}>
                    <Plus size={14} /> Add Tag
                  </button>
                </form>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {expertiseList.length === 0 ? (
                    <span style={{ fontSize: '0.82rem', color: '#64748B', fontStyle: 'italic' }}>No expertise tags logged yet.</span>
                  ) : (
                    expertiseList.map((tag, i) => (
                      <div 
                        key={i} 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          background: 'rgba(26,90,59,0.08)',
                          color: '#1A5A3B',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          border: '1px solid rgba(26,90,59,0.15)'
                        }}
                      >
                        {tag}
                        <button 
                          type="button" 
                          onClick={() => handleDeleteExpertise(tag)} 
                          style={{ background: 'none', border: 'none', color: '#1A5A3B', cursor: 'pointer', display: 'flex', padding: 0 }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 5. WORK EXPERIENCE */}
              <div ref={sectionRefs.experience} className="card p-lg clay-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase size={20} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Work Experience</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {experienceList.length > 0 && (
                      <button type="button" onClick={clearAllExperience} className="btn btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Trash2 size={14} /> Clear All
                      </button>
                    )}
                    {!showExpForm && (
                      <button type="button" onClick={() => { setShowExpForm(true); setEditingExpIndex(-1); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Plus size={14} /> Add Entry
                      </button>
                    )}
                  </div>
                </div>

                {showExpForm && (
                  <form onSubmit={saveExperience} style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>{editingExpIndex === -1 ? 'Add Experience' : 'Edit Experience'}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Designation / Role</label>
                        <input type="text" className="form-input" value={expForm.designation} onChange={e => setExpForm({ ...expForm, designation: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Organization / University</label>
                        <input type="text" className="form-input" value={expForm.organization} onChange={e => setExpForm({ ...expForm, organization: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Start Date</label>
                        <input type="date" className="form-input" value={expForm.startDate ? expForm.startDate.split('T')[0] : ''} onChange={e => setExpForm({ ...expForm, startDate: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">End Date</label>
                        <input type="date" className="form-input" value={expForm.endDate ? expForm.endDate.split('T')[0] : ''} onChange={e => setExpForm({ ...expForm, endDate: e.target.value })} disabled={expForm.isPresent} required={!expForm.isPresent} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.8rem' }}>
                          <input type="checkbox" checked={expForm.isPresent} onChange={e => setExpForm({ ...expForm, isPresent: e.target.checked, endDate: e.target.checked ? '' : expForm.endDate })} /> Currently working here
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description / Core Roles</label>
                      <textarea className="form-input" style={{ height: '60px', resize: 'vertical' }} value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowExpForm(false)} className="btn btn-outline">Cancel</button>
                      <button type="submit" disabled={loading} className="btn btn-primary">Save Entry</button>
                    </div>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {experienceList.length === 0 ? (
                    <span style={{ fontSize: '0.82rem', color: '#64748B', fontStyle: 'italic' }}>No employment history logged yet.</span>
                  ) : (
                    experienceList.map((exp, i) => (
                      <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{exp.designation}</strong>
                          <span style={{ fontSize: '0.82rem', color: '#1A5A3B', fontWeight: 600, display: 'block', margin: '2px 0' }}>{exp.organization}</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>
                            {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ''} – {exp.isPresent ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'N/A'}
                          </span>
                          {exp.description && <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '8px 0 0 0', lineHeight: 1.4 }}>{exp.description}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', height: 'fit-content' }}>
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingExpIndex(i);
                              setExpForm(exp);
                              setShowExpForm(true);
                            }} 
                            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => deleteExperience(i)} 
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 6. HONOURS & AWARDS */}
              <div ref={sectionRefs.awards} className="card p-lg clay-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={20} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Honours & Awards</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {awardsList.length > 0 && (
                      <button type="button" onClick={clearAllAwards} className="btn btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Trash2 size={14} /> Clear All
                      </button>
                    )}
                    {!showAwardForm && (
                      <button type="button" onClick={() => { setShowAwardForm(true); setEditingAwardIndex(-1); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Plus size={14} /> Add Entry
                      </button>
                    )}
                  </div>
                </div>

                {showAwardForm && (
                  <form onSubmit={saveAward} style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>{editingAwardIndex === -1 ? 'Add Award' : 'Edit Award'}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Award Name</label>
                        <input type="text" className="form-input" value={awardForm.awardName} onChange={e => setAwardForm({ ...awardForm, awardName: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Awarding Body / Institution</label>
                        <input type="text" className="form-input" value={awardForm.awardingBody} onChange={e => setAwardForm({ ...awardForm, awardingBody: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Year of Award</label>
                        <input type="text" className="form-input" value={awardForm.year} onChange={e => setAwardForm({ ...awardForm, year: e.target.value })} placeholder="e.g. 2021" required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description / Brief Notes</label>
                      <textarea className="form-input" style={{ height: '60px', resize: 'vertical' }} value={awardForm.description} onChange={e => setAwardForm({ ...awardForm, description: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowAwardForm(false)} className="btn btn-outline">Cancel</button>
                      <button type="submit" disabled={loading} className="btn btn-primary">Save Entry</button>
                    </div>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {awardsList.length === 0 ? (
                    <span style={{ fontSize: '0.82rem', color: '#64748B', fontStyle: 'italic' }}>No honours or awards logged yet.</span>
                  ) : (
                    awardsList.map((aw, i) => (
                      <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{aw.awardName}</strong>
                          <span style={{ fontSize: '0.82rem', color: '#1A5A3B', fontWeight: 600, display: 'block', margin: '2px 0' }}>{aw.awardingBody}</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>Year: {aw.year}</span>
                          {aw.description && <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '8px 0 0 0', lineHeight: 1.4 }}>{aw.description}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', height: 'fit-content' }}>
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingAwardIndex(i);
                              setAwardForm(aw);
                              setShowAwardForm(true);
                            }} 
                            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => deleteAward(i)} 
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 7. PROFESSIONAL BODIES */}
              <div ref={sectionRefs.memberships} className="card p-lg clay-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={20} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Professional Bodies</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {membershipsList.length > 0 && (
                      <button type="button" onClick={clearAllMemberships} className="btn btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Trash2 size={14} /> Clear All
                      </button>
                    )}
                    {!showMemberForm && (
                      <button type="button" onClick={() => { setShowMemberForm(true); setEditingMemberIndex(-1); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Plus size={14} /> Add Entry
                      </button>
                    )}
                  </div>
                </div>

                {showMemberForm && (
                  <form onSubmit={saveMember} style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>{editingMemberIndex === -1 ? 'Add Membership' : 'Edit Membership'}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Membership Title</label>
                        <input type="text" className="form-input" value={memberForm.membershipName} onChange={e => setMemberForm({ ...memberForm, membershipName: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Organization Name</label>
                        <input type="text" className="form-input" value={memberForm.organization} onChange={e => setMemberForm({ ...memberForm, organization: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Membership Type</label>
                        <select className="form-input" value={memberForm.membershipType} onChange={e => setMemberForm({ ...memberForm, membershipType: e.target.value })} required>
                          <option value="Life Member">Life Member</option>
                          <option value="Annual Member">Annual Member</option>
                          <option value="Fellow">Fellow</option>
                          <option value="Executive Board Member">Executive Board Member</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Year of Joining</label>
                        <input type="text" className="form-input" value={memberForm.year} onChange={e => setMemberForm({ ...memberForm, year: e.target.value })} placeholder="e.g. 2019" required />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowMemberForm(false)} className="btn btn-outline">Cancel</button>
                      <button type="submit" disabled={loading} className="btn btn-primary">Save Entry</button>
                    </div>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {membershipsList.length === 0 ? (
                    <span style={{ fontSize: '0.82rem', color: '#64748B', fontStyle: 'italic' }}>No professional memberships logged yet.</span>
                  ) : (
                    membershipsList.map((mb, i) => (
                      <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{mb.membershipName}</strong>
                          <span style={{ fontSize: '0.82rem', color: '#1A5A3B', fontWeight: 600, display: 'block', margin: '2px 0' }}>{mb.organization}</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'inline-flex', gap: '12px' }}>
                            <span>Joined: {mb.year}</span>
                            <span style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>{mb.membershipType}</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', height: 'fit-content' }}>
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingMemberIndex(i);
                              setMemberForm(mb);
                              setShowMemberForm(true);
                            }} 
                            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => deleteMember(i)} 
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 8. MEMBERSHIP IN COMMITTEE */}
              <div ref={sectionRefs.committees} className="card p-lg clay-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bookmark size={20} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Membership in Committee</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {committeesList.length > 0 && (
                      <button type="button" onClick={clearAllCommittees} className="btn btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Trash2 size={14} /> Clear All
                      </button>
                    )}
                    {!showCommitteeForm && (
                      <button type="button" onClick={() => { setShowCommitteeForm(true); setEditingCommitteeIndex(-1); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Plus size={14} /> Add Entry
                      </button>
                    )}
                  </div>
                </div>

                {showCommitteeForm && (
                  <form onSubmit={saveCommittee} style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>{editingCommitteeIndex === -1 ? 'Add Committee Seat' : 'Edit Committee Seat'}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Committee Name</label>
                        <input type="text" className="form-input" value={committeeForm.committeeName} onChange={e => setCommitteeForm({ ...committeeForm, committeeName: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Role in Committee</label>
                        <input type="text" className="form-input" value={committeeForm.role} onChange={e => setCommitteeForm({ ...committeeForm, role: e.target.value })} placeholder="e.g. Chairman, Board Member" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Organization Name</label>
                        <input type="text" className="form-input" value={committeeForm.organization} onChange={e => setCommitteeForm({ ...committeeForm, organization: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Duration / Dates</label>
                        <input type="text" className="form-input" value={committeeForm.duration} onChange={e => setCommitteeForm({ ...committeeForm, duration: e.target.value })} placeholder="e.g. 2021 – Present" required />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowCommitteeForm(false)} className="btn btn-outline">Cancel</button>
                      <button type="submit" disabled={loading} className="btn btn-primary">Save Entry</button>
                    </div>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {committeesList.length === 0 ? (
                    <span style={{ fontSize: '0.82rem', color: '#64748B', fontStyle: 'italic' }}>No committee seats logged yet.</span>
                  ) : (
                    committeesList.map((ct, i) => (
                      <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{ct.committeeName}</strong>
                          <span style={{ fontSize: '0.82rem', color: '#1A5A3B', fontWeight: 600, display: 'block', margin: '2px 0' }}>Role: {ct.role} ({ct.organization})</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>Duration: {ct.duration}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', height: 'fit-content' }}>
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingCommitteeIndex(i);
                              setCommitteeForm(ct);
                              setShowCommitteeForm(true);
                            }} 
                            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => deleteCommittee(i)} 
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 9. RESEARCH PROJECTS */}
              <div ref={sectionRefs.projects} className="card p-lg clay-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Folder size={20} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Research Projects</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {projectsList.length > 0 && (
                      <button type="button" onClick={clearAllProjects} className="btn btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Trash2 size={14} /> Clear All
                      </button>
                    )}
                    {!showProjectForm && (
                      <button type="button" onClick={() => { setShowProjectForm(true); setEditingProjectIndex(-1); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Plus size={14} /> Add Entry
                      </button>
                    )}
                  </div>
                </div>

                {showProjectForm && (
                  <form onSubmit={saveProject} style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>{editingProjectIndex === -1 ? 'Add Project' : 'Edit Project'}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Project Title</label>
                        <input type="text" className="form-input" value={projectForm.projectTitle} onChange={e => setProjectForm({ ...projectForm, projectTitle: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Funding Agency</label>
                        <input type="text" className="form-input" value={projectForm.fundingAgency} onChange={e => setProjectForm({ ...projectForm, fundingAgency: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Grant Amount (INR)</label>
                        <input type="text" className="form-input" value={projectForm.amount} onChange={e => setProjectForm({ ...projectForm, amount: e.target.value })} placeholder="e.g. 5,00,000" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Duration / Year</label>
                        <input type="text" className="form-input" value={projectForm.duration} onChange={e => setProjectForm({ ...projectForm, duration: e.target.value })} placeholder="e.g. 2022 – 2024" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Role</label>
                        <select className="form-input" value={projectForm.role} onChange={e => setProjectForm({ ...projectForm, role: e.target.value })} required>
                          <option value="Principal Investigator">Principal Investigator</option>
                          <option value="Co-Principal Investigator">Co-Principal Investigator</option>
                          <option value="Co-Investigator">Co-Investigator</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-input" value={projectForm.status} onChange={e => setProjectForm({ ...projectForm, status: e.target.value })} required>
                          <option value="Ongoing">Ongoing</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowProjectForm(false)} className="btn btn-outline">Cancel</button>
                      <button type="submit" disabled={loading} className="btn btn-primary">Save Entry</button>
                    </div>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {projectsList.length === 0 ? (
                    <span style={{ fontSize: '0.82rem', color: '#64748B', fontStyle: 'italic' }}>No research projects logged yet.</span>
                  ) : (
                    projectsList.map((pr, i) => (
                      <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{pr.projectTitle}</strong>
                          <span style={{ fontSize: '0.82rem', color: '#1A5A3B', fontWeight: 600, display: 'block', margin: '2px 0' }}>Agency: {pr.fundingAgency} | Grant: ₹{pr.amount}</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'inline-flex', gap: '12px', alignItems: 'center' }}>
                            <span>Duration: {pr.duration}</span>
                            <span style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>{pr.role}</span>
                            <span style={{ background: pr.status === 'Completed' ? '#D1FAE5' : '#FEF3C7', color: pr.status === 'Completed' ? '#065F46' : '#D97706', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>{pr.status}</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', height: 'fit-content' }}>
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingProjectIndex(i);
                              setProjectForm(pr);
                              setShowProjectForm(true);
                            }} 
                            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => deleteProject(i)} 
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 10. PUBLICATIONS */}
              <div ref={sectionRefs.publications} className="card p-lg clay-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={20} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Research Publications</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {loadingPubsAndIprs ? (
                    <span style={{ fontSize: '0.82rem', color: '#64748B', fontStyle: 'italic' }}>Loading verified publication entries...</span>
                  ) : verifiedPubs.length === 0 ? (
                    <span style={{ fontSize: '0.82rem', color: '#64748B', fontStyle: 'italic' }}>No publication found.</span>
                  ) : (
                    verifiedPubs.map((p, i) => (
                      <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{p.title}</strong>
                          <span style={{ fontSize: '0.82rem', color: '#1A5A3B', fontWeight: 600, display: 'block', margin: '2px 0' }}>{p.journalName} ({p.type})</span>
                          {p.type === 'JOURNAL' ? (
                            <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>
                              Indexing: {p.indexing || 'N/A'} | Vol: {p.volume || 'N/A'} | Issue: {p.issue || 'N/A'} | Pages: {p.pages || 'N/A'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>
                              Organized by: {p.volume || 'N/A'} | Location: {p.issn || 'N/A'}
                            </span>
                          )}
                          <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block', marginTop: '2px' }}>
                            Date of Publication: {p.publicationDate ? new Date(p.publicationDate).toLocaleDateString() : 'N/A'}
                          </span>
                          {p.paperLink && (
                            <a 
                              href={p.paperLink.startsWith('http') ? p.paperLink : `https://${p.paperLink}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ fontSize: '0.75rem', color: '#1A5A3B', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', textDecoration: 'none', fontWeight: 600 }}
                            >
                              <ExternalLink size={12} /> Paper Link / DOI
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 11. INTELLECTUAL PROPERTY RIGHTS */}
              <div ref={sectionRefs.ipr} className="card p-lg clay-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Copyright size={20} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Intellectual Property Rights (IPR)</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {loadingPubsAndIprs ? (
                    <span style={{ fontSize: '0.82rem', color: '#64748B', fontStyle: 'italic' }}>Loading verified IPR entries...</span>
                  ) : verifiedIprs.length === 0 ? (
                    <span style={{ fontSize: '0.82rem', color: '#64748B', fontStyle: 'italic' }}>No IPR found.</span>
                  ) : (
                    verifiedIprs.map((ip, i) => (
                      <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{ip.title}</strong>
                          <span style={{ fontSize: '0.82rem', color: '#1A5A3B', fontWeight: 600, display: 'block', margin: '2px 0' }}>{ip.iprType || (ip.type === 'PATENT' ? 'Patent' : 'IPR')} | Status: {ip.itemStatus} ({ip.journalName})</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>Inventors: {ip.volume} | Date: {ip.publicationDate ? new Date(ip.publicationDate).toLocaleDateString() : 'N/A'}</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>Reg/App Number: {ip.issn} | App/Grant ID: {ip.issue} | Region: {ip.pages}</span>
                          {ip.doiUrl && <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'block' }}>IPR Ref: {ip.doiUrl}</span>}
                          {ip.paperLink && (
                            <a 
                              href={ip.paperLink.startsWith('http') ? ip.paperLink : `https://${ip.paperLink}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ fontSize: '0.75rem', color: '#1A5A3B', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', textDecoration: 'none', fontWeight: 600 }}
                            >
                              <ExternalLink size={12} /> Registry Link
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 12. PRIVACY & SETTINGS */}
              <div ref={sectionRefs.settings} className="card p-lg clay-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                  <Settings size={20} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Profile Privacy Controls</h3>
                </div>

                <div style={{ background: 'rgba(26, 90, 59, 0.05)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary)', display: 'block', marginBottom: '8px' }}>
                    🛡️ Consolidated Privacy Settings
                  </strong>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    Configure public profile visibility preferences for all sections. Only the checked items will be displayed in the public profile section, and unchecked items will be strictly hidden.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Subsection 1: Personal Info */}
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'var(--color-bg)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
                      1. Personal & General Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.85rem' }}>
                      {[
                        { key: 'dob', label: 'Date of Birth' },
                        { key: 'gender', label: 'Gender' },
                        { key: 'category', label: 'Social Category' },
                        { key: 'nationality', label: 'Nationality' },
                        { key: 'fatherName', label: "Father's Name" },
                        { key: 'motherName', label: "Mother's Name" },
                        { key: 'phoneNumber', label: 'Phone Number' },
                        { key: 'address', label: 'Residential Address' },
                        { key: 'specialization', label: 'Area of Specialization' },
                        { key: 'areaOfInterest', label: 'Area of Research Interest' },
                        ...(isPhD ? [
                          { key: 'thesisTitle', label: 'Thesis Title' },
                          { key: 'thesisSummary', label: 'Thesis Summary' },
                          { key: 'thesisKeywords', label: 'Thesis Keywords' },
                          { key: 'admissionDate', label: 'Admission Date' },
                          { key: 'enrollmentNumber', label: 'Enrollment Number' },
                          { key: 'academicSession', label: 'Academic Session' }
                        ] : [])
                      ].map(item => (
                        <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'rgba(0,0,0,0.02)', cursor: isEditingPrivacy ? 'pointer' : 'not-allowed', color: 'var(--text-primary)' }}>
                          <input 
                            type="checkbox" 
                            disabled={!isEditingPrivacy}
                            checked={privacySettings[item.key] !== false} 
                            onChange={() => setPrivacySettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Subsection 2: Academic Qualifications */}
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'var(--color-bg)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
                      2. Academic Qualifications
                    </h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Qualification Level</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>Score/Details Visible</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>Certificate Visible</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: 'class10', label: 'Class 10th (Matriculation)' },
                          { key: 'class12', label: 'Class 12th (Senior Secondary)' },
                          { key: 'graduation', label: 'Undergraduate Degree' },
                          { key: 'postGraduation', label: 'Postgraduate Degree' },
                          ...(user?.profile?.qualifications?.mphil?.done === true ? [{ key: 'mphil', label: 'M.Phil. Degree' }] : []),
                          ...(netJrfQualified === 'YES' || user?.profile?.qualifications?.netJrf?.qualified === true ? [{ key: 'netJrf', label: 'UGC-NET / JRF Fellowship' }] : [])
                        ].map(item => (
                          <tr key={item.key} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{item.label}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                disabled={!isEditingPrivacy}
                                checked={privacySettings[item.key] !== false} 
                                onChange={() => setPrivacySettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))} 
                              />
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                disabled={!isEditingPrivacy}
                                checked={privacySettings[`${item.key}Doc`] !== false} 
                                onChange={() => setPrivacySettings(prev => ({ ...prev, [`${item.key}Doc`]: !prev[`${item.key}Doc`] }))} 
                              />
                            </td>
                          </tr>
                        ))}
                        {(user?.profile?.qualifications?.otherQuals || []).map((oq, idx) => (
                          <tr key={`other_${idx}`} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{oq.degree || `Other Qualification #${idx + 1}`}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                disabled={!isEditingPrivacy}
                                checked={privacySettings.otherQuals?.[idx]?.details !== false} 
                                onChange={() => {
                                  setPrivacySettings(prev => {
                                    const oqList = [...(prev.otherQuals || [])];
                                    while (oqList.length <= idx) oqList.push({ details: true, doc: true });
                                    oqList[idx] = { ...oqList[idx], details: !oqList[idx].details };
                                    return { ...prev, otherQuals: oqList };
                                  });
                                }} 
                              />
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                disabled={!isEditingPrivacy}
                                checked={privacySettings.otherQuals?.[idx]?.doc !== false} 
                                onChange={() => {
                                  setPrivacySettings(prev => {
                                    const oqList = [...(prev.otherQuals || [])];
                                    while (oqList.length <= idx) oqList.push({ details: true, doc: true });
                                    oqList[idx] = { ...oqList[idx], doc: !oqList[idx].doc };
                                    return { ...prev, otherQuals: oqList };
                                  });
                                }} 
                              />
                            </td>
                          </tr>
                        ))}
                        {(fellowships || []).map((f, idx) => (
                          <tr key={`fellow_${idx}`} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{f.name || `Fellowship #${idx + 1}`}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                disabled={!isEditingPrivacy}
                                checked={privacySettings.fellowships?.[idx]?.details !== false} 
                                onChange={() => {
                                  setPrivacySettings(prev => {
                                    const fList = [...(prev.fellowships || [])];
                                    while (fList.length <= idx) fList.push({ details: true, doc: true });
                                    fList[idx] = { ...fList[idx], details: !fList[idx].details };
                                    return { ...prev, fellowships: fList };
                                  });
                                }} 
                              />
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <input 
                                type="checkbox" 
                                disabled={!isEditingPrivacy}
                                checked={privacySettings.fellowships?.[idx]?.doc !== false} 
                                onChange={() => {
                                  setPrivacySettings(prev => {
                                    const fList = [...(prev.fellowships || [])];
                                    while (fList.length <= idx) fList.push({ details: true, doc: true });
                                    fList[idx] = { ...fList[idx], doc: !fList[idx].doc };
                                    return { ...prev, fellowships: fList };
                                  });
                                }} 
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Subsection 3: Experience */}
                  {(isPhD || user?.profile?.experience?.length > 0) && (
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'var(--color-bg)' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
                        3. Professional Experience
                      </h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'rgba(0,0,0,0.02)', cursor: isEditingPrivacy ? 'pointer' : 'not-allowed', color: 'var(--text-primary)' }}>
                        <input 
                          type="checkbox" 
                          disabled={!isEditingPrivacy}
                          checked={privacySettings.experience !== false} 
                          onChange={() => setPrivacySettings(prev => ({ ...prev, experience: !prev.experience }))}
                        />
                        <span>Show Professional Experience details & certificates</span>
                      </label>
                    </div>
                  )}

                  {/* Subsection 4: Expertise */}
                  {(isPhD || user?.profile?.expertise?.length > 0) && (
                    <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'var(--color-bg)' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
                        4. Area of Expertise
                      </h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '6px', background: 'rgba(0,0,0,0.02)', cursor: isEditingPrivacy ? 'pointer' : 'not-allowed', color: 'var(--text-primary)' }}>
                        <input 
                          type="checkbox" 
                          disabled={!isEditingPrivacy}
                          checked={privacySettings.expertise !== false} 
                          onChange={() => setPrivacySettings(prev => ({ ...prev, expertise: !prev.expertise }))}
                        />
                        <span>Show Areas of Expertise keywords</span>
                      </label>
                    </div>
                  )}

                  {/* Subsection 5: Other Profile Sections */}
                  <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: 'var(--color-bg)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
                      5. Portfolio Timeline & Memberships
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.85rem' }}>
                      {[
                        ...(isPhD ? [
                          { key: 'publications', label: 'Publications/Conferences', mandatory: true },
                          { key: 'projects', label: 'Research Projects' },
                          { key: 'ipr', label: 'IPR / Patents', mandatory: true }
                        ] : []),
                        { key: 'awards', label: 'Awards & Achievements' },
                        { key: 'professionalBodies', label: 'Professional Memberships' },
                        { key: 'committees', label: 'Committee Memberships' }
                      ].map(item => (
                        <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', border: `1px solid ${item.mandatory ? '#16a34a' : 'var(--color-border)'}`, borderRadius: '6px', background: item.mandatory ? 'rgba(22,163,74,0.06)' : 'rgba(0,0,0,0.02)', cursor: item.mandatory ? 'not-allowed' : (isEditingPrivacy ? 'pointer' : 'not-allowed'), color: 'var(--text-primary)' }}>
                          <input 
                            type="checkbox" 
                            disabled={item.mandatory || !isEditingPrivacy}
                            checked={true} 
                            readOnly={item.mandatory}
                            onChange={() => !item.mandatory && setPrivacySettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          />
                          <span>Show {item.label}{item.mandatory ? <span style={{ fontSize: '0.72rem', color: '#16a34a', marginLeft: '4px', fontWeight: 700 }}>(Mandatory)</span> : null}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '2px solid var(--color-border)' }}>
                  {/* Undertaking - always visible, highlighted in edit mode */}
                  <div style={{ 
                    padding: '14px 16px', 
                    borderRadius: '10px', 
                    border: isEditingPrivacy ? '2px solid #f59e0b' : '1px solid var(--color-border)',
                    background: isEditingPrivacy ? 'rgba(245, 158, 11, 0.07)' : 'rgba(0,0,0,0.02)',
                    marginBottom: '16px',
                    transition: 'all 0.2s ease'
                  }}>
                    {isEditingPrivacy && (
                      <p style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ⚠️ You must check the box below to enable the Save button:
                      </p>
                    )}
                    <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: isEditingPrivacy ? 'pointer' : 'default', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        disabled={!isEditingPrivacy}
                        checked={isEditingPrivacy ? undertakingPrivacy : true} 
                        onChange={(e) => setUndertakingPrivacy(e.target.checked)} 
                        style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#f59e0b', flexShrink: 0 }}
                      />
                      <span>I have carefully reviewed all my profile field-level privacy and visibility settings above. I understand that only the checked details and documents will be publicly visible on my repository profile. I confirm these are my intended privacy preferences.</span>
                    </label>
                  </div>

                  {isEditingPrivacy ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                      {!undertakingPrivacy && (
                        <span style={{ fontSize: '0.78rem', color: '#b45309', fontStyle: 'italic' }}>
                          ↑ Check the undertaking above to save
                        </span>
                      )}
                      <button 
                        type="button" 
                        onClick={handleCancelPrivacy} 
                        style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        onClick={savePrivacy}
                        disabled={loading || !undertakingPrivacy} 
                        style={{ background: (loading || !undertakingPrivacy) ? '#9CA3AF' : 'var(--color-primary)', color: 'white', border: 'none', padding: '8px 20px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px', cursor: (loading || !undertakingPrivacy) ? 'not-allowed' : 'pointer' }}
                      >
                        {loading ? 'Saving...' : '💾 Save Privacy Settings'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setIsEditingPrivacy(true)}
                        style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '8px 20px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        ✏️ Edit Privacy Settings
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  </div>
  );
};
export default ProfileTab;
