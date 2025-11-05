import { useEffect, useState } from 'react';
import { Package, Layers, Hash, Ruler, Hammer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/calculations';

interface MaterialData {
  boxMaterialSheets: Map<string, { sheetsNeeded: number; totalSF: number; cost: number }>;
  doorsMaterialSheets: Map<string, { sheetsNeeded: number; totalSF: number; cost: number }>;
  boxEdgebandRolls: Map<string, { rollsNeeded: number; totalMeters: number; cost: number }>;
  doorsEdgebandRolls: Map<string, { rollsNeeded: number; totalMeters: number; cost: number }>;
  hardware: Map<string, { quantity: number; cost: number }>;
  countertops: Map<string, { quantity: number; cost: number }>;
  totalCost: number;
}

interface AreaMaterialBreakdownProps {
  areaId: string;
}

const SHEET_SIZE_SF = 32;
const ROLL_LENGTH_METERS = 100;

export function AreaMaterialBreakdown({ areaId }: AreaMaterialBreakdownProps) {
  const [data, setData] = useState<MaterialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterialData();
  }, [areaId]);

  async function loadMaterialData() {
    try {
      const { data: cabinets, error: cabinetsError } = await supabase
        .from('area_cabinets')
        .select(`
          quantity,
          product_sku,
          box_material_id,
          box_edgeband_id,
          doors_material_id,
          doors_edgeband_id,
          box_material_cost,
          box_edgeband_cost,
          doors_material_cost,
          doors_edgeband_cost,
          hardware_cost,
          hardware,
          subtotal
        `)
        .eq('area_id', areaId);

      if (cabinetsError) throw cabinetsError;

      const { data: countertops, error: countertopsError } = await supabase
        .from('area_countertops')
        .select(`
          item_name,
          quantity,
          subtotal
        `)
        .eq('area_id', areaId);

      if (countertopsError) throw countertopsError;

      const { data: priceList, error: priceListError } = await supabase
        .from('price_list')
        .select('id, concept_description');

      if (priceListError) throw priceListError;

      const { data: products, error: productsError } = await supabase
        .from('products_catalog')
        .select('sku, box_sf, doors_fronts_sf, total_edgeband, box_edgeband');

      if (productsError) throw productsError;

      const priceListMap = new Map(priceList?.map(p => [p.id, p.concept_description]) || []);
      const productsMap = new Map(products?.map(p => [p.sku, p]) || []);

      const boxMaterialSheets = new Map<string, { sheetsNeeded: number; totalSF: number; cost: number }>();
      const doorsMaterialSheets = new Map<string, { sheetsNeeded: number; totalSF: number; cost: number }>();
      const boxEdgebandRolls = new Map<string, { rollsNeeded: number; totalMeters: number; cost: number }>();
      const doorsEdgebandRolls = new Map<string, { rollsNeeded: number; totalMeters: number; cost: number }>();
      const hardware = new Map<string, { quantity: number; cost: number }>();
      const countertopsMap = new Map<string, { quantity: number; cost: number }>();

      let totalCost = 0;

      cabinets?.forEach(cabinet => {
        const product = productsMap.get(cabinet.product_sku || '');
        const qty = cabinet.quantity || 1;

        if (cabinet.box_material_id && product) {
          const name = priceListMap.get(cabinet.box_material_id) || 'Unknown Box Material';
          const totalSF = product.box_sf * qty;
          const existing = boxMaterialSheets.get(name) || { sheetsNeeded: 0, totalSF: 0, cost: 0 };
          boxMaterialSheets.set(name, {
            sheetsNeeded: existing.sheetsNeeded + Math.ceil(totalSF / SHEET_SIZE_SF),
            totalSF: existing.totalSF + totalSF,
            cost: existing.cost + (cabinet.box_material_cost || 0),
          });
        }

        if (cabinet.doors_material_id && product) {
          const name = priceListMap.get(cabinet.doors_material_id) || 'Unknown Doors Material';
          const totalSF = product.doors_fronts_sf * qty;
          const existing = doorsMaterialSheets.get(name) || { sheetsNeeded: 0, totalSF: 0, cost: 0 };
          doorsMaterialSheets.set(name, {
            sheetsNeeded: existing.sheetsNeeded + Math.ceil(totalSF / SHEET_SIZE_SF),
            totalSF: existing.totalSF + totalSF,
            cost: existing.cost + (cabinet.doors_material_cost || 0),
          });
        }

        if (cabinet.box_edgeband_id && product) {
          const name = priceListMap.get(cabinet.box_edgeband_id) || 'Unknown Box Edgeband';
          const totalMeters = (product.box_edgeband || 0) * qty;
          const existing = boxEdgebandRolls.get(name) || { rollsNeeded: 0, totalMeters: 0, cost: 0 };
          boxEdgebandRolls.set(name, {
            rollsNeeded: existing.rollsNeeded + Math.ceil(totalMeters / ROLL_LENGTH_METERS),
            totalMeters: existing.totalMeters + totalMeters,
            cost: existing.cost + (cabinet.box_edgeband_cost || 0),
          });
        }

        if (cabinet.doors_edgeband_id && product) {
          const name = priceListMap.get(cabinet.doors_edgeband_id) || 'Unknown Doors Edgeband';
          const totalMeters = product.total_edgeband * qty - ((product.box_edgeband || 0) * qty);
          const existing = doorsEdgebandRolls.get(name) || { rollsNeeded: 0, totalMeters: 0, cost: 0 };
          doorsEdgebandRolls.set(name, {
            rollsNeeded: existing.rollsNeeded + Math.ceil(totalMeters / ROLL_LENGTH_METERS),
            totalMeters: existing.totalMeters + totalMeters,
            cost: existing.cost + (cabinet.doors_edgeband_cost || 0),
          });
        }

        if (cabinet.hardware && Array.isArray(cabinet.hardware) && cabinet.hardware.length > 0) {
          const totalHardwareCost = cabinet.hardware_cost || 0;
          const totalHardwareItems = cabinet.hardware.reduce((sum: number, hw: any) => sum + (hw.quantity_per_cabinet || 0), 0);

          (cabinet.hardware as any[]).forEach((hw: any) => {
            const hardwareId = hw.hardware_id;
            const quantityPerCabinet = hw.quantity_per_cabinet || 0;

            if (!hardwareId || quantityPerCabinet === 0) return;

            const name = priceListMap.get(hardwareId) || 'Unknown Hardware';
            const hwQty = quantityPerCabinet * qty;
            const proportionalCost = totalHardwareItems > 0
              ? (quantityPerCabinet / totalHardwareItems) * totalHardwareCost
              : 0;

            const existing = hardware.get(name) || { quantity: 0, cost: 0 };
            hardware.set(name, {
              quantity: existing.quantity + hwQty,
              cost: existing.cost + proportionalCost,
            });
          });
        }

        totalCost += cabinet.subtotal || 0;
      });

      countertops?.forEach(countertop => {
        const name = countertop.item_name || 'Unknown Countertop';
        const qty = countertop.quantity || 0;
        const cost = countertop.subtotal || 0;

        const existing = countertopsMap.get(name) || { quantity: 0, cost: 0 };
        countertopsMap.set(name, {
          quantity: existing.quantity + qty,
          cost: existing.cost + cost,
        });

        totalCost += cost;
      });

      setData({
        boxMaterialSheets,
        doorsMaterialSheets,
        boxEdgebandRolls,
        doorsEdgebandRolls,
        hardware,
        countertops: countertopsMap,
        totalCost,
      });
    } catch (error) {
      console.error('Error loading material breakdown:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-center py-4">
          <div className="text-sm text-slate-600">Loading materials...</div>
        </div>
      </div>
    );
  }

  if (!data || (
    data.boxMaterialSheets.size === 0 &&
    data.doorsMaterialSheets.size === 0 &&
    data.boxEdgebandRolls.size === 0 &&
    data.doorsEdgebandRolls.size === 0 &&
    data.hardware.size === 0 &&
    data.countertops.size === 0
  )) {
    return (
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
        <div className="text-center py-4 text-sm text-slate-500">
          No material data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 p-4">
      <div className="flex items-center mb-3">
        <Layers className="h-4 w-4 text-slate-600 mr-2" />
        <h4 className="text-sm font-semibold text-slate-900">Material Breakdown</h4>
        <span className="ml-auto text-xs font-semibold text-green-600">
          Total: {formatCurrency(data.totalCost)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {data.boxMaterialSheets.size > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center mb-2">
              <Package className="h-3 w-3 text-blue-700 mr-1.5" />
              <h5 className="text-xs font-semibold text-blue-900">Box Materials (Sheets)</h5>
            </div>
            <div className="space-y-1.5">
              {Array.from(data.boxMaterialSheets.entries()).map(([name, matData]) => (
                <div key={name} className="bg-white rounded p-2 text-xs">
                  <div className="font-medium text-slate-900 truncate mb-1">{name}</div>
                  <div className="flex justify-between text-slate-600">
                    <span><Hash className="h-3 w-3 inline mr-1" />{matData.sheetsNeeded} sheets</span>
                    <span><Ruler className="h-3 w-3 inline mr-1" />{matData.totalSF.toFixed(1)} SF</span>
                    <span className="font-semibold text-blue-700">{formatCurrency(matData.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.doorsMaterialSheets.size > 0 && (
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center mb-2">
              <Package className="h-3 w-3 text-green-700 mr-1.5" />
              <h5 className="text-xs font-semibold text-green-900">Doors Materials (Sheets)</h5>
            </div>
            <div className="space-y-1.5">
              {Array.from(data.doorsMaterialSheets.entries()).map(([name, matData]) => (
                <div key={name} className="bg-white rounded p-2 text-xs">
                  <div className="font-medium text-slate-900 truncate mb-1">{name}</div>
                  <div className="flex justify-between text-slate-600">
                    <span><Hash className="h-3 w-3 inline mr-1" />{matData.sheetsNeeded} sheets</span>
                    <span><Ruler className="h-3 w-3 inline mr-1" />{matData.totalSF.toFixed(1)} SF</span>
                    <span className="font-semibold text-green-700">{formatCurrency(matData.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.boxEdgebandRolls.size > 0 && (
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <div className="flex items-center mb-2">
              <Ruler className="h-3 w-3 text-amber-700 mr-1.5" />
              <h5 className="text-xs font-semibold text-amber-900">Box Edgeband (Rolls)</h5>
            </div>
            <div className="space-y-1.5">
              {Array.from(data.boxEdgebandRolls.entries()).map(([name, rollData]) => (
                <div key={name} className="bg-white rounded p-2 text-xs">
                  <div className="font-medium text-slate-900 truncate mb-1">{name}</div>
                  <div className="flex justify-between text-slate-600">
                    <span><Hash className="h-3 w-3 inline mr-1" />{rollData.rollsNeeded} rolls</span>
                    <span><Ruler className="h-3 w-3 inline mr-1" />{rollData.totalMeters.toFixed(1)} m</span>
                    <span className="font-semibold text-amber-700">{formatCurrency(rollData.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.doorsEdgebandRolls.size > 0 && (
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
            <div className="flex items-center mb-2">
              <Ruler className="h-3 w-3 text-purple-700 mr-1.5" />
              <h5 className="text-xs font-semibold text-purple-900">Doors Edgeband (Rolls)</h5>
            </div>
            <div className="space-y-1.5">
              {Array.from(data.doorsEdgebandRolls.entries()).map(([name, rollData]) => (
                <div key={name} className="bg-white rounded p-2 text-xs">
                  <div className="font-medium text-slate-900 truncate mb-1">{name}</div>
                  <div className="flex justify-between text-slate-600">
                    <span><Hash className="h-3 w-3 inline mr-1" />{rollData.rollsNeeded} rolls</span>
                    <span><Ruler className="h-3 w-3 inline mr-1" />{rollData.totalMeters.toFixed(1)} m</span>
                    <span className="font-semibold text-purple-700">{formatCurrency(rollData.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.hardware.size > 0 && (
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 lg:col-span-2">
            <div className="flex items-center mb-2">
              <Package className="h-3 w-3 text-slate-700 mr-1.5" />
              <h5 className="text-xs font-semibold text-slate-900">Hardware</h5>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {Array.from(data.hardware.entries()).map(([name, hwData]) => (
                <div key={name} className="bg-white rounded p-2 text-xs">
                  <div className="font-medium text-slate-900 truncate mb-1">{name}</div>
                  <div className="flex justify-between text-slate-600">
                    <span><Hash className="h-3 w-3 inline mr-1" />{hwData.quantity} pcs</span>
                    <span className="font-semibold text-slate-700">{formatCurrency(hwData.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.countertops.size > 0 && (
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200 lg:col-span-2">
            <div className="flex items-center mb-2">
              <Hammer className="h-3 w-3 text-orange-700 mr-1.5" />
              <h5 className="text-xs font-semibold text-orange-900">Countertops</h5>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {Array.from(data.countertops.entries()).map(([name, ctData]) => (
                <div key={name} className="bg-white rounded p-2 text-xs">
                  <div className="font-medium text-slate-900 truncate mb-1">{name}</div>
                  <div className="flex justify-between text-slate-600">
                    <span><Hash className="h-3 w-3 inline mr-1" />{ctData.quantity.toFixed(2)} units</span>
                    <span className="font-semibold text-orange-700">{formatCurrency(ctData.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
