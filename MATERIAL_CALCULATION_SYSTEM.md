# Sistema de Cálculo de Materiales

## Resumen

Este documento explica cómo funciona el sistema de cálculo de materiales por área, implementando reglas de negocio para rolls de edgeband (150m) y sheets de materiales completos.

## Reglas de Negocio

### 1. Edgeband - Rolls de 150 Metros

**Regla:** Todo el edgeband se vende en rolls de 150m. Los metros totales por finish se redondean al múltiplo de 150m más cercano superior.

**Ejemplo:**
- Área necesita 200m de "Edgeband Evita Laminate Matching Finish"
- Redondea a 300m (2 rolls de 150m cada uno)
- Costo = 2 rolls × 150m × $8.30/m = $2,490.00
- Este costo se distribuye proporcionalmente entre todos los cabinets que usan ese finish

**Implementación:**
- Archivo: `src/lib/edgebandRolls.ts`
- Función principal: `calculateAreaEdgebandRolls(areaId)`
- Constante: `ROLL_LENGTH_METERS = 150`

**Proceso:**
1. Agrupa todos los cabinets del área por edgeband finish
2. Suma todos los metros de box_edgeband + doors_fronts_edgeband del mismo finish
3. Calcula rolls necesarios: `Math.ceil(totalMeters / 150)`
4. Calcula costo total: `rollsNeeded * 150 * pricePerMeter`
5. Distribuye el costo proporcionalmente entre cabinets según su uso

### 2. Sheet Materials - Tableros Completos

**Regla:** Los materiales tipo sheet (Melamine, MDF, Plywood, Laminate, Veneer) se venden en tableros completos. Los SF totales se redondean al múltiplo del tamaño del sheet más cercano superior.

**Ejemplo:**
- Área necesita 68 SF de "Melamine Evita Premium Sisal"
- Sheet es de 32 SF (4ft × 8ft)
- Calcula: 68 ÷ 32 = 2.125, redondea a 3 sheets
- Costo = 3 sheets × $52.00/sheet = $156.00
- Este costo se distribuye proporcionalmente entre todos los cabinets que usan ese material

**Implementación:**
- Archivo: `src/lib/sheetMaterials.ts`
- Función principal: `calculateAreaSheetMaterials(areaId)`
- Función auxiliar: `isSheetMaterial(type)` - Identifica si un material se vende por sheets

**Proceso:**
1. Agrupa todos los cabinets del área por material
2. Suma todos los SF de box_sf o doors_fronts_sf del mismo material
3. Calcula sheets necesarios: `Math.ceil(totalSF / sfPerSheet)`
4. Calcula costo total: `sheetsNeeded * pricePerSheet`
5. Distribuye el costo proporcionalmente entre cabinets según su uso

### 3. Recalculación Automática

**Trigger:** Cada vez que se agrega, edita o elimina un cabinet del área.

**Proceso:**
1. `CabinetForm.tsx` guarda el cabinet
2. Llama a `recalculateAreaSheetMaterialCosts(areaId)`
3. Llama a `recalculateAreaEdgebandCosts(areaId)`
4. Actualiza costos en todos los cabinets del área
5. Recalcula subtotal del área

**Código:**
```typescript
await recalculateAreaSheetMaterialCosts(areaId);
await recalculateAreaEdgebandCosts(areaId);
```

## Visualización en Material Breakdown

### Estructura de Display

**Archivo:** `src/components/AreaMaterialBreakdown.tsx`

**Secciones:**

1. **Box Materials (Sheets)** - Azul
   - Muestra: # sheets | SF totales | Costo
   - Agrupa por nombre de material

2. **Doors Materials (Sheets)** - Verde
   - Muestra: # sheets | SF totales | Costo
   - Agrupa por nombre de material

3. **Edgeband (Rolls 150m)** - Ámbar
   - Muestra: # rolls | Metros usados / Metros totales | Costo
   - Agrupa por nombre de finish
   - **Importante:** NO separa en box/doors, muestra el total combinado

4. **Hardware** - Gris
   - Muestra: # piezas | Costo
   - Agrupa por nombre de hardware

5. **Countertops** - Naranja
   - Muestra: Unidades | Costo
   - Agrupa por nombre de countertop

### Ejemplo de Display

```
Edgeband (Rolls 150m)
┌─────────────────────────────────────────────┐
│ Edgeband Evita Laminate Matching Finish     │
│ # 2 rolls  📏 203.5m / 300m  MX$2,490.00    │
└─────────────────────────────────────────────┘
```

## Flujo Completo

### Cuando se agrega un nuevo cabinet:

