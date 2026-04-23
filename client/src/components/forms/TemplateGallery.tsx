import { useState, useEffect } from 'react';
import { Loader2, Plus, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  listAllTemplates,
  FORM_PURPOSE_LABELS,
  type FormTemplate,
  type BuiltInTemplate,
  type CustomTemplate,
} from '@/lib/form-template-api';
import type { FormPurpose } from '@/lib/form-api';

const PURPOSE_CONFIG: Record<string, { from: string; to: string; icon: string }> = {
  REGISTRATION:          { from: '#3b82f6', to: '#2563eb', icon: '📋' },
  FEEDBACK:              { from: '#10b981', to: '#059669', icon: '⭐' },
  SPEAKER_APPLICATION:   { from: '#8b5cf6', to: '#7c3aed', icon: '🎤' },
  EXHIBITOR_APPLICATION: { from: '#f97316', to: '#ea580c', icon: '🏢' },
  SPONSOR_APPLICATION:   { from: '#f59e0b', to: '#d97706', icon: '💼' },
  VOLUNTEER_APPLICATION: { from: '#14b8a6', to: '#0d9488', icon: '🙋' },
  PERFORMER_APPLICATION: { from: '#ec4899', to: '#db2777', icon: '🎭' },
  VENDOR_APPLICATION:    { from: '#84cc16', to: '#65a30d', icon: '🛒' },
  JUDGE_APPLICATION:     { from: '#06b6d4', to: '#0891b2', icon: '⚖️' },
  MEDIA_APPLICATION:     { from: '#a855f7', to: '#9333ea', icon: '📸' },
  GENERAL_INQUIRY:       { from: '#64748b', to: '#475569', icon: '💬' },
  CUSTOM:                { from: '#6b7280', to: '#4b5563', icon: '✏️' },
};

const FILTER_PILLS: { label: string; value: FormPurpose | 'ALL' }[] = [
  { label: 'All',        value: 'ALL' },
  { label: 'Registration', value: 'REGISTRATION' },
  { label: 'Feedback',   value: 'FEEDBACK' },
  { label: 'Speaker',    value: 'SPEAKER_APPLICATION' },
  { label: 'Exhibitor',  value: 'EXHIBITOR_APPLICATION' },
  { label: 'Sponsor',    value: 'SPONSOR_APPLICATION' },
  { label: 'Volunteer',  value: 'VOLUNTEER_APPLICATION' },
  { label: 'Performer',  value: 'PERFORMER_APPLICATION' },
  { label: 'Vendor',     value: 'VENDOR_APPLICATION' },
  { label: 'Judge',      value: 'JUDGE_APPLICATION' },
  { label: 'Media',      value: 'MEDIA_APPLICATION' },
];

export interface TemplateGalleryProps {
  /** Called when a card is clicked. null = blank form. */
  onSelect: (template: FormTemplate | null) => void;
  /** When true the gallery is shown inline on a page (no dialog padding/scroll wrapper needed). */
  inline?: boolean;
}

