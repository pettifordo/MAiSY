import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Deal, Stage } from '../../types';
import { DealCard } from './DealCard';

interface Props {
  stage: Stage;
  deals: Deal[];
  onAddDeal?: () => void;
}

const STAGE_HEADER_STYLES: Record<string, string> = {
  prospect: 'bg-gray-50 border-gray-200',
  nda: 'bg-blue-50 border-blue-200',
  diligence: 'bg-amber-50 border-amber-200',
  loi: 'bg-orange-50 border-orange-200',
  closing: 'bg-green-50 border-green-200',
  won: 'bg-emerald-50 border-emerald-200',
  dead: 'bg-red-50 border-red-200',
};

const STAGE_DOT: Record<string, string> = {
  prospect: 'bg-gray-400',
  nda: 'bg-blue-500',
  diligence: 'bg-amber-500',
  loi: 'bg-orange-500',
  closing: 'bg-green-500',
  won: 'bg-emerald-500',
  dead: 'bg-red-500',
};

export function StageColumn({ stage, deals, onAddDeal }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const totalEv = deals.reduce((sum, d) => sum + d.financials.ev, 0);

  const headerStyle = STAGE_HEADER_STYLES[stage.id] ?? 'bg-gray-50 border-gray-200';
  const dotStyle = STAGE_DOT[stage.id] ?? 'bg-gray-400';

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      {/* Column header */}
      <div className={`rounded-lg border px-3 py-2.5 mb-2 ${headerStyle}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dotStyle}`} />
            <span className="text-sm font-semibold text-gray-800">{stage.name}</span>
            <span className="text-xs text-gray-500 bg-white/70 px-1.5 py-0.5 rounded-full font-medium">
              {deals.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 font-medium">
              {totalEv > 0 ? `£${totalEv.toFixed(0)}m` : ''}
            </span>
            {onAddDeal && (
              <button
                onClick={onAddDeal}
                className="p-0.5 rounded hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-colors ml-1"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-400 mt-0.5">{stage.probability}% probability</div>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 min-h-[120px] rounded-lg transition-colors ${
          isOver ? 'bg-blue-50/50 ring-2 ring-blue-300 ring-dashed' : ''
        } p-1`}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>
        {deals.length === 0 && (
          <div className="flex items-center justify-center h-16 text-gray-300 text-xs">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}
