import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Plus, LogOut, ChevronDown, Sun, Moon, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { projectsApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const navigate              = useNavigate();
  const { user, logout }      = useAuth();
  const { theme, toggleTheme }= useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data } = useQuery({
    queryKey: ['sidebar-projects'],
    queryFn:  () => projectsApi.getAll({ limit: 8, sortBy: 'created_at', sortOrder: 'desc' }),
    enabled:  !!user,
  });

  const projects = data?.data?.data || [];

  const handleLogout = async () => {
    try { await logout(); toast.success('Signed out'); }
    catch { toast.error('Could not sign out'); }
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  const isDark = theme === 'dark';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <span className="brand-name">Projex</span>
        {/* Theme toggle in sidebar */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            marginLeft: 'auto',
            width: 30, height: 30,
            borderRadius: '50%',
            border: '1px solid var(--border)',
            background: 'var(--bg-3)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isDark ? '#fbbf24' : '#6366f1',
            transition: 'all 0.25s ease',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-4)'; e.currentTarget.style.transform = 'rotate(20deg)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.transform = 'none'; }}
        >
          {isDark ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>

      {/* Nav */}
      <div className="sidebar-section">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={16} /> Dashboard
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FolderKanban size={16} /> All Projects
        </NavLink>
      </div>

      <div className="divider" />

      {/* Recent projects */}
      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-label">Recent Projects</div>
        {projects.map(p => (
          <button key={p._id} className="sidebar-link" onClick={() => navigate(`/projects/${p._id}`)}>
            <span className="dot" style={{ background: p.color || '#6366f1' }} />
            <span className="truncate" style={{ maxWidth: 148 }}>{p.name}</span>
            {p.status === 'completed' && (
              <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--green)', fontWeight: 700 }}>✓</span>
            )}
          </button>
        ))}
        <button className="sidebar-link" onClick={() => navigate('/projects')} style={{ marginTop: 4, opacity: 0.75 }}>
          <Plus size={14} /> New Project
        </button>
      </div>

      {/* User footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px' }}>
        <button className="sidebar-link" style={{ width: '100%', position: 'relative' }}
          onClick={() => setShowUserMenu(v => !v)}>
          {user?.photoURL
            ? <img src={user.photoURL} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
          }
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-0)' }} className="truncate">
              {user?.displayName || 'User'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }} className="truncate">{user?.email}</div>
          </div>
          <ChevronDown size={13} style={{ flexShrink: 0, transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </button>

        {showUserMenu && (
          <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, marginTop: 6, overflow: 'hidden' }}>
            <button className="sidebar-link" style={{ width: '100%', color: 'var(--red)', gap: 8 }} onClick={handleLogout}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
