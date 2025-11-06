import { useRoleView } from "@/contexts/RoleViewContext";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Building2 } from "lucide-react";

interface RoleSwitcherProps {
  className?: string;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ className }) => {
  const { user } = useAuth();
  const { activeViewRole, setActiveViewRole, availableRoles, resetToDefaultRole } = useRoleView();

  if (!user || availableRoles.length <= 1) {
    return null; // Don't show if user has only one role or not authenticated
  }

  const getRoleIcon = (role: UserRole) => {
    const isAdminRole = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN_STAFF,
      UserRole.MARKETER,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ].includes(role);
    
    const isOrganizerRole = [
      UserRole.ORGANIZER,
      UserRole.ORGANIZER_STAFF,
      UserRole.ORGANIZER_TELLER,
    ].includes(role);

    if (isAdminRole) return <Shield className="h-4 w-4" />;
    if (isOrganizerRole) return <Building2 className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  };

  const getRoleLabel = (role: UserRole): string => {
    const isAdminRole = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN_STAFF,
      UserRole.MARKETER,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ].includes(role);
    
    const isOrganizerRole = [
      UserRole.ORGANIZER,
      UserRole.ORGANIZER_STAFF,
      UserRole.ORGANIZER_TELLER,
    ].includes(role);

    if (isAdminRole) return 'Admin';
    if (isOrganizerRole) return 'Organizer';
    if (role === UserRole.ATTENDEE) return 'Attendee';
    return role;
  };

  const currentViewRole = activeViewRole || user.role;
  const isUsingActualRole = activeViewRole === null || activeViewRole === user.role;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Role View
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current View:</span>
            <Badge variant={isUsingActualRole ? "default" : "secondary"} className="flex items-center gap-1">
              {getRoleIcon(currentViewRole)}
              {getRoleLabel(currentViewRole)}
            </Badge>
          </div>
          {!isUsingActualRole && (
            <p className="text-xs text-muted-foreground">
              You're viewing as {getRoleLabel(currentViewRole)}. Your actual role is {getRoleLabel(user.role)}.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Switch to:</span>
          <div className="flex flex-wrap gap-2">
            {availableRoles.map((role) => {
              const isActive = (activeViewRole || user.role) === role;
              const isActualRole = role === user.role;
              
              return (
                <Button
                  key={role}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (isActualRole && isActive) {
                      resetToDefaultRole();
                    } else {
                      setActiveViewRole(role);
                    }
                  }}
                  className="flex items-center gap-1"
                >
                  {getRoleIcon(role)}
                  {getRoleLabel(role)}
                  {isActualRole && <span className="text-xs">(Actual)</span>}
                </Button>
              );
            })}
          </div>
        </div>

        {!isUsingActualRole && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefaultRole}
            className="w-full"
          >
            Reset to Actual Role
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleSwitcher;

