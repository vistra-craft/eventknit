/**
 * Protected Layout Component
 * Wraps protected routes with layout components (sidebar, navbar, etc.)
 * Similar to pos/client's AppLayout pattern
 */

import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { UserRole } from '@/types/auth';

interface ProtectedLayoutProps {
  allowedRoles?: UserRole[];
  showLayout?: boolean;
}

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({
  allowedRoles,
  showLayout = true,
}) => {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      {showLayout ? (
        <div className="min-h-screen bg-background">
          {/* Add your layout components here (Sidebar, Navbar, etc.) */}
          <main className="container mx-auto px-4 py-8">
            <Outlet />
          </main>
        </div>
      ) : (
        <Outlet />
      )}
    </ProtectedRoute>
  );
};

