import { useAppStore } from '../../store/useAppStore';

export function Avatar({ userId, size = 'sm' }: { userId: string; size?: 'sm' | 'md' }) {
  const member = useAppStore((s) => s.team.find((m) => m.id === userId));
  if (!member) return null;
  const sz = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white ${sz}`}
      style={{ backgroundColor: member.avatarColor }}
      title={member.name}
    >
      {member.initials}
    </span>
  );
}

export function AvatarGroup({ userIds }: { userIds: string[] }) {
  return (
    <div className="flex -space-x-1">
      {userIds.slice(0, 3).map((id) => (
        <Avatar key={id} userId={id} size="sm" />
      ))}
      {userIds.length > 3 && (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-medium">
          +{userIds.length - 3}
        </span>
      )}
    </div>
  );
}
