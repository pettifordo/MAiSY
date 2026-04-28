import { useState } from 'react';
import { Modal } from './Modal';
import { useAppStore } from '../../store/useAppStore';
import type { Sector } from '../../types';

const SECTORS: Sector[] = [
  'Specialty Chemicals',
  'Industrial Coatings',
  'Adhesives & Sealants',
  'Polymer Processing',
  'Performance Materials',
  'Agrochemicals',
  'Fine Chemicals',
];

interface Props {
  onClose: () => void;
}

export function NewDealModal({ onClose }: Props) {
  const stages = useAppStore((s) => s.stages);
  const team = useAppStore((s) => s.team);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const addDeal = useAppStore((s) => s.addDeal);

  const [form, setForm] = useState({
    name: '',
    description: '',
    sector: SECTORS[0] as Sector,
    geography: '',
    stageId: stages[0]?.id ?? 'prospect',
    revenue: '',
    ebitda: '',
    ev: '',
    ownership: '',
    advisors: '',
    source: '',
    nextAction: '',
    nextActionDate: '',
    ownerIds: [currentUserId],
  });

  const handle = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim()) return;
    const rev = parseFloat(form.revenue) || 0;
    const ebt = parseFloat(form.ebitda) || 0;
    const ev = parseFloat(form.ev) || 0;
    addDeal({
      name: form.name,
      description: form.description,
      sector: form.sector,
      geography: form.geography,
      stageId: form.stageId,
      financials: {
        revenue: rev,
        ebitda: ebt,
        ev,
        ebitdaMargin: rev > 0 ? (ebt / rev) * 100 : 0,
        revenueGrowth: 0,
        netDebt: 0,
        year: new Date().getFullYear(),
      },
      ownerIds: form.ownerIds,
      advisors: form.advisors,
      ownership: form.ownership,
      source: form.source,
      nextAction: form.nextAction,
      nextActionDate: form.nextActionDate,
    });
    onClose();
  };

  return (
    <Modal title="New Deal" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Company Name *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => handle('name', e.target.value)}
              placeholder="e.g. Acme Chemicals Ltd"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sector</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.sector}
              onChange={(e) => handle('sector', e.target.value)}
            >
              {SECTORS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Stage</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.stageId}
              onChange={(e) => handle('stageId', e.target.value)}
            >
              {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Geography</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.geography}
              onChange={(e) => handle('geography', e.target.value)}
              placeholder="e.g. UK (Midlands)"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ownership</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.ownership}
              onChange={(e) => handle('ownership', e.target.value)}
              placeholder="e.g. PE-backed, Family-owned"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Revenue (£m)</label>
            <input
              type="number"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.revenue}
              onChange={(e) => handle('revenue', e.target.value)}
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">EBITDA (£m)</label>
            <input
              type="number"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.ebitda}
              onChange={(e) => handle('ebitda', e.target.value)}
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">EV (£m)</label>
            <input
              type="number"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.ev}
              onChange={(e) => handle('ev', e.target.value)}
              placeholder="0.0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Origination Source</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.source}
              onChange={(e) => handle('source', e.target.value)}
              placeholder="e.g. Intermediary, Proprietary"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Deal Owner(s)</label>
            <div className="flex flex-wrap gap-2">
              {team.map((m) => (
                <label key={m.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ownerIds.includes(m.id)}
                    onChange={(e) =>
                      handle(
                        'ownerIds',
                        e.target.checked
                          ? [...form.ownerIds, m.id]
                          : form.ownerIds.filter((id) => id !== m.id)
                      )
                    }
                  />
                  <span className="text-sm text-gray-700">{m.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Next Action</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.nextAction}
              onChange={(e) => handle('nextAction', e.target.value)}
              placeholder="What's the next step?"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Next Action Date</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.nextActionDate}
              onChange={(e) => handle('nextActionDate', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={form.description}
              onChange={(e) => handle('description', e.target.value)}
              placeholder="Brief company description..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Deal
          </button>
        </div>
      </div>
    </Modal>
  );
}
