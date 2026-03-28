import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Plus, Tag } from 'lucide-react';
import { tasksApi } from '../utils/api';
import { format } from 'date-fns';

export default function TaskModal({ task, projectId, onClose }) {
  const isEdit = Boolean(task);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
    assignee: task?.assignee || '',
    tags: task?.tags || [],
  });
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? tasksApi.update(task._id, { ...data, due_date: data.due_date || null })
        : tasksApi.create(projectId, { ...data, due_date: data.due_date || null }),
    onSuccess: () => {
      toast.success(isEdit ? 'Task updated!' : 'Task created!');
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    else if (form.title.length > 200) e.title = 'Max 200 characters';
    if (form.description.length > 1000) e.description = 'Max 1000 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) mutation.mutate(form);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm({ ...form, tags: [...form.tags, t] });
    }
    setTagInput('');
  };

  const removeTag = (tag) => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              className="form-input"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Add more details..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-row" style={{ marginTop: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assignee</label>
              <input
                className="form-input"
                placeholder="e.g. john.doe"
                value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Tags</label>
            <div className="flex items-center gap-2">
              <input
                className="form-input"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                style={{ flex: 1 }}
              />
              <button className="btn btn-ghost btn-sm" onClick={addTag}><Plus size={14} /></button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex items-center gap-2" style={{ flexWrap: 'wrap', marginTop: 8 }}>
                {form.tags.map((tag) => (
                  <button
                    key={tag}
                    className="tag-chip"
                    onClick={() => removeTag(tag)}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
