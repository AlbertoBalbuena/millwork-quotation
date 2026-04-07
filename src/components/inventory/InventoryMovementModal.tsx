import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Input } from '../Input';
import { AutocompleteSelect } from '../AutocompleteSelect';
import { useCurrentMember } from '../../lib/useCurrentMember';

type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

interface InventoryMovementModalProps {
  priceListItemId?: string;
  priceListItemName?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function InventoryMovementModal({
  priceListItemId,
  priceListItemName,
  onClose,
  onSaved,
}: InventoryMovementModalProps) {
  const { member } = useCurrentMember();

  // Item selection (only needed when no pre-selected item)
  const [itemOptions, setItemOptions] = useState<{ value: string; label: string }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState(priceListItemId ?? '');

  // Form fields
  const [movementType, setMovementType] = useState<MovementType>('IN');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsItemSelect = !priceListItemId;

  useEffect(() => {
    if (needsItemSelect) {
      supabase
        .from('price_list')
        .select('id, concept_description')
        .eq('is_active', true)
        .order('concept_description')
        .then(({ data }) => {
          setItemOptions(
            (data ?? []).map((i) => ({ value: i.id, label: i.concept_description }))
          );
        });
    }
  }, [needsItemSelect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const itemId = priceListItemId ?? selectedItemId;
    if (!itemId) { setError('Please select an item.'); return; }

    const qty = parseFloat(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    setSaving(true);
    try {
      const { error: err } = await supabase.from('inventory_movements').insert({
        price_list_item_id: itemId,
        movement_type: movementType,
        quantity: qty,
        unit_cost: movementType === 'IN' && unitCost ? parseFloat(unitCost) : null,
        reference_type: 'MANUAL_ADJUSTMENT',
        notes: notes.trim() || null,
        created_by_member_id: member?.id ?? null,
      });
      if (err) throw err;
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record movement.');
    } finally {
      setSaving(false);
    }
  }

  const typeConfig: Record<MovementType, { label: string; color: string; desc: string }> = {
    IN:         { label: 'IN',         color: 'bg-green-100 text-green-700 border-green-300', desc: 'Add stock (purchase, receive)' },
    OUT:        { label: 'OUT',        color: 'bg-red-100 text-red-700 border-red-300',       desc: 'Remove stock (use, consume)' },
    ADJUSTMENT: { label: 'ADJUSTMENT', color: 'bg-blue-100 text-blue-700 border-blue-300',   desc: 'Set stock to exact quantity' },
  };

  return (
    <Modal isOpen onClose={onClose} title="Record Inventory Movement" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {needsItemSelect ? (
          <AutocompleteSelect
            label="Item *"
            options={itemOptions}
            value={selectedItemId}
            onChange={setSelectedItemId}
            placeholder="Search items..."
            required
          />
        ) : (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Item</p>
            <p className="text-sm font-medium text-slate-800">{priceListItemName}</p>
          </div>
        )}

        {/* Movement type */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Movement Type *</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(typeConfig) as MovementType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMovementType(t)}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  movementType === t
                    ? typeConfig[t].color + ' ring-2 ring-offset-1 ring-current'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400">{typeConfig[movementType].desc}</p>
        </div>

        <Input
          label="Quantity *"
          type="number"
          min={0.001}
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="e.g. 10"
          disabled={saving}
          required
        />

        {movementType === 'ADJUSTMENT' && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            This value will replace the current stock level.
          </p>
        )}

        {movementType === 'IN' && (
          <Input
            label="Unit Cost"
            type="number"
            min={0}
            step="any"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            placeholder="e.g. 250.00"
            disabled={saving}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            rows={2}
            disabled={saving}
            className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Record Movement'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