1. Usuario completa `CabinetForm`
2. Sistema calcula costos iniciales del cabinet individual
3. Sistema guarda cabinet en `area_cabinets`
4. Sistema ejecuta `recalculateAreaSheetMaterialCosts()`
   - Recalcula sheets necesarios para toda el área
   - Redistribuye costos entre todos los cabinets
5. Sistema ejecuta `recalculateAreaEdgebandCosts()`
   - Recalcula rolls necesarios para toda el área
   - Redistribuye costos entre todos los cabinets
6. Sistema actualiza `subtotal` de cada cabinet
7. Sistema actualiza `subtotal` del área
8. Sistema actualiza `total_amount` del proyecto

### Base de Datos

**Tablas Afectadas:**
- `area_cabinets` - Almacena costos individuales redistribuidos
- `project_areas` - Almacena subtotal del área
- `projects` - Almacena total del proyecto

**Campos Clave en `area_cabinets`:**
- `box_material_cost` - Costo de material de caja (redistribuido)
- `doors_material_cost` - Costo de material de puertas (redistribuido)
- `box_edgeband_cost` - Costo de edgeband de caja (redistribuido)
- `doors_edgeband_cost` - Costo de edgeband de puertas (redistribuido)
- `subtotal` - Suma de todos los costos del cabinet

## Soporte para Versiones

El sistema también funciona con versiones de proyectos:

**Tablas de Versiones:**
- `version_area_cabinets` - Copia de cabinets en versión
- `version_area_countertops` - Copia de countertops en versión

**Diferencias:**
- En versiones, los datos de productos (SF, edgeband) se copian directamente a los campos del cabinet
- No se consulta `products_catalog` en tiempo real
- Los cálculos de rolls y sheets funcionan igual

**Campos Adicionales en `version_area_cabinets`:**
- `box_sf` - SF del producto copiado
- `doors_fronts_sf` - SF del producto copiado
- `box_edgeband` - Metros de edgeband copiados
- `doors_fronts_edgeband` - Metros de edgeband copiados

## Testing

Para verificar que el sistema funciona correctamente:

1. **Crear un área nueva con 2 cabinets** del mismo material
2. **Verificar Material Breakdown** muestra rolls y sheets completos
3. **Agregar un 3er cabinet** del mismo material
4. **Verificar que los rolls/sheets se recalculan** automáticamente
5. **Verificar que los costos se redistribuyen** entre los 3 cabinets

## Notas Importantes

### ⚠️ Cuando box y doors usan el MISMO edgeband

Si un cabinet usa el mismo finish para box_edgeband y doors_edgeband:
- Los metros se SUMAN para ese finish
- Aparece UNA SOLA VEZ en el Material Breakdown
- El costo se distribuye correctamente entre box_edgeband_cost y doors_edgeband_cost del cabinet

**Ejemplo:**
- Cabinet 1: box_edgeband = 5m, doors_edgeband = 10m (mismo finish)
- Total para ese finish = 15m
- Aparece en breakdown como: "1 roll (15m / 150m)"

### ⚠️ Materiales que NO son sheets

Algunos materiales no se venden por sheets completos:
- Paint
- Stain
- Algunos tipos de hardware

Estos materiales NO pasan por `isSheetMaterial()` y se calculan de forma tradicional (precio × cantidad exacta).

## Mantenimiento

### Cambiar el tamaño de rolls de edgeband

Modificar la constante en `src/lib/edgebandRolls.ts`:
```typescript
const ROLL_LENGTH_METERS = 150; // Cambiar aquí
```

### Agregar nuevos tipos de sheet materials

Modificar la función en `src/lib/sheetMaterials.ts`:
```typescript
function isSheetMaterial(type: string): boolean {
  const typeLower = type.toLowerCase();
  return (
    typeLower.includes('laminate') ||
    typeLower.includes('melamine') ||
    typeLower.includes('plywood') ||
    typeLower.includes('mdf') ||
    typeLower.includes('veneer') ||
    typeLower.includes('nuevo_tipo_aqui') // Agregar aquí
  );
}
```

## Archivos Relacionados

### Core Logic
- `src/lib/edgebandRolls.ts` - Lógica de rolls de 150m
- `src/lib/sheetMaterials.ts` - Lógica de sheets completos
- `src/lib/calculations.ts` - Funciones de cálculo base

### UI Components
- `src/components/AreaMaterialBreakdown.tsx` - Display del breakdown
- `src/components/CabinetForm.tsx` - Form que trigger recalculations

### Database
- `supabase/migrations/` - Migraciones de tablas y campos necesarios
