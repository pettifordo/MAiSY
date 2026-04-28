import { useState, useMemo } from 'react';
import { format, parseISO, isPast } from 'date-fns';
import { Plus, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { TaskStatus } from '../../types';

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: typeof Circle }> = {
  'open': { label: 'Open', color: 'text-gray-500', icon: Circle },
  'in-progress': { label: 'In Progress', color: 'text-blue-600', icon: Clock },
  'done': { label: 'Done', color: 'text-green-600', icon: CheckCircle2 },
};

interface Props {
  dealId: string;
}

export function TaskList({ dealId }: Props) {
  const allTasks = useAppStore((s) => s.tasks);
  const tasks = useMemo(() =>
    allTasks.filter((t) => t.dealId === dealId).sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    ),
    [allTasks, dealId]
  );
  const team = useAppStore((s) => s.team);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const deleteTask = useAppStore((s) => s.deleteTask);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', ownerId: currentUserId, dueDate: '' });

  const handleAdd = () => {
    if (!form.title.trim()) return;
    addTask({
      dealId,
      title: form.title,
      ownerId: form.ownerId,
      dueDate: form.dueDate,
      status: 'open',
    });
    setForm({ title: '', ownerId: currentUserId, dueDate: '' });
    setAdding(false);
  };

  const cycleStatus = (id: string, current: TaskStatus) => {
    const order: TaskStatus[] = ['open', 'in-progress', 'done'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    updateTask(id, { status: next });
  };

  const openCount = tasks.filter((t) => t.status !== 'done').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Tasks</h3>
          {openCount > 0 && (
            <p className="text-xs text-gray-500">{openCount} open</p>
          )}
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add task
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Owner</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                value={form.ownerId}
                onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
              >
                {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button onClick={handleAdd} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">Add</button>
          </div>
        </div>
      )}

      {tasks.length === 0 && !adding ? (
        <p className="text-sm text-gray-400 text-center py-8">No tasks yet.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const config = STATUS_CONFIG[task.status];
            const Icon = config.icon;
            const owner = team.find((m) => m.id === task.ownerId);
            const isOverdue = task.status !== 'done' && task.dueDate && isPast(parseISO(task.dueDate));

            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-lg border group transition-colors ${
                  task.status === 'done'
                    ? 'bg-gray-50 border-gray-100'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <button
                  onClick={() => cycleStatus(task.id, task.status)}
                  className={`shrink-0 ${config.color} hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {owner && (
                      <span className="text-xs text-gray-400">{owner.name}</span>
                    )}
                    {task.dueDate && (
                      <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        Due {format(parseISO(task.dueDate), 'd MMM')}
                        {isOverdue && ' (overdue)'}
                      </span>
                    )}
                  </div>
                </div>
                <select
                  value={task.status}
                  onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                  className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
