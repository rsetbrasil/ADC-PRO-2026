
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/context/PermissionsContext';
import { hasAccess, ALL_SECTIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useAdminData } from '@/context/AdminContext';

export default function AdminNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const { chatSessions } = useAdminData();

  if (!user || !permissions) {
    return null;
  }

  const accessibleNavItems = ALL_SECTIONS.filter(item => hasAccess(user.role, item.id, permissions));
  
  const hasUnreadMessages = chatSessions.some(session => session.unreadBySeller);

  return (
    <div className="mb-8 md:overflow-x-auto">
      <nav className="flex flex-col gap-1 md:flex-row md:h-10 md:items-center md:justify-start rounded-md bg-muted p-1 text-muted-foreground">
        {accessibleNavItems.map(item => {
          const isActive = pathname.startsWith(`/admin/${item.id}`);
          
          return (
            <Link
              key={item.id}
              href={`/admin/${item.id}`}
              className={cn(
                "relative inline-flex items-center justify-start whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
