import { Facebook, Twitter, Instagram } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <footer className="bg-primary/5">
      <div className="container mx-auto px-6 py-2">
        <div className="flex flex-col items-center justify-center gap-2 py-2 text-[11px] text-muted-foreground md:flex-row">
          <p className="text-center whitespace-nowrap">
            © 2025 <span className="text-eventknit font-semibold">EventKnit</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link
              to="/privacy-policy"
              className="hover:text-nav-hover transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="hidden md:inline text-border">|</span>
            <Link
              to="/terms-of-service"
              className="hover:text-nav-hover transition-colors"
            >
              Terms of Service
            </Link>
            <span className="hidden md:inline text-border">|</span>
            <Link
              to="/cookie-policy"
              className="hover:text-nav-hover transition-colors"
            >
              Cookie Policy
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2">
            <a
              href="#"
              className="flex items-center justify-center w-6 h-6 rounded-full bg-eventknit text-eventknit-foreground hover:bg-eventknit/90 transition-colors"
              aria-label="Facebook"
            >
              <Facebook size={12} />
            </a>
            <a
              href="#"
              className="flex items-center justify-center w-6 h-6 rounded-full bg-eventknit text-eventknit-foreground hover:bg-eventknit/90 transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={12} />
            </a>
            <a
              href="#"
              className="flex items-center justify-center w-6 h-6 rounded-full bg-eventknit text-eventknit-foreground hover:bg-eventknit/90 transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={12} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;