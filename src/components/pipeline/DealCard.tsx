import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import type { Deal } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { SectorBadge } from '../shared/SectorBadge';
import { AvatarGroup } from '../shared/Avatar';
import { format, parseISO, isPast } from 'date-fns';

interface Props {
  deal: Deal;
  isDragging?: boolean;
}

export function DealCard({ deal, isDragging = false }: Props) {
  const navigate = useNavigate();
  const stages = useAppStore((s) => s.stages);
  const stage = stages.find((s) => s.id === deal.stageId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const isOverdue =
    deal.nextActionDate && isPast(parseISO(deal.nextActionDate));

  const ebitdaMultiple =
    deal.financials.ebitda > 0
      ? (deal.financials.ev / deal.financials.ebitda).toFixed(1)
      : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border border-gray-200 p-3.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow group ${
        isDragging ? 'shadow-xl rotate-1' : ''
      }`}
      onClick={(e) => {
        // Only navigate if not dragging
        if (!isSortableDragging) {
          e.stopPropagation();
          navigate(`/deal/${deal.id}`);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 text-sm truncate">{deal.name}</p>
          <p className="text-gray-500 text-xs mt-0.5 truncate">{deal.geography}</p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 shrink-0 ml-2 mt-0.5 transition-colors" />
      </div>

      {/* Sector */}
      <div className="mb-2.5">
        <SectorBadge sector={deal.sector} />
      </div>

      {/* Financials */}
      <div className="grid grid-cols-3 gap-1 mb-3">
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wide">Rev</p>
          <p className="text-gray-800 text-xs font-medium">£{deal.financials.revenue}m</p>
        </div>
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wide">EBITDA</p>
          <p className="text-gray-800 text-xs font-medium">£{deal.financials.ebitda}m</p>
        </div>
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wide">EV</p>
          <p className="text-gray-800 text-xs font-medium font-semibold">
            £{deal.financials.ev}m
            {ebitdaMultiple && (
              <span className="text-gray-400 font-normal ml-1">{ebitdaMultiple}x</span>
            )}
          </p>
        </div>
      </div>

      {/* Next Action */}
      {deal.nextAction && (
        <div className={`text-xs px-2 py-1.5 rounded mb-2.5 flex items-start gap-1.5 ${
          isOverdue ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
        }`}>
          <Calendar className="w-3 h-3 shrink-0 mt-0.5" />
          <span className="line-clamp-2 leading-tight">{deal.nextAction}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <AvatarGroup userIds={deal.ownerIds} />
        {deal.nextActionDate && (
          <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {format(parseISO(deal.nextActionDate), 'd MMM')}
          </span>
        )}
      </div>
    </div>
  );
}
