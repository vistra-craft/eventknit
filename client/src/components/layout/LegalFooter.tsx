import { Link, useLocation } from 'react-router-dom';

/**
 * Footer for legal pages (Terms, Privacy, Cookies)
 * Contains: Logo, legal page links, support contact, copyright
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
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Top row: Logo + Legal Links */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-foreground">EventKnit</span>
          </Link>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
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
        </div>

        <div className="border-t border-border pt-6" />

        {/* Bottom row: Copyright + Contact */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} EventKnit. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <a
              href="mailto:support@eventknit.com"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              support@eventknit.com
            </a>
            <span className="text-muted-foreground/30">|</span>
            <a
              href="mailto:privacy@eventknit.com"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              privacy@eventknit.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LegalFooter;
