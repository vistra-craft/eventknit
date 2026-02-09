import type { CreateBrandingData } from '@/lib/white-label-api';

interface BrandingPreviewProps {
  data: CreateBrandingData;
}

const BrandingPreview = ({ data }: BrandingPreviewProps) => {
  const primary = data.primaryColor || '#4a6cf7';
  const secondary = data.secondaryColor || '#1a1a2e';
  const accent = data.accentColor || '#f4a261';
  const bg = data.backgroundColor || '#ffffff';
  const text = data.textColor || '#333333';
  const link = data.linkColor || primary;

  return (
    <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: bg }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: primary }}
      >
        {data.logoUrl ? (
          <img
            src={data.logoUrl}
            alt="Logo"
            className="h-8 w-auto max-w-[120px] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="h-8 w-8 rounded bg-white/20" />
        )}
        <span className="text-sm font-semibold text-white truncate">
          {data.brandName || 'Brand Name'}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-3">
        {data.tagline && (
          <p className="text-xs italic" style={{ color: text }}>
            {data.tagline}
          </p>
        )}

        {/* Sample event card */}
        <div className="border rounded-md p-3 space-y-2" style={{ borderColor: `${secondary}20` }}>
          <div className="h-2 rounded" style={{ backgroundColor: `${secondary}15`, width: '70%' }} />
          <div className="h-2 rounded" style={{ backgroundColor: `${secondary}10`, width: '90%' }} />
          <div className="h-2 rounded" style={{ backgroundColor: `${secondary}10`, width: '50%' }} />
        </div>

        {/* Sample button */}
        <button
          className="w-full rounded-md py-1.5 text-xs font-medium text-white cursor-default"
          style={{ backgroundColor: primary }}
        >
          Get Tickets
        </button>

        {/* Sample link */}
        <p className="text-xs text-center" style={{ color: link }}>
          View event details
        </p>

        {/* Color swatches */}
        <div className="flex items-center gap-1.5 pt-2 border-t">
          {[
            { label: 'Primary', color: primary },
            { label: 'Secondary', color: secondary },
            { label: 'Accent', color: accent },
            { label: 'BG', color: bg },
            { label: 'Text', color: text },
            { label: 'Link', color: link },
          ].map(({ label, color }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <div
                className="w-5 h-5 rounded border border-gray-200"
                style={{ backgroundColor: color }}
                title={`${label}: ${color}`}
              />
              <span className="text-[9px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      {(data.supportEmail || data.websiteUrl) && (
        <div
          className="px-4 py-2 text-[10px] border-t"
          style={{ color: `${text}99` }}
        >
          {data.supportEmail && <span>{data.supportEmail}</span>}
          {data.supportEmail && data.websiteUrl && <span> | </span>}
          {data.websiteUrl && <span style={{ color: link }}>{data.websiteUrl}</span>}
        </div>
      )}
    </div>
  );
};

export default BrandingPreview;
