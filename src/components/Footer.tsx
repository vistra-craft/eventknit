import { Facebook, Twitter, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-100">
      <div className="container mx-auto px-6 py-4">
        {/* Top border */}
        <div className="border-t border-gray-200 pt-2 mb-2"></div>
        
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
          {/* Column 1 - Regional Sites */}
          <div className="text-center md:text-left">
            <ul className="space-y-1">
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  TicketWeb CA
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  TicketWeb UK
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Ticketmaster
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2 - Support & Info */}
          <div className="text-center">
            <ul className="space-y-1">
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  My Account
                </a>
              </li>
              <li>
                <Link
                  to="/support"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Help/Contact Us
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Purchase Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Do Not Sell or Share My Personal Information
                </a>
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
                  Client Sign-In
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Sell Tickets With Us
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
            </ul>
          </div>
        </div>
      </div>
      
      {/* Full-width line above legal text */}
      <div className="border-t border-gray-200"></div>
      
      <div className="container mx-auto px-6 py-2">
        {/* Legal Text */}
        <div>
          <p className="text-center text-xs text-gray-500 leading-relaxed">
            BY CONTINUING PAST THIS PAGE, YOU AGREE TO OUR{" "}
            <a
              href="#"
              className="text-gray-700 underline hover:no-underline transition-colors"
            >
              TERMS OF USE
            </a>{" "}
            AND{" "}
            <a
              href="#"
              className="text-gray-700 underline hover:no-underline transition-colors"
            >
              PURCHASE POLICY
            </a>{" "}
            |{" "}
            <a
              href="#"
              className="text-gray-700 underline hover:no-underline transition-colors"
            >
              COOKIE POLICY
            </a>{" "}
            |
          </p>
          <p className="text-center text-xs text-gray-500 mt-1">
            © 2025 EVENTKNIT. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;