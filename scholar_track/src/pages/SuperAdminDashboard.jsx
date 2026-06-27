import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import DashboardShell from '../components/DashboardShell';
import { useTabPersistence } from '../hooks/useTabPersistence';
import OverviewTab from '../modules/admin/OverviewTab';
import UserVerificationTab from "../modules/admin/UserVerificationTab";
import FacultyMasterTab from "../modules/admin/FacultyMasterTab";
import HODMasterTab from "../modules/admin/HODMasterTab";
import SAProfileTab from "../modules/admin/SAProfileTab";
import SessionMasterTab from "../modules/admin/SessionMasterTab";
import DegreeTypeMasterTab from "../modules/admin/DegreeTypeMasterTab";
import DegreeNameMasterTab from "../modules/admin/DegreeNameMasterTab";
import SemesterDegreeMappingTab from "../modules/admin/SemesterDegreeMappingTab";
import SemesterMasterTab from "../modules/admin/SemesterMasterTab";
import DegreeDeptMappingTab from "../modules/admin/DegreeDeptMappingTab";
import HolidayCalendarTab from "../modules/admin/HolidayCalendarTab";
import DepartmentsTab from "../modules/admin/DepartmentsTab";

const SuperAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useTabPersistence('track_superadmin_tab', 'overview');

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);
  if (!user) return null;

  const titles = {
    overview: "System Overview",
    users: "User Verification",
    sessions: "Academic Sessions",
    degreeTypes: "Degree Types",
    degreeNames: "Degree Names",
    semesterDegreeMap: "Semester-Degree Mapping",
    semesters: "Semesters",
    degreeDeptMap: "Degree-Department Mapping",
    holidays: "Holiday Calendar",
    departments: "Department Master",
    faculty: "Faculty Master",
    hod: "HOD Master",
    profile: "My Credentials",
  };

  return (
    <DashboardShell
      role="SUPER_ADMIN"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerTitle={titles[activeTab]}
    >
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "users" && <UserVerificationTab />}
      {activeTab === "faculty" && <FacultyMasterTab />}
      {activeTab === "hod" && <HODMasterTab />}
      {activeTab === "profile" && <SAProfileTab />}
      {activeTab === "sessions" && <SessionMasterTab />}
      {activeTab === "degreeTypes" && <DegreeTypeMasterTab />}
      {activeTab === "degreeNames" && <DegreeNameMasterTab />}
      {activeTab === "semesterDegreeMap" && <SemesterDegreeMappingTab />}
      {activeTab === "semesters" && <SemesterMasterTab />}
      {activeTab === "degreeDeptMap" && <DegreeDeptMappingTab />}
      {activeTab === "holidays" && <HolidayCalendarTab />}
      {activeTab === "departments" && <DepartmentsTab />}
    </DashboardShell>
  );
};

export default SuperAdminDashboard;
