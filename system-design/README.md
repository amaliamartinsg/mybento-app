# MyBento Design System

**MyBento** — aplicación web para gestionar recetas con macros, planificar menús semanales y obtener sugerencias de recetas con IA.
UI en español · Stack **React + Vite + MUI (Material UI v5)** · Estado con **@tanstack/react-query** · Routing con **react-router-dom**.

## Productos / superficies

Un único producto con tres vistas principales:
1. **Recetas** — grid de recetas con filtros por categoría, búsqueda, generación por IA y Despensa Virtual (buscar por ingredientes).
2. **Menú** — planificador semanal (Lunes–Viernes × 5 momentos del día) con Autofill por IA y barras de kcal.
3. **Ajustes** — perfil físico (peso/altura/actividad/objetivo), distribución de macros, categorías y pesos por unidad.

## Sources

- **Codebase** (read-only, mounted): `src/` — Vite + React + TS
  - `src/theme.ts` — tema MUI con tokens tipo Material 3 "Culinary Atelier" (paleta morada).
  - `src/views/{RecipesView,MenuView,DayDetailView,SettingsView}.tsx` — paleta azul aplicada inline.
  - `src/components/{RecipeCard,MacroProgressBar,RecipeDetailDialog,RecipeSelectorDialog,ExtrasTab,ImageCarousel}.tsx`
- **Logos** (uploaded): `assets/mybento-logo.png`, `assets/mybento-logo-simple.png`
- **Repo anexado**: `amaliamartinsg/mybento-app` (GitHub, no importado por defecto).

## ⚠️ Nota importante sobre la paleta

El `theme.ts` declara una paleta **morada** ("Culinary Atelier", primary `#68548d`) con gradientes terciopelo. Sin embargo, **las vistas (Recetas, Menú, Ajustes) sobreescriben inline con una paleta azul** (`#4da8ff` → `#005cb2`). Lo que ve el usuario es mayormente azul; el morado aparece sólo en el logo y en componentes MUI que no se han pisado (botones genéricos, botón "Guardar perfil" que combina ambos gradientes).

Este design system documenta ambos con tokens separados (`--mb-brand-*` para el morado y `--mb-*` para el azul). **Cuestión abierta para el usuario:** ¿consolidar en la paleta azul, volver a la morada, o mantener este esquema dual intencionalmente?

## Content fundamentals

### Idioma y tono
- **Idioma:** español (España) — `es-ES` (`d.toLocaleDateString('es-ES', …)`).
- **Tratamiento:** tuteo directo (*tú*). Ejemplos reales:
  - *"¡Añade la primera!"*
  - *"¿Seguro que quieres eliminar **X**? Esta acción no se puede deshacer."*
  - *"Escribe los ingredientes que tienes y pulsa Enter para añadirlos. Luego haz clic en Sugerir."*
- **Voz:** cálida pero directa, imperativa. Frases cortas, sin jerga técnica.
- **Nunca "usted". Nunca anglicismos innecesarios.** Excepción consciente: `AUTOFILL` en mayúsculas en un botón (sensación de acción mágica).
- **Mayúsculas de oraciones** en textos; **Title Case ligero** en títulos de secciones ("Mi Perfil", "Comidas del día", "Despensa Virtual").
- **Etiquetas eyebrow** van en MAYÚSCULAS con letter-spacing amplio: "SEMANA", "LUN MAR MIÉ", "PROTEÍNAS".

### Vocabulario clave (español nutricional)
- **Macros:** `kcal`, `P` (proteínas), `HC` (hidratos), `G` (grasas). Abreviaturas usadas en chips para ahorrar espacio.
- **Momentos del día:** `Desayuno`, `M. Mañana` (media mañana), `Comida`, `Merienda`, `Cena`.
- **Días:** `LUN MAR MIÉ JUE VIE` (tres letras, mayúsculas, sin sábado/domingo — es una app laboral).
- **Objetivos:** `Perder` / `Mantenimiento` / `Ganar`.
- **Acciones frecuentes:** *Generar*, *Guardar*, *Eliminar*, *Cambiar*, *Quitar*, *Añadir*, *Crear*, *Buscar*.
- **Funcionalidad con marca propia:** *Despensa Virtual*, *Autofill*, *Snacks Rápidos*.

