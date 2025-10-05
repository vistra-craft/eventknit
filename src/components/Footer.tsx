import { Facebook, Twitter, Instagram } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  return (
    <footer className="bg-primary/5">
      <div className="container mx-auto px-6 py-4">
        {/* Social Media Icons */}
        <div className="flex justify-center space-x-4 mb-2">
          <a
            href="#"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            aria-label="Facebook"
          >
            <Facebook size={16} />
          </a>
          <a
            href="#"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            aria-label="Twitter"
          >
            <Twitter size={16} />
          </a>
          <a
            href="#"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            aria-label="Instagram"
          >
            <Instagram size={16} />
          </a>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          {/* Column 1 - Platform */}
          <div className="text-center md:text-left">
            <ul className="space-y-1">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  <span className="text-eventknit">EventKnit</span> Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  About <span className="text-eventknit">EventKnit</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/create-event"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Create Event
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2 - Support & Info */}
          <div className="text-center">
            <ul className="space-y-1">
              <li>
                <Link
                  to="/support"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Help/Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/cookie-policy"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Business */}
          <div className="text-center md:text-right">
            <ul className="space-y-1">
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Partner With Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Press
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {isHomePage && (
        <div className="container mx-auto px-6 py-2">
          {/* Line above legal text */}
          <div className="border-t border-gray-300 pt-2 mb-2"></div>
          {/* Legal Text */}
          <div>
            <p className="text-center text-xs text-gray-500 leading-relaxed">
              BY CONTINUING PAST THIS PAGE, YOU AGREE TO OUR{" "}
              <Link
                to="/terms-of-service"
                className="text-gray-700 underline hover:no-underline transition-colors"
              >
                TERMS OF USE
              </Link>{" "}
              AND{" "}
              <Link
                to="/privacy-policy"
                className="text-gray-700 underline hover:no-underline transition-colors"
              >
                PRIVACY POLICY
              </Link>{" "}
              |{" "}
              <Link
                to="/cookie-policy"
                className="text-gray-700 underline hover:no-underline transition-colors"
              >
                COOKIE POLICY
              </Link>{" "}
              |
            </p>
            <p className="text-center text-xs text-gray-500 mt-1">
              © 2025 <span className="text-eventknit">EVENTKNIT</span>. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      )}
      
      {!isHomePage && (
        <div className="container mx-auto px-6 py-2">
          <p className="text-center text-xs text-gray-500 mt-1">
            © 2025 <span className="text-eventknit">EVENTKNIT</span>. ALL RIGHTS RESERVED.
          </p>
        </div>
      )}
    </footer>
  );
};

export default Footer;