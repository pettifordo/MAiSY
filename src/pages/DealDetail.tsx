import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Check, X, MapPin, Building, Users,
  MessageSquare, Phone, Mail, Users2, RefreshCw,
  FileText, CheckSquare, AlertCircle, Calendar,
} from 'lucide-react';
import { format, parseISO, isPast, differenceInDays } from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { SectorBadge } from '../components/shared/SectorBadge';
import { StagePill } from '../components/shared/StagePill';
import { ActivityTimeline } from '../components/deals/ActivityTimeline';
import { DocumentList } from '../components/deals/DocumentList';
import { ContactsTab } from '../components/deals/ContactsTab';
import { TaskList } from '../components/tasks/TaskList';
import { DiligenceChecklist } from '../components/tasks/DiligenceChecklist';
import type { Activity, Document, DiligenceCategory } from '../types';

type Tab = 'overview' | 'activity' | 'documents' | 'tasks' | 'diligence' | 'contacts';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'documents', label: 'Documents' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'diligence', label: 'Diligence' },
  { id: 'contacts', label: 'Contacts' },
];

const ACTIVITY_TYPE_CONFIG: Record<Activity['type'], { icon: typeof MessageSquare; color: string; label: string }> = {
  note: { icon: MessageSquare, color: 'bg-gray-100 text-gray-600', label: 'Note' },
  call: { icon: Phone, color: 'bg-blue-100 text-blue-600', label: 'Call' },
  email: { icon: Mail, color: 'bg-indigo-100 text-indigo-600', label: 'Email' },
  meeting: { icon: Users2, color: 'bg-amber-100 text-amber-600', label: 'Meeting' },
  update: { icon: RefreshCw, color: 'bg-green-100 text-green-600', label: 'Update' },
};

const DOC_TYPE_COLORS: Record<Document['type'], string> = {
  NDA: 'bg-gray-100 text-gray-700 border-gray-200',
  CIM: 'bg-blue-50 text-blue-700 border-blue-200',
  LOI: 'bg-orange-50 text-orange-700 border-orange-200',
  Model: 'bg-green-50 text-green-700 border-green-200',
  Report: 'bg-purple-50 text-purple-700 border-purple-200',
  Other: 'bg-slate-50 text-slate-700 border-slate-200',
};

