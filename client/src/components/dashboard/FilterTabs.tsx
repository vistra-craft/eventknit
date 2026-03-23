/**
 * Sub-filter tabs for dashboard content sections (All / Upcoming / Past).
 *
 * Styled as lightweight underline tabs to visually differentiate from
 * the parent-level pill tabs (Attending / Saved / Tickets).
 */

export interface FilterTab<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface FilterTabsProps<T extends string> {
  tabs: FilterTab<T>[];
  activeFilter: T;
  onFilterChange: (filter: T) => void;
}

function FilterTabs<T extends string>({ tabs, activeFilter, onFilterChange }: FilterTabsProps<T>) {
  return (
    <div className="flex items-center gap-4 mb-6 border-b border-border overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onFilterChange(tab.key)}
          className={`relative pb-2.5 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
            activeFilter === tab.key
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
          {tab.count != null && tab.count > 0 && (
            <span className={`ml-1.5 text-xs ${
              activeFilter === tab.key ? 'text-primary/70' : 'text-muted-foreground/70'
            }`}>
              {tab.count}
            </span>
          )}
          {/* Active underline indicator */}
          {activeFilter === tab.key && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

export default FilterTabs;
