import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { StageColumn } from '../components/pipeline/StageColumn';
import { DealCard } from '../components/pipeline/DealCard';
import { NewDealModal } from '../components/shared/NewDealModal';
import type { Deal, Sector } from '../types';

const SECTORS = [
  'Specialty Chemicals',
  'Industrial Coatings',
  'Adhesives & Sealants',
  'Polymer Processing',
  'Performance Materials',
  'Agrochemicals',
  'Fine Chemicals',
] as const;

export function Pipeline() {
  const stages = useAppStore((s) => s.stages);
  const deals = useAppStore((s) => s.deals);
  const team = useAppStore((s) => s.team);
  const moveDeal = useAppStore((s) => s.moveDeal);
  const updateDeal = useAppStore((s) => s.updateDeal);

  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSector, setFilterSector] = useState<Sector | ''>('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterMinEv, setFilterMinEv] = useState('');
  const [filterMaxEv, setFilterMaxEv] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (filterSector && d.sector !== filterSector) return false;
      if (filterOwner && !d.ownerIds.includes(filterOwner)) return false;
      if (filterMinEv && d.financials.ev < parseFloat(filterMinEv)) return false;
      if (filterMaxEv && d.financials.ev > parseFloat(filterMaxEv)) return false;
      return true;
    });
  }, [deals, filterSector, filterOwner, filterMinEv, filterMaxEv]);

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  // Summary stats
  const activePipelineDeals = deals.filter((d) => d.stageId !== 'won' && d.stageId !== 'dead');
  const totalEv = activePipelineDeals.reduce((sum, d) => sum + d.financials.ev, 0);
  const weightedEv = activePipelineDeals.reduce((sum, d) => {
    const stage = stages.find((s) => s.id === d.stageId);
    return sum + d.financials.ev * ((stage?.probability ?? 0) / 100);
  }, 0);

  const hasFilters = filterSector || filterOwner || filterMinEv || filterMaxEv;

  const clearFilters = () => {
    setFilterSector('');
    setFilterOwner('');
    setFilterMinEv('');
    setFilterMaxEv('');
  };

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal ?? null);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // handled in dragEnd
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropped over a stage column
    const targetStage = stages.find((s) => s.id === overId);
    if (targetStage) {
      const deal = deals.find((d) => d.id === activeId);
      if (deal && deal.stageId !== targetStage.id) {
        moveDeal(activeId, targetStage.id);
      }
      return;
    }

    // Dropped over another card — get that card's stage
    const overDeal = deals.find((d) => d.id === overId);
    if (overDeal) {
      const activeDeal = deals.find((d) => d.id === activeId);
      if (activeDeal && activeDeal.stageId !== overDeal.stageId) {
        moveDeal(activeId, overDeal.stageId);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Deal Pipeline</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {activePipelineDeals.length} active deals &bull; £{totalEv.toFixed(0)}m total EV &bull; £{weightedEv.toFixed(0)}m weighted
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
                hasFilters
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasFilters && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  !
                </span>
              )}
            </button>
            <button
              onClick={() => setShowNewDeal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              New Deal
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-4 flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sector</label>
              <select
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none"
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value as Sector | '')}
              >
                <option value="">All sectors</option>
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Owner</label>
              <select
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none"
                value={filterOwner}
                onChange={(e) => setFilterOwner(e.target.value)}
              >
                <option value="">All owners</option>
                {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min EV (£m)</label>
              <input
                type="number"
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none w-24"
                value={filterMinEv}
                onChange={(e) => setFilterMinEv(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max EV (£m)</label>
              <input
                type="number"
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none w-24"
                value={filterMaxEv}
                onChange={(e) => setFilterMaxEv(e.target.value)}
                placeholder="∞"
              />
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full items-start">
            {sortedStages.map((stage) => {
              const stageDeals = filteredDeals.filter((d) => d.stageId === stage.id);
              return (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  deals={stageDeals}
                  onAddDeal={() => setShowNewDeal(true)}
                />
              );
            })}
          </div>
          <DragOverlay>
            {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {showNewDeal && <NewDealModal onClose={() => setShowNewDeal(false)} />}
    </div>
  );
}
