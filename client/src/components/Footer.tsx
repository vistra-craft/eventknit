import { Facebook, Twitter, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-6 py-2">
        <div className="flex flex-col items-center justify-center gap-2 py-2 text-[11px] text-gray-300 md:flex-row">
          <p className="text-center whitespace-nowrap text-[11px] font-normal">
            © 2025 <span className="text-white font-normal">EventKnit</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link
              to="/privacy-policy"
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="hidden md:inline text-border">|</span>
            <Link
              to="/terms-of-service"
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <span className="hidden md:inline text-border">|</span>
            <Link
              to="/cookie-policy"
              className="hover:text-white transition-colors"
            >
              Cookie Policy
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2">
            <a
              href="#"
              className="flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <Facebook size={14} />
            </a>
            <a
              href="#"
              className="flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={14} />
            </a>
            <a
              href="#"
              className="flex items-center justify-center text-gray-400 hover:text-white transition-colors"
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