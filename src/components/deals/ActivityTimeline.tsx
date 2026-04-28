import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { MessageSquare, Phone, Mail, Users, RefreshCw, Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Activity } from '../../types';

const TYPE_CONFIG: Record<Activity['type'], { icon: typeof MessageSquare; color: string; label: string }> = {
  note: { icon: MessageSquare, color: 'bg-gray-100 text-gray-600', label: 'Note' },
  call: { icon: Phone, color: 'bg-blue-100 text-blue-600', label: 'Call' },
  email: { icon: Mail, color: 'bg-indigo-100 text-indigo-600', label: 'Email' },
  meeting: { icon: Users, color: 'bg-amber-100 text-amber-600', label: 'Meeting' },
  update: { icon: RefreshCw, color: 'bg-green-100 text-green-600', label: 'Update' },
};

interface Props {
  dealId: string;
}

export function ActivityTimeline({ dealId }: Props) {
  const activities = useAppStore((s) =>
    s.activities.filter((a) => a.dealId === dealId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  );
  const team = useAppStore((s) => s.team);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const addActivity = useAppStore((s) => s.addActivity);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ type: 'note' as Activity['type'], title: '', body: '' });

  const handleAdd = () => {
    if (!form.title.trim()) return;
    addActivity({
      dealId,
      type: form.type,
      title: form.title,
      body: form.body,
      authorId: currentUserId,
    });
    setForm({ type: 'note', title: '', body: '' });
    setAdding(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Activity</h3>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <Plus className="w-4 h-4" />
          Log activity
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <div className="flex gap-2">
            {(Object.keys(TYPE_CONFIG) as Activity['type'][]).map((t) => (
              <button
                key={t}
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  form.type === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Notes..."
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {activities.map((activity, idx) => {
          const config = TYPE_CONFIG[activity.type];
          const Icon = config.icon;
          const author = team.find((m) => m.id === activity.authorId);
          return (
            <div key={activity.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {idx < activities.length - 1 && (
                  <div className="w-px flex-1 bg-gray-100 mt-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {author?.name ?? 'Unknown'} &bull; {format(parseISO(activity.createdAt), 'd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                {activity.body && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{activity.body}</p>
                )}
              </div>
            </div>
          );
        })}
        {activities.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No activity recorded yet.</p>
        )}
      </div>
    </div>
  );
}
