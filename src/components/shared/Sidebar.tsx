import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  BarChart3,
  Settings,
  Building2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/reporting', icon: BarChart3, label: 'Reporting' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const member = useAppStore((s) => s.team.find((m) => m.id === currentUserId));

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-navy-900 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-navy-700">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-base tracking-tight">MAiSY</p>
          <p className="text-navy-400 text-[10px] uppercase tracking-widest font-medium" style={{ color: '#64748b' }}>
            M&amp;A Pipeline
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {member && (
        <div className="px-4 py-4 border-t border-navy-700 flex items-center gap-3">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: member.avatarColor }}
          >
            {member.initials}
          </span>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{member.name}</p>
            <p className="text-slate-500 text-xs">{member.role}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
