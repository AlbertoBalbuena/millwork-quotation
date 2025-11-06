import { supabase } from './supabase';
import type { PriceListItem, Product, AreaCabinet } from '../types';
import {
  calculateBoxMaterialCost,
  calculateBoxEdgebandCost,
  calculateDoorsMaterialCost,
  calculateDoorsEdgebandCost,
  calculateInteriorFinishCost,
  calculateHardwareCost,
  calculateLaborCost,
} from './calculations';
import { getSettings } from './settingsStore';

export interface MaterialImpact {
  materialId: string;
  materialName: string;
  materialType: 'box_material' | 'box_edgeband' | 'box_interior_finish' | 'doors_material' | 'doors_edgeband' | 'doors_interior_finish' | 'hardware';
  oldPrice: number;
  currentPrice: number;
  priceChangeDate: string;
  priceChangePercentage: number;
  affectedCabinetsCount: number;
  totalOldCost: number;
  totalNewCost: number;
  totalDifference: number;
  percentageChange: number;
  affectedAreas: string[];
}

export interface MaterialUpdateAnalysis {
  projectId: string;
  projectCreatedAt: string;
  materials: MaterialImpact[];
  totalDifference: number;
  affectedCabinetsCount: number;
}

export async function analyzeMaterialPriceChanges(projectId: string): Promise<MaterialUpdateAnalysis> {
  // Get project creation date
  const { data: project } = await supabase
    .from('projects')
    .select('created_at')
    .eq('id', projectId)
    .single();

  if (!project) {
    throw new Error('Project not found');
  }

  const [areasResult, priceListResult, productsResult, settingsData] = await Promise.all([
    supabase
      .from('project_areas')
      .select('id, name')
      .eq('project_id', projectId),
    supabase.from('price_list').select('*').eq('is_active', true),
    supabase.from('products_catalog').select('*'),
    getSettings(),
  ]);

  const areas = areasResult.data || [];
  const priceList = priceListResult.data || [];
  const products = productsResult.data || [];

  const materialImpactMap = new Map<string, MaterialImpact>();
  const affectedCabinetsSet = new Set<string>();

  for (const area of areas) {
    const cabinetsResult = await supabase
      .from('area_cabinets')
      .select('*')
      .eq('area_id', area.id);

    const cabinets = cabinetsResult.data || [];

    for (const cabinet of cabinets) {
      const product = products.find(p => p.sku === cabinet.product_sku);
      if (!product) continue;

      // Check each material type
      await checkMaterialChange(
        cabinet,
        product,
        'box_material_id',
        'box_material_cost',
        'box_material',
        area.name,
        priceList,
        materialImpactMap,
        affectedCabinetsSet,
        settingsData,
        project.created_at
      );

      await checkMaterialChange(
        cabinet,
        product,
        'box_edgeband_id',
        'box_edgeband_cost',
        'box_edgeband',
        area.name,
        priceList,
        materialImpactMap,
        affectedCabinetsSet,
        settingsData,
        project.created_at
      );

      await checkMaterialChange(
        cabinet,
        product,
        'box_interior_finish_id',
        'box_interior_finish_cost',
        'box_interior_finish',
        area.name,
        priceList,
        materialImpactMap,
        affectedCabinetsSet,
        settingsData,
        project.created_at
      );

      await checkMaterialChange(
        cabinet,
        product,
        'doors_material_id',
        'doors_material_cost',
        'doors_material',
        area.name,
        priceList,
        materialImpactMap,
        affectedCabinetsSet,
        settingsData,
        project.created_at
      );

      await checkMaterialChange(
        cabinet,
        product,
        'doors_edgeband_id',
        'doors_edgeband_cost',
        'doors_edgeband',
        area.name,
        priceList,
        materialImpactMap,
        affectedCabinetsSet,
        settingsData,
        project.created_at
      );

      await checkMaterialChange(
        cabinet,
        product,
        'doors_interior_finish_id',
        'doors_interior_finish_cost',
        'doors_interior_finish',
        area.name,
        priceList,
        materialImpactMap,
        affectedCabinetsSet,
        settingsData,
        project.created_at
      );
    }
  }

  const materials = Array.from(materialImpactMap.values());
  const totalDifference = materials.reduce((sum, m) => sum + m.totalDifference, 0);

  return {
    projectId,
    projectCreatedAt: project.created_at,
    materials,
    totalDifference,
    affectedCabinetsCount: affectedCabinetsSet.size,
  };
}

