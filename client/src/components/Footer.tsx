import { Facebook, Twitter, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground dark:bg-primary-dark">
      <div className="container mx-auto px-6 py-2">
        <div className="flex flex-col items-center justify-center gap-2 py-2 text-[11px] text-current md:flex-row">
          <p className="text-center whitespace-nowrap text-[11px] font-normal">
            © 2025 <span className="font-normal">EventKnit</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link to="/privacy-policy" className="text-current hover:underline transition-colors">
              Privacy Policy
            </Link>
            <span className="hidden md:inline text-border">|</span>
            <Link to="/terms-of-service" className="text-current hover:underline transition-colors">
              Terms of Service
            </Link>
            <span className="hidden md:inline text-border">|</span>
            <Link to="/cookie-policy" className="text-current hover:underline transition-colors">
              Cookie Policy
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2">
            <a
              href="#"
              className="flex items-center justify-center text-current hover:scale-110 transition-all"
              aria-label="Facebook"
            >
              <Facebook size={14} />
            </a>
            <a
              href="#"
              className="flex items-center justify-center text-current hover:scale-110 transition-all"
              aria-label="Twitter"
            >
              <Twitter size={14} />
            </a>
            <a
              href="#"
              className="flex items-center justify-center text-current hover:scale-110 transition-all"
              aria-label="Instagram"
            >
              <Instagram size={14} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;