### Emoji
- **Usado con moderación** y sólo como glifo decorativo en estados vacíos o iconografía de categorías:
  - `🍽️` dentro de pastillas de categoría/extras (única aparición recurrente).
- Nunca en microcopy ni en CTAs.

### Números y unidades
- Siempre redondeados para display (`Math.round(value)`).
- Separador de miles español: `toLocaleString('es-ES')` → `2.200 kcal`.
- Unidades pegadas al número sin espacio en chips compactos (`120g`, `45g`) pero separadas en texto descriptivo (`2.200 kcal/día`, `30 g consumidos`).

### Microcopy ejemplos
| Contexto | Copy |
|---|---|
| Empty state recetas | "No hay recetas. ¡Añade la primera!" |
| Empty state extras | "No hay extras añadidos" |
| Confirmación destructiva | "¿Seguro que quieres eliminar **X**? Esta acción no se puede deshacer." |
| Semana sin menú | "No hay menú creado para esta semana." → botón "Crear semana" |
| Autofill éxito | "Menú rellenado correctamente" |
| IA prompt | "Escribe el nombre de la receta y la IA generará un borrador completo para revisarlo antes de guardarlo." |
| Despensa prompt | "Escribe los ingredientes que tienes y pulsa Enter para añadirlos." |

## Visual foundations

### Paleta — modo claro
| Rol | Token | Hex | Uso |
|---|---|---|---|
| Primary | `--mb-primary` | `#4da8ff` | Acento universal, selección de tabs, chips, bordes focus |
| Primary strong | `--mb-primary-strong` | `#005cb2` | FAB, top app bar de Day Detail, gradient hacia el oscuro |
| Primary mid | `--mb-primary-mid` | `#5071d5` | Autofill button, chip de subcategoría seleccionada |
| Macro P | `--mb-macro-prot` | `#1565C0` | Proteínas |
| Macro HC | `--mb-macro-hc` | `#F57F17` | Hidratos |
| Macro G | `--mb-macro-fat` | `#C62828` | Grasas |
| Surface | `--mb-surface` | `#fef7fd` | Fondo base (theme.ts) |
| Surface alt | `--mb-surface-alt` | `#f8f9ff` | Fondo Day Detail |
| Surface ice | `--mb-surface-ice` | `#f0f4ff` | Barra de selector semanal, fondo de filas activas |
| Surface chip | `--mb-surface-chip` | `#eef2ff` | Inputs, chips inactivas, celdas de slot, thumbnails vacíos |
| Error | `--mb-error` | `#ba1a1a` | Acciones destructivas, kcal sobre objetivo |
| Brand | `--mb-brand-primary` | `#68548d` | Logo, tema MUI base |

### Tipografía
- **UI:** `Inter` (300–900) — la fuente real que se renderiza en el 95% de pantallas (todas las vistas usan `fontFamily: '"Inter", sans-serif'` inline).
- **Marca / `theme.ts`:** `Lexend` — declarada como fuente del MUI theme, aparece en componentes MUI no sobreescritos (buttons MUI genéricos, chips MUI, algunas dialog titles).
- **Jerarquía real:**
  - Display `800 36px` (macros del día: "2.200 / 2.200 kcal").
  - H1 `800 24px` (títulos de sección en Ajustes).
  - H2 `800 18px` (nombre de receta en card).
  - Tabs `700 15px` (Recetas / Snacks Rápidos).
  - Body `500 14px`.
  - Micro `700 11–12px` (chips de macro, eyebrow).
  - Eyebrow `700 10px / letter-spacing .1em` (DAY labels, KCAL/DÍA).
  - Tick `800 9px` (marcadores 1°/2° en platos con pareja primero+segundo).
- **Letter-spacing negativo** (`-0.02em`) en todos los headings por `theme.ts`.

### Spacing
Sistema base MUI (múltiplos de 8px). Padding interior de cards `p: 2–3` (16–24px). Gaps de grids `1.5` (12px) en week grid, `3` (24px) en recipe grid. Mobile-first: max-widths comunes `640px` (Day Detail), `680px` (Settings).