async function checkMaterialChange(
  cabinet: AreaCabinet,
  product: Product,
  materialIdField: keyof AreaCabinet,
  costField: keyof AreaCabinet,
  materialType: MaterialImpact['materialType'],
  areaName: string,
  priceList: PriceListItem[],
  materialImpactMap: Map<string, MaterialImpact>,
  affectedCabinetsSet: Set<string>,
  settings: any,
  projectCreatedAt: string
) {
  const materialId = cabinet[materialIdField] as string | null;
  if (!materialId) return;

  const material = priceList.find(p => p.id === materialId);
  if (!material) return;

  const oldCost = cabinet[costField] as number;
  const newCost = await calculateNewCost(cabinet, product, material, materialType, priceList, settings);

  // Skip if there's no difference (prices are already up to date)
  if (Math.abs(newCost - oldCost) < 0.01) return;

  // Get the most recent price change after project creation
  const { data: latestChange } = await supabase
    .from('price_change_log')
    .select('changed_at')
    .eq('price_list_item_id', materialId)
    .gte('changed_at', projectCreatedAt)
    .order('changed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!materialImpactMap.has(materialId)) {
    // Calculate the implicit old price by reverse-engineering from stored cost
    const implicitOldPrice = await calculateImplicitPrice(
      cabinet,
      product,
      oldCost,
      materialType,
      settings
    );

    const priceChangePercentage = implicitOldPrice > 0
      ? ((material.price - implicitOldPrice) / implicitOldPrice) * 100
      : 0;

    materialImpactMap.set(materialId, {
      materialId,
      materialName: material.concept_description,
      materialType,
      oldPrice: implicitOldPrice,
      currentPrice: material.price,
      priceChangeDate: latestChange?.changed_at || projectCreatedAt,
      priceChangePercentage,
      affectedCabinetsCount: 0,
      totalOldCost: 0,
      totalNewCost: 0,
      totalDifference: 0,
      percentageChange: 0,
      affectedAreas: [],
    });
  }

  const impact = materialImpactMap.get(materialId)!;
  impact.affectedCabinetsCount++;
  impact.totalOldCost += oldCost;
  impact.totalNewCost += newCost;
  impact.totalDifference += (newCost - oldCost);

  if (!impact.affectedAreas.includes(areaName)) {
    impact.affectedAreas.push(areaName);
  }

  if (impact.totalOldCost !== 0) {
    impact.percentageChange = ((impact.totalNewCost - impact.totalOldCost) / impact.totalOldCost) * 100;
  }

  affectedCabinetsSet.add(cabinet.id);
}

async function calculateImplicitPrice(
  cabinet: AreaCabinet,
  product: Product,
  storedCost: number,
  materialType: MaterialImpact['materialType'],
  settings: any
): Promise<number> {
  // Calculate how many square feet or linear feet this cabinet uses
  let usageAmount = 0;

  switch (materialType) {
    case 'box_material':
    case 'doors_material':
      // For sheet materials, calculate sq ft used
      const sqft = materialType === 'box_material'
        ? product.box_sf || 0
        : product.doors_fronts_sf || 0;
      usageAmount = sqft * cabinet.quantity;
      break;

    case 'box_edgeband':
    case 'doors_edgeband':
      // For edgeband, calculate linear feet used
      const lf = materialType === 'box_edgeband'
        ? product.box_edgeband || 0
        : product.doors_fronts_edgeband || 0;
      usageAmount = lf * cabinet.quantity;
      break;

    case 'box_interior_finish':
    case 'doors_interior_finish':
      // For interior finish, calculate sq ft used (same as material)
      const finishSqft = materialType === 'box_interior_finish'
        ? product.box_sf || 0
        : product.doors_fronts_sf || 0;
      usageAmount = finishSqft * cabinet.quantity;
      break;

    default:
      return 0;
  }

  if (usageAmount === 0) return 0;

  // For sheet materials, the price is per sheet (32 sqft)
  // storedCost = (pricePerSheet / 32) * sqftUsed
  // pricePerSheet = (storedCost * 32) / sqftUsed

  // For edgeband, the price is per linear foot
  // storedCost = pricePerFoot * lfUsed
  // pricePerFoot = storedCost / lfUsed

  if (materialType === 'box_material' || materialType === 'doors_material' ||
      materialType === 'box_interior_finish' || materialType === 'doors_interior_finish') {
    // Sheet materials: return price per sheet
    return (storedCost * 32) / usageAmount;
  } else {
    // Edgeband: return price per roll (assuming 328ft per roll)
    return (storedCost * 328) / usageAmount;
  }
}

