import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User, GraduationCap } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const OverviewTab = () => {
  const { user } = useContext(AuthContext);

  return (
    <div>
      {/* Welcome Banner */}
      <motion.div
        className="welcome-banner glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="welcome-tag">
          <Sparkles size={12} /> Student Dashboard
        </div>
        <h1 className="welcome-title">Welcome, {user?.name ?? 'Scholar'}</h1>
        <p className="welcome-subtitle">
          Department of {user?.department ?? 'Computer Science'} · Research Scholar
        </p>
      </motion.div>

      <div className="grid-2">
        {/* Personal Profile */}
        <motion.div
          className="glass-panel p-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
            <User size={20} /> Personal Profile
          </h3>
          <div className="flex flex-col gap-lg">
            {[
              { label: 'Full Name', value: user?.name },
              { label: 'Username', value: user?.username },
              { label: 'Email', value: user?.profile?.email || user?.username },
              { label: 'Role', value: 'Student / Research Scholar' },
              { label: 'SH Number', value: user?.profile?.shNo || 'Auto-generated' },
            ].map((item, i) => (
              <div key={i}>
                <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {item.label}
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '3px' }}>
                  {item.value ?? '—'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Academic Info */}
        <motion.div
          className="glass-panel p-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)' }}>
            <GraduationCap size={20} /> Academic Information
          </h3>
          <div className="flex flex-col gap-lg">
            {[
              { label: 'Department', value: user?.department },
              { label: 'Program Type', value: user?.profile?.phdMode ? `PhD (${user.profile.phdMode})` : 'PhD' },
              { label: 'Enrollment Number', value: user?.profile?.enrollmentNumber },
              { label: 'Area of Interest', value: user?.profile?.areaOfInterest },
              { label: 'Research Title', value: user?.profile?.thesisTitle },
            ].map((item, i) => (
              <div key={i}>
                <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {item.label}
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '3px', lineHeight: item.label === 'Research Title' ? 1.4 : 1.2, fontStyle: item.label === 'Research Title' ? 'italic' : 'normal' }}>
                  {item.value || '—'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OverviewTab;
