import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Plus, LayoutList, Columns, Search,
  Trash2, Pencil, CheckCircle2, Circle, Clock, AlertTriangle, Flag
} from 'lucide-react';
import { projectsApi, tasksApi } from '../utils/api';
import TaskModal from '../components/TaskModal';
import ConfirmModal from '../components/ConfirmModal';
import Pagination from '../components/Pagination';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';

const STATUS_CONFIG = {
  'todo': { label: 'To Do', color: 'var(--text-2)', bg: 'var(--bg-4)' },
  'in-progress': { label: 'In Progress', color: 'var(--blue)', bg: 'var(--blue-dim)' },
  'done': { label: 'Done', color: 'var(--green)', bg: 'var(--green-dim)' },
};

const PRIORITY_CONFIG = {
  low: { color: 'var(--green)', label: 'Low' },
  medium: { color: 'var(--amber)', label: 'Medium' },
  high: { color: 'var(--red)', label: 'High' },
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [view, setView] = useState('list');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id, { page, search, statusFilter, priorityFilter, sortBy, sortOrder }],
    queryFn: () =>
      tasksApi.getByProject(id, {
        page, limit: view === 'kanban' ? 100 : 15,
        search, status: statusFilter, priority: priorityFilter,
        sortBy, sortOrder,
      }),
    keepPreviousData: true,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => tasksApi.delete(taskId),
    onSuccess: () => {
      toast.success('Task deleted');
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setDeleteTaskId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => tasksApi.updateStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (err) => toast.error(err.message),
  });

  const project = projectData?.data?.data;
  const tasks = tasksData?.data?.data || [];
  const pagination = tasksData?.data?.pagination || {};
  const taskStats = project?.taskStats || {};

  const totalTasks = (taskStats.todo || 0) + (taskStats['in-progress'] || 0) + (taskStats.done || 0);
  const donePercent = totalTasks > 0 ? Math.round((taskStats.done / totalTasks) * 100) : 0;

  const cycleStatus = (current) => {
    const cycle = { 'todo': 'in-progress', 'in-progress': 'done', 'done': 'todo' };
    return cycle[current];
  };

  if (projectLoading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!project) return (
    <div className="page-content">
      <div className="empty-state">
        <h3>Project not found</h3>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/projects')}>
          Back to Projects
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/projects')}>
          <ArrowLeft size={16} />
        </button>
        <div className="color-dot" style={{ background: project.color || 'var(--accent)', width: 14, height: 14 }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{project.name}</h1>
          {project.description && (
            <p className="text-xs" style={{ marginTop: 1 }}>{project.description}</p>
          )}
        </div>
        <span className={`badge badge-${project.status}`}>{project.status}</span>
        <button
          className="btn btn-primary"
          onClick={() => { setEditTask(null); setShowTaskModal(true); }}
        >
          <Plus size={15} /> Add Task
        </button>
      </div>

      {/* Project stats bar */}
      <div style={{ padding: '14px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)' }}>
        <div className="flex items-center gap-16" style={{ marginBottom: 8, flexWrap: 'wrap', gap: '16px 32px' }}>
          {Object.entries(taskStats).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_CONFIG[status]?.color, display: 'inline-block' }} />
              <span className="text-xs">{STATUS_CONFIG[status]?.label}: <strong style={{ color: 'var(--text-0)' }}>{count}</strong></span>
            </div>
          ))}
          <span className="text-xs ml-auto">{donePercent}% complete</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${donePercent}%`, background: 'var(--green)' }} />
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={14} color="var(--text-3)" />
          <input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select className="filter-select" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select className="filter-select" value={`${sortBy}:${sortOrder}`} onChange={(e) => {
          const [f, o] = e.target.value.split(':');
          setSortBy(f); setSortOrder(o); setPage(1);
        }}>
          <option value="created_at:desc">Newest</option>
          <option value="created_at:asc">Oldest</option>
          <option value="due_date:asc">Due Date ↑</option>
          <option value="due_date:desc">Due Date ↓</option>
          <option value="priority:desc">Priority ↓</option>
        </select>

        <div className="ml-auto view-toggle">
          <button className={`view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
            <LayoutList size={15} />
          </button>
          <button className={`view-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>
            <Columns size={15} />
          </button>
        </div>
      </div>

      <div className="page-content">
        {tasksLoading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={48} />
            <h3>{search || statusFilter || priorityFilter ? 'No tasks match your filters' : 'No tasks yet'}</h3>
            <p>Add your first task to get started</p>
            {!search && !statusFilter && !priorityFilter && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowTaskModal(true)}>
                + Add Task
              </button>
            )}
          </div>
        ) : view === 'kanban' ? (
          <KanbanView
            tasks={tasks}
            onEdit={(t) => { setEditTask(t); setShowTaskModal(true); }}
            onDelete={(tid) => setDeleteTaskId(tid)}
            onStatusChange={(taskId, status) => updateStatusMutation.mutate({ taskId, status })}
          />
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map((task) => (
                <TaskItem
                  key={task._id}
                  task={task}
                  onEdit={() => { setEditTask(task); setShowTaskModal(true); }}
                  onDelete={() => setDeleteTaskId(task._id)}
                  onCycleStatus={() => updateStatusMutation.mutate({ taskId: task._id, status: cycleStatus(task.status) })}
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

      {showTaskModal && (
        <TaskModal
          task={editTask}
          projectId={id}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
        />
      )}

      {deleteTaskId && (
        <ConfirmModal
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={() => deleteTaskMutation.mutate(deleteTaskId)}
          onCancel={() => setDeleteTaskId(null)}
          loading={deleteTaskMutation.isPending}
        />
      )}
    </>
  );
}

function getDueDateClass(due_date) {
  if (!due_date) return '';
  const d = new Date(due_date);
  if (isPast(d)) return 'overdue';
  if (isWithinInterval(d, { start: new Date(), end: addDays(new Date(), 2) })) return 'due-soon';
  return 'due-ok';
}

function TaskItem({ task, onEdit, onDelete, onCycleStatus }) {
  const cfg = STATUS_CONFIG[task.status];
  const dueCls = getDueDateClass(task.due_date);

  return (
    <div className={`task-item ${task.status === 'done' ? 'done' : ''}`}>
      <button
        className={`status-btn ${task.status}`}
        onClick={onCycleStatus}
        title={`Click to change to ${task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in-progress' : 'done'}`}
      >
        {task.status === 'done' && <CheckCircle2 size={12} color="#fff" />}
        {task.status === 'in-progress' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
          <span style={{ fontWeight: 500, fontSize: '0.9rem', textDecoration: task.status === 'done' ? 'line-through' : 'none' }} className="truncate">
            {task.title}
          </span>
        </div>

        {task.description && (
          <p className="text-xs" style={{ marginBottom: 6 }} >{task.description}</p>
        )}

        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <span className={`badge badge-${task.status}`}>{STATUS_CONFIG[task.status]?.label}</span>
          <span className={`badge badge-${task.priority}`}>
            <Flag size={10} /> {task.priority}
          </span>
          {task.due_date && (
            <span className={`text-xs flex items-center gap-1 ${dueCls}`}>
              <Clock size={11} />
              {format(new Date(task.due_date), 'MMM d, yyyy')}
            </span>
          )}
          {task.assignee && (
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>@{task.assignee}</span>
          )}
          {task.tags?.map((tag) => (
            <span key={tag} className="tag-chip">{tag}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="btn btn-ghost btn-sm btn-icon" onClick={onEdit}><Pencil size={13} /></button>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={onDelete}><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

function KanbanView({ tasks, onEdit, onDelete, onStatusChange }) {
  const columns = [
    { key: 'todo', label: 'To Do', color: 'var(--text-2)' },
    { key: 'in-progress', label: 'In Progress', color: 'var(--blue)' },
    { key: 'done', label: 'Done', color: 'var(--green)' },
  ];

  return (
    <div className="kanban-board">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        return (
          <div key={col.key} className="kanban-col">
            <div className="kanban-col-header">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
              <span style={{ color: col.color }}>{col.label}</span>
              <span style={{ marginLeft: 'auto', background: 'var(--bg-4)', borderRadius: 99, padding: '1px 8px', fontSize: '0.75rem' }}>
                {colTasks.length}
              </span>
            </div>
            <div className="kanban-col-body">
              {colTasks.length === 0 && (
                <div className="text-xs" style={{ color: 'var(--text-3)', textAlign: 'center', padding: '24px 0' }}>No tasks</div>
              )}
              {colTasks.map((task) => (
                <div key={task._id} className="kanban-task" onClick={() => onEdit(task)}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: 8 }}>{task.title}</div>
                  <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                    <span className={`badge badge-${task.priority}`}>
                      <Flag size={10} /> {task.priority}
                    </span>
                    {task.due_date && (
                      <span className={`text-xs flex items-center gap-1 ${getDueDateClass(task.due_date)}`}>
                        <Clock size={10} />
                        {format(new Date(task.due_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1" style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    {col.key !== 'done' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                        onClick={(e) => { e.stopPropagation(); onStatusChange(task._id, col.key === 'todo' ? 'in-progress' : 'done'); }}
                      >
                        → Move {col.key === 'todo' ? 'In Progress' : 'Done'}
                      </button>
                    )}
                    {col.key === 'done' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                        onClick={(e) => { e.stopPropagation(); onStatusChange(task._id, 'todo'); }}
                      >
                        ↩ Reopen
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm btn-icon ml-auto" onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
