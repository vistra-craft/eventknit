import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Country {
  name: string;
  dialCode: string;
  flag: string;
}

// East Africa first, then rest of Africa, then global (alphabetical within regions)
export const COUNTRIES: Country[] = [
  // ── East Africa (priority) ────────────────────────────────────────────────
  { name: 'Kenya',                    dialCode: '+254', flag: '🇰🇪' },
  { name: 'Uganda',                   dialCode: '+256', flag: '🇺🇬' },
  { name: 'Tanzania',                 dialCode: '+255', flag: '🇹🇿' },
  { name: 'Rwanda',                   dialCode: '+250', flag: '🇷🇼' },
  { name: 'Ethiopia',                 dialCode: '+251', flag: '🇪🇹' },
  { name: 'Burundi',                  dialCode: '+257', flag: '🇧🇮' },
  { name: 'Djibouti',                 dialCode: '+253', flag: '🇩🇯' },
  { name: 'Eritrea',                  dialCode: '+291', flag: '🇪🇷' },
  { name: 'Somalia',                  dialCode: '+252', flag: '🇸🇴' },
  { name: 'South Sudan',              dialCode: '+211', flag: '🇸🇸' },
  // ── Rest of Africa ────────────────────────────────────────────────────────
  { name: 'Algeria',                  dialCode: '+213', flag: '🇩🇿' },
  { name: 'Angola',                   dialCode: '+244', flag: '🇦🇴' },
  { name: 'Benin',                    dialCode: '+229', flag: '🇧🇯' },
  { name: 'Botswana',                 dialCode: '+267', flag: '🇧🇼' },
  { name: 'Burkina Faso',             dialCode: '+226', flag: '🇧🇫' },
  { name: 'Cameroon',                 dialCode: '+237', flag: '🇨🇲' },
  { name: 'Cape Verde',               dialCode: '+238', flag: '🇨🇻' },
  { name: 'Central African Republic', dialCode: '+236', flag: '🇨🇫' },
  { name: 'Chad',                     dialCode: '+235', flag: '🇹🇩' },
  { name: 'Comoros',                  dialCode: '+269', flag: '🇰🇲' },
  { name: 'Congo (DR)',               dialCode: '+243', flag: '🇨🇩' },
  { name: 'Congo (Republic)',         dialCode: '+242', flag: '🇨🇬' },
  { name: 'Egypt',                    dialCode: '+20',  flag: '🇪🇬' },
  { name: 'Equatorial Guinea',        dialCode: '+240', flag: '🇬🇶' },
  { name: 'Gabon',                    dialCode: '+241', flag: '🇬🇦' },
  { name: 'Gambia',                   dialCode: '+220', flag: '🇬🇲' },
  { name: 'Ghana',                    dialCode: '+233', flag: '🇬🇭' },
  { name: 'Guinea',                   dialCode: '+224', flag: '🇬🇳' },
  { name: 'Guinea-Bissau',            dialCode: '+245', flag: '🇬🇼' },
  { name: 'Ivory Coast',              dialCode: '+225', flag: '🇨🇮' },
  { name: 'Lesotho',                  dialCode: '+266', flag: '🇱🇸' },
  { name: 'Liberia',                  dialCode: '+231', flag: '🇱🇷' },
  { name: 'Libya',                    dialCode: '+218', flag: '🇱🇾' },
  { name: 'Madagascar',               dialCode: '+261', flag: '🇲🇬' },
  { name: 'Malawi',                   dialCode: '+265', flag: '🇲🇼' },
  { name: 'Mali',                     dialCode: '+223', flag: '🇲🇱' },
  { name: 'Mauritania',               dialCode: '+222', flag: '🇲🇷' },
  { name: 'Mauritius',                dialCode: '+230', flag: '🇲🇺' },
  { name: 'Morocco',                  dialCode: '+212', flag: '🇲🇦' },
  { name: 'Mozambique',               dialCode: '+258', flag: '🇲🇿' },
  { name: 'Namibia',                  dialCode: '+264', flag: '🇳🇦' },
  { name: 'Niger',                    dialCode: '+227', flag: '🇳🇪' },
  { name: 'Nigeria',                  dialCode: '+234', flag: '🇳🇬' },
  { name: 'São Tomé & Príncipe',      dialCode: '+239', flag: '🇸🇹' },
  { name: 'Senegal',                  dialCode: '+221', flag: '🇸🇳' },
  { name: 'Seychelles',               dialCode: '+248', flag: '🇸🇨' },
  { name: 'Sierra Leone',             dialCode: '+232', flag: '🇸🇱' },
  { name: 'South Africa',             dialCode: '+27',  flag: '🇿🇦' },
  { name: 'Sudan',                    dialCode: '+249', flag: '🇸🇩' },
  { name: 'Eswatini',                 dialCode: '+268', flag: '🇸🇿' },
  { name: 'Togo',                     dialCode: '+228', flag: '🇹🇬' },
  { name: 'Tunisia',                  dialCode: '+216', flag: '🇹🇳' },
  { name: 'Zambia',                   dialCode: '+260', flag: '🇿🇲' },
  { name: 'Zimbabwe',                 dialCode: '+263', flag: '🇿🇼' },
  // ── Americas ──────────────────────────────────────────────────────────────
  { name: 'Antigua & Barbuda',        dialCode: '+1268',flag: '🇦🇬' },
  { name: 'Argentina',                dialCode: '+54',  flag: '🇦🇷' },
  { name: 'Bahamas',                  dialCode: '+1242',flag: '🇧🇸' },
  { name: 'Barbados',                 dialCode: '+1246',flag: '🇧🇧' },
  { name: 'Belize',                   dialCode: '+501', flag: '🇧🇿' },
  { name: 'Bolivia',                  dialCode: '+591', flag: '🇧🇴' },
  { name: 'Brazil',                   dialCode: '+55',  flag: '🇧🇷' },
  { name: 'Canada',                   dialCode: '+1',   flag: '🇨🇦' },
  { name: 'Chile',                    dialCode: '+56',  flag: '🇨🇱' },
  { name: 'Colombia',                 dialCode: '+57',  flag: '🇨🇴' },
  { name: 'Costa Rica',               dialCode: '+506', flag: '🇨🇷' },
  { name: 'Cuba',                     dialCode: '+53',  flag: '🇨🇺' },
  { name: 'Dominican Republic',       dialCode: '+1809',flag: '🇩🇴' },
  { name: 'Ecuador',                  dialCode: '+593', flag: '🇪🇨' },
  { name: 'El Salvador',              dialCode: '+503', flag: '🇸🇻' },
  { name: 'Guatemala',                dialCode: '+502', flag: '🇬🇹' },
  { name: 'Guyana',                   dialCode: '+592', flag: '🇬🇾' },
  { name: 'Haiti',                    dialCode: '+509', flag: '🇭🇹' },
  { name: 'Honduras',                 dialCode: '+504', flag: '🇭🇳' },
  { name: 'Jamaica',                  dialCode: '+1876',flag: '🇯🇲' },
  { name: 'Mexico',                   dialCode: '+52',  flag: '🇲🇽' },
  { name: 'Nicaragua',                dialCode: '+505', flag: '🇳🇮' },
  { name: 'Panama',                   dialCode: '+507', flag: '🇵🇦' },
  { name: 'Paraguay',                 dialCode: '+595', flag: '🇵🇾' },
  { name: 'Peru',                     dialCode: '+51',  flag: '🇵🇪' },
  { name: 'Puerto Rico',              dialCode: '+1787',flag: '🇵🇷' },
  { name: 'Trinidad & Tobago',        dialCode: '+1868',flag: '🇹🇹' },
  { name: 'United States',            dialCode: '+1',   flag: '🇺🇸' },
  { name: 'Uruguay',                  dialCode: '+598', flag: '🇺🇾' },
  { name: 'Venezuela',                dialCode: '+58',  flag: '🇻🇪' },
  // ── Asia ──────────────────────────────────────────────────────────────────
  { name: 'Afghanistan',              dialCode: '+93',  flag: '🇦🇫' },
  { name: 'Armenia',                  dialCode: '+374', flag: '🇦🇲' },
  { name: 'Azerbaijan',               dialCode: '+994', flag: '🇦🇿' },
  { name: 'Bahrain',                  dialCode: '+973', flag: '🇧🇭' },
  { name: 'Bangladesh',               dialCode: '+880', flag: '🇧🇩' },
  { name: 'Bhutan',                   dialCode: '+975', flag: '🇧🇹' },
  { name: 'Brunei',                   dialCode: '+673', flag: '🇧🇳' },
  { name: 'Cambodia',                 dialCode: '+855', flag: '🇰🇭' },
  { name: 'China',                    dialCode: '+86',  flag: '🇨🇳' },
  { name: 'Cyprus',                   dialCode: '+357', flag: '🇨🇾' },
  { name: 'Georgia',                  dialCode: '+995', flag: '🇬🇪' },
  { name: 'Hong Kong',                dialCode: '+852', flag: '🇭🇰' },
  { name: 'India',                    dialCode: '+91',  flag: '🇮🇳' },
  { name: 'Indonesia',                dialCode: '+62',  flag: '🇮🇩' },
  { name: 'Iran',                     dialCode: '+98',  flag: '🇮🇷' },
  { name: 'Iraq',                     dialCode: '+964', flag: '🇮🇶' },
  { name: 'Israel',                   dialCode: '+972', flag: '🇮🇱' },
  { name: 'Japan',                    dialCode: '+81',  flag: '🇯🇵' },
  { name: 'Jordan',                   dialCode: '+962', flag: '🇯🇴' },
  { name: 'Kazakhstan',               dialCode: '+7',   flag: '🇰🇿' },
  { name: 'Kuwait',                   dialCode: '+965', flag: '🇰🇼' },
  { name: 'Kyrgyzstan',               dialCode: '+996', flag: '🇰🇬' },
  { name: 'Laos',                     dialCode: '+856', flag: '🇱🇦' },
  { name: 'Lebanon',                  dialCode: '+961', flag: '🇱🇧' },
  { name: 'Macau',                    dialCode: '+853', flag: '🇲🇴' },
  { name: 'Malaysia',                 dialCode: '+60',  flag: '🇲🇾' },
  { name: 'Maldives',                 dialCode: '+960', flag: '🇲🇻' },
  { name: 'Mongolia',                 dialCode: '+976', flag: '🇲🇳' },
  { name: 'Myanmar',                  dialCode: '+95',  flag: '🇲🇲' },
  { name: 'Nepal',                    dialCode: '+977', flag: '🇳🇵' },
  { name: 'North Korea',              dialCode: '+850', flag: '🇰🇵' },
  { name: 'Oman',                     dialCode: '+968', flag: '🇴🇲' },
  { name: 'Pakistan',                 dialCode: '+92',  flag: '🇵🇰' },
  { name: 'Palestine',                dialCode: '+970', flag: '🇵🇸' },
  { name: 'Philippines',              dialCode: '+63',  flag: '🇵🇭' },
  { name: 'Qatar',                    dialCode: '+974', flag: '🇶🇦' },
  { name: 'Saudi Arabia',             dialCode: '+966', flag: '🇸🇦' },
  { name: 'Singapore',                dialCode: '+65',  flag: '🇸🇬' },
  { name: 'South Korea',              dialCode: '+82',  flag: '🇰🇷' },
  { name: 'Sri Lanka',                dialCode: '+94',  flag: '🇱🇰' },
  { name: 'Syria',                    dialCode: '+963', flag: '🇸🇾' },
  { name: 'Taiwan',                   dialCode: '+886', flag: '🇹🇼' },
  { name: 'Tajikistan',               dialCode: '+992', flag: '🇹🇯' },
  { name: 'Thailand',                 dialCode: '+66',  flag: '🇹🇭' },
  { name: 'Timor-Leste',              dialCode: '+670', flag: '🇹🇱' },
  { name: 'Turkey',                   dialCode: '+90',  flag: '🇹🇷' },
  { name: 'Turkmenistan',             dialCode: '+993', flag: '🇹🇲' },
  { name: 'UAE',                      dialCode: '+971', flag: '🇦🇪' },
  { name: 'Uzbekistan',               dialCode: '+998', flag: '🇺🇿' },
  { name: 'Vietnam',                  dialCode: '+84',  flag: '🇻🇳' },
  { name: 'Yemen',                    dialCode: '+967', flag: '🇾🇪' },
  // ── Europe ────────────────────────────────────────────────────────────────
  { name: 'Albania',                  dialCode: '+355', flag: '🇦🇱' },
  { name: 'Andorra',                  dialCode: '+376', flag: '🇦🇩' },
  { name: 'Austria',                  dialCode: '+43',  flag: '🇦🇹' },
  { name: 'Belarus',                  dialCode: '+375', flag: '🇧🇾' },
  { name: 'Belgium',                  dialCode: '+32',  flag: '🇧🇪' },
  { name: 'Bosnia & Herzegovina',     dialCode: '+387', flag: '🇧🇦' },
  { name: 'Bulgaria',                 dialCode: '+359', flag: '🇧🇬' },
  { name: 'Croatia',                  dialCode: '+385', flag: '🇭🇷' },
  { name: 'Czech Republic',           dialCode: '+420', flag: '🇨🇿' },
  { name: 'Denmark',                  dialCode: '+45',  flag: '🇩🇰' },
  { name: 'Estonia',                  dialCode: '+372', flag: '🇪🇪' },
  { name: 'Finland',                  dialCode: '+358', flag: '🇫🇮' },
  { name: 'France',                   dialCode: '+33',  flag: '🇫🇷' },
  { name: 'Germany',                  dialCode: '+49',  flag: '🇩🇪' },
  { name: 'Greece',                   dialCode: '+30',  flag: '🇬🇷' },
  { name: 'Hungary',                  dialCode: '+36',  flag: '🇭🇺' },
  { name: 'Iceland',                  dialCode: '+354', flag: '🇮🇸' },
  { name: 'Ireland',                  dialCode: '+353', flag: '🇮🇪' },
  { name: 'Italy',                    dialCode: '+39',  flag: '🇮🇹' },
  { name: 'Kosovo',                   dialCode: '+383', flag: '🇽🇰' },
  { name: 'Latvia',                   dialCode: '+371', flag: '🇱🇻' },
  { name: 'Liechtenstein',            dialCode: '+423', flag: '🇱🇮' },
  { name: 'Lithuania',                dialCode: '+370', flag: '🇱🇹' },
  { name: 'Luxembourg',               dialCode: '+352', flag: '🇱🇺' },
  { name: 'Malta',                    dialCode: '+356', flag: '🇲🇹' },
  { name: 'Moldova',                  dialCode: '+373', flag: '🇲🇩' },
  { name: 'Monaco',                   dialCode: '+377', flag: '🇲🇨' },
  { name: 'Montenegro',               dialCode: '+382', flag: '🇲🇪' },
  { name: 'Netherlands',              dialCode: '+31',  flag: '🇳🇱' },
  { name: 'North Macedonia',          dialCode: '+389', flag: '🇲🇰' },
  { name: 'Norway',                   dialCode: '+47',  flag: '🇳🇴' },
  { name: 'Poland',                   dialCode: '+48',  flag: '🇵🇱' },
  { name: 'Portugal',                 dialCode: '+351', flag: '🇵🇹' },
  { name: 'Romania',                  dialCode: '+40',  flag: '🇷🇴' },
  { name: 'Russia',                   dialCode: '+7',   flag: '🇷🇺' },
  { name: 'San Marino',               dialCode: '+378', flag: '🇸🇲' },
  { name: 'Serbia',                   dialCode: '+381', flag: '🇷🇸' },
  { name: 'Slovakia',                 dialCode: '+421', flag: '🇸🇰' },
  { name: 'Slovenia',                 dialCode: '+386', flag: '🇸🇮' },
  { name: 'Spain',                    dialCode: '+34',  flag: '🇪🇸' },
  { name: 'Sweden',                   dialCode: '+46',  flag: '🇸🇪' },
  { name: 'Switzerland',              dialCode: '+41',  flag: '🇨🇭' },
  { name: 'Ukraine',                  dialCode: '+380', flag: '🇺🇦' },
  { name: 'United Kingdom',           dialCode: '+44',  flag: '🇬🇧' },
  // ── Oceania ───────────────────────────────────────────────────────────────
  { name: 'Australia',                dialCode: '+61',  flag: '🇦🇺' },
  { name: 'Fiji',                     dialCode: '+679', flag: '🇫🇯' },
  { name: 'Kiribati',                 dialCode: '+686', flag: '🇰🇮' },
  { name: 'Marshall Islands',         dialCode: '+692', flag: '🇲🇭' },
  { name: 'Micronesia',               dialCode: '+691', flag: '🇫🇲' },
  { name: 'Nauru',                    dialCode: '+674', flag: '🇳🇷' },
  { name: 'New Zealand',              dialCode: '+64',  flag: '🇳🇿' },
  { name: 'Palau',                    dialCode: '+680', flag: '🇵🇼' },
  { name: 'Papua New Guinea',         dialCode: '+675', flag: '🇵🇬' },
  { name: 'Samoa',                    dialCode: '+685', flag: '🇼🇸' },
  { name: 'Solomon Islands',          dialCode: '+677', flag: '🇸🇧' },
  { name: 'Tonga',                    dialCode: '+676', flag: '🇹🇴' },
  { name: 'Tuvalu',                   dialCode: '+688', flag: '🇹🇻' },
  { name: 'Vanuatu',                  dialCode: '+678', flag: '🇻🇺' },
];

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const PhoneInput = ({
  value = '',
  onChange,
  className,
  placeholder = '712 345 678',
  disabled = false,
}: PhoneInputProps) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [localNumber, setLocalNumber] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Parse initial value once on mount
  useEffect(() => {
    if (!value) return;
    const match = COUNTRIES.find((c) => value.startsWith(c.dialCode));
    if (match) {
      setSelectedCountry(match);
      setLocalNumber(value.slice(match.dialCode.length).trim());
    } else {
      setLocalNumber(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q),
    );
  }, [search]);

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    setOpen(false);
    onChange?.(`${country.dialCode}${localNumber}`);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^\d\s\-()]/g, '');
    setLocalNumber(num);
    onChange?.(`${selectedCountry.dialCode}${num}`);
  };

  return (
    <div
      className={cn(
        'flex h-10 rounded-md border border-input bg-background overflow-hidden',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      {/* Country selector */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex items-center gap-1.5 pl-3 pr-2 border-r border-input',
              'bg-muted/40 hover:bg-muted/70 transition-colors shrink-0',
              'text-sm text-foreground focus:outline-none',
            )}
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span className="text-xs text-muted-foreground font-medium tabular-nums">
              {selectedCountry.dialCode}
            </span>
            <ChevronDown className={cn('w-3 h-3 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64 p-0" onCloseAutoFocus={(e) => e.preventDefault()}>
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code…"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Country list */}
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">No results</p>
            ) : (
              filtered.map((country) => {
                const isSelected = selectedCountry.name === country.name;
                return (
                  <button
                    key={`${country.name}-${country.dialCode}`}
                    type="button"
                    onClick={() => handleCountryChange(country)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-1.5 text-sm',
                      'hover:bg-accent hover:text-accent-foreground transition-colors text-left',
                      isSelected && 'bg-primary/5',
                    )}
                  >
                    <span className="text-base leading-none w-5 shrink-0">{country.flag}</span>
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">{country.dialCode}</span>
                    {isSelected && <Check className="w-3 h-3 text-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Number input */}
      <input
        type="tel"
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground min-w-0"
      />
    </div>
  );
};

export default PhoneInput;
