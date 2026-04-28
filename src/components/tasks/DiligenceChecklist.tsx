import { useAppStore } from '../../store/useAppStore';
import type { DiligenceCategory } from '../../types';
import { CheckSquare, Square, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';

const CATEGORIES: DiligenceCategory[] = ['Legal', 'Financial', 'Commercial', 'Operational'];

const CATEGORY_COLORS: Record<DiligenceCategory, string> = {
  Legal: 'text-red-600 bg-red-50 border-red-200',
  Financial: 'text-blue-600 bg-blue-50 border-blue-200',
  Commercial: 'text-green-600 bg-green-50 border-green-200',
  Operational: 'text-amber-600 bg-amber-50 border-amber-200',
};

interface Props {
  dealId: string;
}

export function DiligenceChecklist({ dealId }: Props) {
  const allDiligenceItems = useAppStore((s) => s.diligenceItems);
  const items = useMemo(() => allDiligenceItems.filter((di) => di.dealId === dealId), [allDiligenceItems, dealId]);
  const applyTemplate = useAppStore((s) => s.applyDiligenceTemplate);
  const toggleItem = useAppStore((s) => s.toggleDiligenceItem);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (cat: string) =>
    setCollapsed((c) => ({ ...c, [cat]: !c[cat] }));

  const appliedCategories = [...new Set(items.map((i) => i.category))];
  const unappliedCategories = CATEGORIES.filter((c) => !appliedCategories.includes(c));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Diligence Checklist</h3>
      </div>

      {/* Apply templates */}
      {unappliedCategories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {unappliedCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => applyTemplate(dealId, cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${CATEGORY_COLORS[cat]} hover:opacity-80`}
            >
              <Plus className="w-3 h-3" />
              Add {cat}
            </button>
          ))}
        </div>
      )}

      {/* Categories */}
      {CATEGORIES.filter((c) => appliedCategories.includes(c)).map((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        const checkedCount = catItems.filter((i) => i.checked).length;
        const isCollapsed = collapsed[cat];

        return (
          <div key={cat} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCollapse(cat)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${CATEGORY_COLORS[cat]}`}>
                  {cat}
                </span>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {checkedCount}/{catItems.length}
              </span>
            </button>

            {!isCollapsed && (
              <div className="p-3 space-y-1.5">
                {catItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-2.5 cursor-pointer group p-1.5 rounded hover:bg-gray-50 transition-colors"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="shrink-0 mt-0.5 text-gray-400 group-hover:text-gray-600"
                    >
                      {item.checked ? (
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <span
                      className={`text-sm leading-snug ${
                        item.checked ? 'line-through text-gray-400' : 'text-gray-700'
                      }`}
                    >
                      {item.label}
                    </span>
                  </label>
                ))}

                {/* Progress bar */}
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${catItems.length > 0 ? (checkedCount / catItems.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {items.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          Apply a diligence template to get started.
        </p>
      )}
    </div>
  );
}
