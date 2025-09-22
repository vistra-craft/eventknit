import { Facebook, Twitter, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-100">
      <div className="container mx-auto px-6 py-12">
        {/* Legal Text */}
        <div className="border-t border-gray-200 pt-6 mb-8">
          
        </div>

        {/* Social Media Icons */}
        <div className="flex justify-center space-x-6 mb-8">
          <a
            href="#"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            aria-label="Facebook"
          >
            <Facebook size={20} />
          </a>
          <a
            href="#"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-400 text-white hover:bg-blue-500 transition-colors"
            aria-label="Twitter"
          >
            <Twitter size={20} />
          </a>
          <a
            href="#"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white hover:opacity-80 transition-opacity"
            aria-label="Instagram"
          >
            <Instagram size={20} />
          </a>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1 - Regional Sites */}
          <div className="text-center md:text-left">
            <ul className="space-y-2">
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
            <ul className="space-y-2">
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
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Help/Contact Us
                </a>
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
            <ul className="space-y-2">
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
      
      <div className="container mx-auto px-6 py-6">
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
          <p className="text-center text-xs text-gray-500 mt-2">
            © 2025 EVENTKNIT. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;