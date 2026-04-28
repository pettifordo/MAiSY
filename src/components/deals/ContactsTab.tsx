import { useState, useMemo } from 'react';
import { Plus, Trash2, Mail, Phone, Star } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  dealId: string;
}

export function ContactsTab({ dealId }: Props) {
  const allContacts = useAppStore((s) => s.contacts);
  const contacts = useMemo(() => allContacts.filter((c) => c.dealId === dealId), [allContacts, dealId]);
  const addContact = useAppStore((s) => s.addContact);
  const deleteContact = useAppStore((s) => s.deleteContact);
  const updateContact = useAppStore((s) => s.updateContact);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '', isPrimary: false });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addContact({ dealId, ...form });
    setForm({ name: '', role: '', email: '', phone: '', isPrimary: false });
    setAdding(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Contacts</h3>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add contact
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role / Title</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="CEO, CFO, Advisor..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="name@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+44 7700..."
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Primary contact</span>
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button onClick={handleAdd} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">
              Add
            </button>
          </div>
        </div>
      )}

      {contacts.length === 0 && !adding ? (
        <p className="text-sm text-gray-400 text-center py-8">No contacts added yet.</p>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg group">
              <div
                className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0"
              >
                {contact.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900">{contact.name}</p>
                  {contact.isPrimary && (
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{contact.role}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <Mail className="w-3 h-3" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone className="w-3 h-3" />
                      {contact.phone}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteContact(contact.id)}
                className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
