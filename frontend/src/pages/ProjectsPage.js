import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, ExternalLink, FolderKanban, CheckCircle2 } from 'lucide-react';
import { projectsApi } from '../utils/api';
import ProjectModal from '../components/ProjectModal';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6'];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { page, search, statusFilter }],
    queryFn: () => projectsApi.getAll({ page, limit: 12, search, status: statusFilter }),
    keepPreviousData: true,
  });

  const projects = data?.data?.data || [];
  const pagination = data?.data?.pagination || {};

  const deleteMutation = useMutation({
    mutationFn: (id) => projectsApi.delete(id),
    onSuccess: () => {
      toast.success('Project deleted');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handleStatusFilter = (e) => { setStatusFilter(e.target.value); setPage(1); };

  return (
    <>
      <div className="page-header">
        <FolderKanban size={20} color="var(--accent)" />
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Projects</h1>
          <p className="text-xs">{pagination.total || 0} total projects</p>
        </div>
        <button className="btn btn-primary ml-auto" onClick={() => { setEditProject(null); setShowModal(true); }}>
          <Plus size={15} /> New Project
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={14} color="var(--text-3)" />
          <input placeholder="Search projects..." value={search} onChange={handleSearch} />
        </div>
        <select className="filter-select" value={statusFilter} onChange={handleStatusFilter}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="page-content">
        {isLoading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <FolderKanban size={48} />
            <h3>{search || statusFilter ? 'No projects match your filters' : 'No projects yet'}</h3>
            <p>Create your first project to get started</p>
            {!search && !statusFilter && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                + Create Project
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="projects-grid">
              {projects.map((p) => (
                <ProjectCard
                  key={p._id}
                  project={p}
                  onClick={() => navigate(`/projects/${p._id}`)}
                  onEdit={(e) => { e.stopPropagation(); setEditProject(p); setShowModal(true); }}
                  onDelete={(e) => { e.stopPropagation(); setDeleteId(p._id); }}
                />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={pagination.totalPages || 1}
              onPageChange={setPage}
              hasPrev={pagination.hasPrev}
              hasNext={pagination.hasNext}
            />
          </>
        )}
      </div>

      {showModal && (
        <ProjectModal
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null); }}
        />
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete Project"
          message="This will permanently delete the project and ALL its tasks. This action cannot be undone."
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </>
  );
}

function ProjectCard({ project, onClick, onEdit, onDelete }) {
  const taskCount = project.taskCount || 0;
  return (
    <div className="project-card" onClick={onClick}>
      <div className="project-card-accent" style={{ background: project.color || 'var(--accent)' }} />
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <div className="color-dot" style={{ background: project.color || 'var(--accent)', width: 12, height: 12 }} />
        <span style={{ fontWeight: 600, fontSize: '0.95rem', flex: 1 }} className="truncate">{project.name}</span>
        <span className={`badge badge-${project.status}`}>{project.status}</span>
      </div>

      {project.description && (
        <p className="text-sm" style={{ marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {project.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs" style={{ marginBottom: 14 }}>
        <CheckCircle2 size={13} />
        <span>{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex items-center gap-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>Edit</button>
        <button className="btn btn-ghost btn-sm" onClick={onDelete}>
          <Trash2 size={13} />
        </button>
        <span className="ml-auto">
          <ExternalLink size={13} color="var(--text-3)" />
        </span>
      </div>
    </div>
  );
}