export function TemplateGallery({ onSelect, inline = false }: TemplateGalleryProps) {
  const [builtIn, setBuiltIn] = useState<BuiltInTemplate[]>([]);
  const [custom, setCustom]   = useState<CustomTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter]   = useState<FormPurpose | 'ALL'>('ALL');

  const load = () => {
    setLoading(true);
    setFetchError(null);
    listAllTemplates()
      .then(res => { setBuiltIn(res.builtIn); setCustom(res.custom); })
      .catch((err: unknown) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load templates.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filteredBuiltIn = filter === 'ALL' ? builtIn : builtIn.filter(t => t.purpose === filter);
  const filteredCustom  = filter === 'ALL' ? custom  : custom.filter(t => t.purpose === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm text-muted-foreground">{fetchError}</p>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTER_PILLS.map(pill => (
          <button
            key={pill.value}
            type="button"
            onClick={() => setFilter(pill.value)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              filter === pill.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border/50 hover:border-border hover:text-foreground',
            )}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Card grid */}
      <div className={cn('grid gap-3', inline ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3')}>
        {/* Blank */}
        {filter === 'ALL' && (
          <TemplateCard
            isBlank
            title="Blank Form"
            description="Start with an empty form and build your own questions from scratch."
            questionCount={0}
            onClick={() => onSelect(null)}
          />
        )}

        {filteredBuiltIn.map((t, i) => {
          const cfg = PURPOSE_CONFIG[t.purpose] ?? PURPOSE_CONFIG['CUSTOM'];
          return (
            <TemplateCard
              key={i}
              title={t.name}
              description={t.description}
              questionCount={t.questions.length}
              purposeLabel={FORM_PURPOSE_LABELS[t.purpose]}
              colorFrom={cfg.from}
              colorTo={cfg.to}
              icon={cfg.icon}
              previewLabels={t.questions.slice(0, 3).map(q => q.label)}
              onClick={() => onSelect(t)}
            />
          );
        })}

        {filteredCustom.map(t => {
          const cfg = PURPOSE_CONFIG[t.purpose] ?? PURPOSE_CONFIG['CUSTOM'];
          return (
            <TemplateCard
              key={t.id}
              title={t.name}
              description={t.description ?? ''}
              questionCount={t.questions.length}
              purposeLabel={FORM_PURPOSE_LABELS[t.purpose]}
              colorFrom={cfg.from}
              colorTo={cfg.to}
              icon={cfg.icon}
              previewLabels={t.questions.slice(0, 3).map(q => q.label)}
              onClick={() => onSelect(t)}
              isSaved
            />
          );
        })}
      </div>

      {filteredBuiltIn.length === 0 && filteredCustom.length === 0 && filter !== 'ALL' && (
        <p className="text-sm text-muted-foreground text-center py-6">No templates for this category.</p>
      )}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface TemplateCardProps {
  title: string;
  description: string;
  questionCount: number;
  purposeLabel?: string;
  colorFrom?: string;
  colorTo?: string;
  icon?: string;
  previewLabels?: string[];
  onClick: () => void;
  isBlank?: boolean;
  isSaved?: boolean;
}

function TemplateCard({
  title,
  questionCount,
  purposeLabel,
  colorFrom,
  colorTo,
  icon,
  previewLabels = [],
  onClick,
  isBlank,
  isSaved,
}: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative text-left rounded-xl border overflow-hidden transition-all duration-150',
        'hover:shadow-lg hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'border-border/50 hover:border-primary/30',
      )}
    >
      {/* Coloured header */}
      <div
        className="h-28 p-3 flex flex-col justify-between relative overflow-hidden"
        style={
          isBlank
            ? { background: 'hsl(var(--muted))' }
            : { background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})` }
        }
      >
        {isBlank ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full border-2 border-muted-foreground/30 border-dashed flex items-center justify-center">
              <Plus className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">Blank</span>
          </div>
        ) : (
          <>
            {/* Frosted mini form preview */}
            <div className="bg-white/20 backdrop-blur-sm rounded-md p-2 space-y-1.5 flex-1">
              <div className="h-1.5 bg-white/70 rounded-full w-3/4" />
              {previewLabels.map((label, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 shrink-0 rounded-sm border border-white/60" />
                  <div
                    className="h-1 bg-white/50 rounded-full"
                    style={{ width: `${50 + (label.length * 3) % 35}%` }}
                  />
                </div>
              ))}
            </div>
            {/* Emoji icon */}
            <span className="text-base leading-none mt-1.5 drop-shadow-sm">{icon}</span>
          </>
        )}

        {/* Hover arrow */}
        <div className={cn(
          'absolute right-2 bottom-2 bg-white/20 rounded-full p-1 transition-all',
          'opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0',
        )}>
          <ArrowRight className="h-3 w-3 text-white" />
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 bg-card space-y-0.5">
        <div className="flex items-start gap-1">
          <p className="text-xs font-semibold text-foreground leading-snug flex-1 line-clamp-1">{title}</p>
          {isSaved && (
            <span className="text-[9px] font-medium bg-muted text-muted-foreground rounded px-1 py-0.5 shrink-0">Saved</span>
          )}
        </div>
        {!isBlank && (
          <p className="text-[10px] text-muted-foreground">
            {questionCount} question{questionCount !== 1 ? 's' : ''}
            {purposeLabel ? ` · ${purposeLabel}` : ''}
          </p>
        )}
      </div>
    </button>
  );
}
