import { TaskStatus } from '../types';

type Filter = 'today' | 'upcoming' | 'done' | 'all';

interface FilterTabsProps {
  active: Filter;
  onChange: (f: Filter) => void;
  counts: Record<Filter, number>;
}

export const FilterTabs = ({ active, onChange, counts }: FilterTabsProps) => {
  const tabs: { key: Filter; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'done', label: 'Done' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95"
            style={{
              background: isActive ? '#ffffff' : 'var(--surface)',
              color: isActive ? '#000000' : '#ffffff',
              boxShadow: isActive ? '0 1px 4px rgba(255,255,255,0.15)' : 'none',
            }}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span 
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                style={{ 
                  background: isActive ? '#00000015' : '#ffffff15',
                  color: isActive ? '#000000' : '#ffffff',
                }}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
