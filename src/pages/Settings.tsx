import { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, GripVertical } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { Stage } from '../types';

export function Settings() {
  const team = useAppStore((s) => s.team);
  const stages = useAppStore((s) => s.stages);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const addStage = useAppStore((s) => s.addStage);
  const updateStage = useAppStore((s) => s.updateStage);
  const deleteStage = useAppStore((s) => s.deleteStage);

  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [stageDraft, setStageDraft] = useState<Partial<Stage>>({});
  const [addingStage, setAddingStage] = useState(false);
  const [newStage, setNewStage] = useState({ name: '', probability: 50, color: '#6b7280' });

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const startEdit = (stage: Stage) => {
    setEditingStage(stage.id);
    setStageDraft({ name: stage.name, probability: stage.probability, color: stage.color });
  };

  const saveEdit = (id: string) => {
    updateStage(id, stageDraft);
    setEditingStage(null);
  };

  const handleAddStage = () => {
    if (!newStage.name.trim()) return;
    addStage({
      name: newStage.name,
      probability: newStage.probability,
      color: newStage.color,
      order: stages.length,
    });
    setNewStage({ name: '', probability: 50, color: '#6b7280' });
    setAddingStage(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your pipeline stages and team</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-3xl">
        {/* Current user */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Active User</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-600 mb-3">
              Select who you are logged in as (demo mode — no authentication required).
            </p>
            <div className="space-y-2">
              {team.map((member) => (
                <label
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                    currentUserId === member.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="currentUser"
                    value={member.id}
                    checked={currentUserId === member.id}
                    onChange={() => setCurrentUser(member.id)}
                    className="sr-only"
                  />
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.initials}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.role} &bull; {member.email}</p>
                  </div>
                  {currentUserId === member.id && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                      You
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Pipeline stages */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Pipeline Stages</h2>
            <button
              onClick={() => setAddingStage(true)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add stage
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="col-span-1" />
              <div className="col-span-5">Stage Name</div>
              <div className="col-span-2">Color</div>
              <div className="col-span-2">Probability</div>
              <div className="col-span-2" />
            </div>

            {sortedStages.map((stage) => (
              <div
                key={stage.id}
                className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="col-span-1 text-gray-300">
                  <GripVertical className="w-4 h-4" />
                </div>

                {editingStage === stage.id ? (
                  <>
                    <div className="col-span-5">
                      <input
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={stageDraft.name ?? ''}
                        onChange={(e) => setStageDraft((d) => ({ ...d, name: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="color"
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                        value={stageDraft.color ?? '#6b7280'}
                        onChange={(e) => setStageDraft((d) => ({ ...d, color: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={stageDraft.probability ?? 0}
                        onChange={(e) => setStageDraft((d) => ({ ...d, probability: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="col-span-2 flex gap-1.5">
                      <button onClick={() => saveEdit(stage.id)} className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingStage(null)} className="p-1.5 bg-gray-50 text-gray-500 rounded hover:bg-gray-100">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-5 flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="text-sm font-medium text-gray-800">{stage.name}</span>
                    </div>
                    <div className="col-span-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-200"
                        style={{ backgroundColor: stage.color }}
                      />
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600">{stage.probability}%</span>
                    </div>
                    <div className="col-span-2 flex gap-1.5">
                      <button
                        onClick={() => startEdit(stage)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteStage(stage.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {addingStage && (
              <div className="grid grid-cols-12 gap-2 items-center px-4 py-3 bg-blue-50 border-t border-blue-100">
                <div className="col-span-1" />
                <div className="col-span-5">
                  <input
                    className="w-full border border-blue-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="Stage name"
                    value={newStage.name}
                    onChange={(e) => setNewStage((s) => ({ ...s, name: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="color"
                    className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                    value={newStage.color}
                    onChange={(e) => setNewStage((s) => ({ ...s, color: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full border border-blue-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={newStage.probability}
                    onChange={(e) => setNewStage((s) => ({ ...s, probability: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="col-span-2 flex gap-1.5">
                  <button onClick={handleAddStage} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setAddingStage(false)} className="p-1.5 bg-white text-gray-500 rounded hover:bg-gray-50 border border-gray-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Team */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Team Members</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {team.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-b-0"
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: member.avatarColor }}
                >
                  {member.initials}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  member.role === 'Admin'
                    ? 'bg-purple-100 text-purple-700'
                    : member.role === 'Deal Lead'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Reset data */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Data</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-600 mb-4">
              All data is stored in your browser's localStorage. Clearing it will reset the app to the seed data on next reload.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('maisy-store');
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-200"
            >
              Reset to Seed Data
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
