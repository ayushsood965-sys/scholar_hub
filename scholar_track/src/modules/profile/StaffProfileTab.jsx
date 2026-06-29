import React, { useContext, useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  User, Lightbulb, Briefcase, GraduationCap, Award, FileText, 
  Users, Bookmark, Folder, BookOpen, Settings, Plus, Edit, 
  Trash2, Upload, ExternalLink, ShieldCheck, ShieldAlert, 
  RefreshCw, Camera, Eye, Trash, Check, X, Lock, EyeOff, Copyright
} from 'lucide-react';

const StaffProfileTab = () => {
  const { user, updateProfile, uploadAvatar, uploadProfileDocument, fetchMe } = useContext(AuthContext);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [uploadingDocKey, setUploadingDocKey] = useState(null);

  // Active section track
  const [activeSection, setActiveSection] = useState('personal');

  // References for scroll navigation
  const sectionRefs = {
    personal: useRef(null),
    expertise: useRef(null),
    experience: useRef(null),
    education: useRef(null),
    awards: useRef(null),
    theses: useRef(null),
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

  // Button style definitions to ensure consistent rendering across portals
  const btnPrimaryStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 14px',
    background: '#1A5A3B',
    color: '#ffffff',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.8rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    gap: '6px'
  };

  const btnSecondaryStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 14px',
    background: 'transparent',
    color: '#475569',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    gap: '6px'
  };

  const btnDangerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 14px',
    background: 'transparent',
    color: '#EF4444',
    border: '1px solid #EF4444',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    gap: '6px'
  };

  // Responsive design styles injected directly in the component
  const responsiveStyles = `
    .profile-layout-container {
      display: flex;
      gap: 28px;
      max-width: 1280px;
      margin: 0 auto;
      padding: 12px;
      position: relative;
    }

    .card, .clay-card {
      transition: border-color 0.25s ease, box-shadow 0.25s ease !important;
      border: 2px solid #e5e7eb !important;
    }

    .card.active-card, .clay-card.active-card {
      border-color: #1A5A3B !important;
      box-shadow: 0 6px 20px rgba(26, 90, 59, 0.12) !important;
    }
    
    .timeline-sidebar-panel {
      width: 260px;
      position: sticky;
      top: 90px;
      height: fit-content;
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex-shrink: 0;
    }
    
    .profile-details-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 28px;
      min-width: 0;
    }

    .personal-info-header {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .avatar-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      width: 120px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--color-border-solid, #e5e7eb);
      padding-bottom: 12px;
    }

    .section-header-buttons {
      display: flex;
      gap: 8px;
    }

    .edu-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      border-bottom: 1px dashed var(--color-border-solid, #e5e7eb);
      padding-bottom: 8px;
    }

    .verification-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .mobile-milestones-bar {
      display: none;
      position: sticky;
      top: 64px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 12px;
      padding: 8px 12px;
      z-index: 99;
      overflow-x: auto;
      white-space: nowrap;
      gap: 8px;
      -webkit-overflow-scrolling: touch;
      margin: 8px 0 16px 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02);
      scrollbar-width: none;
    }
    
    .mobile-milestones-bar::-webkit-scrollbar {
      display: none;
    }
    
    .mobile-milestone-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.74rem;
      font-weight: 600;
      color: #475569;
      background: transparent;
      border: 1px solid transparent;
      transition: all 0.2s ease-in-out;
      cursor: pointer;
      flex-shrink: 0;
    }
    
    .mobile-milestone-link:hover {
      background: rgba(26, 90, 59, 0.05);
      color: #1A5A3B;
    }
    
    .mobile-milestone-link.active {
      color: #ffffff !important;
      background: #1A5A3B !important;
      border-color: #1A5A3B !important;
      box-shadow: 0 4px 10px rgba(26, 90, 59, 0.25);
    }

    @media (max-width: 992px) {
      .timeline-sidebar-panel {
        width: 200px;
      }
    }

    @media (max-width: 768px) {
      .profile-layout-container {
        flex-direction: column;
        gap: 16px;
        padding: 8px;
      }
      
      .timeline-sidebar-panel {
        display: none !important;
      }

      .mobile-milestones-bar {
        display: flex !important;
      }

      .mobile-milestones-bar.is-stuck {
        position: fixed !important;
        top: 68px !important;
        left: 0 !important;
        width: 100% !important;
        height: 50px !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
        border-top: none !important;
        margin: 0 !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
        background: #ffffff !important;
        z-index: 999 !important;
      }
      
      .clay-card, .card {
        padding: 16px !important;
      }

      .personal-info-header {
        flex-direction: column !important;
        align-items: center !important;
      }

      .avatar-wrapper {
        width: 100% !important;
      }

      .section-header {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 10px !important;
      }

      .section-header-buttons {
        width: 100% !important;
        justify-content: flex-start !important;
      }

      .edu-card-header {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 8px !important;
      }
      
      .verification-banner {
        flex-direction: column !important;
        align-items: flex-start !important;
      }
      
      .verification-banner button {
        width: 100% !important;
      }
    }
  `;

  // Profile data shortcuts
  const profile = user?.profile || {};
  const qualifications = profile.qualifications || {};
  const experienceList = profile.experience || [];
  const expertiseList = profile.expertise || [];
  const awardsList = profile.awards || [];
  const thesesList = profile.thesesSupervised || [];
  const membershipsList = profile.professionalBodies || [];
  const committeesList = profile.committees || [];
  const projectsList = profile.projects || [];
  const publicationsList = profile.publications || [];
  const iprList = profile.ipr || [];
  const privacySettings = profile.privacySettings || { profileVisibility: 'public', documentVisibility: 'public' };

  // Milestone list items definitions
  const milestoneItems = [
    { key: 'personal', label: 'Personal Info', Icon: User },
    { key: 'expertise', label: 'Expertise', Icon: Lightbulb },
    { key: 'experience', label: 'Experience', Icon: Briefcase },
    { key: 'education', label: 'Qualifications & Docs', Icon: GraduationCap },
    { key: 'awards', label: 'Awards', Icon: Award },
    { key: 'theses', label: 'Theses Guidance', Icon: FileText },
    { key: 'memberships', label: 'Professional Bodies', Icon: Users },
    { key: 'committees', label: 'Committees', Icon: Bookmark },
    { key: 'projects', label: 'Projects', Icon: Folder },
    { key: 'publications', label: 'Publications', Icon: BookOpen },
    { key: 'ipr', label: 'Intellectual Property Rights', Icon: Copyright },
    { key: 'settings', label: 'Privacy Settings', Icon: Settings }
  ];

  // Forms State
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    dob: '',
    gender: '',
    category: '',
    fatherName: '',
    motherName: '',
    nationality: '',
    address: '',
    designation: '',
    specialization: '',
    officeRoom: '',
    yearsOfService: '',
    additionalResponsibilities: '',
    phoneNumber: '',
    email: ''
  });

  const [newExpertise, setNewExpertise] = useState('');

  const [expForm, setExpForm] = useState({ designation: '', organization: '', startDate: '', endDate: '', isPresent: false, description: '' });
  const [editingExpIndex, setEditingExpIndex] = useState(-1);
  const [showExpForm, setShowExpForm] = useState(false);

  const [awardForm, setAwardForm] = useState({ awardName: '', awardingBody: '', year: '', description: '' });
  const [editingAwardIndex, setEditingAwardIndex] = useState(-1);
  const [showAwardForm, setShowAwardForm] = useState(false);

  const [thesisForm, setThesisForm] = useState({ scholarName: '', thesisTitle: '', yearOfAward: '', status: 'Ongoing' });
  const [editingThesisIndex, setEditingThesisIndex] = useState(-1);
  const [showThesisForm, setShowThesisForm] = useState(false);

  const [memberForm, setMemberForm] = useState({ membershipName: '', organization: '', membershipType: 'Life Member', year: '' });
  const [editingMemberIndex, setEditingMemberIndex] = useState(-1);
  const [showMemberForm, setShowMemberForm] = useState(false);

  const [committeeForm, setCommitteeForm] = useState({ committeeName: '', role: '', organization: '', duration: '' });
  const [editingCommitteeIndex, setEditingCommitteeIndex] = useState(-1);
  const [showCommitteeForm, setShowCommitteeForm] = useState(false);

  const [projectForm, setProjectForm] = useState({ projectTitle: '', fundingAgency: '', amount: '', duration: '', role: 'Principal Investigator', status: 'Ongoing' });
  const [editingProjectIndex, setEditingProjectIndex] = useState(-1);
  const [showProjectForm, setShowProjectForm] = useState(false);

  const [pubForm, setPubForm] = useState({ title: '', journalName: '', authors: '', year: '', doi: '' });
  const [editingPubIndex, setEditingPubIndex] = useState(-1);
  const [showPubForm, setShowPubForm] = useState(false);

  const [iprForm, setIprForm] = useState({
    iprType: '',
    itemStatus: '',
    title: '',
    journalName: '',
    volume: '',
    issn: '',
    issue: '',
    pages: '',
    publicationDate: '',
    doiUrl: '',
    paperLink: ''
  });
  const [editingIprIndex, setEditingIprIndex] = useState(-1);
  const [showIprForm, setShowIprForm] = useState(false);

  const [privacyForm, setPrivacyForm] = useState({
    profileVisibility: 'public',
    documentVisibility: 'public'
  });

  const [eduDrafts, setEduDrafts] = useState({});
  const [otherQualsDraft, setOtherQualsDraft] = useState([]);

  // Initial form values sync
  useEffect(() => {
    if (user?.profile) {
      setPersonalForm({
        dob: profile.dob || '',
        gender: profile.gender || '',
        category: profile.category || '',
        fatherName: profile.fatherName || '',
        motherName: profile.motherName || '',
        nationality: profile.nationality || 'Indian',
        address: profile.address || '',
        designation: profile.designation || '',
        specialization: profile.specialization || '',
        officeRoom: profile.officeRoom || '',
        yearsOfService: profile.yearsOfService || '',
        additionalResponsibilities: profile.additionalResponsibilities || '',
        phoneNumber: profile.phoneNumber || '',
        email: profile.email || ''
      });
      setPrivacyForm({
        profileVisibility: privacySettings.profileVisibility || 'public',
        documentVisibility: privacySettings.documentVisibility || 'public'
      });
      setEduDrafts(profile.qualifications || {});
      setOtherQualsDraft(profile.qualifications?.otherQuals || []);
    }
  }, [user]);

  // Dynamic Scroll Sentinel & Snap Scroll Hook
  useEffect(() => {
    let touchStartY = 0;

    const checkSticky = () => {
      if (milestonePlaceholderRef.current) {
        const rect = milestonePlaceholderRef.current.getBoundingClientRect();
        // Sticky boundary in ScholarTrack is 68px from viewport top
        setIsStuck(rect.top <= 68);
      }
    };

    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );
      if (isInput) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const keys = Object.keys(sectionRefs);
        const currentIndex = keys.indexOf(activeSection);
        
        let nextIndex = currentIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = Math.min(currentIndex + 1, keys.length - 1);
        } else if (e.key === 'ArrowUp') {
          nextIndex = Math.max(currentIndex - 1, 0);
        }
        
        if (nextIndex !== currentIndex) {
          const nextKey = keys[nextIndex];
          scrollToSection(nextKey);
        }
      }
    };

    const handleWheel = (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );
      if (isInput) return;

      const now = Date.now();
      if (now - lastWheelTimeRef.current < 900) {
        e.preventDefault();
        return;
      }

      const keys = Object.keys(sectionRefs);
      const currentIndex = keys.indexOf(activeSection);
      
      let nextIndex = currentIndex;
      if (e.deltaY > 0) {
        nextIndex = Math.min(currentIndex + 1, keys.length - 1);
      } else if (e.deltaY < 0) {
        nextIndex = Math.max(currentIndex - 1, 0);
      }
      
      if (nextIndex !== currentIndex) {
        e.preventDefault();
        lastWheelTimeRef.current = now;
        const nextKey = keys[nextIndex];
        scrollToSection(nextKey);
      }
    };

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );
      if (isInput) return;

      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartY - touchEndY;
      
      const now = Date.now();
      if (now - lastWheelTimeRef.current < 900) {
        return;
      }
      
      if (Math.abs(diffY) > 50) {
        const keys = Object.keys(sectionRefs);
        const currentIndex = keys.indexOf(activeSection);
        
        let nextIndex = currentIndex;
        if (diffY > 0) {
          nextIndex = Math.min(currentIndex + 1, keys.length - 1);
        } else {
          nextIndex = Math.max(currentIndex - 1, 0);
        }
        
        if (nextIndex !== currentIndex) {
          lastWheelTimeRef.current = now;
          const nextKey = keys[nextIndex];
          scrollToSection(nextKey);
        }
      }
    };

    checkSticky();

    window.addEventListener('scroll', checkSticky);
    window.addEventListener('resize', checkSticky);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkSticky);
      window.removeEventListener('resize', checkSticky);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeSection]);

  // Premium micro-interaction: Auto-scroll mobile milestones navigation row to keep active tab centered
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
  }, []);

  const scrollToSection = (key) => {
    setActiveSection(key);
    isAutoScrollingRef.current = true;
    sectionRefs[key].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 850);
  };

  // Standard API Update Trigger
  const triggerProfileUpdate = async (updatedFields, successMessage) => {
    try {
      setLoading(true);
      await updateProfile(updatedFields);
      toast.success(successMessage || 'Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Avatar Upload Handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setAvatarLoading(true);
      await uploadAvatar(file);
      toast.success('Profile picture updated successfully');
    } catch (err) {
      toast.error('Failed to upload profile picture');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Check verification status
  const handleCheckStatus = async () => {
    try {
      setCheckingStatus(true);
      await fetchMe();
      toast.success('Profile status synchronized');
    } catch (err) {
      toast.error('Failed to sync profile status');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Save Personal Info
  const savePersonalInfo = async (e) => {
    e.preventDefault();
    if (personalForm.phoneNumber) {
      const cleanedPhone = personalForm.phoneNumber.trim().replace(/[\s\-()]/g, '');
      const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
      if (!indianPhoneRegex.test(cleanedPhone)) {
        toast.error('Please enter a valid 10-digit Indian phone number.');
        return;
      }
    }
    await triggerProfileUpdate(personalForm, 'Personal information updated successfully');
    setIsEditingPersonal(false);
  };

  // Clear Personal Info
  const clearPersonalInfo = async () => {
    const emptyForm = {
      dob: '',
      gender: '',
      category: '',
      fatherName: '',
      motherName: '',
      nationality: '',
      address: '',
      designation: '',
      specialization: '',
      officeRoom: '',
      yearsOfService: '',
      additionalResponsibilities: '',
      phoneNumber: '',
      email: ''
    };
    setPersonalForm(emptyForm);
    await triggerProfileUpdate(emptyForm, 'Personal information details cleared');
    setIsEditingPersonal(false);
  };

  // Add Expertise tag
  const handleAddExpertise = async (e) => {
    e.preventDefault();
    if (!newExpertise.trim()) return;
    const updated = [...expertiseList, newExpertise.trim()];
    await triggerProfileUpdate({ expertise: updated }, 'Area of expertise added');
    setNewExpertise('');
  };

  // Delete Expertise tag
  const handleDeleteExpertise = async (tag) => {
    const updated = expertiseList.filter(t => t !== tag);
    await triggerProfileUpdate({ expertise: updated }, 'Area of expertise removed');
  };

  const clearAllExpertise = async () => {
    await triggerProfileUpdate({ expertise: [] }, 'All expertise tags cleared');
  };

  // Add/Edit Experience
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

  // Add/Edit Honours
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

  // Add/Edit Theses
  const saveThesis = async (e) => {
    e.preventDefault();
    let updated;
    if (editingThesisIndex === -1) {
      updated = [...thesesList, thesisForm];
    } else {
      updated = [...thesesList];
      updated[editingThesisIndex] = thesisForm;
    }
    await triggerProfileUpdate({ thesesSupervised: updated }, 'Thesis record saved');
    setShowThesisForm(false);
    setEditingThesisIndex(-1);
    setThesisForm({ scholarName: '', thesisTitle: '', yearOfAward: '', status: 'Ongoing' });
  };

  const deleteThesis = async (index) => {
    const updated = thesesList.filter((_, i) => i !== index);
    await triggerProfileUpdate({ thesesSupervised: updated }, 'Thesis record deleted');
  };

  const clearAllTheses = async () => {
    await triggerProfileUpdate({ thesesSupervised: [] }, 'All theses supervised details cleared');
  };

  // Add/Edit Professional Memberships
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

  // Add/Edit Committees
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

  // Add/Edit Research Projects
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

  // Add/Edit Publications
  const savePub = async (e) => {
    e.preventDefault();
    let updated;
    if (editingPubIndex === -1) {
      updated = [...publicationsList, pubForm];
    } else {
      updated = [...publicationsList];
      updated[editingPubIndex] = pubForm;
    }
    await triggerProfileUpdate({ publications: updated }, 'Publication details saved');
    setShowPubForm(false);
    setEditingPubIndex(-1);
    setPubForm({ title: '', journalName: '', authors: '', year: '', doi: '' });
  };

  const deletePub = async (index) => {
    const updated = publicationsList.filter((_, i) => i !== index);
    await triggerProfileUpdate({ publications: updated }, 'Publication details deleted');
  };

  const clearAllPublications = async () => {
    await triggerProfileUpdate({ publications: [] }, 'All research publications cleared');
  };

  // Add/Edit Intellectual Property Rights (IPR)
  const saveIpr = async (e) => {
    e.preventDefault();
    let updated;
    if (editingIprIndex === -1) {
      updated = [...iprList, iprForm];
    } else {
      updated = [...iprList];
      updated[editingIprIndex] = iprForm;
    }
    await triggerProfileUpdate({ ipr: updated }, 'Intellectual Property Rights details saved');
    setShowIprForm(false);
    setEditingIprIndex(-1);
    setIprForm({
      iprType: '',
      itemStatus: '',
      title: '',
      journalName: '',
      volume: '',
      issn: '',
      issue: '',
      pages: '',
      publicationDate: '',
      doiUrl: '',
      paperLink: ''
    });
  };

  const deleteIpr = async (index) => {
    const updated = iprList.filter((_, i) => i !== index);
    await triggerProfileUpdate({ ipr: updated }, 'Intellectual Property Rights details deleted');
  };

  const clearAllIprs = async () => {
    await triggerProfileUpdate({ ipr: [] }, 'All Intellectual Property Rights cleared');
  };

  // Save Privacy Settings
  const savePrivacy = async (e) => {
    e.preventDefault();
    await triggerProfileUpdate({ privacySettings: privacyForm }, 'Privacy configuration updated');
  };

  // Education Details & Document Upload
  const eduKeys = [
    { key: 'class10', label: '10th / Matriculation' },
    { key: 'class12', label: '12th / Intermediate' },
    { key: 'graduation', label: 'Undergraduate / Graduation' },
    { key: 'postGraduation', label: 'Postgraduate / Post-Graduation' },
    { key: 'netJrf', label: 'NET / JRF Verification' },
    { key: 'mphil', label: 'M.Phil (If Applicable)' },
    { key: 'other', label: 'Doctor of Philosophy / PhD' }
  ];

  const handleEduDraftChange = (key, field, value) => {
    setEduDrafts(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value
      }
    }));
  };

  const saveQualification = async (key) => {
    const updatedQualifications = {
      ...qualifications,
      [key]: eduDrafts[key] || {}
    };
    await triggerProfileUpdate({ qualifications: updatedQualifications }, `${eduKeys.find(k => k.key === key)?.label || 'Qualification'} details saved`);
  };

  const clearQualification = async (key) => {
    const clearedValue = { boardOrUniv: '', yearOfPassing: '', subject: '', percentage: '', certificateUrl: '' };
    setEduDrafts(prev => ({
      ...prev,
      [key]: clearedValue
    }));
    const updatedQualifications = {
      ...qualifications,
      [key]: clearedValue
    };
    await triggerProfileUpdate({ qualifications: updatedQualifications }, `${eduKeys.find(k => k.key === key)?.label || 'Qualification'} details cleared`);
  };

  const clearAllQualifications = async () => {
    const cleared = {};
    eduKeys.forEach(({ key }) => {
      cleared[key] = { boardOrUniv: '', yearOfPassing: '', subject: '', percentage: '', certificateUrl: '' };
    });
    setEduDrafts(cleared);
    setOtherQualsDraft([]);
    await triggerProfileUpdate({ qualifications: { ...cleared, otherQuals: [] } }, 'All educational qualifications details cleared');
  };

  const handleEduFileChange = async (e, key) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingDocKey(key);
      const res = await uploadProfileDocument(file, key);
      if (res.success) {
        toast.success('Certificate file uploaded successfully');
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error('File upload process failed');
    } finally {
      setUploadingDocKey(null);
    }
  };

  const deleteEduFile = async (key) => {
    const currentEdu = qualifications[key] || {};
    const updatedEdu = { ...currentEdu, certificateUrl: '' };
    const updatedQualifications = { ...qualifications, [key]: updatedEdu };
    await triggerProfileUpdate({ qualifications: updatedQualifications }, 'Certificate file removed');
  };

  // Other Qualifications Handlers
  const handleOtherQualFieldChange = (index, field, value) => {
    const updated = [...otherQualsDraft];
    updated[index] = { ...updated[index], [field]: value };
    setOtherQualsDraft(updated);
  };

  const saveOtherQual = async (index) => {
    const updatedOtherQuals = [...otherQualsDraft];
    const updatedQualifications = {
      ...qualifications,
      otherQuals: updatedOtherQuals
    };
    await triggerProfileUpdate({ qualifications: updatedQualifications }, 'Other qualification saved');
  };

  const deleteOtherQual = async (index) => {
    const updatedOtherQuals = otherQualsDraft.filter((_, i) => i !== index);
    setOtherQualsDraft(updatedOtherQuals);
    const updatedQualifications = {
      ...qualifications,
      otherQuals: updatedOtherQuals
    };
    await triggerProfileUpdate({ qualifications: updatedQualifications }, 'Other qualification deleted');
  };

  const addOtherQualRow = () => {
    setOtherQualsDraft(prev => [
      ...prev,
      { degree: '', boardOrUniv: '', yearOfPassing: '', subject: '', percentage: '', certificateUrl: '' }
    ]);
  };

  const handleOtherQualFileChange = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingDocKey(`otherQuals_${index}`);
      const res = await uploadProfileDocument(file, `otherQuals_${index}`);
      if (res.success) {
        toast.success('Certificate file uploaded successfully');
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error('File upload process failed');
    } finally {
      setUploadingDocKey(null);
    }
  };

  const deleteOtherQualFile = async (index) => {
    const updatedOtherQuals = [...otherQualsDraft];
    updatedOtherQuals[index] = { ...updatedOtherQuals[index], certificateUrl: '' };
    setOtherQualsDraft(updatedOtherQuals);
    const updatedQualifications = {
      ...qualifications,
      otherQuals: updatedOtherQuals
    };
    await triggerProfileUpdate({ qualifications: updatedQualifications }, 'Certificate file removed');
  };

  return (
    <div className="profile-layout-container">
      <style>{responsiveStyles}</style>
      
      {/* LEFT: Sticky Timeline Side Panel */}
      <div className="timeline-sidebar-panel">
        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', paddingLeft: '12px', marginBottom: '8px', letterSpacing: '0.05em' }}>
          Profile Timeline
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Vertical Connective Line */}
          <div style={{
            position: 'absolute',
            left: '20px',
            top: '20px',
            bottom: '20px',
            width: '2px',
            background: 'var(--color-border-solid, #e5e7eb)',
            zIndex: 0
          }} />

          {/* Timeline Nodes */}
          {milestoneItems.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => scrollToSection(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '8px',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  zIndex: 1,
                  transition: 'all 0.2s',
                  color: isActive ? 'var(--color-primary, #1A5A3B)' : 'var(--text-secondary, #64748b)',
                  fontWeight: isActive ? 700 : 500
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: isActive ? 'var(--color-primary, #1A5A3B)' : 'var(--color-border-solid, #e5e7eb)',
                  boxShadow: isActive ? '0 0 0 4px rgba(26,90,59,0.15)' : 'none',
                  transition: 'all 0.2s'
                }} />
                <item.Icon size={16} />
                <span style={{ fontSize: '0.85rem' }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Detailed Profile Sections */}
      <div className="profile-details-column">
        {/* Placeholder Sentinel to detect when milestones bar should stick */}
        <div 
          ref={milestonePlaceholderRef} 
          style={{ 
            height: isStuck ? '58px' : '0px', 
            margin: '0', 
            padding: '0', 
            visibility: 'hidden' 
          }} 
        />
        
        {/* Mobile Sticky Milestone Navigation Bar */}
        <div className={`mobile-milestones-bar ${isStuck ? 'is-stuck' : ''}`} ref={mobileBarRef}>
          {milestoneItems.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                data-key={item.key}
                onClick={() => scrollToSection(item.key)}
                className={`mobile-milestone-link ${isActive ? 'active' : ''}`}
                style={{ border: 'none', cursor: 'pointer' }}
              >
                <item.Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Verification Alert Banner */}
        {!user?.isVerified && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderLeft: '4px solid var(--status-late, #d97706)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-xl, 12px)',
          }} className="verification-banner">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <ShieldAlert style={{ color: 'var(--status-late, #d97706)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--status-late, #d97706)', display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>
                  Account Verification Pending
                </strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                  Access to dashboard options is currently locked. Full permissions will unlock upon verification from the {user?.role === 'HOD' ? 'Super Admin' : 'Head of Department'}.
                </p>
              </div>
            </div>
            <button 
              style={{ ...btnSecondaryStyle, whiteSpace: 'nowrap' }}
              onClick={handleCheckStatus}
              disabled={checkingStatus}
            >
              <RefreshCw size={14} className={checkingStatus ? 'spin-animation' : ''} /> Sync Status
            </button>
          </div>
        )}

        {/* Verification Success Banner */}
        {user?.isVerified && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderLeft: '4px solid var(--status-present, #10b981)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-xl, 12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <ShieldCheck style={{ color: 'var(--status-present, #10b981)' }} />
            <div>
              <strong style={{ color: 'var(--status-present, #10b981)', display: 'block', fontSize: '0.95rem' }}>
                Account Verified
              </strong>
            </div>
          </div>
        )}

        {/* 1. PERSONAL INFORMATION */}
        <section ref={sectionRefs.personal} className="clay-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'Outfit', margin: 0 }}>Personal Information</h3>
            </div>
            {!isEditingPersonal && (
              <button onClick={() => setIsEditingPersonal(true)} style={btnSecondaryStyle}>
                <Edit size={14} /> Edit Info
              </button>
            )}
          </div>

          <div className="personal-info-header">
            {/* Avatar block */}
            <div className="avatar-wrapper">
              <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                {user?.avatarUrl ? (
                  <img 
                    src={`${API_BASE_URL}${user.avatarUrl}`} 
                    alt="Avatar" 
                    style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)' }} 
                  />
                ) : (
                  <div style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--color-primary-light, #1A5A3B), var(--color-primary, #0f4028))', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    border: '3px solid var(--color-primary)'
                  }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <label style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  background: 'var(--color-primary, #1A5A3B)',
                  color: 'white',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} disabled={avatarLoading} />
                </label>
              </div>
              <span className="badge badge-neutral" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                {user?.role === 'HOD' ? 'HOD' : user?.subRole || 'Faculty'}
              </span>
            </div>

            {/* Fields Listing/Form */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              {isEditingPersonal ? (
                <form onSubmit={savePersonalInfo} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={personalForm.phoneNumber} 
                        onChange={e => setPersonalForm({ ...personalForm, phoneNumber: e.target.value })} 
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email ID</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        value={personalForm.email} 
                        onChange={e => setPersonalForm({ ...personalForm, email: e.target.value })} 
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Designation</label>
                      <select 
                        className="form-input" 
                        value={personalForm.designation} 
                        onChange={e => setPersonalForm({ ...personalForm, designation: e.target.value })}
                        required
                      >
                        <option value="">Select...</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                        <option value="Professor Emeritus">Professor Emeritus</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Specialization</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={personalForm.specialization} 
                        onChange={e => setPersonalForm({ ...personalForm, specialization: e.target.value })} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={personalForm.dob} 
                        onChange={e => setPersonalForm({ ...personalForm, dob: e.target.value })} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select 
                        className="form-input" 
                        value={personalForm.gender} 
                        onChange={e => setPersonalForm({ ...personalForm, gender: e.target.value })}
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select 
                        className="form-input" 
                        value={personalForm.category} 
                        onChange={e => setPersonalForm({ ...personalForm, category: e.target.value })}
                      >
                        <option value="">Select...</option>
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nationality</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={personalForm.nationality} 
                        onChange={e => setPersonalForm({ ...personalForm, nationality: e.target.value })} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Father's Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={personalForm.fatherName} 
                        onChange={e => setPersonalForm({ ...personalForm, fatherName: e.target.value })} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mother's Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={personalForm.motherName} 
                        onChange={e => setPersonalForm({ ...personalForm, motherName: e.target.value })} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Office Room</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={personalForm.officeRoom} 
                        onChange={e => setPersonalForm({ ...personalForm, officeRoom: e.target.value })} 
                      />
                    </div>
                    {user?.role === 'HOD' && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Years of Service</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            value={personalForm.yearsOfService} 
                            onChange={e => setPersonalForm({ ...personalForm, yearsOfService: e.target.value })} 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Additional Responsibilities</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={personalForm.additionalResponsibilities} 
                            onChange={e => setPersonalForm({ ...personalForm, additionalResponsibilities: e.target.value })} 
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Residential Address</label>
                    <textarea 
                      className="form-input" 
                      style={{ height: '70px', resize: 'vertical' }}
                      value={personalForm.address} 
                      onChange={e => setPersonalForm({ ...personalForm, address: e.target.value })} 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={clearPersonalInfo} style={btnDangerStyle}>
                      Clear Info
                    </button>
                    <button type="button" onClick={() => setIsEditingPersonal(false)} style={btnSecondaryStyle}>
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} style={btnPrimaryStyle}>
                      {loading ? 'Saving...' : 'Save Info'}
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Faculty Name</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Designation</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{profile.designation || 'Supervisor'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Department</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{user?.department}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Specialization</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{profile.specialization || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Email ID</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{profile.email || user?.username}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Contact Phone</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{profile.phoneNumber || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Date of Birth</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{profile.dob || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Gender</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{profile.gender || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Category</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{profile.category || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Nationality</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{profile.nationality || 'Indian'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Father's Name</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{profile.fatherName || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Mother's Name</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{profile.motherName || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Office Room</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{profile.officeRoom || 'N/A'}</strong>
                  </div>
                  {user?.role === 'HOD' && (
                    <>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Years of Service</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{profile.yearsOfService || 'N/A'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Additional Responsibilities</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{profile.additionalResponsibilities || 'N/A'}</strong>
                      </div>
                    </>
                  )}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Residential Address</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{profile.address || 'N/A'}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. AREA OF EXPERTISE */}
        <section ref={sectionRefs.expertise} className="clay-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'Outfit', margin: 0 }}>Area of Expertise</h3>
            </div>
            {expertiseList.length > 0 && (
              <button type="button" onClick={clearAllExpertise} style={btnDangerStyle}>
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
            <button type="submit" style={btnPrimaryStyle}>
              <Plus size={14} /> Add Tag
            </button>
          </form>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {expertiseList.length === 0 ? (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No expertise tags logged yet.</span>
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
                    color: 'var(--color-primary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    border: '1px solid rgba(26,90,59,0.15)'
                  }}
                >
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => handleDeleteExpertise(tag)} 
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 3. EXPERIENCE DETAILS */}
        <section ref={sectionRefs.experience} className="clay-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'Outfit', margin: 0 }}>Work Experience</h3>
            </div>
            <div className="section-header-buttons">
              {experienceList.length > 0 && (
                <button onClick={clearAllExperience} style={btnDangerStyle}>
                  <Trash2 size={14} /> Clear All
                </button>
              )}
              {!showExpForm && (
                <button onClick={() => { setShowExpForm(true); setEditingExpIndex(-1); }} style={btnPrimaryStyle}>
                  <Plus size={14} /> Add Entry
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          {showExpForm && (
            <form onSubmit={saveExperience} style={{ padding: '16px', border: '1px dashed var(--color-border-solid)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-surface-elevated)' }}>
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
                  <input type="date" className="form-input" value={expForm.startDate} onChange={e => setExpForm({ ...expForm, startDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" value={expForm.endDate} onChange={e => setExpForm({ ...expForm, endDate: e.target.value })} disabled={expForm.isPresent} required={!expForm.isPresent} />
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
                <button type="button" onClick={() => setShowExpForm(false)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={btnPrimaryStyle}>Save Entry</button>
              </div>
            </form>
          )}

          {/* List items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {experienceList.length === 0 ? (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No employment history logged yet.</span>
            ) : (
              experienceList.map((exp, i) => (
                <div key={i} style={{ border: '1px solid var(--color-border-solid)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{exp.designation}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, display: 'block', margin: '2px 0' }}>{exp.organization}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>
                      {new Date(exp.startDate).toLocaleDateString()} – {exp.isPresent ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'N/A'}
                    </span>
                    {exp.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '8px 0 0 0', lineHeight: 1.4 }}>{exp.description}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', height: 'fit-content' }}>
                    <button 
                      onClick={() => {
                        setEditingExpIndex(i);
                        setExpForm(exp);
                        setShowExpForm(true);
                      }} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
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
        </section>

        {/* 4. EDUCATIONAL QUALIFICATIONS */}
        <section ref={sectionRefs.education} className="clay-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'Outfit', margin: 0 }}>Educational Qualifications</h3>
            </div>
            {(Object.keys(qualifications).length > 0 || otherQualsDraft.length > 0) && (
              <button onClick={clearAllQualifications} style={btnDangerStyle}>
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {eduKeys.map(({ key, label }) => {
              const info = eduDrafts[key] || {};
              const originalInfo = qualifications[key] || {};
              return (
                <div key={key} style={{ border: '1px solid var(--color-border-solid)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <div className="edu-card-header">
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{label}</strong>
                    
                    {/* Document status or upload controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {originalInfo.certificateUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <a 
                            href={`${API_BASE_URL}${originalInfo.certificateUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={btnSecondaryStyle}
                          >
                            <Eye size={12} /> View Doc
                          </a>
                          <button 
                            onClick={() => deleteEduFile(key)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', padding: '4px' }}
                            title="Delete certificate document"
                            type="button"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      ) : (
                        <label style={{ ...btnSecondaryStyle, margin: 0 }}>
                          <Upload size={12} /> {uploadingDocKey === key ? 'Uploading...' : 'Upload Doc'}
                          <input 
                            type="file" 
                            accept=".pdf,image/*" 
                            onChange={(e) => handleEduFileChange(e, key)} 
                            style={{ display: 'none' }} 
                            disabled={uploadingDocKey !== null} 
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Details forms inside */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Board / University</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Board or University"
                        value={info.boardOrUniv || ''} 
                        onChange={e => handleEduDraftChange(key, 'boardOrUniv', e.target.value)} 
                        style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Year of Passing</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Year of Passing"
                        value={info.yearOfPassing || ''} 
                        onChange={e => handleEduDraftChange(key, 'yearOfPassing', e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Subject / Stream</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Subject / Stream"
                        value={info.subject || ''} 
                        onChange={e => handleEduDraftChange(key, 'subject', e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Marks Obtained / CGPA</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Marks / CGPA"
                        value={info.percentage || ''} 
                        onChange={e => handleEduDraftChange(key, 'percentage', e.target.value)}
                        style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => clearQualification(key)} 
                      style={btnDangerStyle}
                    >
                      Clear details
                    </button>
                    <button 
                      type="button" 
                      onClick={() => saveQualification(key)} 
                      disabled={loading}
                      style={btnPrimaryStyle}
                    >
                      Save {label}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Other Qualifications Header */}
            <div style={{ borderTop: '1px solid var(--color-border-solid)', paddingTop: '20px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }} className="section-header">
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0, color: 'var(--color-primary)' }}>Other Qualifications</h4>
                <button 
                  type="button" 
                  onClick={addOtherQualRow} 
                  style={btnPrimaryStyle}
                >
                  <Plus size={14} /> Add More Row
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {otherQualsDraft.map((qual, index) => {
                  const originalQual = (qualifications.otherQuals && qualifications.otherQuals[index]) || {};
                  return (
                    <div key={index} style={{ border: '1px solid var(--color-border-solid)', borderRadius: '12px', padding: '16px', background: 'var(--color-surface-elevated, #F8FAFC)' }}>
                      <div className="edu-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, width: '100%' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Degree/Certificate Name (e.g. PG Diploma)"
                            value={qual.degree || ''} 
                            onChange={e => handleOtherQualFieldChange(index, 'degree', e.target.value)}
                            style={{ fontSize: '0.85rem', padding: '4px 8px', fontWeight: 600, maxWidth: '280px', width: '100%' }}
                          />
                        </div>
                        
                        {/* File Upload/View for Other Qualification */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {originalQual.certificateUrl ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <a 
                                href={`${API_BASE_URL}${originalQual.certificateUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={btnSecondaryStyle}
                              >
                                <Eye size={12} /> View Doc
                              </a>
                              <button 
                                onClick={() => deleteOtherQualFile(index)}
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', padding: '4px' }}
                                title="Delete certificate document"
                                type="button"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          ) : (
                            <label style={{ ...btnSecondaryStyle, margin: 0 }}>
                              <Upload size={12} /> {uploadingDocKey === `otherQuals_${index}` ? 'Uploading...' : 'Upload Doc'}
                              <input 
                                type="file" 
                                accept=".pdf,image/*" 
                                onChange={(e) => handleOtherQualFileChange(e, index)} 
                                style={{ display: 'none' }} 
                                disabled={uploadingDocKey !== null} 
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Fields */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Board / University</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Board or University"
                            value={qual.boardOrUniv || ''} 
                            onChange={e => handleOtherQualFieldChange(index, 'boardOrUniv', e.target.value)} 
                            style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Year of Passing</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Year of Passing"
                            value={qual.yearOfPassing || ''} 
                            onChange={e => handleOtherQualFieldChange(index, 'yearOfPassing', e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Subject / Stream</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Subject / Stream"
                            value={qual.subject || ''} 
                            onChange={e => handleOtherQualFieldChange(index, 'subject', e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Marks Obtained / CGPA</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Marks / CGPA"
                            value={qual.percentage || ''} 
                            onChange={e => handleOtherQualFieldChange(index, 'percentage', e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          type="button" 
                          onClick={() => deleteOtherQual(index)} 
                          style={btnDangerStyle}
                        >
                          Delete Row
                        </button>
                        <button 
                          type="button" 
                          onClick={() => saveOtherQual(index)} 
                          disabled={loading}
                          style={btnPrimaryStyle}
                        >
                          Save Qualification
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* 5. HONOURS & AWARDS */}
        <section ref={sectionRefs.awards} className="clay-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'Outfit', margin: 0 }}>Honours & Awards</h3>
            </div>
            <div className="section-header-buttons">
              {awardsList.length > 0 && (
                <button onClick={clearAllAwards} style={btnDangerStyle}>
                  <Trash2 size={14} /> Clear All
                </button>
              )}
              {!showAwardForm && (
                <button onClick={() => { setShowAwardForm(true); setEditingAwardIndex(-1); }} style={btnPrimaryStyle}>
                  <Plus size={14} /> Add Entry
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          {showAwardForm && (
            <form onSubmit={saveAward} style={{ padding: '16px', border: '1px dashed var(--color-border-solid)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-surface-elevated)' }}>
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
                <button type="button" onClick={() => setShowAwardForm(false)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={btnPrimaryStyle}>Save Entry</button>
              </div>
            </form>
          )}

          {/* List items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {awardsList.length === 0 ? (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No honours or awards logged yet.</span>
            ) : (
              awardsList.map((aw, i) => (
                <div key={i} style={{ border: '1px solid var(--color-border-solid)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{aw.awardName}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, display: 'block', margin: '2px 0' }}>{aw.awardingBody}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Year: {aw.year}</span>
                    {aw.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '8px 0 0 0', lineHeight: 1.4 }}>{aw.description}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', height: 'fit-content' }}>
                    <button 
                      onClick={() => {
                        setEditingAwardIndex(i);
                        setAwardForm(aw);
                        setShowAwardForm(true);
                      }} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
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
        </section>

        {/* 6. DOCTORAL THESES */}
        <section ref={sectionRefs.theses} className="clay-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'Outfit', margin: 0 }}>Doctoral Theses Supervised</h3>
            </div>
            <div className="section-header-buttons">
              {thesesList.length > 0 && (
                <button onClick={clearAllTheses} style={btnDangerStyle}>
                  <Trash2 size={14} /> Clear All
                </button>
              )}
              {!showThesisForm && (
                <button onClick={() => { setShowThesisForm(true); setEditingThesisIndex(-1); }} style={btnPrimaryStyle}>
                  <Plus size={14} /> Add Entry
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          {showThesisForm && (
            <form onSubmit={saveThesis} style={{ padding: '16px', border: '1px dashed var(--color-border-solid)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-surface-elevated)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>{editingThesisIndex === -1 ? 'Add Thesis Record' : 'Edit Thesis Record'}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Scholar Name</label>
                  <input type="text" className="form-input" value={thesisForm.scholarName} onChange={e => setThesisForm({ ...thesisForm, scholarName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Thesis Title</label>
                  <input type="text" className="form-input" value={thesisForm.thesisTitle} onChange={e => setThesisForm({ ...thesisForm, thesisTitle: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={thesisForm.status} onChange={e => setThesisForm({ ...thesisForm, status: e.target.value })} required>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year of Award / Registration</label>
                  <input type="text" className="form-input" value={thesisForm.yearOfAward} onChange={e => setThesisForm({ ...thesisForm, yearOfAward: e.target.value })} placeholder="e.g. 2023" required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowThesisForm(false)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={btnPrimaryStyle}>Save Entry</button>
              </div>
            </form>
          )}

          {/* List items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {thesesList.length === 0 ? (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No theses guidance logged yet.</span>
            ) : (
              thesesList.map((th, i) => (
                <div key={i} style={{ border: '1px solid var(--color-border-solid)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{th.thesisTitle}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, display: 'block', margin: '2px 0' }}>Scholar: {th.scholarName}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'inline-flex', gap: '12px' }}>
                      <span>Year: {th.yearOfAward}</span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{th.status}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', height: 'fit-content' }}>
                    <button 
                      onClick={() => {
                        setEditingThesisIndex(i);
                        setThesisForm(th);
                        setShowThesisForm(true);
                      }} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => deleteThesis(i)} 
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 7. PROFESSIONAL BODIES */}
        <section ref={sectionRefs.memberships} className="clay-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'Outfit', margin: 0 }}>Professional Bodies</h3>
            </div>
            <div className="section-header-buttons">
              {membershipsList.length > 0 && (
                <button onClick={clearAllMemberships} style={btnDangerStyle}>
                  <Trash2 size={14} /> Clear All
                </button>
              )}
              {!showMemberForm && (
                <button onClick={() => { setShowMemberForm(true); setEditingMemberIndex(-1); }} style={btnPrimaryStyle}>
                  <Plus size={14} /> Add Entry
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          {showMemberForm && (
            <form onSubmit={saveMember} style={{ padding: '16px', border: '1px dashed var(--color-border-solid)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-surface-elevated)' }}>
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
                <button type="button" onClick={() => setShowMemberForm(false)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={btnPrimaryStyle}>Save Entry</button>
              </div>
            </form>
          )}

          {/* List items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {membershipsList.length === 0 ? (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No professional memberships logged yet.</span>
            ) : (
              membershipsList.map((mb, i) => (
                <div key={i} style={{ border: '1px solid var(--color-border-solid)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{mb.membershipName}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, display: 'block', margin: '2px 0' }}>{mb.organization}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'inline-flex', gap: '12px' }}>
                      <span>Joined: {mb.year}</span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{mb.membershipType}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', height: 'fit-content' }}>
                    <button 
                      onClick={() => {
                        setEditingMemberIndex(i);
                        setMemberForm(mb);
                        setShowMemberForm(true);
                      }} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
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
        </section>

        {/* 8. MEMBERSHIP IN COMMITTEE */}
        <section ref={sectionRefs.committees} className="clay-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bookmark size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'Outfit', margin: 0 }}>Membership in Committee</h3>
            </div>
            <div className="section-header-buttons">
              {committeesList.length > 0 && (
                <button onClick={clearAllCommittees} style={btnDangerStyle}>
                  <Trash2 size={14} /> Clear All
                </button>
              )}
              {!showCommitteeForm && (
                <button onClick={() => { setShowCommitteeForm(true); setEditingCommitteeIndex(-1); }} style={btnPrimaryStyle}>
                  <Plus size={14} /> Add Entry
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          {showCommitteeForm && (
            <form onSubmit={saveCommittee} style={{ padding: '16px', border: '1px dashed var(--color-border-solid)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-surface-elevated)' }}>
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
                <button type="button" onClick={() => setShowCommitteeForm(false)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={btnPrimaryStyle}>Save Entry</button>
              </div>
            </form>
          )}

          {/* List items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {committeesList.length === 0 ? (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No committee seats logged yet.</span>
            ) : (
              committeesList.map((ct, i) => (
                <div key={i} style={{ border: '1px solid var(--color-border-solid)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{ct.committeeName}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, display: 'block', margin: '2px 0' }}>Role: {ct.role} ({ct.organization})</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Duration: {ct.duration}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', height: 'fit-content' }}>
                    <button 
                      onClick={() => {
                        setEditingCommitteeIndex(i);
                        setCommitteeForm(ct);
                        setShowCommitteeForm(true);
                      }} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
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
        </section>

        {/* 9. RESEARCH PROJECTS */}
        <section ref={sectionRefs.projects} className="clay-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Folder size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'Outfit', margin: 0 }}>Research Projects</h3>
            </div>
            <div className="section-header-buttons">
              {projectsList.length > 0 && (
                <button onClick={clearAllProjects} style={btnDangerStyle}>
                  <Trash2 size={14} /> Clear All
                </button>
              )}
              {!showProjectForm && (
                <button onClick={() => { setShowProjectForm(true); setEditingProjectIndex(-1); }} style={btnPrimaryStyle}>
                  <Plus size={14} /> Add Entry
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          {showProjectForm && (
            <form onSubmit={saveProject} style={{ padding: '16px', border: '1px dashed var(--color-border-solid)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-surface-elevated)' }}>
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
                <button type="button" onClick={() => setShowProjectForm(false)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={btnPrimaryStyle}>Save Entry</button>
              </div>
            </form>
          )}

          {/* List items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {projectsList.length === 0 ? (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No research projects logged yet.</span>
            ) : (
              projectsList.map((pr, i) => (
                <div key={i} style={{ border: '1px solid var(--color-border-solid)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{pr.projectTitle}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, display: 'block', margin: '2px 0' }}>Agency: {pr.fundingAgency} | Grant: ₹{pr.amount}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'inline-flex', gap: '12px' }}>
                      <span>Duration: {pr.duration}</span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{pr.role}</span>
                      <span className="badge badge-present" style={{ fontSize: '0.65rem', padding: '2px 6px', background: pr.status === 'Completed' ? '#E8F5E9' : '#FFF3E0', color: pr.status === 'Completed' ? '#2E7D32' : '#E65100' }}>{pr.status}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', height: 'fit-content' }}>
                    <button 
                      onClick={() => {
                        setEditingProjectIndex(i);
                        setProjectForm(pr);
                        setShowProjectForm(true);
                      }} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
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
        </section>

        {/* 10. PUBLICATIONS */}
        <section ref={sectionRefs.publications} className="clay-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'Outfit', margin: 0 }}>Research Publications</h3>
            </div>
            <div className="section-header-buttons">
              {publicationsList.length > 0 && (
                <button onClick={clearAllPublications} style={btnDangerStyle}>
                  <Trash2 size={14} /> Clear All
                </button>
              )}
              {!showPubForm && (
                <button onClick={() => { setShowPubForm(true); setEditingPubIndex(-1); }} style={btnPrimaryStyle}>
                  <Plus size={14} /> Add Entry
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          {showPubForm && (
            <form onSubmit={savePub} style={{ padding: '16px', border: '1px dashed var(--color-border-solid)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-surface-elevated)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>{editingPubIndex === -1 ? 'Add Publication' : 'Edit Publication'}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Paper Title</label>
                  <input type="text" className="form-input" value={pubForm.title} onChange={e => setPubForm({ ...pubForm, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Journal / Conference Name</label>
                  <input type="text" className="form-input" value={pubForm.journalName} onChange={e => setPubForm({ ...pubForm, journalName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Authors (Comma separated)</label>
                  <input type="text" className="form-input" value={pubForm.authors} onChange={e => setPubForm({ ...pubForm, authors: e.target.value })} placeholder="e.g. A. Sood, H. Negi" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Year of Publication</label>
                  <input type="text" className="form-input" value={pubForm.year} onChange={e => setPubForm({ ...pubForm, year: e.target.value })} placeholder="e.g. 2024" required />
                </div>
                <div className="form-group">
                  <label className="form-label">DOI / URL</label>
                  <input type="text" className="form-input" value={pubForm.doi} onChange={e => setPubForm({ ...pubForm, doi: e.target.value })} placeholder="e.g. https://doi.org/10..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowPubForm(false)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={btnPrimaryStyle}>Save Entry</button>
              </div>
            </form>
          )}

          {/* List items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {publicationsList.length === 0 ? (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No publications logged yet.</span>
            ) : (
              publicationsList.map((pb, i) => (
                <div key={i} style={{ border: '1px solid var(--color-border-solid)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{pb.title}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, display: 'block', margin: '2px 0' }}>{pb.journalName}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Authors: {pb.authors} | Year: {pb.year}</span>
                    {pb.doi && (
                      <a 
                        href={pb.doi.startsWith('http') ? pb.doi : `https://${pb.doi}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', textDecoration: 'none', fontWeight: 600 }}
                      >
                        <ExternalLink size={12} /> Paper Link / DOI
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', height: 'fit-content' }}>
                    <button 
                      onClick={() => {
                        setEditingPubIndex(i);
                        setPubForm(pb);
                        setShowPubForm(true);
                      }} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => deletePub(i)} 
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 11. INTELLECTUAL PROPERTY RIGHTS */}
        <section ref={sectionRefs.ipr} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Copyright size={20} style={{ color: '#1A5A3B' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Intellectual Property Rights (IPR)</h3>
            </div>
            <div className="section-header-buttons">
              {iprList.length > 0 && (
                <button onClick={clearAllIprs} style={btnDangerStyle}>
                  <Trash2 size={14} /> Clear All
                </button>
              )}
              {!showIprForm && (
                <button onClick={() => { setShowIprForm(true); setEditingIprIndex(-1); }} style={btnPrimaryStyle}>
                  <Plus size={14} /> Add Entry
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          {showIprForm && (
            <form onSubmit={saveIpr} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#F8FAFC' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>{editingIprIndex === -1 ? 'Add IPR Log' : 'Edit IPR Log'}</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">IPR Type *</label>
                  <select className="form-input" required value={iprForm.iprType} onChange={e => setIprForm({ ...iprForm, iprType: e.target.value })} style={{ width: '100%' }}>
                    <option value="">-- Select IPR Type --</option>
                    <option value="Patent">Patent</option>
                    <option value="Copyright">Copyright</option>
                    <option value="Trademark">Trademark</option>
                    <option value="Design Registration">Design Registration</option>
                    <option value="Geographical Indication">Geographical Indication</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">IPR Status *</label>
                  <select className="form-input" required value={iprForm.itemStatus} onChange={e => setIprForm({ ...iprForm, itemStatus: e.target.value })} style={{ width: '100%' }}>
                    <option value="">-- Select Status --</option>
                    <option value="Filed / Application Submitted">Filed / Application Submitted</option>
                    <option value="Published (in Gazette/Journal)">Published (in Gazette/Journal)</option>
                    <option value="Granted / Issued / Registered">Granted / Issued / Registered</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">IPR / Patent Title *</label>
                  <input type="text" className="form-input" required value={iprForm.title} onChange={e => setIprForm({ ...iprForm, title: e.target.value })} placeholder="e.g. System and Method for Adaptive Threat Detection" />
                </div>
                <div className="form-group">
                  <label className="form-label">IPR Office / Issuing Organization *</label>
                  <input type="text" className="form-input" required value={iprForm.journalName} onChange={e => setIprForm({ ...iprForm, journalName: e.target.value })} placeholder="e.g. Indian Patent Office (IPO)" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Inventors / Applicants *</label>
                  <input type="text" className="form-input" required value={iprForm.volume} onChange={e => setIprForm({ ...iprForm, volume: e.target.value })} placeholder="e.g. Dr. Ayush Sood, Prof. M. Roy" />
                </div>
                <div className="form-group">
                  <label className="form-label">Application / Registration Number *</label>
                  <input type="text" className="form-input" required value={iprForm.issn} onChange={e => setIprForm({ ...iprForm, issn: e.target.value })} placeholder="e.g. 202611012345" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">App/Grant ID *</label>
                  <input type="text" className="form-input" required value={iprForm.issue} onChange={e => setIprForm({ ...iprForm, issue: e.target.value })} placeholder="e.g. PAT/2026/7890" />
                </div>
                <div className="form-group">
                  <label className="form-label">Country / Region *</label>
                  <input type="text" className="form-input" required value={iprForm.pages} onChange={e => setIprForm({ ...iprForm, pages: e.target.value })} placeholder="e.g. India" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Date of Filing / Award *</label>
                  <input type="date" className="form-input" required value={iprForm.publicationDate} onChange={e => setIprForm({ ...iprForm, publicationDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">IPR ID / Reference Number (Optional)</label>
                  <input type="text" className="form-input" value={iprForm.doiUrl} onChange={e => setIprForm({ ...iprForm, doiUrl: e.target.value })} placeholder="e.g. Ref/IPO/4567" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">IPR URL / Registry Link (Optional)</label>
                <input type="text" className="form-input" value={iprForm.paperLink} onChange={e => setIprForm({ ...iprForm, paperLink: e.target.value })} placeholder="e.g. https://ipindiaservices.gov.in/..." />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowIprForm(false)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={loading} style={btnPrimaryStyle}>Save Entry</button>
              </div>
            </form>
          )}

          {/* List items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {iprList.length === 0 ? (
              <span style={{ fontSize: '0.82rem', color: '#64748B', fontStyle: 'italic' }}>No Intellectual Property Rights logged yet.</span>
            ) : (
              iprList.map((ip, i) => (
                <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', gap: '16px', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#1F2937', display: 'block' }}>{ip.title}</strong>
                    <span style={{ fontSize: '0.82rem', color: '#1A5A3B', fontWeight: 600, display: 'block', margin: '2px 0' }}>{ip.iprType} | Status: {ip.itemStatus} ({ip.journalName})</span>
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
                  <div style={{ display: 'flex', gap: '6px', height: 'fit-content' }}>
                    <button 
                      onClick={() => {
                        setEditingIprIndex(i);
                        setIprForm(ip);
                        setShowIprForm(true);
                      }} 
                      style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => deleteIpr(i)} 
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 12. PRIVACY & SETTINGS */}
        <section ref={sectionRefs.settings} className="clay-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border-solid)', paddingBottom: '12px' }}>
            <Settings size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', fontFamily: 'Outfit', margin: 0 }}>Privacy & Settings</h3>
          </div>

          <form onSubmit={savePrivacy} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              
              <div style={{ border: '1px solid var(--color-border-solid)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  Profile Visibility
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.35 }}>
                  Decide whether your academic credentials and publications are discoverable on the public portal.
                </p>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="profileVisibility" 
                      value="public" 
                      checked={privacyForm.profileVisibility === 'public'}
                      onChange={() => setPrivacyForm({ ...privacyForm, profileVisibility: 'public' })}
                    />
                    <Eye size={14} style={{ color: '#10b981' }} /> Public
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="profileVisibility" 
                      value="private"
                      checked={privacyForm.profileVisibility === 'private'}
                      onChange={() => setPrivacyForm({ ...privacyForm, profileVisibility: 'private' })}
                    />
                    <EyeOff size={14} style={{ color: '#d97706' }} /> Private
                  </label>
                </div>
              </div>

              <div style={{ border: '1px solid var(--color-border-solid)', borderRadius: '12px', padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  Document Visibility
                </strong>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.35 }}>
                  Decide whether uploaded certificates and research briefs are viewable by public query guests.
                </p>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="documentVisibility" 
                      value="public"
                      checked={privacyForm.documentVisibility === 'public'}
                      onChange={() => setPrivacyForm({ ...privacyForm, documentVisibility: 'public' })}
                    />
                    <Eye size={14} style={{ color: '#10b981' }} /> Public
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="documentVisibility" 
                      value="private"
                      checked={privacyForm.documentVisibility === 'private'}
                      onChange={() => setPrivacyForm({ ...privacyForm, documentVisibility: 'private' })}
                    />
                    <EyeOff size={14} style={{ color: '#d97706' }} /> Private
                  </label>
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={loading} style={btnPrimaryStyle}>
                <Check size={14} /> Update Privacy Settings
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
};

export default StaffProfileTab;
