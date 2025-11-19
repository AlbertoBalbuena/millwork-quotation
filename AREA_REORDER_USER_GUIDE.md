# Guía de Usuario: Reorganización Manual de Áreas

## Fecha de Implementación
2025-11-18

---

## ¿Qué es esta función?

La función de **Reorganización Manual de Áreas** te permite cambiar el orden en que aparecen las áreas (Kitchen, Closet, Bedroom, etc.) en tu proyecto mediante un simple arrastrar y soltar (drag & drop).

### Beneficios

✅ **Control Total**: Organiza las áreas según tus necesidades o prioridades
✅ **PDFs Profesionales**: El orden se refleja automáticamente en ambos PDFs (Standard y USD Summary)
✅ **Fácil de Usar**: Interface intuitiva con arrastrar y soltar
✅ **Persistente**: El orden se guarda en la base de datos

---

## Cómo Usar la Función

### Paso 1: Identificar el Drag Handle

Cada área en tu proyecto ahora muestra un ícono de **"agarre"** (⋮⋮) en el lado izquierdo del nombre del área:

```
┌────────────────────────────────────────┐
│ ⋮⋮ Kitchen              [Edit] [Del]   │ ← Agarre aquí
│   12 cabinets • $45,000                 │
└────────────────────────────────────────┘
```

**Nota**: El drag handle solo aparece si tienes 2 o más áreas en el proyecto.

### Paso 2: Arrastrar y Soltar

1. **Haz clic** en el ícono de agarre (⋮⋮) o en cualquier parte del header del área
2. **Mantén presionado** el botón del mouse
3. **Arrastra** el área hacia arriba o abajo
4. **Suelta** en la posición deseada

**Feedback Visual**:
- El área que estás arrastrando se vuelve semi-transparente (50% opacidad)
- El cursor cambia a "agarrando" (grabbing)

### Paso 3: Guardar el Nuevo Orden

Después de reorganizar las áreas:

1. **Aparece automáticamente** el botón **"Save Order"** en la barra de acciones flotante (parte inferior de la pantalla)
2. Haz clic en el botón circular de menú (esquina inferior derecha) para expandir la barra
3. Haz clic en **"Save Order"** (botón naranja con ícono ↕)
4. El sistema guarda el nuevo orden en la base de datos
5. Verás una confirmación: "Areas order saved successfully!"

**Colores de Botones**:
- 🟠 **Naranja**: Save Order (solo aparece cuando hay cambios sin guardar)
- 🟢 **Verde**: Save (guarda otros cambios del proyecto)

---

## Características Importantes

### 🔒 Seguridad y Persistencia

- El orden se guarda en el campo `display_order` de la base de datos
- El orden persiste entre sesiones (puedes cerrar y reabrir el proyecto)
- Cada área mantiene su número de orden único

### 📄 Integración con PDFs

El nuevo orden se refleja **automáticamente** en:

1. **Standard PDF (MXN)**
   - Las áreas aparecen en el orden guardado
   - Los totales por área respetan el orden

2. **USD Summary PDF**
   - Las áreas se listan en el orden guardado
   - Los breakdowns de precio, tariff y tax siguen el orden

**No necesitas hacer nada adicional** - solo reorganiza y guarda, los PDFs se actualizan solos.

### ♻️ Cancelar Cambios

Si reorganizas áreas pero decides NO guardar:

1. Simplemente **no hagas clic en "Save Order"**
2. Recarga la página o navega a otra vista
3. El orden volverá al último estado guardado

**No hay manera de deshacer después de guardar** - asegúrate del orden antes de presionar "Save Order".

---

## Ejemplos de Uso

### Ejemplo 1: Priorizar Áreas Importantes

**Antes**:
1. Bedroom
2. Closet
3. Kitchen
4. Bathroom

**Después de Reorganizar**:
1. Kitchen (área más grande/importante)
2. Bedroom
3. Bathroom
4. Closet

### Ejemplo 2: Orden Lógico de Construcción

**Antes**:
1. Bathroom
2. Living Room
3. Kitchen
4. Closet

**Después de Reorganizar** (orden de construcción):
1. Kitchen
2. Living Room
3. Bathroom
4. Closet

### Ejemplo 3: Agrupación por Cliente

**Antes**:
1. Master Bedroom
2. Kitchen
3. Guest Bedroom
4. Closet

**Después de Reorganizar** (áreas principales primero):
1. Kitchen
2. Master Bedroom
3. Closet
4. Guest Bedroom

---

## Casos Especiales

### Proyecto con 1 Área

Si solo tienes **1 área** en el proyecto:
- El drag handle **NO aparece** (no hay necesidad de reordenar)
- No puedes arrastrar la única área

### Proyecto sin Áreas

Si el proyecto está vacío:
- No hay áreas para reorganizar
- Agrega tu primera área con el botón "Add Area"

### Búsqueda Activa

Si tienes **filtrado de búsqueda activo**:
- Solo puedes reorganizar las áreas **visibles** en la búsqueda
- Para reorganizar todas las áreas, limpia la búsqueda primero

### Nueva Área Creada

Cuando creas una **nueva área**:
- Se agrega automáticamente **al final** de la lista
- Puedes reorganizarla inmediatamente después

---

## Solución de Problemas

### Problema: No veo el drag handle (⋮⋮)

**Solución**:
- Verifica que tengas al menos 2 áreas en el proyecto
- Si solo tienes 1 área, el handle no aparece (no hay necesidad de reordenar)

