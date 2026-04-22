import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import Logo from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { useAuth } from "@/hooks/useAuth";
import { useRoleView } from "@/contexts/RoleViewContext";
import { UserRole } from "@/types/auth";
import { useToast } from "@/hooks/useToast";
import { EASE } from "@/lib/animation-constants";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface NavbarProps {
  transparent?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ transparent = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isLoading, refreshProfile } = useAuth();
  const { activeViewRole } = useRoleView();
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Scroll progress for the thin bar at the bottom
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    if (!isAuthenticated || !user) setIsMobileMenuOpen(false);
  }, [isAuthenticated, user]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && !isAuthenticated && !isLoading && !user) {
      refreshProfile().catch(() => {});
    }
  }, [isAuthenticated, isLoading, refreshProfile, user]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Routing logic (unchanged) ──────────────────────────────

  const getDashboardRoute = async () => {
    const roleToUse = activeViewRole || user?.role;
    if (!roleToUse) return "/user/dashboard";

    const isAdminRole = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.SUPPORT, UserRole.TELLER].includes(roleToUse);
    const isOrganizerRole = [UserRole.ORGANIZER, UserRole.ORGANIZER_ADMIN, UserRole.ORGANIZER_TELLER].includes(roleToUse);

    if (isAdminRole) return "/admin/dashboard";

    if (isOrganizerRole && roleToUse === UserRole.ORGANIZER) {
      try {
        const { getDashboardAccess } = await import("@/lib/organizer-api");
        const accessResponse = await getDashboardAccess();
        if (accessResponse.success && !accessResponse.data.hasAccess) {
          return "/organizer/events/create-standalone";
        }
      } catch {
        return "/organizer/events/create-standalone";
      }
    }

    if (isOrganizerRole) return "/organizer/dashboard";
    return "/user/dashboard";
  };

  const getProfileRoute = () => {
    const roleToUse = activeViewRole || user?.role;
    if (!roleToUse) return "/user/dashboard";
    const isAdminRole = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.SUPPORT, UserRole.TELLER].includes(roleToUse);
    const isOrganizerRole = [UserRole.ORGANIZER, UserRole.ORGANIZER_ADMIN, UserRole.ORGANIZER_TELLER].includes(roleToUse);
    if (isOrganizerRole) return "/organizer/profile";
    if (isAdminRole) return "/admin/settings";
    return "/user/dashboard";
  };

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
  };

  const handleCreateEvent = () => {
    if (!isAuthenticated || !user) {
      navigate("/auth/register/organizer", {
        state: { message: "Register as an organizer to create and manage events", redirectTo: "/organizer/events/create" },
      });
      return;
    }

    const isOrganizerRole = [UserRole.ORGANIZER, UserRole.ORGANIZER_ADMIN, UserRole.ORGANIZER_TELLER].includes(user.role);
    const isAdminRole = [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.SUPPORT, UserRole.TELLER].includes(user.role);

    if (isAdminRole) { navigate("/admin/events/create"); return; }
    if (isOrganizerRole) { navigate("/organizer/events/create"); return; }

    toast({
      title: "Organizer Account Required",
      description: "You need to register as an organizer to create events.",
      variant: "default",
    });
    navigate("/auth/register/organizer", {
      state: { message: "Register as an organizer to create and manage events.", redirectTo: "/organizer/events/create" },
    });
  };

  // ── Style computation ──────────────────────────────────────

  const isTransparentMode = transparent && !isScrolled;

  // Floating pill: gains margin + rounded corners after scrolling past the hero.
  // Non-scrolled: full-width bar (transparent over hero, or solid on other pages).
  const pillStyle = isScrolled
    ? "mx-6 lg:mx-16 xl:mx-24 mt-3 rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-elevated"
    : isTransparentMode
      ? "border-b border-transparent bg-transparent"
      : "border-b border-border bg-background/95 backdrop-blur-xl shadow-sm";

  const textColor = isTransparentMode
    ? "text-white/90 hover:text-white"
    : "text-muted-foreground hover:text-foreground";

  const textColorHover = isTransparentMode
    ? "hover:bg-white/10"
    : "hover:bg-muted";

  const mobileMenuStyle = isScrolled
    ? "mx-6 lg:mx-16 xl:mx-24 rounded-b-2xl border border-t-0 border-border bg-background overflow-hidden"
    : "border-t border-border bg-background overflow-hidden";

  // ── Mobile menu items ──────────────────────────────────────

  const mobileItems = isAuthenticated
    ? [{ label: "Create Event", onClick: () => { handleCreateEvent(); setIsMobileMenuOpen(false); } }]
    : [{ label: "Sign in", onClick: () => { navigate("/auth/signin"); setIsMobileMenuOpen(false); } }];

  return (
    <nav className="fixed left-0 right-0 top-0 z-[9999]">
      {/* Pill / bar — this is the visual navbar surface */}
      <div className={`relative overflow-hidden transition-all duration-500 ${pillStyle}`}>
        {/* Dark gradient scrim — ensures text reads on any hero image */}
        {isTransparentMode && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent pointer-events-none" />
        )}
        <div className="relative px-6 lg:px-8">
        <div className="flex items-center h-[72px] justify-between">

          {/* Logo */}
          {/* TODO: once the final logo asset is ready, verify it renders in white
              when isTransparentMode is true — if it uses text-foreground or a dark
              fill it will disappear over the dark hero image. May need a variant prop
              or a CSS filter (invert) to force white in transparent mode. */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate("/")}>
            <Logo to={undefined} size={isScrolled ? "sm" : "default"} />
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle className={isTransparentMode ? "text-white/90 hover:bg-white/10" : ""} />

            {isAuthenticated && (
              <button
                onClick={handleCreateEvent}
                className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${textColor} ${textColorHover} hover:text-orange-500 dark:hover:text-orange-400`}
              >
                Create Event
              </button>
            )}

            {!isAuthenticated && (
              <>
                <button
                  onClick={() => navigate("/auth/signin")}
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${textColor} ${textColorHover}`}
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate("/get-started")}
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Get Started
                </button>
              </>
            )}

            {isAuthenticated && user && (
              <ProfileDropdown key={`profile-${user.id}`} />
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle className={isTransparentMode ? "text-white/90 hover:bg-white/10" : ""} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={isTransparentMode ? "text-white hover:bg-white/10" : ""}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        </div>

        {/* Scroll progress bar — inside pill so it respects rounded corners */}
        {isScrolled && (
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-primary to-orange-500"
            style={{ width: progressWidth }}
          />
        )}
      </div>

      {/* Animated mobile menu — attaches below pill when floating */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={`md:hidden ${mobileMenuStyle}`}
          >
            <div className="px-6 lg:px-8 py-3 space-y-1">
              {mobileItems.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE, delay: i * 0.04 }}
                  onClick={item.onClick}
                  className="block w-full text-left px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-medium transition-colors"
                >
                  {item.label}
                </motion.button>
              ))}

              {!isAuthenticated && (
                <motion.button
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE, delay: mobileItems.length * 0.04 }}
                  onClick={() => { navigate("/get-started"); setIsMobileMenuOpen(false); }}
                  className="block w-full text-center px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors mt-2"
                >
                  Get Started
                </motion.button>
              )}

              {isAuthenticated && user && (
                <div className="border-t border-border pt-2 mt-2 space-y-1">
                  {[
                    { label: "Profile", onClick: () => { navigate(getProfileRoute()); setIsMobileMenuOpen(false); } },
                    { label: "Dashboard", onClick: async () => { const route = await getDashboardRoute(); navigate(route); setIsMobileMenuOpen(false); } },
                  ].map((item, i) => (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: EASE, delay: (mobileItems.length + i + 1) * 0.04 }}
                      onClick={item.onClick}
                      className="block w-full text-left px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-medium transition-colors"
                    >
                      {item.label}
                    </motion.button>
                  ))}
                  <motion.button
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE, delay: (mobileItems.length + 3) * 0.04 }}
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 text-sm font-medium transition-colors"
                  >
                    Logout
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
