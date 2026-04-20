import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LegalSubsection {
  subtitle: string;
  items: string[];
}

export interface LegalSection {
  id?: string;
  title: string;
  content?: string;
  items?: string[];
  subsections?: LegalSubsection[];
  note?: string;
}

export interface LegalPageProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  contactEmail: string;
  sections: LegalSection[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const EASE = [0.16, 1, 0.3, 1] as const;

// Generate stable IDs from section titles
function toId(title: string, existingId?: string): string {
  if (existingId) return existingId;
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── Component ──────────────────────────────────────────────────────────────

const LegalPage = ({ title, subtitle, lastUpdated, contactEmail, sections }: LegalPageProps) => {
  const enriched = sections.map((s) => ({ ...s, _id: toId(s.title, s.id) }));
  const [activeSection, setActiveSection] = useState(enriched[0]?._id ?? '');
  const [tocOpen, setTocOpen] = useState(false);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const offsets = enriched.map((s) => {
        const el = document.getElementById(s._id);
        return { id: s._id, top: el?.getBoundingClientRect().top ?? Infinity };
      });
      const current = offsets.find((o) => o.top > 120) ?? offsets[offsets.length - 1];
      const idx = offsets.indexOf(current);
      setActiveSection(idx > 0 ? offsets[idx - 1].id : offsets[0].id);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enriched]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setTocOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-10 sm:pb-14">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
              className="text-muted-foreground mt-2 max-w-lg"
            >
              {subtitle}
            </motion.p>
          )}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14, ease: EASE }}
            className="text-sm text-muted-foreground mt-3"
          >
            Last updated: {lastUpdated}
          </motion.p>
          {/* Accent bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
            className="h-0.5 w-12 bg-primary rounded-full mt-5 origin-left"
          />
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* TOC — Mobile Dropdown */}
            <div className="lg:hidden">
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground"
              >
                Table of Contents
                <motion.div
                  animate={{ rotate: tocOpen ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </button>
              <AnimatePresence>
                {tocOpen && (
                  <motion.nav
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-2 rounded-lg border border-border bg-card overflow-hidden"
                  >
                    <div className="p-3 space-y-0.5">
                      {enriched.map((s) => (
                        <button
                          key={s._id}
                          onClick={() => scrollToSection(s._id)}
                          className={cn(
                            'block w-full text-left text-sm py-1.5 px-3 rounded-md transition-colors',
                            activeSection === s._id
                              ? 'text-primary font-medium bg-primary/5'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {s.title}
                        </button>
                      ))}
                    </div>
                  </motion.nav>
                )}
              </AnimatePresence>
            </div>

            {/* TOC — Desktop Sidebar */}
            <nav className="hidden lg:block lg:w-64 shrink-0">
              <div className="sticky top-20 space-y-0.5">
                <p className="text-sm font-medium text-foreground mb-3">Contents</p>
                {enriched.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => scrollToSection(s._id)}
                    className={cn(
                      'block w-full text-left text-[13px] py-1.5 px-3 rounded-md transition-colors',
                      activeSection === s._id
                        ? 'text-primary font-medium bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {enriched.map((section, index) => (
                <motion.section
                  key={section._id}
                  id={section._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: index * 0.03, duration: 0.5, ease: EASE }}
                  className="mb-10 scroll-mt-24"
                >
                  <h2 className="text-lg font-semibold text-foreground mb-3">
                    {section.title}
                  </h2>

                  {section.content && section.content.includes('\n\n') ? (
                    <div className="space-y-3">
                      {section.content.split('\n\n').map((paragraph, i) => (
                        <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : section.content ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  ) : null}

                  {section.subsections && (
                    <div className="space-y-4 mt-1">
                      {section.subsections.map((sub, i) => (
                        <div key={i}>
                          <h3 className="text-sm font-medium text-foreground mb-1.5">{sub.subtitle}</h3>
                          <ul className="space-y-1 pl-1">
                            {sub.items.map((item, j) => (
                              <li key={j} className="text-sm text-muted-foreground flex items-start gap-2.5">
                                <span className="text-primary/60 mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.items && !section.subsections && (
                    <ul className="space-y-1.5 mt-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2.5">
                          <span className="text-primary/60 mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.note && (
                    <p className="text-sm font-medium text-foreground mt-3 pl-3 border-l-2 border-primary/30">
                      {section.note}
                    </p>
                  )}
                </motion.section>
              ))}

              {/* Contact */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="pt-6 border-t border-border"
              >
                <p className="text-sm text-muted-foreground">
                  Questions? Contact us at{' '}
                  <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">
                    {contactEmail}
                  </a>
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LegalPage;
