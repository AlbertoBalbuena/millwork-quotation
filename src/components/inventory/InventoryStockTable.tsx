import { useEffect, useState, useRef } from 'react';
import { Search, AlertTriangle, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/calculations';
import { StockBadge } from './StockBadge';
import { InventoryMovementModal } from './InventoryMovementModal';
import type { PriceListItem } from '../../types';

type SupplierRow = { id: string; name: string };
type PriceListSupplierRow = {
  id: string;
  is_primary: boolean;
  supplier_sku: string | null;
  supplier_price: number | null;
  supplier: SupplierRow | null;
};
type StockItem = PriceListItem & { price_list_suppliers: PriceListSupplierRow[] };

type EditingCell = { id: string; field: 'stock_location' | 'min_stock_level' };

export function InventoryStockTable() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [movementModal, setMovementModal] = useState<{ id: string; name: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (editingCell && inputRef.current) inputRef.current.focus();
  }, [editingCell]);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('price_list')
      .select('*, price_list_suppliers(id, is_primary, supplier_sku, supplier_price, supplier:suppliers(id, name))')
      .eq('is_active', true)
      .order('concept_description');
    if (!error) setItems((data as StockItem[]) ?? []);
    setLoading(false);
  }

  function startEdit(id: string, field: EditingCell['field'], currentValue: string | number | null) {
    setEditingCell({ id, field });
    setCellValue(String(currentValue ?? ''));
  }

  async function commitEdit() {
    if (!editingCell) return;
    const { id, field } = editingCell;
    const value = field === 'min_stock_level' ? parseFloat(cellValue) || 0 : cellValue.trim() || null;
    setEditingCell(null);
    await supabase.from('price_list').update({ [field]: value } as any).eq('id', id);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  const filtered = items.filter((item) => {
    if (lowStockOnly && item.stock_quantity > (item.min_stock_level ?? 0) && item.stock_quantity > 0) return false;
    if (searchTerm && !item.concept_description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totalItems = items.length;
  const lowStockCount = items.filter(
    (i) => i.stock_quantity > 0 && i.stock_quantity <= (i.min_stock_level ?? 0)
  ).length;
  const noStockCount = items.filter((i) => i.stock_quantity === 0).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton-shimmer rounded-xl" />)}
        </div>
        <div className="h-11 skeleton-shimmer rounded-lg" />
        <div className="h-64 skeleton-shimmer rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Items</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{lowStockCount}</p>
          <p className="text-xs text-amber-600 mt-0.5">Low Stock</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{noStockCount}</p>
          <p className="text-xs text-red-600 mt-0.5">No Stock</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-600 whitespace-nowrap">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          Show only low / no stock items
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No items match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Location</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Min</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">WAC</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Last Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Primary Supplier</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const primarySupplier = item.price_list_suppliers?.find((s) => s.is_primary)?.supplier;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-slate-900 line-clamp-2">{item.concept_description}</p>
                        {item.sku_code && <p className="text-xs text-slate-400 font-mono mt-0.5">{item.sku_code}</p>}
                      </td>

                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {item.type}
                        </span>
                      </td>

                      {/* Location — inline editable */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {editingCell?.id === item.id && editingCell.field === 'stock_location' ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={cellValue}
                            onChange={(e) => setCellValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null); }}
                            className="w-32 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span
                            className="cursor-pointer text-slate-600 hover:text-blue-600 transition-colors"
                            title="Click to edit"
                            onClick={() => startEdit(item.id, 'stock_location', item.stock_location)}
                          >
                            {item.stock_location || <span className="text-slate-300">—</span>}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">
                        {item.stock_quantity} <span className="text-slate-400 font-normal text-xs">{item.unit}</span>
                      </td>

                      {/* Min Stock — inline editable */}
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        {editingCell?.id === item.id && editingCell.field === 'min_stock_level' ? (
                          <input
                            ref={inputRef}
                            type="number"
                            min={0}
                            step="any"
                            value={cellValue}
                            onChange={(e) => setCellValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null); }}
                            className="w-20 px-2 py-1 border border-blue-400 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span
                            className="cursor-pointer text-slate-600 hover:text-blue-600 transition-colors tabular-nums"
                            title="Click to edit"
                            onClick={() => startEdit(item.id, 'min_stock_level', item.min_stock_level)}
                          >
                            {item.min_stock_level ?? 0}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right text-slate-700 tabular-nums hidden xl:table-cell">
                        {item.average_cost != null ? formatCurrency(item.average_cost) : <span className="text-slate-300">—</span>}
                      </td>

                      <td className="px-4 py-3 text-right text-slate-700 tabular-nums hidden xl:table-cell">
                        {item.last_purchase_cost != null ? formatCurrency(item.last_purchase_cost) : <span className="text-slate-300">—</span>}
                      </td>

                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                        {primarySupplier?.name ?? <span className="text-slate-300">—</span>}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <StockBadge
                          stock_quantity={item.stock_quantity ?? 0}
                          min_stock_level={item.min_stock_level ?? 0}
                        />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setMovementModal({ id: item.id, name: item.concept_description })}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border border-slate-200 hover:border-blue-200"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {movementModal && (
        <InventoryMovementModal
          priceListItemId={movementModal.id}
          priceListItemName={movementModal.name}
          onClose={() => setMovementModal(null)}
          onSaved={load}
        />
      )}
    </>
  );
}
