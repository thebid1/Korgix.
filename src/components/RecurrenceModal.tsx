import { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { RecurrencePattern, RecurrenceType } from '../types';

interface RecurrenceModalProps {
  onClose: () => void;
  onSelect: (recurrence: RecurrencePattern | null) => void;
  initial?: RecurrencePattern | null;
}

export const RecurrenceModal = ({ onClose, onSelect, initial }: RecurrenceModalProps) => {
  const [selectedType, setSelectedType] = useState<RecurrenceType>(initial?.type || 'none');
  const [customInterval, setCustomInterval] = useState<number>(initial?.interval || 1);
  const [customUnit, setCustomUnit] = useState<'days' | 'weeks' | 'months'>(
    initial?.unit || 'days'
  );
  const [showCustomOptions, setShowCustomOptions] = useState(
    initial?.type === 'custom'
  );

  const handleSelect = (type: RecurrenceType) => {
    if (type === 'none') {
      onSelect(null);
      onClose();
      return;
    }

    if (type === 'custom') {
      setSelectedType(type);
      setShowCustomOptions(true);
      return;
    }

    setSelectedType(type);
    const pattern: RecurrencePattern = {
      type,
      interval: 1,
      unit: type === 'daily' ? 'days' : type === 'weekly' ? 'weeks' : 'months',
    };
    onSelect(pattern);
    onClose();
  };

  const handleCustomConfirm = () => {
    if (customInterval < 1) {
      return;
    }
    const pattern: RecurrencePattern = {
      type: 'custom',
      interval: customInterval,
      unit: customUnit,
    };
    onSelect(pattern);
    onClose();
  };

  const getDescription = (type: RecurrenceType): string => {
    switch (type) {
      case 'daily':
        return 'Every day';
      case 'weekly':
        return 'Every week';
      case 'monthly':
        return 'Every month';
      case 'yearly':
        return 'Every year';
      case 'none':
        return 'No repeat';
      default:
        return '';
    }
  };

  const getCustomDescription = (): string => {
    if (customInterval === 1) {
      return `Every ${customUnit.slice(0, -1)}`;
    }
    return `Every ${customInterval} ${customUnit}`;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90"
          style={{ background: 'var(--surface)' }}
        >
          <X size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Repeat
        </h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {!showCustomOptions ? (
          <div className="space-y-2">
            {(
              [
                { type: 'none' as RecurrenceType, label: 'No repeat' },
                { type: 'daily' as RecurrenceType, label: 'Daily' },
                { type: 'weekly' as RecurrenceType, label: 'Weekly' },
                { type: 'monthly' as RecurrenceType, label: 'Monthly' },
                { type: 'yearly' as RecurrenceType, label: 'Yearly' },
                { type: 'custom' as RecurrenceType, label: 'Custom' },
              ] as const
            ).map(({ type, label }) => (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                className="w-full flex items-center justify-between px-4 py-4 rounded-xl active:scale-95"
                style={{
                  background: selectedType === type ? 'var(--accent)' : 'var(--surface)',
                  color: selectedType === type ? '#000' : 'var(--text)',
                }}
              >
                <div className="text-left">
                  <p className="font-semibold">{label}</p>
                  {selectedType === type && type !== 'none' && (
                    <p
                      className="text-xs mt-1"
                      style={{
                        color: selectedType === type ? 'rgba(0,0,0,0.6)' : 'var(--text-muted)',
                      }}
                    >
                      {getDescription(type)}
                    </p>
                  )}
                </div>
                {selectedType === type && <ChevronRight size={18} />}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => {
                setShowCustomOptions(false);
                setSelectedType('none');
              }}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: 'var(--surface)' }}
            >
              <X size={18} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)' }}>Back</span>
            </button>

            <div>
              <label
                className="text-[11px] font-bold tracking-widest uppercase mb-3 block"
                style={{ color: 'var(--text-muted)' }}
              >
                Every
              </label>
              <input
                type="number"
                value={customInterval}
                onChange={(e) => setCustomInterval(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="365"
                className="w-full px-4 py-3 rounded-xl text-lg font-semibold outline-none"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              />
            </div>

            <div>
              <label
                className="text-[11px] font-bold tracking-widest uppercase mb-3 block"
                style={{ color: 'var(--text-muted)' }}
              >
                Unit
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['days', 'weeks', 'months'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setCustomUnit(unit)}
                    className="px-3 py-3 rounded-xl font-semibold text-sm active:scale-95"
                    style={{
                      background: customUnit === unit ? 'var(--accent)' : 'var(--surface)',
                      color: customUnit === unit ? '#000' : 'var(--text)',
                    }}
                  >
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="px-4 py-4 rounded-xl text-center"
              style={{ background: 'var(--surface)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Preview:
              </p>
              <p className="text-lg font-semibold" style={{ color: 'var(--accent)' }}>
                {getCustomDescription()}
              </p>
            </div>

            <button
              onClick={handleCustomConfirm}
              className="w-full px-4 py-3 rounded-xl font-semibold active:scale-95"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
