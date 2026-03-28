import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { projectsApi, tasksApi } from '../utils/api';
import { differenceInHours, differenceInMinutes, isPast, isValid, parseISO } from 'date-fns';

// How often to check (ms)
const CHECK_INTERVAL = 5 * 60 * 1000; // every 5 minutes
// Only notify for tasks due within this many hours
const NOTIFY_WINDOW_HOURS = 48;

function formatTimeLeft(dueDate) {
  const now    = new Date();
  const due    = new Date(dueDate);
  const mins   = differenceInMinutes(due, now);
  const hours  = differenceInHours(due, now);

  if (isPast(due))           return { label: 'OVERDUE',      color: '#ef4444', emoji: '🚨' };
  if (mins < 60)             return { label: `${mins}m left`,  color: '#ef4444', emoji: '⏰' };
  if (hours < 24)            return { label: `${hours}h left`, color: '#f59e0b', emoji: '⚠️' };
  return                            { label: `${hours}h left`, color: '#f59e0b', emoji: '📅' };
}

// Custom toast renderer for reminders
function reminderToast(task, timeInfo) {
  toast.custom(
    (t) => (
      <div
        onClick={() => toast.dismiss(t.id)}
        style={{
          display:       'flex',
          alignItems:    'flex-start',
          gap:           10,
          background:    '#1a1a2e',
          border:        `1px solid ${timeInfo.color}44`,
          borderLeft:    `4px solid ${timeInfo.color}`,
          borderRadius:  10,
          padding:       '12px 14px',
          boxShadow:     '0 8px 32px rgba(0,0,0,0.5)',
          cursor:        'pointer',
          minWidth:      280,
          maxWidth:      340,
          animation:     t.visible ? 'slideInRight 0.3s ease' : 'slideOutRight 0.3s ease',
          fontFamily:    "'Outfit', sans-serif",
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{timeInfo.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: timeInfo.color, marginBottom: 2 }}>
            {isPast(new Date(task.due_date)) ? 'Task Overdue!' : 'Due Soon'}
          </div>
          <div style={{
            fontWeight: 500, fontSize: 13, color: '#f1f5f9',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {task.title}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{
              background: `${timeInfo.color}22`, color: timeInfo.color,
              borderRadius: 99, padding: '1px 7px', fontWeight: 600,
            }}>
              {timeInfo.label}
            </span>
            <span>•</span>
            <span style={{ textTransform: 'capitalize' }}>{task.priority} priority</span>
          </div>
        </div>
      </div>
    ),
    {
      position: 'bottom-right',
      duration:  8000,
      id:        `reminder-${task._id}`,  // deduplicates same task
    }
  );
}

export function useDueReminders(isAuthenticated) {
  const notifiedRef = useRef(new Set());

  const checkDueTasks = async () => {
    if (!isAuthenticated) return;

    try {
      // Fetch all projects, then scan tasks across them
      const projRes  = await projectsApi.getAll({ limit: 100 });
      const projects = projRes?.data?.data || [];

      for (const project of projects) {
        const taskRes = await tasksApi.getByProject(project._id, {
          limit: 50,
          status: 'todo',       // only incomplete tasks
          sortBy: 'due_date',
          sortOrder: 'asc',
        });
        const tasks = taskRes?.data?.data || [];

        for (const task of tasks) {
          if (!task.due_date) continue;
          if (task.status === 'done') continue;

          const due   = new Date(task.due_date);
          if (!isValid(due)) continue;

          const hoursLeft = differenceInHours(due, new Date());

          // Only notify if within window
          if (hoursLeft > NOTIFY_WINDOW_HOURS && !isPast(due)) continue;

          // Skip already notified in this session (unless overdue — always show)
          const notifyKey = `${task._id}-${Math.floor(Date.now() / CHECK_INTERVAL)}`;
          if (notifiedRef.current.has(notifyKey) && !isPast(due)) continue;

          // Only notify high + medium for upcoming; all priorities if overdue
          if (!isPast(due) && task.priority === 'low' && hoursLeft > 24) continue;

          notifiedRef.current.add(notifyKey);
          const timeInfo = formatTimeLeft(task.due_date);
          reminderToast(task, timeInfo);
        }
      }
    } catch (_) {
      // Silent fail — reminders are best-effort
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Check once on mount (after short delay)
    const initial = setTimeout(checkDueTasks, 3000);

    // Then check every interval
    const interval = setInterval(checkDueTasks, CHECK_INTERVAL);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [isAuthenticated]);
}