async function calculateNewCost(
  cabinet: AreaCabinet,
  product: Product,
  material: PriceListItem,
  materialType: MaterialImpact['materialType'],
  priceList: PriceListItem[],
  settings: any
): Promise<number> {
  switch (materialType) {
    case 'box_material':
      return calculateBoxMaterialCost(product, material, cabinet.quantity);
    case 'box_edgeband':
      return calculateBoxEdgebandCost(product, material, cabinet.quantity);
    case 'box_interior_finish':
      return calculateInteriorFinishCost(product, material, cabinet.quantity, true);
    case 'doors_material':
      return calculateDoorsMaterialCost(product, material, cabinet.quantity);
    case 'doors_edgeband':
      return calculateDoorsEdgebandCost(product, material, cabinet.quantity);
    case 'doors_interior_finish':
      return calculateInteriorFinishCost(product, material, cabinet.quantity, false);
    default:
      return 0;
  }
}

export async function updateSelectedMaterials(
  projectId: string,
  selectedMaterialIds: string[],
  onProgress?: (message: string, current: number, total: number) => void
): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  const [priceListResult, productsResult, settingsData, areasResult] = await Promise.all([
    supabase.from('price_list').select('*').eq('is_active', true),
    supabase.from('products_catalog').select('*'),
    getSettings(),
    supabase.from('project_areas').select('id').eq('project_id', projectId),
  ]);

  const priceList = priceListResult.data || [];
  const products = productsResult.data || [];
  const areas = areasResult.data || [];

  let processedCount = 0;
  let totalCabinets = 0;

  for (const area of areas) {
    const { data: cabinets } = await supabase
      .from('area_cabinets')
      .select('id')
      .eq('area_id', area.id);
    totalCabinets += (cabinets || []).length;
  }

  for (const area of areas) {
    const { data: cabinets } = await supabase
      .from('area_cabinets')
      .select('*')
      .eq('area_id', area.id);

    for (const cabinet of cabinets || []) {
      processedCount++;
      if (onProgress) {
        onProgress(`Updating cabinet ${processedCount} of ${totalCabinets}`, processedCount, totalCabinets);
      }

      const product = products.find(p => p.sku === cabinet.product_sku);
      if (!product) continue;

      const usesSelectedMaterial = selectedMaterialIds.some(id =>
        cabinet.box_material_id === id ||
        cabinet.box_edgeband_id === id ||
        cabinet.box_interior_finish_id === id ||
        cabinet.doors_material_id === id ||
        cabinet.doors_edgeband_id === id ||
        cabinet.doors_interior_finish_id === id
      );

      if (!usesSelectedMaterial) continue;

      try {
        const costs = await recalculateCabinetCosts(cabinet, product, priceList, settingsData);

        const updateData: any = {};

        if (selectedMaterialIds.includes(cabinet.box_material_id || '')) {
          updateData.box_material_cost = costs.boxMaterialCost;
        }
        if (selectedMaterialIds.includes(cabinet.box_edgeband_id || '')) {
          updateData.box_edgeband_cost = costs.boxEdgebandCost;
        }
        if (selectedMaterialIds.includes(cabinet.box_interior_finish_id || '')) {
          updateData.box_interior_finish_cost = costs.boxInteriorFinishCost;
        }
        if (selectedMaterialIds.includes(cabinet.doors_material_id || '')) {
          updateData.doors_material_cost = costs.doorsMaterialCost;
        }
        if (selectedMaterialIds.includes(cabinet.doors_edgeband_id || '')) {
          updateData.doors_edgeband_cost = costs.doorsEdgebandCost;
        }
        if (selectedMaterialIds.includes(cabinet.doors_interior_finish_id || '')) {
          updateData.doors_interior_finish_cost = costs.doorsInteriorFinishCost;
        }

        const subtotal = (
          (updateData.box_material_cost ?? cabinet.box_material_cost) +
          (updateData.box_edgeband_cost ?? cabinet.box_edgeband_cost) +
          (updateData.box_interior_finish_cost ?? cabinet.box_interior_finish_cost) +
          (updateData.doors_material_cost ?? cabinet.doors_material_cost) +
          (updateData.doors_edgeband_cost ?? cabinet.doors_edgeband_cost) +
          (updateData.doors_interior_finish_cost ?? cabinet.doors_interior_finish_cost) +
          cabinet.hardware_cost +
          cabinet.labor_cost
        );

        updateData.subtotal = subtotal;

        const { error } = await supabase
          .from('area_cabinets')
          .update(updateData)
          .eq('id', cabinet.id);

        if (error) {
          errors.push(`Failed to update cabinet ${cabinet.id}: ${error.message}`);
        } else {
          updated++;
        }
      } catch (error: any) {
        errors.push(`Error processing cabinet ${cabinet.id}: ${error.message}`);
      }
    }
  }

  return { updated, errors };
}

