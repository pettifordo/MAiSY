import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, FunnelChart, Funnel, LabelList,
} from 'recharts';
import { Download, TrendingUp, DollarSign, BarChart3, Target } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { differenceInDays, parseISO } from 'date-fns';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f97316', '#ec4899', '#06b6d4'];

export function Reporting() {
  const deals = useAppStore((s) => s.deals);
  const stages = useAppStore((s) => s.stages);
  const team = useAppStore((s) => s.team);

  const activeDeals = deals.filter((d) => d.stageId !== 'dead');
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  // Pipeline by stage
  const stageData = useMemo(() =>
    sortedStages
      .filter((s) => s.id !== 'dead')
      .map((stage) => {
        const stageDeals = activeDeals.filter((d) => d.stageId === stage.id);
        return {
          name: stage.name,
          count: stageDeals.length,
          totalEv: parseFloat(stageDeals.reduce((sum, d) => sum + d.financials.ev, 0).toFixed(1)),
          weightedEv: parseFloat(
            stageDeals.reduce((sum, d) => sum + d.financials.ev * (stage.probability / 100), 0).toFixed(1)
          ),
        };
      }),
    [activeDeals, sortedStages]
  );

  // Sector mix
  const sectorData = useMemo(() => {
    const map: Record<string, number> = {};
    activeDeals.forEach((d) => {
      map[d.sector] = (map[d.sector] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [activeDeals]);

  // Weighted pipeline value
  const totalWeightedEv = useMemo(() =>
    activeDeals.reduce((sum, d) => {
      const stage = stages.find((s) => s.id === d.stageId);
      return sum + d.financials.ev * ((stage?.probability ?? 0) / 100);
    }, 0),
    [activeDeals, stages]
  );

  const totalEv = activeDeals.reduce((sum, d) => sum + d.financials.ev, 0);

  // Deal velocity — avg days per stage transition
  const velocityData = useMemo(() => {
    const stageDays: Record<string, number[]> = {};
    deals.forEach((d) => {
      d.stageHistory.forEach((h, i) => {
        if (i < d.stageHistory.length - 1) {
          const days = differenceInDays(
            parseISO(d.stageHistory[i + 1].enteredAt),
            parseISO(h.enteredAt)
          );
          if (!stageDays[h.stageId]) stageDays[h.stageId] = [];
          stageDays[h.stageId].push(days);
        }
      });
    });
    return sortedStages
      .filter((s) => s.id !== 'dead' && s.id !== 'won' && stageDays[s.id])
      .map((s) => {
        const days = stageDays[s.id] ?? [];
        const avg = days.length > 0 ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;
        return { name: s.name, avgDays: avg };
      });
  }, [deals, sortedStages]);

  // Origination table
  const originationData = useMemo(() => {
    const map: Record<string, { count: number; totalEv: number }> = {};
    activeDeals.forEach((d) => {
      const src = d.source || 'Unknown';
      if (!map[src]) map[src] = { count: 0, totalEv: 0 };
      map[src].count++;
      map[src].totalEv += d.financials.ev;
    });
    return Object.entries(map)
      .map(([source, data]) => ({ source, ...data }))
      .sort((a, b) => b.totalEv - a.totalEv);
  }, [activeDeals]);

  const exportCsv = () => {
    const headers = ['Name', 'Sector', 'Stage', 'Geography', 'Revenue (£m)', 'EBITDA (£m)', 'EV (£m)', 'EBITDA Margin (%)', 'Owner(s)', 'Source', 'Next Action'];
    const rows = deals.map((d) => {
      const stageName = stages.find((s) => s.id === d.stageId)?.name ?? d.stageId;
      const owners = d.ownerIds.map((id) => team.find((m) => m.id === id)?.name ?? id).join('; ');
      return [
        d.name,
        d.sector,
        stageName,
        d.geography,
        d.financials.revenue,
        d.financials.ebitda,
        d.financials.ev,
        d.financials.ebitdaMargin.toFixed(1),
        owners,
        d.source,
        d.nextAction,
      ];
    });
    const csvContent = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maisy-pipeline-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reporting</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activeDeals.length} active deals &bull; updated live</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Active Deals', value: activeDeals.length.toString(), icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
            { label: 'Total EV', value: `£${totalEv.toFixed(0)}m`, icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
            { label: 'Weighted EV', value: `£${totalWeightedEv.toFixed(0)}m`, icon: Target, color: 'text-green-600 bg-green-50' },
            { label: 'Won YTD', value: deals.filter((d) => d.stageId === 'won').length.toString(), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-2 gap-6">
          {/* Pipeline by stage */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Pipeline by Stage</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stageData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'totalEv' ? [`£${value}m`, 'Total EV'] : [value, 'Deals']
                  }
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Deals" />
                <Bar dataKey="totalEv" fill="#e0e7ff" radius={[4, 4, 0, 0]} name="totalEv" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sector mix */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Sector Mix</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={sectorData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {sectorData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-2 gap-6">
          {/* Weighted EV by stage */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-1">Weighted Pipeline Value</h3>
            <p className="text-sm text-gray-500 mb-4">EV × stage probability</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`£${v}m`, 'Weighted EV']} />
                <Bar dataKey="weightedEv" fill="#10b981" radius={[4, 4, 0, 0]} name="Weighted EV" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Deal velocity */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-1">Deal Velocity</h3>
            <p className="text-sm text-gray-500 mb-4">Average days per stage</p>
            {velocityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={velocityData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} days`, 'Avg. days']} />
                  <Bar dataKey="avgDays" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg. Days" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Insufficient data</p>
            )}
          </div>
        </div>

        {/* Origination table */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Origination by Source</h3>
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="text-xs font-medium text-gray-500 uppercase pb-3">Source</th>
                <th className="text-xs font-medium text-gray-500 uppercase pb-3 text-right">Deals</th>
                <th className="text-xs font-medium text-gray-500 uppercase pb-3 text-right">Total EV</th>
                <th className="text-xs font-medium text-gray-500 uppercase pb-3 text-right">Avg. EV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {originationData.map((row) => (
                <tr key={row.source}>
                  <td className="py-3 text-sm font-medium text-gray-800">{row.source}</td>
                  <td className="py-3 text-sm text-gray-600 text-right">{row.count}</td>
                  <td className="py-3 text-sm text-gray-600 text-right">£{row.totalEv.toFixed(0)}m</td>
                  <td className="py-3 text-sm text-gray-600 text-right">£{(row.totalEv / row.count).toFixed(0)}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
