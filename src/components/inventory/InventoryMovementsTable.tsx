import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/calculations';
import type { InventoryMovement } from '../../types';

type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';

type MovementRow = InventoryMovement & {
  price_list_item: { concept_description: string; unit: string } | null;
  created_by_member: { name: string } | null;
};

type TypeFilter = 'ALL' | MovementType;

function formatDatetime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const TYPE_BADGE: Record<MovementType, string> = {
  IN:         'bg-green-100 text-green-700',
  OUT:        'bg-red-100 text-red-700',
  ADJUSTMENT: 'bg-blue-100 text-blue-700',
  RETURN:     'bg-orange-100 text-orange-700',
};

const REF_BADGE: Record<string, string> = {
  PURCHASE:         'bg-violet-100 text-violet-700',
  PROJECT:          'bg-teal-100 text-teal-700',
  MANUAL_ADJUSTMENT:'bg-slate-100 text-slate-600',
  RETURN:           'bg-orange-100 text-orange-700',
};

function qtyPrefix(type: string) {
  if (type === 'IN') return '+';
  if (type === 'OUT' || type === 'RETURN') return '−';
  return '~';
}

const ALL_TYPES: TypeFilter[] = ['ALL', 'IN', 'OUT', 'ADJUSTMENT', 'RETURN'];

export function InventoryMovementsTable() {
  const [rows, setRows] = useState<MovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*, price_list_item:price_list(concept_description, unit), created_by_member:team_members(name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error) setRows((data as MovementRow[]) ?? []);
    setLoading(false);
  }

  const filtered = rows.filter((r) => {
    if (typeFilter !== 'ALL' && r.movement_type !== typeFilter) return false;
    if (dateFrom && r.created_at < dateFrom) return false;
    if (dateTo && r.created_at > dateTo + 'T23:59:59') return false;
    if (itemSearch && !(r.price_list_item?.concept_description ?? '').toLowerCase().includes(itemSearch.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {ALL_TYPES.map((t) => <div key={t} className="h-8 w-24 skeleton-shimmer rounded-full" />)}
        </div>
        <div className="h-11 skeleton-shimmer rounded-lg" />
        <div className="h-64 skeleton-shimmer rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* Filter bar */}
      <div className="mb-4 space-y-3">
        {/* Type chips */}
        <div className="flex gap-2 flex-wrap">
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                typeFilter === t
                  ? t === 'ALL'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : TYPE_BADGE[t as MovementType] + ' border-current ring-2 ring-current ring-offset-1'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by item..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2.5 border border-slate-200 rounded-lg bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="To date"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No movements match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date / Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Unit Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">WAC After</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Done By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => {
                  const type = row.movement_type as MovementType;
                  const prefix = qtyPrefix(row.movement_type);
                  const isNegative = row.movement_type === 'OUT' || row.movement_type === 'RETURN';
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                        {formatDatetime(row.created_at)}
                      </td>

                      <td className="px-4 py-3 max-w-[200px]">
                        {row.price_list_item ? (
                          <Link
                            to={`/prices/${row.price_list_item_id}`}
                            className="text-blue-600 hover:underline line-clamp-2 font-medium"
                          >
                            {row.price_list_item.concept_description}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_BADGE[type] ?? 'bg-slate-100 text-slate-600'}`}>
                          {type}
                        </span>
                      </td>

                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${isNegative ? 'text-red-600' : type === 'ADJUSTMENT' ? 'text-blue-600' : 'text-green-700'}`}>
                        {prefix}{row.quantity}
                        {row.price_list_item?.unit && (
                          <span className="text-slate-400 font-normal text-xs ml-1">{row.price_list_item.unit}</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right text-slate-600 tabular-nums hidden lg:table-cell">
                        {row.unit_cost != null ? formatCurrency(row.unit_cost) : <span className="text-slate-300">—</span>}
                      </td>

                      <td className="px-4 py-3 text-right text-slate-600 tabular-nums hidden lg:table-cell">
                        {row.running_average_cost != null ? formatCurrency(row.running_average_cost) : <span className="text-slate-300">—</span>}
                      </td>

                      <td className="px-4 py-3 hidden md:table-cell">
                        {row.reference_type ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REF_BADGE[row.reference_type] ?? 'bg-slate-100 text-slate-600'}`}>
                              {row.reference_type}
                            </span>
                            {row.reference_type === 'PROJECT' && row.reference_id && (
                              <Link
                                to={`/projects/${row.reference_id}`}
                                className="text-xs text-blue-500 hover:underline"
                              >
                                View
                              </Link>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600 hidden xl:table-cell">
                        {row.created_by_member?.name ?? <span className="text-slate-400 italic">System</span>}
                      </td>

                      <td className="px-4 py-3 text-slate-500 max-w-[180px] hidden xl:table-cell">
                        <span className="line-clamp-2 text-xs">{row.notes || <span className="text-slate-300">—</span>}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
