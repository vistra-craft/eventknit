import React, { useState, useEffect } from "react";
import { Calendar, Menu, X } from 'lucide-react';
import Logo from '@/components/Logo';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ProfileDropdown } from "./ProfileDropdown";
import { useAuth } from "@/hooks/useAuth";
import { useRoleView } from "@/contexts/RoleViewContext";
import { UserRole } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";

interface NavItem {
  name: string;
  href: string;
  dropdown?: string[];
}

interface NavbarProps {
  onSearch?: (searchTerm: string, location: string) => void;
}

const Navbar: React.FC<NavbarProps> = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { activeViewRole } = useRoleView();
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Force close mobile menu when user logs out
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsMobileMenuOpen(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const shouldBeScrolled = scrollPosition > 10;
      setIsScrolled(shouldBeScrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Country detection disabled to prevent CORS/rate limiting issues
  // useEffect(() => {
  //   const detectCountry = async () => {
  //     try {
  //       const response = await fetch('https://ipapi.co/json/');
  //       const data = await response.json();
  //       if (data.country_code) {
  //         setCountry(data.country_code);
  //       }
  //     } catch (error) {
  //       // If API fails, keep default 'US'
  //       console.log('Country detection failed, using default US');
  //     }
  //   };
  //   detectCountry();
  // }, []);

  // Simplified navigation items - keeping only essential ones
  const navItems: NavItem[] = [
    { name: "About", href: "/about" },
    { name: "Find Events", href: "/" },
  ];

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    // Logout is now synchronous - no need to await
    logout();
  };

  const getDashboardRoute = async () => {
    // Use active view role if set, otherwise use user's actual role
    const roleToUse = activeViewRole || user?.role;
    
    if (!roleToUse) return '/user/dashboard';
    
    const isAdminRole = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN_STAFF,
      UserRole.MARKETER,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ].includes(roleToUse);
    
    const isOrganizerRole = [
      UserRole.ORGANIZER,
      UserRole.ORGANIZER_STAFF,
      UserRole.ORGANIZER_TELLER,
    ].includes(roleToUse);
    
    if (isAdminRole) return '/admin/dashboard';
    
    // For organizers, check if they have dashboard access
    if (isOrganizerRole && roleToUse === UserRole.ORGANIZER) {
      try {
        const { getDashboardAccess } = await import('@/lib/organizer-api');
        const accessResponse = await getDashboardAccess();
        if (accessResponse.success && !accessResponse.data.hasAccess) {
          // No event created - redirect to event creation
          return '/organizer/events/create-standalone';
        }
      } catch (error) {
        console.error('Error checking dashboard access:', error);
        // On error, redirect to event creation to be safe
        return '/organizer/events/create-standalone';
      }
    }
    
    if (isOrganizerRole) return '/organizer/dashboard';
    return '/user/dashboard';
  };

  const getProfileRoute = () => {
    // Use active view role if set, otherwise use user's actual role
    const roleToUse = activeViewRole || user?.role;
    
    if (!roleToUse) return '/user/dashboard';
    
    const isAdminRole = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN_STAFF,
      UserRole.MARKETER,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ].includes(roleToUse);
    
    const isOrganizerRole = [
      UserRole.ORGANIZER,
      UserRole.ORGANIZER_STAFF,
      UserRole.ORGANIZER_TELLER,
    ].includes(roleToUse);
    
    if (isOrganizerRole) return '/organizer/profile';
    if (isAdminRole) return '/admin/settings';
    return '/user/dashboard';
  };

  const handleNavigation = (item: NavItem) => {
    if (item.name === "Find Events") {
      // Navigate to home page and scroll to events section
      navigate('/');
      // Use setTimeout to ensure the page loads before scrolling
      setTimeout(() => {
        const eventsSection = document.querySelector('[data-section="events"]') || 
                              document.querySelector('.event-grid') ||
                              document.querySelector('[class*="EventGrid"]');
        if (eventsSection) {
          eventsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      navigate(item.href);
    }
  };

  const handleCreateEvent = () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      // Not logged in - redirect to organizer signup
      navigate('/auth/register/organizer', { 
        state: { 
          message: 'Register as an organizer to create and manage events',
          redirectTo: '/organizer/events/create'
        } 
      });
      return;
    }

    // User is logged in - route based on role
    const isOrganizerRole = [
      UserRole.ORGANIZER,
      UserRole.ORGANIZER_STAFF,
      UserRole.ORGANIZER_TELLER,
    ].includes(user.role);

    const isAdminRole = [
      UserRole.SUPERADMIN,
      UserRole.ADMIN_STAFF,
      UserRole.MARKETER,
      UserRole.SUPPORT,
      UserRole.TELLER,
    ].includes(user.role);

    // Route admins to admin event creation page
    if (isAdminRole) {
      navigate('/admin/events/create');
      return;
    }

    // Route organizers to organizer event creation page
    if (isOrganizerRole) {
      navigate('/organizer/events/create');
      return;
    }

    // Logged in as client/attendee - they need to register as organizer to create events
    // Redirect to organizer signup so they can switch/register as organizer
    toast({
      title: "Organizer Account Required",
      description: "You need to register as an organizer to create events. You can register with a different email or switch accounts.",
      variant: "default",
    });
    navigate('/auth/register/organizer', { 
      state: { 
        message: 'Register as an organizer to create and manage events. You can use a different email if needed.',
        redirectTo: '/organizer/events/create'
      } 
    });
  };

  return (
    <>
      {/* Main Navbar */}
      <nav
        className={`fixed left-0 right-0 top-0 z-[9999] bg-background/95 backdrop-blur-xl border-b border-border transition-all duration-300 ease-in-out ${
          isScrolled ? "shadow-md" : "shadow-none"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center h-16 gap-6 justify-between">
            
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}> 
              <Logo to={undefined} />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-2">
                {navItems.map((item) => {
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item)}
                      className="text-sm font-medium px-3 py-1.5 rounded-md text-foreground/80 hover:bg-accent-coral hover:text-white transition-colors duration-200"
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>

              {/* Desktop Actions */}
              <div className="flex items-center gap-4">
                {!isAuthenticated && (
                  <>
                    <button
                      onClick={() => navigate('/auth/signin')}
                      className="text-sm font-medium px-3 py-1.5 rounded-md text-foreground/80 hover:bg-accent-coral hover:text-white transition-colors duration-200"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => navigate('/auth/signup')}
                      className="text-sm font-medium text-white bg-accent-coral px-4 py-1.5 rounded-md hover:bg-accent-coral/90 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
                    >
                      Sign Up
                    </button>
                  </>
                )}

                {isAuthenticated && (
                  <button
                    onClick={handleCreateEvent}
                    className="text-sm font-medium text-foreground/80 hover:text-nav-hover transition-colors duration-200"
                  >
                    Create Event
                  </button>
                )}

                {/* Profile Dropdown - Only show when authenticated and user exists */}
                {isAuthenticated && user ? (
                  <ProfileDropdown key={`profile-${user.id}`} />
                ) : null}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden ml-auto">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border shadow-lg">
            <div className="container mx-auto px-6 py-4">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    handleNavigation(item);
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-nav-hover font-medium"
                >
                  {item.name}
                </button>
              ))}
              
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <button
                  className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-nav-hover font-medium"
                  onClick={() => {
                    handleCreateEvent();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Create Event
                </button>
                
                {/* Mobile Profile Section */}
                {isAuthenticated && user && (
                  <div className="border-t border-border pt-4 mt-4 space-y-2">
                    <button
                      onClick={() => {
                        navigate(getProfileRoute());
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-nav-hover font-medium"
                    >
                      Profile
                    </button>
                    <button
                      onClick={async () => {
                        const route = await getDashboardRoute();
                        navigate(route);
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-nav-hover font-medium"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-destructive hover:text-destructive/80 font-medium"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;