### Problema: No puedo arrastrar el área

**Solución**:
- Asegúrate de hacer clic directamente en el ícono de agarre (⋮⋮) o en el header del área
- Verifica que el proyecto tenga más de 1 área
- Intenta recargar la página

### Problema: El botón "Save Order" no aparece

**Solución**:
- El botón solo aparece después de **reorganizar** las áreas
- Si no ves cambios, intenta arrastrar un área a una posición diferente
- Expande el menú de acciones flotante (botón circular inferior derecho)

### Problema: Los cambios no se guardaron

**Solución**:
- Verifica que hayas hecho clic en "Save Order" (botón naranja)
- Espera a ver el mensaje "Areas order saved successfully!"
- Si ves un error, intenta guardar nuevamente

### Problema: El orden no se refleja en el PDF

**Solución**:
- Asegúrate de haber guardado el orden antes de generar el PDF
- Genera el PDF **después** de ver la confirmación de guardado
- El PDF siempre usa el último orden guardado en la base de datos

---

## Tips y Mejores Prácticas

### 💡 Tip 1: Organiza Antes de Imprimir

Reorganiza las áreas **antes** de generar los PDFs para asegurar que el orden sea el deseado.

### 💡 Tip 2: Orden Lógico para el Cliente

Considera organizar las áreas en el orden que tenga más sentido para tu cliente:
- Por importancia
- Por secuencia de construcción
- Por tamaño de presupuesto
- Por ubicación física

### 💡 Tip 3: Consistencia entre Proyectos

Si trabajas con múltiples proyectos similares, usa el mismo orden de áreas para mantener consistencia en tus cotizaciones.

### 💡 Tip 4: Guarda Regularmente

Cada vez que reorganices áreas, guarda inmediatamente para no perder los cambios si navegas a otra página.

### 💡 Tip 5: Usa la Búsqueda

Si tienes muchas áreas (10+), usa la función de búsqueda para encontrar rápidamente el área que quieres reorganizar.

---

## Atajos de Teclado

Actualmente no hay atajos de teclado para la reorganización. Usa el mouse o trackpad para arrastrar y soltar.

**Funcionalidad Futura**: Se podrían agregar botones ↑/↓ para reorganización en dispositivos móviles o como alternativa al drag & drop.

---

## Compatibilidad

### ✅ Navegadores Soportados

- Chrome/Edge (Recomendado)
- Firefox
- Safari
- Navegadores modernos con soporte HTML5 Drag & Drop

### ⚠️ Dispositivos Móviles

La función de drag & drop funciona mejor en **desktop**. En dispositivos móviles:
- La funcionalidad puede ser limitada
- Se recomienda usar una computadora para reorganizar áreas

**Nota**: Una versión futura podría incluir controles móviles optimizados (botones ↑/↓).

---

## Preguntas Frecuentes (FAQ)

### ¿El orden afecta los cálculos del proyecto?

**No**. El orden de las áreas es solo visual. Los cálculos de materiales, costos, boxes, pallets, etc. no dependen del orden.

### ¿Puedo deshacer después de guardar?

**No**. Una vez guardado el orden, no hay función de deshacer. Sin embargo, puedes reorganizar las áreas nuevamente y guardar el nuevo orden.

### ¿El orden se mantiene en los reportes CSV?

**Sí**. Los reportes CSV exportados también respetan el orden guardado de las áreas.

### ¿Qué pasa con las versiones antiguas del proyecto?

Las versiones históricas mantienen el orden que tenían cuando fueron guardadas. El nuevo orden solo afecta la versión actual del proyecto.

### ¿Puedo reorganizar áreas en múltiples proyectos a la vez?

**No**. La reorganización es por proyecto individual. Necesitas abrir cada proyecto y reorganizar sus áreas separadamente.

### ¿El orden se pierde si elimino y recreo un área?

**Sí**. Si eliminas un área, su posición se pierde. Si creas una nueva área con el mismo nombre, se agregará al final de la lista.

---

## Soporte Técnico

Si encuentras problemas con la función de reorganización:

1. Verifica que estés usando un navegador moderno actualizado
2. Intenta recargar la página (Ctrl+R o Cmd+R)
3. Limpia el caché del navegador
4. Contacta al soporte técnico con:
   - Descripción del problema
   - Navegador y versión
   - Pasos para reproducir el error
   - Screenshots si es posible

---

## Registro de Cambios

### Versión 1.0 (2025-11-18)

**Nuevas Funcionalidades**:
- ✅ Drag & drop para reorganizar áreas
- ✅ Drag handle visual (⋮⋮)
- ✅ Botón "Save Order" en FloatingActionBar
- ✅ Persistencia en base de datos
- ✅ Integración automática con PDFs (Standard y USD)
- ✅ Feedback visual durante arrastre
- ✅ Soporte para proyectos con múltiples áreas

**Mejoras Futuras Consideradas**:
- 📱 Controles móviles optimizados (↑/↓ buttons)
- ⌨️ Atajos de teclado
- 🔄 Función de deshacer/rehacer
- 📋 Copiar orden entre proyectos

---

## Recursos Adicionales

- **Documentación Técnica**: Ver `AREA_REORDER_IMPLEMENTATION_PLAN.md`
- **Video Tutorial**: (Por agregar)
- **Soporte**: Contactar al equipo de desarrollo

---

**¡Disfruta organizando tus proyectos de manera más eficiente!** 🎉
