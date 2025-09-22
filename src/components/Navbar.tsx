import React, { useState, useEffect } from "react";
import { Calendar, Menu, X, User, LogOut, ChevronDown, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import SearchBar from "./Searchbar";

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
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null); // Mock user state - replace with your auth
  const [country, setCountry] = useState<string>('US'); // Default to US
  const location = useLocation();

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

  const handleLogout = (): void => {
    setUser(null);
    // Add your logout logic here
  };

  return (
    <>
      {/* Utility Bar - Simplified */}
      <div className="bg-primary h-8 w-full">
        <div className="container mx-auto px-6 h-full flex items-center justify-between text-primary-foreground text-sm font-medium">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>|</span>
            <span>{country}</span>
          </div>
          
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{user.name || 'John Doe'}</span>
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
          <div className="flex items-center h-16 gap-6">
            
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">EventKnit</span>
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
                  const isActive = location.pathname === item.href || 
                                 (item.href === '/' && location.pathname === '/');

                  return (
                    <button
                      key={item.name}
                      onClick={() => navigate(item.href)}
                      className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground/80 hover:text-primary'} transition-colors duration-200`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
              
              {/* Actions */}
              <button
                onClick={() => navigate('/create-event')}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors duration-200"
              >
                Create Event
              </button>
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
                    navigate(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-foreground/80 hover:text-primary font-medium ${location.pathname === item.href ? 'text-primary' : ''}`}
                >
                  {item.name}
                </button>
              ))}
              
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <button
                  className="block w-full text-left px-3 py-2 text-foreground/80 hover:text-primary font-medium"
                  onClick={() => {
                    navigate('/create-event');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;