const DILIGENCE_CAT_COLORS: Record<DiligenceCategory, { bar: string; text: string; bg: string }> = {
  Legal: { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
  Financial: { bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
  Commercial: { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
  Operational: { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
};

export function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deal = useAppStore((s) => s.deals.find((d) => d.id === id));
  const stages = useAppStore((s) => s.stages);
  const team = useAppStore((s) => s.team);
  const updateDeal = useAppStore((s) => s.updateDeal);
  const moveDeal = useAppStore((s) => s.moveDeal);
  const activities = useAppStore((s) => s.activities.filter((a) => a.dealId === id));
  const documents = useAppStore((s) => s.documents.filter((d) => d.dealId === id));
  const tasks = useAppStore((s) => s.tasks.filter((t) => t.dealId === id));
  const diligenceItems = useAppStore((s) => s.diligenceItems.filter((di) => di.dealId === id));
  const contacts = useAppStore((s) => s.contacts.filter((c) => c.dealId === id));

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [editingNextAction, setEditingNextAction] = useState(false);
  const [nextActionDraft, setNextActionDraft] = useState('');

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500">Deal not found.</p>
          <button onClick={() => navigate('/pipeline')} className="text-blue-600 text-sm mt-2 hover:underline">Back to pipeline</button>
        </div>
      </div>
    );
  }

  const stage = stages.find((s) => s.id === deal.stageId);
  const owners = team.filter((m) => deal.ownerIds.includes(m.id));
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const ebitdaMultiple = deal.financials.ebitda > 0 ? (deal.financials.ev / deal.financials.ebitda).toFixed(1) : '—';

  // Tab badges
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const overdueTasks = openTasks.filter((t) => t.dueDate && isPast(parseISO(t.dueDate)));
  const diligenceChecked = diligenceItems.filter((di) => di.checked).length;
  const primaryContact = contacts.find((c) => c.isPrimary) ?? contacts[0];

  const handleNextActionSave = () => {
    updateDeal(deal.id, { nextAction: nextActionDraft });
    setEditingNextAction(false);
  };

  // ── Activity tab stats ──────────────────────────────────────────────────
  const activityByType = (Object.keys(ACTIVITY_TYPE_CONFIG) as Activity['type'][]).map((type) => ({
    type,
    count: activities.filter((a) => a.type === type).length,
    ...ACTIVITY_TYPE_CONFIG[type],
  })).filter((t) => t.count > 0);
  const lastActivity = [...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  // ── Document tab stats ──────────────────────────────────────────────────
  const docTypes: Document['type'][] = ['NDA', 'CIM', 'LOI', 'Model', 'Report', 'Other'];
  const docByType = docTypes.map((type) => ({
    type,
    count: documents.filter((d) => d.type === type).length,
  })).filter((d) => d.count > 0);
  const totalSizeMb = (documents.reduce((s, d) => s + d.sizeKb, 0) / 1024).toFixed(1);
  const latestDoc = [...documents].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];

  // ── Task tab stats ──────────────────────────────────────────────────────
  const taskStats = {
    open: tasks.filter((t) => t.status === 'open').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    overdue: overdueTasks.length,
  };

  // ── Diligence tab stats ─────────────────────────────────────────────────
  const categories: DiligenceCategory[] = ['Legal', 'Financial', 'Commercial', 'Operational'];
  const catStats = categories.map((cat) => {
    const items = diligenceItems.filter((di) => di.category === cat);
    return { cat, total: items.length, checked: items.filter((di) => di.checked).length };
  }).filter((c) => c.total > 0);
  const overallPct = diligenceItems.length > 0
    ? Math.round((diligenceChecked / diligenceItems.length) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{deal.name}</h1>
              <SectorBadge sector={deal.sector} />
              {stage && <StagePill stage={stage} />}
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{deal.geography}</span>
              <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" />{deal.ownership}</span>
              {owners.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {owners.map((o) => o.name).join(', ')}
                </span>
              )}
            </div>
          </div>
          <select
            value={deal.stageId}
            onChange={(e) => moveDeal(deal.id, e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortedStages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Financial summary bar */}
        <div className="mt-4 grid grid-cols-5 gap-3">
          {[
            { label: 'Revenue', value: `£${deal.financials.revenue}m` },
            { label: 'EBITDA', value: `£${deal.financials.ebitda}m` },
            { label: 'EBITDA Margin', value: `${deal.financials.ebitdaMargin.toFixed(1)}%` },
            { label: 'Enterprise Value', value: `£${deal.financials.ev}m` },
            { label: 'EV / EBITDA', value: `${ebitdaMultiple}x` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6">
        <div className="flex">
          {TABS.map((tab) => {
            // Badge logic
            let badge: string | null = null;
            if (tab.id === 'activity' && activities.length > 0) badge = String(activities.length);
            if (tab.id === 'documents' && documents.length > 0) badge = String(documents.length);
            if (tab.id === 'tasks' && openTasks.length > 0) badge = String(openTasks.length);
            if (tab.id === 'diligence' && diligenceItems.length > 0) badge = `${overallPct}%`;
            if (tab.id === 'contacts' && contacts.length > 0) badge = String(contacts.length);
            const hasAlert = (tab.id === 'tasks' && overdueTasks.length > 0);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {badge && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    hasAlert ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Company Overview</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{deal.description || 'No description provided.'}</p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Financials ({deal.financials.year}A)</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Revenue', value: `£${deal.financials.revenue}m`, sub: `${deal.financials.revenueGrowth > 0 ? '+' : ''}${deal.financials.revenueGrowth}% YoY` },
                    { label: 'EBITDA', value: `£${deal.financials.ebitda}m`, sub: `${deal.financials.ebitdaMargin.toFixed(1)}% margin` },
                    { label: 'Enterprise Value', value: `£${deal.financials.ev}m`, sub: `${ebitdaMultiple}x EBITDA` },
                    { label: 'Net Debt', value: `£${deal.financials.netDebt}m`, sub: 'At completion' },
                    { label: 'Revenue Growth', value: `${deal.financials.revenueGrowth > 0 ? '+' : ''}${deal.financials.revenueGrowth}%`, sub: 'Year-on-year' },
                    { label: 'EBITDA Margin', value: `${deal.financials.ebitdaMargin.toFixed(1)}%`, sub: 'As reported' },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-lg font-bold text-gray-900">{value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage history — enhanced timeline */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Deal Timeline</h3>
                <div className="relative">
                  {deal.stageHistory.map((h, i) => {
                    const s = stages.find((st) => st.id === h.stageId);
                    const next = deal.stageHistory[i + 1];
                    const daysInStage = next
                      ? differenceInDays(parseISO(next.enteredAt), parseISO(h.enteredAt))
                      : null;
                    const isCurrent = i === deal.stageHistory.length - 1;
                    return (
                      <div key={i} className="flex gap-4 mb-3 last:mb-0">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-3 h-3 rounded-full mt-1 shrink-0"
                            style={{ backgroundColor: s?.color ?? '#6b7280' }}
                          />
                          {i < deal.stageHistory.length - 1 && (
                            <div className="w-px flex-1 bg-gray-200 my-1" />
                          )}
                        </div>
                        <div className="pb-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800">{s?.name ?? h.stageId}</span>
                            {isCurrent && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Current</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Entered {format(parseISO(h.enteredAt), 'd MMM yyyy')}
                            {daysInStage !== null && ` · ${daysInStage} day${daysInStage !== 1 ? 's' : ''} in stage`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              {/* Next action */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Next Action</h3>
                  {!editingNextAction && (
                    <button onClick={() => { setNextActionDraft(deal.nextAction); setEditingNextAction(true); }} className="text-gray-400 hover:text-gray-600 p-1 rounded">
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
                      <button onClick={handleNextActionSave} className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingNextAction(false)} className="p-1.5 bg-gray-50 text-gray-500 rounded hover:bg-gray-100"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-700">{deal.nextAction || 'Not set'}</p>
                    {deal.nextActionDate && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${isPast(parseISO(deal.nextActionDate)) ? 'text-red-500' : 'text-gray-400'}`}>
                        <Calendar className="w-3 h-3" />
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
                  { label: 'Advisors', value: deal.advisors || 'None appointed' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="text-sm text-gray-700 mt-0.5 leading-snug">{value}</p>
                  </div>
                ))}
              </div>

              {/* Team */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Deal Team</h3>
                <div className="space-y-2.5">
                  {owners.map((o) => (
                    <div key={o.id} className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: o.avatarColor }}>{o.initials}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{o.name}</p>
                        <p className="text-xs text-gray-400">{o.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">At a Glance</h3>
                <div className="space-y-2">
                  {[
                    { icon: MessageSquare, label: 'Activities', value: activities.length, color: 'text-blue-500' },
                    { icon: FileText, label: 'Documents', value: documents.length, color: 'text-purple-500' },
                    { icon: CheckSquare, label: 'Open tasks', value: openTasks.length, color: overdueTasks.length > 0 ? 'text-red-500' : 'text-green-500' },
                    { icon: Users2, label: 'Contacts', value: contacts.length, color: 'text-amber-500' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        <span className="text-xs text-gray-500">{label}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVITY ─────────────────────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <ActivityTimeline dealId={deal.id} />
              </div>
            </div>
            <div className="space-y-4">
              {/* Summary card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-4">Activity Summary</h3>
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-gray-900">{activities.length}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Total entries logged</p>
                </div>
                {lastActivity && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Last entry</p>
                    <p className="text-xs font-medium text-gray-700 truncate">{lastActivity.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{format(parseISO(lastActivity.createdAt), 'd MMM yyyy')}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {activityByType.map(({ type, count, label, color, icon: Icon }) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded flex items-center justify-center ${color}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="text-xs text-gray-600">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full"
                            style={{ width: `${(count / activities.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-4 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team contributions */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Team Contributions</h3>
                <div className="space-y-2">
                  {team.map((member) => {
                    const count = activities.filter((a) => a.authorId === member.id).length;
                    if (count === 0) return null;
                    return (
                      <div key={member.id} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: member.avatarColor }}>{member.initials}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs text-gray-600 truncate">{member.name.split(' ')[0]}</span>
                            <span className="text-xs font-semibold text-gray-700">{count}</span>
                          </div>
                          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(count / activities.length) * 100}%`, backgroundColor: member.avatarColor }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DOCUMENTS ────────────────────────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div className="space-y-5">
            {/* Summary row */}
            {documents.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{documents.length}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{totalSizeMb} MB</p>
                </div>
                {docByType.map(({ type, count }) => (
                  <div key={type} className={`rounded-xl border p-4 ${DOC_TYPE_COLORS[type]}`}>
                    <p className="text-xs uppercase tracking-wide font-medium opacity-70">{type}</p>
                    <p className="text-2xl font-bold mt-1">{count}</p>
                    <p className="text-xs opacity-60 mt-0.5">{count === 1 ? 'document' : 'documents'}</p>
                  </div>
                ))}
              </div>
            )}

            {latestDoc && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Latest upload</p>
                  <p className="text-sm font-semibold text-blue-800">{latestDoc.filename}</p>
                </div>
                <span className="ml-auto text-xs text-blue-400">{format(parseISO(latestDoc.uploadedAt), 'd MMM yyyy')}</span>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <DocumentList dealId={deal.id} />
            </div>
          </div>
        )}

        {/* ── TASKS ────────────────────────────────────────────────────────── */}
        {activeTab === 'tasks' && (
          <div className="space-y-5">
            {/* Stats bar */}
            {tasks.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Open', value: taskStats.open, color: 'text-gray-700', bg: 'bg-white', border: 'border-gray-200' },
                  { label: 'In Progress', value: taskStats.inProgress, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
                  { label: 'Done', value: taskStats.done, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
                  { label: 'Overdue', value: taskStats.overdue, color: taskStats.overdue > 0 ? 'text-red-700' : 'text-gray-400', bg: taskStats.overdue > 0 ? 'bg-red-50' : 'bg-white', border: taskStats.overdue > 0 ? 'border-red-200' : 'border-gray-200' },
                ].map(({ label, value, color, bg, border }) => (
                  <div key={label} className={`rounded-xl border p-4 ${bg} ${border}`}>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Progress bar */}
            {tasks.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Completion</p>
                  <p className="text-sm font-bold text-gray-900">{taskStats.done}/{tasks.length}</p>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${tasks.length > 0 ? (taskStats.done / tasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Overdue banner */}
            {overdueTasks.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm font-semibold text-red-700">{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</p>
                </div>
                <div className="space-y-1.5">
                  {overdueTasks.map((t) => {
                    const owner = team.find((m) => m.id === t.ownerId);
                    return (
                      <div key={t.id} className="flex items-center gap-2 text-xs text-red-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        <span className="flex-1 truncate">{t.title}</span>
                        <span className="shrink-0">{owner?.initials}</span>
                        <span className="shrink-0 font-medium">{format(parseISO(t.dueDate), 'd MMM')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <TaskList dealId={deal.id} />
            </div>
          </div>
        )}

        {/* ── DILIGENCE ────────────────────────────────────────────────────── */}
        {activeTab === 'diligence' && (
          <div className="space-y-5">
            {diligenceItems.length > 0 && (
              <>
                {/* Overall progress */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Overall Completion</h3>
                    <span className={`text-2xl font-bold ${overallPct >= 80 ? 'text-green-600' : overallPct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {overallPct}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full transition-all ${overallPct >= 80 ? 'bg-green-500' : overallPct >= 40 ? 'bg-amber-500' : 'bg-red-400'}`}
                      style={{ width: `${overallPct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {catStats.map(({ cat, total, checked }) => {
                      const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
                      const colors = DILIGENCE_CAT_COLORS[cat];
                      return (
                        <div key={cat} className={`rounded-lg p-3 ${colors.bg}`}>
                          <p className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>{cat}</p>
                          <p className={`text-xl font-bold mt-1 ${colors.text}`}>{pct}%</p>
                          <p className="text-xs text-gray-400 mt-0.5">{checked}/{total} items</p>
                          <div className="h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                            <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <DiligenceChecklist dealId={deal.id} />
            </div>
          </div>
        )}

        {/* ── CONTACTS ─────────────────────────────────────────────────────── */}
        {activeTab === 'contacts' && (
          <div className="space-y-5">
            {/* Primary contact hero */}
            {primaryContact && (
              <div className="bg-gradient-to-r from-navy-800 to-blue-700 rounded-xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #0d1f3c 0%, #1e40af 100%)' }}>
                <p className="text-xs text-blue-200 uppercase tracking-wide mb-3">Primary Contact</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {primaryContact.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold">{primaryContact.name}</p>
                    <p className="text-blue-200 text-sm mt-0.5">{primaryContact.role}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {primaryContact.email && (
                        <a href={`mailto:${primaryContact.email}`} className="flex items-center gap-1.5 text-xs text-blue-100 hover:text-white transition-colors">
                          <Mail className="w-3.5 h-3.5" />{primaryContact.email}
                        </a>
                      )}
                      {primaryContact.phone && (
                        <span className="flex items-center gap-1.5 text-xs text-blue-200">
                          <Phone className="w-3.5 h-3.5" />{primaryContact.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact count summary */}
            {contacts.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <Users2 className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-500">
                  {contacts.length} contact{contacts.length !== 1 ? 's' : ''} linked to this deal
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <ContactsTab dealId={deal.id} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
