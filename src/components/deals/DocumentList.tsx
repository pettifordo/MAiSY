import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { FileText, Plus, Trash2, Download } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Document } from '../../types';

const TYPE_COLORS: Record<Document['type'], string> = {
  NDA: 'bg-gray-100 text-gray-700',
  CIM: 'bg-blue-100 text-blue-700',
  LOI: 'bg-orange-100 text-orange-700',
  Model: 'bg-green-100 text-green-700',
  Report: 'bg-purple-100 text-purple-700',
  Other: 'bg-slate-100 text-slate-700',
};

interface Props {
  dealId: string;
}

export function DocumentList({ dealId }: Props) {
  const documents = useAppStore((s) =>
    s.documents.filter((d) => d.dealId === dealId).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
  );
  const team = useAppStore((s) => s.team);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const addDocument = useAppStore((s) => s.addDocument);
  const deleteDocument = useAppStore((s) => s.deleteDocument);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    filename: '',
    type: 'Other' as Document['type'],
    version: '1.0',
    sizeKb: '500',
  });

  const handleAdd = () => {
    if (!form.filename.trim()) return;
    addDocument({
      dealId,
      filename: form.filename,
      type: form.type,
      version: form.version,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUserId,
      sizeKb: parseInt(form.sizeKb) || 0,
    });
    setForm({ filename: '', type: 'Other', version: '1.0', sizeKb: '500' });
    setAdding(false);
  };

  const formatSize = (kb: number) => {
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${kb} KB`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Documents</h3>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add document
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Filename</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.filename}
                onChange={(e) => setForm((f) => ({ ...f, filename: e.target.value }))}
                placeholder="e.g. Company_CIM_2024.pdf"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Document['type'] }))}
              >
                {(['NDA', 'CIM', 'LOI', 'Model', 'Report', 'Other'] as Document['type'][]).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Version</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                placeholder="1.0"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {documents.length === 0 && !adding ? (
        <p className="text-sm text-gray-400 text-center py-8">No documents yet.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const uploader = team.find((m) => m.id === doc.uploadedBy);
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.filename}</p>
                  <p className="text-xs text-gray-400">
                    {uploader?.name ?? 'Unknown'} &bull; {format(parseISO(doc.uploadedAt), 'd MMM yyyy')} &bull; {formatSize(doc.sizeKb)} &bull; v{doc.version}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${TYPE_COLORS[doc.type]}`}>
                  {doc.type}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Download (demo)">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
