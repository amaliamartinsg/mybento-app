---
name: MyBento Design System
description: Design system + UI kit for MyBento — la web app de recetas, macros y planificación de menú semanal (React + MUI + Inter · es-ES).
---

# MyBento Design System

Load this skill when designing for the MyBento web app — recetario + macros + planificador semanal (interfaz en español, tono tuteo, stack React + Vite + MUI).

## What this system covers

- **Producto:** MyBento web app (3 vistas: Recetas, Menú semanal, Ajustes).
- **Idioma:** español de España (es-ES), tuteo directo, vocabulario nutricional (kcal, P/HC/G, macros).
- **Stack visual:** Inter (UI) + Lexend (marca, para MUI theme), paleta azul producto (`#4da8ff` → `#005cb2`) + acento morado de marca (`#68548d`).
- **Iconografía:** `@mui/icons-material` filled, 24×24, `currentColor`.

## When to use

Use **MyBento Design System** si el usuario pide:

- recetas / recipe cards / recetario
- planificador semanal / menú / weekly meal plan
- macros / nutrición / kcal / distribución de macros
- settings de perfil físico / peso / altura / objetivo
- cualquier pantalla donde la UI esté en **español** y gire en torno a comida + macros.

No la uses para otros productos (que no sean MyBento), para documentos impresos, ni cuando la interfaz esté en inglés.

## How to use

1. Lee [`README.md`](./README.md) para el contexto completo — paleta, tipografía, spacing, iconografía, copywriting, estados, y la **nota sobre la paleta dual** (morado en `theme.ts` vs azul inline en las vistas).
2. Revisa los previews en [`preview/`](./preview) — tarjetas listas para mirar cada token (colors, type, spacing, components, brand).
3. Para construir pantallas nuevas, parte del **UI kit en [`ui_kits/webapp/`](./ui_kits/webapp)**:
   - `index.html` — canvas con las tres vistas interactivas (tabs cambian entre Recetas / Menú / Ajustes).
   - `kit.css` — todas las CSS custom properties (`--mb-*`) y clases (`.mb-phone`, `.mb-recipe`, `.mb-slot`, `.mb-chip`, `.mb-save`, …).
   - `components/` — `Icons.jsx`, `RecetasView.jsx`, `MenuView.jsx`, `AjustesView.jsx`.
4. Copia los tokens de [`colors_and_type.css`](./colors_and_type.css) a cualquier nuevo HTML; `@import` de Inter + Lexend ya viene incluido.
5. Para iconos: usa los SVG de `ui_kits/webapp/components/Icons.jsx` (Material Symbols redibujados a mano, `currentColor`).

## Reglas duras (no romper)

- **Español siempre.** Nunca "usted", nunca anglicismos (sólo `AUTOFILL` y `AUTOFILL` porque es un botón-marca).
- **Tuteo** en microcopy (`tú`, `pulsa`, `elige`).
- **Unidades redondeadas** (`Math.round`) con separador de miles español (`2.200 kcal`).
- **Macros siempre con los mismos colores:** P `#1565C0`, HC `#F57F17`, G `#C62828`.
- **Radio hero = 24px** (cards) / 28px (summary) / 999px (chips y barras).
- **Sombras suaves, nunca duras.** Blur 20–48px, opacidad 4–25%.
- **Sin bordes de 1px** salvo focus (2px azul) y dashed (2px `#c3c7d0` para slots vacíos).
- **Nada de emoji en microcopy ni CTAs** — sólo `🍽️` como glifo de categoría.
- **Backgrounds lisos.** Sólo dos gradientes vivos: kcal bar y botón "Guardar perfil".
