import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { TrendingUp, AlertCircle, CheckCircle2, Activity, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SectorBadge } from '../components/shared/SectorBadge';
import { StagePill } from '../components/shared/StagePill';
import { Avatar } from '../components/shared/Avatar';

export function Dashboard() {
  const navigate = useNavigate();
  const deals = useAppStore((s) => s.deals);
  const stages = useAppStore((s) => s.stages);
  const activities = useAppStore((s) => s.activities);
  const tasks = useAppStore((s) => s.tasks);
  const team = useAppStore((s) => s.team);
  const currentUserId = useAppStore((s) => s.currentUserId);

  const activeDeals = deals.filter((d) => d.stageId !== 'dead');
  const totalEv = activeDeals.reduce((sum, d) => sum + d.financials.ev, 0);
  const weightedEv = activeDeals.reduce((sum, d) => {
    const stage = stages.find((s) => s.id === d.stageId);
    return sum + d.financials.ev * ((stage?.probability ?? 0) / 100);
  }, 0);

  // Recent activity — last 10 across all deals
  const recentActivity = useMemo(() =>
    [...activities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10),
    [activities]
  );

  // Overdue tasks
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const overdueTasks = openTasks.filter((t) => t.dueDate && isPast(parseISO(t.dueDate)));

  // My deals
  const myDeals = activeDeals.filter((d) => d.ownerIds.includes(currentUserId));

  // Stage breakdown
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const stageBreakdown = sortedStages
    .filter((s) => s.id !== 'dead')
    .map((s) => ({
      stage: s,
      deals: activeDeals.filter((d) => d.stageId === s.id),
    }))
    .filter((s) => s.deals.length > 0);

  const currentUser = team.find((m) => m.id === currentUserId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-5">
        <h1 className="text-xl font-bold text-gray-900">
          Good {getGreeting()}, {currentUser?.name.split(' ')[0] ?? 'there'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Active Deals</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{activeDeals.length}</p>
            <p className="text-xs text-gray-400 mt-1">excl. dead / won</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Pipeline EV</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">£{totalEv.toFixed(0)}m</p>
            <p className="text-xs text-gray-400 mt-1">gross unadjusted</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Weighted Pipeline</p>
            <p className="text-3xl font-bold text-green-600 mt-1">£{weightedEv.toFixed(0)}m</p>
            <p className="text-xs text-gray-400 mt-1">probability-adjusted</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Open Tasks</p>
            <p className={`text-3xl font-bold mt-1 ${overdueTasks.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {openTasks.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : 'all on track'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: My deals + stage breakdown */}
          <div className="col-span-2 space-y-6">
            {/* Stage snapshot */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Pipeline Snapshot</h2>
              <div className="space-y-3">
                {stageBreakdown.map(({ stage, deals: stageDeals }) => {
                  const totalEv = stageDeals.reduce((s, d) => s + d.financials.ev, 0);
                  return (
                    <div key={stage.id} className="flex items-center gap-3">
                      <div className="w-24 shrink-0">
                        <StagePill stage={stage} />
                      </div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(stageDeals.length / activeDeals.length) * 100}%`,
                            backgroundColor: stage.color,
                          }}
                        />
                      </div>
                      <div className="text-right shrink-0 w-28">
                        <span className="text-sm font-medium text-gray-700">
                          {stageDeals.length} deal{stageDeals.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">£{totalEv.toFixed(0)}m</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My deals */}
            {myDeals.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">My Deals</h2>
                  <button
                    onClick={() => navigate('/pipeline')}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View all <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {myDeals.slice(0, 5).map((deal) => {
                    const stage = stages.find((s) => s.id === deal.stageId);
                    const isOverdue = deal.nextActionDate && isPast(parseISO(deal.nextActionDate));
                    return (
                      <div
                        key={deal.id}
                        onClick={() => navigate(`/deal/${deal.id}`)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{deal.name}</p>
                            <SectorBadge sector={deal.sector} />
                            {stage && <StagePill stage={stage} />}
                          </div>
                          {deal.nextAction && (
                            <p className={`text-xs mt-0.5 truncate ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                              {isOverdue && '⚠ '}{deal.nextAction}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-gray-700">£{deal.financials.ev}m</p>
                          {deal.nextActionDate && (
                            <p className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
                              {format(parseISO(deal.nextActionDate), 'd MMM')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Overdue tasks */}
            {overdueTasks.length > 0 && (
              <div className="bg-white rounded-xl border border-red-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <h2 className="font-semibold text-red-700">Overdue Tasks ({overdueTasks.length})</h2>
                </div>
                <div className="space-y-2">
                  {overdueTasks.slice(0, 5).map((task) => {
                    const deal = deals.find((d) => d.id === task.dealId);
                    const owner = team.find((m) => m.id === task.ownerId);
                    return (
                      <div
                        key={task.id}
                        onClick={() => deal && navigate(`/deal/${deal.id}?tab=tasks`)}
                        className="flex items-center gap-3 p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                      >
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-red-800 font-medium truncate">{task.title}</p>
                          <p className="text-xs text-red-500">
                            {deal?.name} &bull; due {format(parseISO(task.dueDate), 'd MMM')}
                          </p>
                        </div>
                        {owner && <Avatar userId={owner.id} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Activity feed */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-gray-500" />
                <h2 className="font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const deal = deals.find((d) => d.id === activity.dealId);
                  const author = team.find((m) => m.id === activity.authorId);
                  return (
                    <div
                      key={activity.id}
                      className="flex gap-2.5 cursor-pointer group"
                      onClick={() => deal && navigate(`/deal/${deal.id}`)}
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Activity className="w-3 h-3 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 group-hover:text-blue-600 truncate transition-colors">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {deal?.name} &bull; {author?.name}
                        </p>
                        <p className="text-xs text-gray-300 mt-0.5">
                          {format(parseISO(activity.createdAt), 'd MMM, HH:mm')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