### Backgrounds
- **Lisos** — nunca imágenes de fondo, nunca patrones repetidos.
- **Glassmorphism puntual:** AppBar superior con `backdrop-filter: blur(20px)` + `rgba(254,247,253,0.70)`. Bottom nav con `backdrop-filter: blur(20px)` + `rgba(200,215,255,0.85)`.
- **Gradientes lineales** sólo en dos sitios: barra de kcal del día (`90deg, #4da8ff → #005cb2`) y CTA "Guardar perfil". El gradient morado terciopelo (`135deg, #68548d → #b39ddb`) existe en `theme.ts` para `ContainedPrimary` MUI, pero las vistas evitan MUI Buttons contained, así que aparece poco.

### Corner radii
- `8px` — botones, selects, small inputs.
- `12px` — default card / `theme.ts`.
- `16px` — search bar, toggles groups, day summary sections internas.
- `24px` — **radio hero**: recipe card, extras picker dialog, meal cards.
- `28px` — macro summary card.
- `32px` — top corners del bottom-nav (se "engancha" a la base).
- `9999px` (pill) — chips, barras de progreso, pills de AUTOFILL.

### Shadows
Diseño de **sombras suaves, nunca duras**. Sigue la intención de `theme.ts`: "depth via tonal layering, blur 32–48px, opacity 4–6%".
- `--mb-shadow-sm` `0 1px 4px rgba(0,0,0,0.06)` — reposo de cards.
- `--mb-shadow-lg` `0 6px 20px rgba(0,0,0,0.12)` — hover de cards.
- `--mb-shadow-card` `0 4px 20px rgba(0,130,253,0.04)` — summary card (tinted blue).
- `--mb-shadow-cta` `0 4px 16px rgba(0,130,253,0.25)` — CTA save profile.
- `--mb-shadow-cta-alt` `0 4px 12px rgba(80,113,213,0.3)` — AUTOFILL.
- `--mb-shadow-dialog` `0 8px 48px rgba(73,69,78,0.06)` — ambient dialog.
- `--mb-shadow-bottom-nav` `0 -4px 24px rgba(0,130,253,0.06)` — levita el nav inferior.

### Borders
- **Filosofía: sin bordes de 1px.** El theme override quita `border` de TextField, Chip, ToggleButton. Profundidad por capas tonales.
- **Excepción productiva:** borde de 2px dashed `#c3c7d0` para slots vacíos en el planificador semanal y cards "Añadir Comida" en Day Detail.
- Borde de focus: `2px solid #4da8ff` en inputs.
- Borde sutil `1px solid rgba(0,130,253,0.2)` en slots rellenos (agua en agua, no marco).

### Animaciones
- **Durations típicas:** 150–300ms; MUI estándar easing (`cubic-bezier(.4,0,.2,1)`).
- Scale en hover de imagen de receta: `transform: scale(1.08)` con `transition: transform 0.5s` (el único "largo").
- Fade de acciones al hover (`opacity 0 → 1` en 200ms).
- Barras de progreso animadas `width 300–400ms`.
- **Nada de bounces, nada de wobble, nada de parallax.**

### Estados hover / press
- **Chips categoría (inactiva):** bg `#e8eeff` → `#dde3f0` en hover.
- **Chips categoría (activa):** no cambia (mantiene primary).
- **Cards de receta:** shadow sm → shadow lg + imagen escala 1.08.
- **Slot lleno:** bg `rgba(0,130,253,0.08)` → `rgba(0,130,253,0.14)` + shadow.
- **Slot vacío (dashed):** bg transparente → `#eef2ff`, border → `#4da8ff`.
- **IconButtons:** bg semitransparente blanca → blanco sólido (en top bars con glass).
- **Press:** MUI default (ripple). Sin "shrink" ni "scale down".

### Transparencia y blur
- Mucho `rgba()` con alpha baja (0.06–0.20) para tints sobre fondos claros — chips de macro, estados hover, tonos de primary.
- Blur únicamente en top bar y bottom nav (fijos, permiten ver el contenido detrás).

### Layout rules
- **Bottom navigation** fija (3 tabs con radio top 32px, glass, sombra hacia arriba).
- **AppBar fija** morada con logo centrado (alto 56px).
- **FAB SpeedDial** para acciones principales, `bottom: 88px; right: 20px` (encima del bottom-nav).
- Grids responsive `xs=12 sm=6 md=4 lg=3` para receta cards.
- Scroll horizontal con `scrollbar-width: none` para pastillas de categoría (sin barra visible).
- Max-widths comunes: 640px (Day Detail), 680px (Settings), contenedor principal sin restricción en Recetas/Menú.

