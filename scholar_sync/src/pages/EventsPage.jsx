import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
import { API_URL } from '../config';
import { 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle,
  Archive,
  Hourglass,
  Layers,
  Award
} from 'lucide-react';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming | archive

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_URL}/public/events`);
        setEvents(res.data || []);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const now = new Date();
  
  const upcomingEvents = events.filter(evt => new Date(evt.date) >= now || evt.type === 'Defense Viva');
  const pastEvents = events.filter(evt => new Date(evt.date) < now && evt.type !== 'Defense Viva');

  const getEventBadgeStyle = (type) => {
    if (type === 'Defense Viva') return { bg: '#FEF3C7', color: '#D97706', label: 'PhD Defense' };
    if (type === 'Seminar') return { bg: '#E0F2FE', color: '#0369A1', label: 'Seminar' };
    if (type === 'Guest Lecture') return { bg: '#EDE9FE', color: '#6D28D9', label: 'Guest Lecture' };
    return { bg: '#F3F4F6', color: '#374151', label: 'Academic Event' };
  };

  const renderedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <div className="subpage-container">
      <div className="liquid-bg-wrapper">
        <div className="liquid-blob blob-1"></div>
        <div className="liquid-blob blob-2"></div>
        <div className="liquid-blob blob-3"></div>
      </div>
      <Navbar />

      <div style={{ flex: 1, padding: '40px 20px' }}>
        <div className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px' }}>
          {/* Header Stats */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 className="page-title" style={{ fontSize: '2.8rem', fontWeight: 800, color: '#133A26', marginBottom: '12px' }}>Events & Defenses</h1>
            <p className="page-desc" style={{ maxWidth: '650px', margin: '0 auto 30px', fontSize: '1.05rem', color: 'var(--color-text-secondary)' }}>
              Track PhD defense presentations, seminars, DRC sessions, and expert research talks scheduled across departments.
            </p>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid rgba(19,58,38,0.1)', paddingBottom: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setActiveTab('upcoming')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'upcoming' ? '#133A26' : '#6B7280',
                  fontWeight: activeTab === 'upcoming' ? 700 : 500,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Hourglass size={16} /> Upcoming Events ({upcomingEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'past' ? '#133A26' : '#6B7280',
                  fontWeight: activeTab === 'past' ? 700 : 500,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Archive size={16} /> Defenses Archive ({pastEvents.length})
              </button>
            </div>
          </div>

          {/* Dynamic Content */}
          {loading ? (
            <div className="premium-preloader-container" style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="premium-preloader-spinner"></div>
              <div className="premium-preloader-text">Loading events timeline...</div>
            </div>
          ) : renderedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              No academic events currently logged for this period.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {renderedEvents.map(evt => {
                const style = getEventBadgeStyle(evt.type);
                return (
                  <div key={evt._id} className="card" style={{ display: 'flex', gap: '20px', background: 'rgba(255, 255, 255, 0.85)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', flexWrap: 'wrap' }}>
                    {/* Styled Date Calendar Icon */}
                    <div style={{ width: '80px', height: '80px', background: evt.type === 'Defense Viva' ? '#D97706' : '#133A26', color: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={24} style={{ marginBottom: '4px' }} />
                      <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', textAlign: 'center' }}>
                        {evt.type ? evt.type.replace(' ', '\n') : 'EVENT'}
                      </span>
                    </div>

                    {/* Event Details */}
                    <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', background: style.bg, color: style.color, padding: '3px 8px', borderRadius: '10px', fontWeight: 700 }}>
                          {style.label}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {evt.time}
                        </span>
                      </div>
                      
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827', lineHeight: '1.4', margin: 0 }}>
                        {evt.title}
                      </h3>
                      
                      <p style={{ fontSize: '0.88rem', color: '#374151', fontWeight: 500, margin: 0 }}>
                        📅 {new Date(evt.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                      <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                        📍 <strong>Venue:</strong> {evt.location}
                      </p>
                      <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
                        👤 {evt.speaker}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                      <a href={`mailto:events@hpu.ac.in?subject=Registration RSVP: ${evt.title}`} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem', textDecoration: 'none' }}>
                        RSVP Slot
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EventsPage;
