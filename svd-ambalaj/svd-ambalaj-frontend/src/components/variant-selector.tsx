'use client';

import { useState, useEffect, useMemo } from 'react';

type VariantOption = {
  id: string;
  name: string;
  stock: number;
  priceModifier: number;
};

type VariantSegment = {
  id: string;
  name: string;
  required: boolean;
  options: VariantOption[];
};

type SelectedVariants = Record<string, string>; // segmentId -> optionId

type VariantSelectorProps = {
  variants: VariantSegment[];
  onSelectionChange: (selections: SelectedVariants, availableStock: number) => void;
};

export function VariantSelector({ variants, onSelectionChange }: VariantSelectorProps) {
  // Initialize with first option of each segment selected
  const initialSelections = useMemo(() => {
    const initial: SelectedVariants = {};
    variants.forEach((segment) => {
      if (segment.options.length > 0) {
        initial[segment.id] = segment.options[0].id;
      }
    });
    return initial;
  }, [variants]);

  const [selections, setSelections] = useState<SelectedVariants>(initialSelections);

  // Calculate available stock based on selections
  const calculateAvailableStock = (currentSelections: SelectedVariants): number => {
    if (variants.length === 0) return Infinity;

    // Get all selected options
    const selectedOptions = variants.map(segment => {
      const selectedOptionId = currentSelections[segment.id];
      if (!selectedOptionId) return null;
      return segment.options.find(opt => opt.id === selectedOptionId);
    }).filter(Boolean) as VariantOption[];

    // If not all segments selected, return 0
    if (selectedOptions.length !== variants.length) return 0;

    // Available stock is the minimum stock across all selected options
    return Math.min(...selectedOptions.map(opt => opt.stock));
  };

  useEffect(() => {
    const availableStock = calculateAvailableStock(selections);
    onSelectionChange(selections, availableStock);
  }, [selections]);

  const handleOptionSelect = (segmentId: string, optionId: string) => {
    setSelections(prev => ({
      ...prev,
      [segmentId]: optionId,
    }));
  };

  const isAllSelected = variants.every(segment => selections[segment.id]);

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-bold text-purple-900">
        <span className="text-xl">🎨</span>
        Ürün Seçenekleri
      </h3>

      {variants.map((segment) => (
        <div key={segment.id} className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <label className="block text-sm font-semibold text-purple-800 mb-2">
            {segment.name}
            {segment.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {segment.options.map((option) => {
              const isSelected = selections[segment.id] === option.id;
              const isOutOfStock = option.stock <= 0;

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => handleOptionSelect(segment.id, option.id)}
                  className={`
                    relative rounded-lg px-4 py-2 text-sm font-medium transition-all
                    ${isOutOfStock
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                      : isSelected
                        ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-600 ring-offset-2'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-400 hover:bg-purple-50'
                    }
                  `}
                >
                  {option.name}
                  {!isOutOfStock && (
                    <span className={`ml-2 text-xs ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                      ({option.stock} adet)
                    </span>
                  )}
                  {isOutOfStock && (
                    <span className="ml-2 text-xs text-slate-400">
                      (Stokta yok)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selection summary */}
      {isAllSelected && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Seçim tamamlandı!</span>
            <span className="text-green-600">
              Mevcut stok: {calculateAvailableStock(selections)} adet
            </span>
          </div>
        </div>
      )}

      {!isAllSelected && variants.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Sepete eklemek için tüm seçenekleri belirlemeniz gerekiyor.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get selected variant names for display
export function getVariantSummary(
  variants: VariantSegment[],
  selections: SelectedVariants
): string {
  return variants
    .map(segment => {
      const selectedOption = segment.options.find(opt => opt.id === selections[segment.id]);
      return selectedOption ? `${segment.name}: ${selectedOption.name}` : null;
    })
    .filter(Boolean)
    .join(' | ');
}
