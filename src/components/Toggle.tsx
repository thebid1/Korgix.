interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle = ({ checked, onChange, label, disabled }: ToggleProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors active:scale-95 disabled:opacity-50"
      style={{ background: checked ? 'var(--accent)' : 'var(--border-light)' }}
    >
      <span
        className="inline-block h-5 w-5 rounded-full transform transition-transform"
        style={{
          background: 'var(--inverse-text)',
          transform: checked ? 'translateX(24px)' : 'translateX(4px)',
        }}
      />
      {label && <span className="sr-only">{label}</span>}
    </button>
  );
};
