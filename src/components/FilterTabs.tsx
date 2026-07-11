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
              background: isActive ? 'var(--inverse-bg)' : 'var(--surface)',
              color: isActive ? 'var(--inverse-text)' : 'var(--text)',
              boxShadow: isActive ? 'var(--shadow)' : 'none',
            }}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span 
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                style={{ 
                  background: isActive ? 'rgba(0,0,0,0.08)' : 'rgba(128,128,128,0.15)',
                  color: isActive ? 'var(--inverse-text)' : 'var(--text)',
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
