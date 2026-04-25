import { Sun } from 'lucide-react';

interface EmptyStateProps {
  onAdd: () => void;
}

export const EmptyState = ({ onAdd }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'var(--surface)' }}
      >
        <Sun size={28} style={{ color: 'var(--text-secondary)' }} />
      </div>
      <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>
        Your day is open
      </p>
      <p className="text-sm text-center max-w-[240px]" style={{ color: 'var(--text-muted)' }}>
        Tap the + button to plan your first focus block.
      </p>
    </div>
  );
};
