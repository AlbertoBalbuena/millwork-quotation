import type { AreaCabinet } from '../types';

export function isAccessoryPanel(sku: string | null | undefined): boolean {
  if (!sku) return false;
  return sku.startsWith('460:') || sku.startsWith('460-') || sku.startsWith('460');
}

export function filterActualCabinets(cabinets: AreaCabinet[]): AreaCabinet[] {
  return cabinets.filter(cabinet => !isAccessoryPanel(cabinet.product_sku));
}

export function filterAccessoryPanels(cabinets: AreaCabinet[]): AreaCabinet[] {
  return cabinets.filter(cabinet => isAccessoryPanel(cabinet.product_sku));
}

export function countActualCabinets(cabinets: AreaCabinet[]): number {
  return filterActualCabinets(cabinets).reduce((sum, c) => sum + c.quantity, 0);
}

export function countCabinetEntries(cabinets: AreaCabinet[]): number {
  return filterActualCabinets(cabinets).length;
}