async function recalculateCabinetCosts(
  cabinet: AreaCabinet,
  product: Product,
  priceList: PriceListItem[],
  settings: any
) {
  const boxMaterial = cabinet.box_material_id ? priceList.find(p => p.id === cabinet.box_material_id) : null;
  const boxEdgeband = cabinet.box_edgeband_id ? priceList.find(p => p.id === cabinet.box_edgeband_id) : null;
  const boxInteriorFinish = cabinet.box_interior_finish_id ? priceList.find(p => p.id === cabinet.box_interior_finish_id) : null;
  const doorsMaterial = cabinet.doors_material_id ? priceList.find(p => p.id === cabinet.doors_material_id) : null;
  const doorsEdgeband = cabinet.doors_edgeband_id ? priceList.find(p => p.id === cabinet.doors_edgeband_id) : null;
  const doorsInteriorFinish = cabinet.doors_interior_finish_id ? priceList.find(p => p.id === cabinet.doors_interior_finish_id) : null;

  const boxMaterialCost = boxMaterial && boxEdgeband
    ? calculateBoxMaterialCost(product, boxMaterial, cabinet.quantity)
    : 0;
  const boxEdgebandCost = boxMaterial && boxEdgeband
    ? calculateBoxEdgebandCost(product, boxEdgeband, cabinet.quantity)
    : 0;
  const boxInteriorFinishCost = boxInteriorFinish && boxMaterial && boxEdgeband
    ? calculateInteriorFinishCost(product, boxInteriorFinish, cabinet.quantity, true)
    : 0;
  const doorsMaterialCost = doorsMaterial && doorsEdgeband
    ? calculateDoorsMaterialCost(product, doorsMaterial, cabinet.quantity)
    : 0;
  const doorsEdgebandCost = doorsMaterial && doorsEdgeband
    ? calculateDoorsEdgebandCost(product, doorsEdgeband, cabinet.quantity)
    : 0;
  const doorsInteriorFinishCost = doorsInteriorFinish && doorsMaterial && doorsEdgeband
    ? calculateInteriorFinishCost(product, doorsInteriorFinish, cabinet.quantity, false)
    : 0;

  const hardware = Array.isArray(cabinet.hardware) ? cabinet.hardware : [];
  const hardwareCost = calculateHardwareCost(hardware, cabinet.quantity, priceList);
  const laborCost = calculateLaborCost(product, cabinet.quantity, settings.laborCostNoDrawers, settings.laborCostWithDrawers, settings.laborCostAccessories);

  return {
    boxMaterialCost,
    boxEdgebandCost,
    boxInteriorFinishCost,
    doorsMaterialCost,
    doorsEdgebandCost,
    doorsInteriorFinishCost,
    hardwareCost,
    laborCost,
  };
}
