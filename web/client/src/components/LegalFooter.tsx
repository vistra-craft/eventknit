import { Link, useLocation } from 'react-router-dom';

/**
 * Simplified footer for legal pages (Terms, Privacy, Cookies)
 * Contains only: Logo, legal page links, copyright, support contact
 */
const LegalFooter = () => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();

  const legalLinks = [
    { to: '/terms-of-service', label: 'Terms of Service' },
    { to: '/privacy-policy', label: 'Privacy Policy' },
    { to: '/cookie-policy', label: 'Cookie Policy' },
  ];

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Legal Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6">
          {legalLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm transition-colors ${
                location.pathname === link.to
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border mb-6" />

        {/* Bottom: Logo + Copyright + Contact */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">E</span>
            </div>
            <span className="font-semibold text-foreground text-sm">EventKnit</span>
          </Link>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground text-center">
            &copy; {currentYear} EventKnit. All rights reserved.
          </p>

          {/* Support Contact */}
          <a
            href="mailto:support@eventknit.com"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            support@eventknit.com
          </a>
        </div>
      </div>
    </footer>
  );
};

export default LegalFooter;
