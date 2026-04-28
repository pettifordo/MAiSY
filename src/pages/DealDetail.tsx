import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Check, X, TrendingUp, MapPin, Building, Briefcase, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SectorBadge } from '../components/shared/SectorBadge';
import { StagePill } from '../components/shared/StagePill';
import { AvatarGroup } from '../components/shared/Avatar';
import { ActivityTimeline } from '../components/deals/ActivityTimeline';
import { DocumentList } from '../components/deals/DocumentList';
import { ContactsTab } from '../components/deals/ContactsTab';
import { TaskList } from '../components/tasks/TaskList';
import { DiligenceChecklist } from '../components/tasks/DiligenceChecklist';
import { format, parseISO } from 'date-fns';

type Tab = 'overview' | 'activity' | 'documents' | 'tasks' | 'diligence' | 'contacts';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'documents', label: 'Documents' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'diligence', label: 'Diligence' },
  { id: 'contacts', label: 'Contacts' },
];

export function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deal = useAppStore((s) => s.deals.find((d) => d.id === id));
  const stages = useAppStore((s) => s.stages);
  const team = useAppStore((s) => s.team);
  const updateDeal = useAppStore((s) => s.updateDeal);
  const moveDeal = useAppStore((s) => s.moveDeal);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [editingNextAction, setEditingNextAction] = useState(false);
  const [nextActionDraft, setNextActionDraft] = useState('');

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500">Deal not found.</p>
          <button onClick={() => navigate('/pipeline')} className="text-blue-600 text-sm mt-2 hover:underline">
            Back to pipeline
          </button>
        </div>
      </div>
    );
  }

  const stage = stages.find((s) => s.id === deal.stageId);
  const owners = team.filter((m) => deal.ownerIds.includes(m.id));
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const ebitdaMultiple = deal.financials.ebitda > 0
    ? (deal.financials.ev / deal.financials.ebitda).toFixed(1)
    : '—';

  const handleNextActionSave = () => {
    updateDeal(deal.id, { nextAction: nextActionDraft });
    setEditingNextAction(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors mt-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{deal.name}</h1>
              <SectorBadge sector={deal.sector} />
              {stage && <StagePill stage={stage} />}
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {deal.geography}
              </span>
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                {deal.ownership}
              </span>
              {owners.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {owners.map((o) => o.name).join(', ')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Stage selector */}
            <select
              value={deal.stageId}
              onChange={(e) => moveDeal(deal.id, e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortedStages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial summary bar */}
        <div className="mt-4 grid grid-cols-5 gap-4">
          {[
            { label: 'Revenue', value: `£${deal.financials.revenue}m` },
            { label: 'EBITDA', value: `£${deal.financials.ebitda}m` },
            { label: 'EBITDA Margin', value: `${deal.financials.ebitdaMargin.toFixed(1)}%` },
            { label: 'Enterprise Value', value: `£${deal.financials.ev}m` },
            { label: 'EV/EBITDA', value: `${ebitdaMultiple}x` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left column */}
            <div className="col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Company Overview</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {deal.description || 'No description provided.'}
                </p>
              </div>

              {/* Financial details */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Financials ({deal.financials.year})</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Revenue', value: `£${deal.financials.revenue}m`, sub: `${deal.financials.revenueGrowth > 0 ? '+' : ''}${deal.financials.revenueGrowth}% YoY` },
                    { label: 'EBITDA', value: `£${deal.financials.ebitda}m`, sub: `${deal.financials.ebitdaMargin.toFixed(1)}% margin` },
                    { label: 'Enterprise Value', value: `£${deal.financials.ev}m`, sub: `${ebitdaMultiple}x EBITDA` },
                    { label: 'Net Debt', value: `£${deal.financials.netDebt}m`, sub: 'At completion' },
                    { label: 'Revenue Growth', value: `${deal.financials.revenueGrowth > 0 ? '+' : ''}${deal.financials.revenueGrowth}%`, sub: 'Year-on-year' },
                    { label: 'EBITDA Margin', value: `${deal.financials.ebitdaMargin.toFixed(1)}%`, sub: 'As reported' },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-lg font-bold text-gray-900">{value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage history */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Stage History</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {deal.stageHistory.map((h, i) => {
                    const s = stages.find((st) => st.id === h.stageId);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        {i > 0 && <span className="text-gray-300">→</span>}
                        <div>
                          <span className="text-sm font-medium text-gray-700">{s?.name ?? h.stageId}</span>
                          <p className="text-xs text-gray-400">{format(parseISO(h.enteredAt), 'd MMM yy')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Next action */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Next Action</h3>
                  {!editingNextAction && (
                    <button
                      onClick={() => { setNextActionDraft(deal.nextAction); setEditingNextAction(true); }}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {editingNextAction ? (
                  <div className="space-y-2">
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={nextActionDraft}
                      onChange={(e) => setNextActionDraft(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={handleNextActionSave} className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingNextAction(false)} className="p-1.5 bg-gray-50 text-gray-500 rounded hover:bg-gray-100">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-700">{deal.nextAction || 'Not set'}</p>
                    {deal.nextActionDate && (
                      <p className="text-xs text-gray-400 mt-1">
                        {format(parseISO(deal.nextActionDate), 'd MMMM yyyy')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Deal info */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Deal Information</h3>
                {[
                  { label: 'Sector', value: deal.sector },
                  { label: 'Geography', value: deal.geography },
                  { label: 'Ownership', value: deal.ownership },
                  { label: 'Origination', value: deal.source },
                  { label: 'Advisors', value: deal.advisors || 'None' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="text-sm text-gray-700 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Team */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Deal Team</h3>
                <div className="space-y-2">
                  {owners.map((o) => (
                    <div key={o.id} className="flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: o.avatarColor }}
                      >
                        {o.initials}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{o.name}</p>
                        <p className="text-xs text-gray-400">{o.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <ActivityTimeline dealId={deal.id} />
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <DocumentList dealId={deal.id} />
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <TaskList dealId={deal.id} />
            </div>
          </div>
        )}

        {activeTab === 'diligence' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <DiligenceChecklist dealId={deal.id} />
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <ContactsTab dealId={deal.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
