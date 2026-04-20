import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Search, Target, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { showErrorToast } from '@/lib/utils/error';

export interface Coordinates {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  value?: Coordinates | null;
  onChange: (coords: Coordinates | null) => void;
  venue?: string;
  address?: string;
  location?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const defaultCenter: [number, number] = [20, 0];
const defaultZoom = 2;

const normalizeCoords = (coords?: Coordinates | null): [number, number] | null => {
  if (!coords) return null;
  if (Number.isNaN(coords.lat) || Number.isNaN(coords.lng)) return null;
  return [coords.lat, coords.lng];
};

const buildSearchQuery = (venue?: string, address?: string, location?: string) => {
  const parts = [venue, address, location].map((part) => part?.trim()).filter(Boolean);
  return parts.join(', ');
};

const MapViewUpdater = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.setView(center, 15, { animate: true });
  }, [center, map]);

  return null;
};

const MapClickHandler = ({ onPick }: { onPick: (coords: Coordinates) => void }) => {
  useMapEvents({
    click: (event) => {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
};

export const MapPicker = ({ value, onChange, venue, address, location }: MapPickerProps) => {
  const { toast } = useToast();
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [focusedResult, setFocusedResult] = useState<NominatimResult | null>(null);

  const selectedCenter = useMemo(() => normalizeCoords(value), [value]);

  useEffect(() => {
    // Fix Leaflet default icon paths for bundlers
    delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
  }, []);

  const searchPlaceholder = useMemo(
    () => buildSearchQuery(venue, address, location) || 'Search address or place name',
    [venue, address, location]
  );

  const handleSearch = useCallback(async () => {
    const query = searchValue.trim() || searchPlaceholder;
    if (!query) return;

    setIsSearching(true);
    setResults([]);
    setFocusedResult(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search location');
      }

      const data = (await response.json()) as NominatimResult[];
      setResults(data);

      if (data.length === 1) {
        const match = data[0];
        setFocusedResult(match);
        onChange({ lat: parseFloat(match.lat), lng: parseFloat(match.lon) });
      }
    } catch (error) {
      showErrorToast(toast, error, 'Location search failed', 'Unable to search this address. Try another location.');
    } finally {
      setIsSearching(false);
    }
  }, [searchValue, searchPlaceholder, onChange, toast]);

  const handleSelectResult = useCallback((result: NominatimResult) => {
    setFocusedResult(result);
    setResults([]);
    onChange({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
  }, [onChange]);

  const handleClear = useCallback(() => {
    setSearchValue('');
    setResults([]);
    setFocusedResult(null);
    onChange(null);
  }, [onChange]);

  const handlePick = useCallback((coords: Coordinates) => {
    onChange(coords);
  }, [onChange]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 pl-9"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => setSearchValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-11" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
          {value && (
            <Button type="button" variant="ghost" className="h-11" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Search results
          </div>
          <div className="max-h-48 overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
              >
                {result.display_name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Pin the exact location</p>
            <p className="text-xs text-muted-foreground">Click the map to drop a pin.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="h-4 w-4" />
            {value ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : 'No coordinates yet'}
          </div>
        </div>
        <div className="h-64 w-full overflow-hidden rounded-b-xl">
          <MapContainer
            center={selectedCenter || defaultCenter}
            zoom={selectedCenter ? 15 : defaultZoom}
            className="h-full w-full"
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <MapViewUpdater center={selectedCenter || (focusedResult ? [parseFloat(focusedResult.lat), parseFloat(focusedResult.lon)] : null)} />
            <MapClickHandler onPick={handlePick} />
            {selectedCenter && <Marker position={selectedCenter} />}
          </MapContainer>
        </div>
      </div>

      {value && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Latitude</span>
            <Input value={value.lat.toFixed(6)} readOnly className="h-10" />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Longitude</span>
            <Input value={value.lng.toFixed(6)} readOnly className="h-10" />
          </div>
        </div>
      )}
    </div>
  );
};
