/**
 * Public Layout Component
 * Wraps public pages with Navbar, Footer, and proper flex layout structure
 * Ensures footer stays at bottom when content is short
 */

import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface PublicLayoutProps {
  children: ReactNode;
  className?: string;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-background flex flex-col ${className}`}>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