### Imagery
- Fotografías reales de comida cuando las hay (`recipe.image_url`). Tonos cálidos / naturales — la app no impone tratamiento.
- Placeholder universal: icono `RestaurantIcon` (cubiertos) en gris `#c3c7d0` sobre fondo `#eef2ff`.
- Thumbnails cuadrados con `border-radius: 16px` (meal cards) o rectangulares `height 140–208px` (recipe cards) con radio top heredado del card `24px`.

## Iconography

- **Icon font:** `@mui/icons-material` — filled Material Symbols. Esta es la ÚNICA familia de iconos del producto (no se importan Lucide, FontAwesome ni sets propios).
- Iconos concretos vistos en código:
  - **Navegación:** `RestaurantIcon`, `CalendarMonthIcon`, `SettingsIcon`, `ArrowBackIcon`, `ChevronLeftIcon`, `ChevronRightIcon`, `CloseIcon`.
  - **Acciones:** `AddIcon`, `EditIcon`, `DeleteIcon`, `SaveIcon`, `RemoveIcon`, `ExpandLessIcon`, `ExpandMoreIcon`.
  - **IA:** `AutoAwesomeIcon` (estrellas de destello) — siempre acompaña funcionalidad de IA (Generar, Autofill).
  - **Momentos del día:** `WbTwilightIcon` (desayuno), `WbSunnyIcon` (media mañana), `RestaurantIcon` (comida), `CookieIcon` (merienda), `DarkModeIcon` (cena).
  - **Otros:** `KitchenIcon` (despensa), `BoltIcon` (summary card), `LightModeIcon`/`DarkModeIcon` (toggle de tema), `SpeedDialIcon`.
- **Tamaños típicos:** 16px (en línea con copy), 18–22px (chips y buttons), 24px (AppBar), 28px (empty states), 56–64px (hero empty states).
- **SVG inline:** una sola aparición — la lupa dentro del campo de búsqueda (24×24, stroke 2, currentColor). Convención: usar MUI; inline SVG sólo si el icono necesario no existe en `@mui/icons-material`.
- **Emoji como icono:** `🍽️` como placeholder de categoría en Ajustes y avatar circular de extras (Day Detail). Es la única excepción aceptada.
- **Unicode y dingbats:** no se usan.

### Cómo substituir iconos al diseñar estáticos

Para mocks/HTML estáticos en este sistema: el design system NO embebe una fuente de icons de Material. Para iconos, usa SVGs inline (las vistas del UI kit usan un helper pequeño con los 15–20 iconos de MyBento dibujados a mano en SVG con stroke/fill consistentes). Dibújalos con Material Symbols stroke weight = 400, 24×24 grid, `currentColor` — así se pueden recolorear con CSS.

## Index / Manifesto

- [`README.md`](./README.md) — este documento.
- [`SKILL.md`](./SKILL.md) — cómo invocar este design system como Agent Skill.
- [`colors_and_type.css`](./colors_and_type.css) — variables CSS + clases recipe.
- [`assets/`](./assets) — logos (`mybento-logo.png`, `mybento-logo-simple.png`).
- [`fonts/`](./fonts) — Inter & Lexend vía Google Fonts import (no ttf locales; ver § Fonts abajo).
- [`preview/`](./preview) — cards del Design System tab (colors, type, spacing, components, brand).
- [`ui_kits/webapp/`](./ui_kits/webapp) — UI kit del producto web.
  - `index.html` — recorrido interactivo por las 3 vistas.
  - `components/` — RecipeCard, MealSlot, MacroBar, Chip, Button, AppBar, BottomNav, Icons, etc.

## Fonts

**Ambas fuentes (Inter, Lexend) se cargan vía Google Fonts CDN** — ver `@import` al inicio de `colors_and_type.css`. No hay archivos locales en `fonts/` porque la app usa las mismas vías CDN. Si el entorno necesita funcionar offline, descargar los .woff2 desde Google Fonts y reemplazar el `@import` por `@font-face` locales.

**Flag:** no se proporcionaron TTFs explícitamente, ni aparecen en el codebase — se ha usado la CDN de Google Fonts para ambas. Si MyBento tiene archivos self-hosted oficiales, suminístralos para sustituir el `@import`.
