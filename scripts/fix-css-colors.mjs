/**
 * Sanea el CSS compilado por Tailwind v4 para html2canvas (html2pdf).
 *
 * Tailwind v4 genera colores en `oklch()` y mezclas con `color-mix(in oklab, ...)`,
 * que html2canvas no puede parsear. Este script, tras compilar, reemplaza:
 *
 *   color-mix(in srgb, rgb(r, g, b) N%, transparent)  ->  rgba(r, g, b, N/100)
 *   color-mix(in srgb, #rrggbb N%, transparent)       ->  rgba(r, g, b, N/100)
 *   color-mix(in oklab, var(--color-x) N%, transparent) -> (se elimina la regla)
 *
 * y borra los bloques `@supports (color: color-mix(in lab, red, red)) { ... }`
 * que reintroducen valores en oklab.
 *
 * Uso: node scripts/fix-css-colors.mjs <archivo.css>
 */
import { readFileSync, writeFileSync } from 'fs';

const archivo = process.argv[2];
if (!archivo) {
    console.error('Uso: node scripts/fix-css-colors.mjs <archivo.css>');
    process.exit(1);
}

const NOMBRES_HEX = {
    '#000': [0, 0, 0],
    '#000000': [0, 0, 0],
    '#fff': [255, 255, 255],
    '#ffffff': [255, 255, 255],
};

const normalizarPorcentaje = (valor) => {
    const n = parseFloat(valor);
    return Number.isFinite(n) ? Math.min(Math.max(n / 100, 0), 1) : 1;
};

// Convierte cualquier `color-mix(in srgb, <base> N%, transparent)` a rgba().
const reemplazarColorMixSrgb = (css) =>
    css.replace(
        /color-mix\(in srgb,\s*(rgb\([^)]*\)|#[0-9a-fA-F]{3,8})\s+([\d.]+)%,\s*transparent\)/g,
        (_match, base, porcentaje) => {
            const factor = normalizarPorcentaje(porcentaje);
            if (base.startsWith('rgb')) {
                const nums = base
                    .replace(/rgba?\(|\)/g, '')
                    .split(',')
                    .map((n) => parseFloat(n.trim()));
                const [r, g, b] = nums;
                const aPrevio = nums.length === 4 ? nums[3] : 1;
                return `rgba(${r}, ${g}, ${b}, ${(aPrevio * factor).toFixed(3)})`;
            }
            const hex = NOMBRES_HEX[base.toLowerCase()] || NOMBRES_HEX[base.toLowerCase().slice(0, 4)];
            if (!hex) return `rgba(0, 0, 0, ${factor.toFixed(3)})`;
            const [r, g, b] = hex;
            return `rgba(${r}, ${g}, ${b}, ${factor.toFixed(3)})`;
        },
    );

// Elimina bloques @supports que usan color-mix(in oklab, ...) (incluida su llave
// de cierre correspondiente). El fallback en srgb ya quedó convertido a rgba().
const eliminarBloquesOklab = (css) => {
    let resultado = '';
    let i = 0;
    const marca = '@supports (color: color-mix(in lab, red, red))';
    while (i < css.length) {
        const inicio = css.indexOf(marca, i);
        if (inicio === -1) {
            resultado += css.slice(i);
            break;
        }
        resultado += css.slice(i, inicio);
        // Encontrar la llave de apertura y su cierre balanceado.
        let j = css.indexOf('{', inicio);
        let profundidad = 0;
        let fin = j;
        for (; j < css.length; j++) {
            if (css[j] === '{') profundidad++;
            else if (css[j] === '}') {
                profundidad--;
                if (profundidad === 0) {
                    fin = j + 1;
                    break;
                }
            }
        }
        i = fin;
    }
    return resultado;
};

// Convierte cualquier oklch()/oklab() residual a un rgb() neutro para que
// html2canvas nunca lo encuentre (no suele quedar ninguno tras lo anterior).
const limpiarOklch = (css) =>
    css.replace(/oklch\([^)]*\)/g, 'rgb(0, 0, 0)').replace(/oklab\([^)]*\)/g, 'rgb(0, 0, 0)');

let css = readFileSync(archivo, 'utf8');
const antesOklab = (css.match(/color-mix\(in oklab/g) || []).length;
const antesOklch = (css.match(/oklch\(/g) || []).length;

css = reemplazarColorMixSrgb(css);
css = eliminarBloquesOklab(css);
css = limpiarOklch(css);

writeFileSync(archivo, css);

const despuesOklab = (css.match(/color-mix\(in oklab/g) || []).length;
const despuesOklch = (css.match(/oklch\(/g) || []).length;

console.log(
    `✔ ${archivo}: oklab ${antesOklab} -> ${despuesOklab}, oklch ${antesOklch} -> ${despuesOklch}`,
);
