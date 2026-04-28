import type { Stage } from '../../types';

const STAGE_STYLES: Record<string, string> = {
  prospect: 'bg-gray-100 text-gray-700 border-gray-300',
  nda: 'bg-blue-100 text-blue-800 border-blue-300',
  diligence: 'bg-amber-100 text-amber-800 border-amber-300',
  loi: 'bg-orange-100 text-orange-800 border-orange-300',
  closing: 'bg-green-100 text-green-800 border-green-300',
  won: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  dead: 'bg-red-100 text-red-700 border-red-300',
};

export function StagePill({ stage }: { stage: Stage }) {
  const cls = STAGE_STYLES[stage.id] ?? 'bg-gray-100 text-gray-700 border-gray-300';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {stage.name}
    </span>
  );
}

export function getStageStyle(stageId: string) {
  return STAGE_STYLES[stageId] ?? 'bg-gray-100 text-gray-700 border-gray-300';
}
