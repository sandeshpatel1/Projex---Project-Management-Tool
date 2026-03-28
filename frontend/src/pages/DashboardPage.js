import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { projectsApi, tasksApi } from '../utils/api';
import { format, isAfter, addDays } from 'date-fns';

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: projectsData } = useQuery({
    queryKey: ['projects-all'],
    queryFn: () => projectsApi.getAll({ limit: 100 }),
  });

  const projects = projectsData?.data?.data || [];
  const total = projectsData?.data?.pagination?.total || 0;
  const active = projects.filter((p) => p.status === 'active').length;
  const completed = projects.filter((p) => p.status === 'completed').length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Dashboard</h1>
          <p className="text-sm" style={{ marginTop: 2 }}>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <button className="btn btn-primary ml-auto" onClick={() => navigate('/projects')}>
          + New Project
        </button>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <FolderKanban size={16} color="var(--accent)" />
              <span className="text-xs">Total Projects</span>
            </div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{total}</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <TrendingUp size={16} color="var(--green)" />
              <span className="text-xs">Active</span>
            </div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{active}</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <CheckCircle2 size={16} color="var(--blue)" />
              <span className="text-xs">Completed</span>
            </div>
            <div className="stat-value" style={{ color: 'var(--blue)' }}>{completed}</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <Clock size={16} color="var(--amber)" />
              <span className="text-xs">Archived</span>
            </div>
            <div className="stat-value" style={{ color: 'var(--amber)' }}>
              {projects.filter((p) => p.status === 'archived').length}
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div style={{ marginBottom: 24 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Projects</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}>
              View all
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state">
              <FolderKanban size={48} />
              <h3>No projects yet</h3>
              <p>Create your first project to get started</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => navigate('/projects')}
              >
                + Create Project
              </button>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.slice(0, 6).map((p) => (
                <ProjectMiniCard key={p._id} project={p} onClick={() => navigate(`/projects/${p._id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ProjectMiniCard({ project, onClick }) {
  const taskCount = project.taskCount || 0;
  const statusColors = { active: 'var(--green)', completed: 'var(--blue)', archived: 'var(--text-3)' };

  return (
    <div className="project-card" onClick={onClick}>
      <div className="project-card-accent" style={{ background: project.color || 'var(--accent)' }} />
      <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
        <div className="color-dot" style={{ background: project.color || 'var(--accent)', width: 12, height: 12 }} />
        <span style={{ fontWeight: 600, fontSize: '0.95rem' }} className="truncate">{project.name}</span>
        <span className={`badge badge-${project.status} ml-auto`}>{project.status}</span>
      </div>
      {project.description && (
        <p className="text-sm" style={{ marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {project.description}
        </p>
      )}
      <div className="flex items-center gap-2 text-xs">
        <CheckCircle2 size={13} />
        <span>{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
