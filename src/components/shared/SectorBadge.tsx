import type { Sector } from '../../types';

const SECTOR_COLORS: Record<string, string> = {
  'Specialty Chemicals': 'bg-purple-100 text-purple-800 border-purple-200',
  'Industrial Coatings': 'bg-blue-100 text-blue-800 border-blue-200',
  'Adhesives & Sealants': 'bg-orange-100 text-orange-800 border-orange-200',
  'Polymer Processing': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Performance Materials': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Agrochemicals': 'bg-green-100 text-green-800 border-green-200',
  'Fine Chemicals': 'bg-rose-100 text-rose-800 border-rose-200',
};

export function SectorBadge({ sector }: { sector: Sector | string }) {
  const cls = SECTOR_COLORS[sector] ?? 'bg-gray-100 text-gray-800 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {sector}
    </span>
  );
}
