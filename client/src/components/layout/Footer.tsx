import { Link } from "react-router-dom";

// ---------------------------------------------------------------------------
// Social icons
// ---------------------------------------------------------------------------

const XIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const TiktokIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const LinkedinIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const YouTubeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

// ---------------------------------------------------------------------------
// Link groups — only real routes, no dead links
// ---------------------------------------------------------------------------

const EXPLORE_LINKS = [
  { label: "Browse Events", to: "/" },
  { label: "About", to: "/about" },
  { label: "Careers", to: "/careers" },
  { label: "Support", to: "/support" },
];

const ORGANIZERS_LINKS = [
  { label: "Create Event", to: "/create-event" },
  { label: "Become an Organizer", to: "/auth/register/organizer" },
];

const LEGAL_LINKS = [
  { label: "Terms of Service", to: "/terms-of-service" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Cookie Policy", to: "/cookie-policy" },
];

const SOCIALS = [
  { icon: XIcon, label: "X", href: "#" },
  { icon: FacebookIcon, label: "Facebook", href: "#" },
  { icon: InstagramIcon, label: "Instagram", href: "#" },
  { icon: YouTubeIcon, label: "YouTube", href: "#" },
  { icon: TiktokIcon, label: "TikTok", href: "#" },
  { icon: LinkedinIcon, label: "LinkedIn", href: "#" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400 mb-4">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-sm text-neutral-400 dark:text-muted-foreground hover:text-white dark:hover:text-foreground transition-colors duration-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 dark:bg-background border-t border-orange-500/20 dark:border-border">
      {/* Orange accent line at top */}
      <div className="h-0.5 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 dark:from-orange-500/40 dark:via-orange-500/60 dark:to-orange-500/40" />

      <div className="container mx-auto px-6 lg:px-8">
        {/* Link columns */}
        <div className="py-12 sm:py-14 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-12">
          <FooterLinkGroup title="Explore" links={EXPLORE_LINKS} />
          <FooterLinkGroup title="Organizers" links={ORGANIZERS_LINKS} />
          <FooterLinkGroup title="Legal" links={LEGAL_LINKS} />

          {/* Get the app column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-orange-400 mb-4">
              Get the App
            </h3>
            <div className="flex gap-3">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg border border-neutral-700/60 dark:border-border bg-neutral-900 dark:bg-card hover:border-orange-500/40 hover:bg-neutral-800 dark:hover:bg-muted transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
                  <path d="M3.609 1.814 13.792 12 3.61 22.186a2.372 2.372 0 0 1-.109-.712V2.526c0-.249.037-.489.109-.712z" fill="#4285F4" />
                  <path d="m14.737 12.945-2.836 2.836L3.609 22.186A2.405 2.405 0 0 0 5.264 23c.46 0 .919-.132 1.313-.396l.015-.009 9.024-5.21-2.879-2.879z" fill="#34A853" />
                  <path d="M20.494 10.678 17.3 8.833l-3.508 3.167 3.508 3.508 3.191-1.843c.574-.33.934-.92.934-1.588 0-.668-.36-1.259-.93-1.592v.193z" fill="#FBBC04" />
                  <path d="M3.609 1.814A2.405 2.405 0 0 1 5.264 1c.46 0 .919.132 1.313.396l.015.009 9.024 5.21-2.879 2.879-9.128-7.68z" fill="#EA4335" />
                </svg>
                <div>
                  <div className="text-[10px] text-neutral-500 dark:text-muted-foreground leading-none">Download on</div>
                  <div className="text-sm font-semibold text-white dark:text-foreground leading-tight">Google Play</div>
                </div>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg border border-neutral-700/60 dark:border-border bg-neutral-900 dark:bg-card hover:border-orange-500/40 hover:bg-neutral-800 dark:hover:bg-muted transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 text-white" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div>
                  <div className="text-[10px] text-neutral-500 dark:text-muted-foreground leading-none">Download on</div>
                  <div className="text-sm font-semibold text-white dark:text-foreground leading-tight">App Store</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar — brand left, social right */}
        <div className="border-t border-neutral-800 dark:border-border py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand + copyright */}
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white dark:text-foreground">Event</span>
                <span className="text-orange-500">Knit</span>
              </span>
            </Link>
            <span className="hidden sm:inline text-neutral-700 dark:text-border">|</span>
            <p className="text-xs text-neutral-500 dark:text-muted-foreground">
              &copy; {currentYear} EventKnit. All rights reserved.
            </p>
          </div>

          {/* Social row */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-neutral-500 dark:text-muted-foreground mr-2 hidden sm:inline">Follow us on:</span>
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 dark:text-muted-foreground hover:text-orange-400 hover:bg-orange-500/10 transition-colors duration-200"
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                <social.icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
