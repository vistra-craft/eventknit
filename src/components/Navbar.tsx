import React, { useState, useEffect } from "react";
import { Calendar, Menu, X, User, LogOut, ChevronDown, Globe, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";

// Define types
interface User {
  name: string;
  email?: string;
  id?: string;
}

interface NavItem {
  name: string;
  href: string;
  dropdown?: string[];
}

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null); // Mock user state - replace with your auth

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

  const navItems: NavItem[] = [
    { 
      name: "Browse Events", 
      href: "/events",
      dropdown: [
        "Music & Concerts",
        "Sports & Fitness",
        "Arts & Theater",
        "Food & Drink",
        "Business & Professional",
        "Health & Wellness",
        "Family & Education",
        "Holiday & Seasonal"
      ]
    },
    { name: "Find Events Near You", href: "/nearby" },
    { 
      name: "Categories", 
      href: "/categories",
      dropdown: [
        "Conferences",
        "Workshops",
        "Festivals",
        "Networking Events",
        "Classes & Courses",
        "Charity & Causes"
      ]
    },
    { name: "Venues", href: "/venues" },
    { 
      name: "For Organizers", 
      href: "/organizers",
      dropdown: [
        "Event Planning Tools",
        "Ticketing Solutions",
        "Marketing Resources",
        "Analytics & Reports",
        "Pricing Plans",
        "Success Stories"
      ]
    },
    { name: "My Tickets", href: "/my-tickets" },
  ];

  const handleLogout = (): void => {
    setUser(null);
    // Add your logout logic here
  };

  return (
    <>
      {/* Utility Bar - Using your primary color instead of green */}
      <div className="bg-primary h-8 w-full">
        <div className="container mx-auto px-6 h-full flex items-center justify-between text-white text-sm font-medium">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>United States</span>
            </div>
            <span>|</span>
            <span>Help Center</span>
          </div>
          
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{user.name || 'John Doe'}</span>
                </div>
                <span>|</span>
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </div>
                <span>|</span>
                <button
                  onClick={handleLogout}
                  className="hover:text-primary/80 transition-colors duration-200 cursor-pointer flex items-center space-x-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setUser({name: 'John Doe'})} // Mock login
                  className="hover:text-primary/80 transition-colors duration-200 cursor-pointer"
                >
                  Login
                </button>
                <span>|</span>
                <button className="hover:text-primary/80 transition-colors duration-200 cursor-pointer">
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
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">EventKnit</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <div key={item.name} className="relative group">
                  <a
                    href={item.href}
                    className="px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out text-foreground/80 hover:text-primary flex items-center group"
                    onMouseEnter={() =>
                      item.dropdown && setActiveDropdown(item.name)
                    }
                    onMouseLeave={() => !item.dropdown && setActiveDropdown(null)}
                  >
                    {item.name}
                    {item.dropdown && (
                      <ChevronDown className="inline w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    )}
                  </a>

                  {item.dropdown && activeDropdown === item.name && (
                    <div
                      className="absolute top-full left-0 mt-1 w-64 bg-background rounded-lg shadow-lg border border-border py-2 z-50"
                      onMouseEnter={() => setActiveDropdown(item.name)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {item.dropdown.map((subItem, index) => (
                        <a
                          key={index}
                          href={`/${subItem.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and")}`}
                          className="block px-4 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-primary transition-colors"
                        >
                          {subItem}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost">Find My Tickets</Button>
              <Button variant="default">Create Event</Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-background/95 backdrop-blur-xl border-t border-border shadow-lg">
            <div className="container mx-auto px-6 py-4 max-h-96 overflow-y-auto">
              {navItems.map((item) => (
                <div key={item.name}>
                  <a
                    href={item.href}
                    className="flex items-center justify-between px-3 py-2 text-foreground/80 hover:text-primary font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                    {item.dropdown && (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </a>
                  {item.dropdown && (
                    <div className="pl-4 border-l-2 border-border ml-3">
                      {item.dropdown.map((subItem, index) => (
                        <a
                          key={index}
                          href={`/${subItem.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and")}`}
                          className="block px-3 py-1 text-sm text-foreground/60 hover:text-primary"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {subItem}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <Button variant="ghost" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  Find My Tickets
                </Button>
                <Button variant="default" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  Create Event
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;