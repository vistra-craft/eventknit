import React, { useState, useEffect } from "react";
import { Calendar, Menu, X, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import SearchBar from "./Searchbar";
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

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { activeViewRole } = useRoleView();
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [country] = useState<string>('US'); // Default to US

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

  const getDashboardRoute = () => {
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
      toast({
        title: "Registration Required",
        description: "Please register as an organizer to create events. You'll be redirected to the registration page.",
        variant: "default",
      });
      navigate('/auth/register/organizer', { 
        state: { 
          message: 'Register as an organizer to create and manage events',
          redirectTo: '/organizer/events/create'
        } 
      });
      return;
    }

    // Check if user is an organizer
    const isOrganizerRole = [
      UserRole.ORGANIZER,
      UserRole.ORGANIZER_STAFF,
      UserRole.ORGANIZER_TELLER,
    ].includes(user.role);

    // Check if user is an admin
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

    // User is authenticated but not an organizer or admin
    toast({
      title: "Organizer Account Required",
      description: "You need to register as an organizer to create events. Register now to continue.",
      variant: "default",
    });
    navigate('/auth/register/organizer', { 
      state: { 
        message: 'Register as an organizer to create and manage events',
        redirectTo: '/organizer/events/create'
      } 
    });
  };

  return (
    <>
      {/* Utility Bar - Simplified */}
      <div className="bg-eventknit h-8 w-full">
        <div className="container mx-auto px-6 h-full flex items-center justify-between text-eventknit-foreground text-sm font-medium">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>|</span>
            <span>{country}</span>
          </div>
          
          <div className="flex items-center space-x-6">
            {!isAuthenticated && (
              <>
                <button
                  onClick={() => navigate('/auth/signin')}
                  className="hover:text-accent-electric transition-colors duration-200 cursor-pointer"
                >
                  Login
                </button>
                <span>|</span>
                <button 
                  onClick={() => navigate('/auth/signup')}
                  className="hover:text-accent-electric transition-colors duration-200 cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`fixed left-0 right-0 z-[9999] transition-all duration-300 ease-in-out ${
          isScrolled
            ? "top-0 bg-background/95 backdrop-blur-xl shadow-lg border-b border-border"
            : "top-8 bg-glass-bg backdrop-blur-xl border-b border-glass-border"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center h-16 gap-6">
            
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-eventknit rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-eventknit-foreground" />
              </div>
              <span className="text-xl font-bold text-eventknit">EventKnit</span>
            </div>

            {/* Search Bar - Full Width */}
            <div className="hidden lg:flex flex-1">
              <SearchBar />
            </div>

            {/* Desktop Navigation & Actions */}
            <div className="hidden md:flex items-center space-x-6 flex-shrink-0">
              {/* Navigation */}
              <div className="flex items-center space-x-6">
                {navItems.map((item) => {
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item)}
                      className={`text-sm font-medium text-foreground/80 hover:text-nav-hover transition-colors duration-200`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
              
              {/* Actions */}
              <button
                onClick={handleCreateEvent}
                className="text-sm font-medium text-foreground/80 hover:text-nav-hover transition-colors duration-200"
              >
                Create Event
              </button>

              {/* Profile Dropdown - Only show when authenticated and user exists */}
              {/* Rely on auth context state (isAuthenticated, user) for immediate updates */}
              {isAuthenticated && user ? (
                <ProfileDropdown key={`profile-${user.id}`} />
              ) : null}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
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
              {/* Mobile Search Bar */}
              <div className="mb-4">
                <SearchBar />
              </div>
              
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
                      onClick={() => {
                        navigate(getDashboardRoute());
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