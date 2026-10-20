/**
 * Genera un PDF desde un elemento HTML,
 * clonando su contenido y neutralizando funciones de color modernas
 * (oklch, lab, lch...) que html2canvas no sabe parsear.
 */

// html2canvas (vía html2pdf) no soporta oklch()/lab()/lch(). Tailwind v4 compila
// su paleta a oklch(), lo que rompe el render. Convertimos cualquier color
// problemático a su equivalente rgb() antes de generar el PDF.
const COLOR_FUNCIONES_NO_SOPORTADAS = /\b(oklch|oklab|lab|lch|color-mix)\s*\(/i;

// Convierte un color arbitrario (oklch, lab, etc.) a rgb() usando el propio
// motor del navegador: pintamos el valor en un canvas y leemos el pixel.
const colorARgb = (color) => {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d');

        // Si el navegador no entiende el color, el fillStyle se ignora. Usamos
        // dos centinelas distintos para detectar el rechazo de forma fiable.
        ctx.fillStyle = 'rgb(1, 1, 1)';
        ctx.fillStyle = color;
        if (ctx.fillStyle === 'rgb(1, 1, 1)' || ctx.fillStyle === '#010101') {
            ctx.fillStyle = 'rgb(254, 254, 254)';
            ctx.fillStyle = color;
            if (ctx.fillStyle === 'rgb(254, 254, 254)' || ctx.fillStyle === '#fefefe') return null;
        }

        // Se pinta sobre un canvas transparente para conservar el canal alfa
        // (color-mix(..., transparent) produce colores con alpha < 1).
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        if (a === 255) return `rgb(${r}, ${g}, ${b})`;
        return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
    } catch {
        return null;
    }
};

// Propiedades de color que html2canvas lee del estilo computado.
const PROPIEDADES_COLOR = [
    'color',
    'background-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'text-decoration-color',
    'caret-color',
    'column-rule-color',
    '-webkit-text-fill-color',
    'fill',
    'stroke',
];

// Copia los colores ya resueltos (getComputedStyle los devuelve en rgb())
// como estilos inline en el clon. Así html2canvas no necesita interpretar
// oklch()/lab() del stylesheet: el valor inline gana y ya viene en rgb().
const inlineColoresComputados = (originales, clonados) => {
    const aplicar = (original, clon) => {
        if (!(original instanceof Element) || !(clon instanceof Element)) return;
        const computado = window.getComputedStyle(original);
        for (const propiedad of PROPIEDADES_COLOR) {
            const valor = computado.getPropertyValue(propiedad);
            if (valor && !COLOR_FUNCIONES_NO_SOPORTADAS.test(valor)) {
                clon.style.setProperty(propiedad, valor);
            }
        }
        const hijosOriginales = original.children;
        const hijosClonados = clon.children;
        for (let i = 0; i < hijosOriginales.length; i++) {
            aplicar(hijosOriginales[i], hijosClonados[i]);
        }
    };
    aplicar(originales, clonados);
};

// Recorre las hojas de estilo y reemplaza los valores de color no soportados
// por su equivalente rgb(). Devuelve una función para restaurar los originales.
const neutralizarColores = () => {
    const restaurar = [];

    for (const hoja of Array.from(document.styleSheets)) {
        let reglas;
        try {
            reglas = hoja.cssRules;
        } catch {
            // Hoja de otro origen (CDN sin CORS): no se puede leer, se ignora.
            continue;
        }
        if (!reglas) continue;

        for (const regla of Array.from(reglas)) {
            if (!regla.style) continue;

            for (let i = regla.style.length - 1; i >= 0; i--) {
                const propiedad = regla.style[i];
                const valor = regla.style.getPropertyValue(propiedad);
                if (!COLOR_FUNCIONES_NO_SOPORTADAS.test(valor)) continue;

                const rgb = colorARgb(valor);
                if (!rgb) continue;

                const prioridad = regla.style.getPropertyPriority(propiedad);
                regla.style.removeProperty(propiedad);
                regla.style.setProperty(propiedad, rgb, prioridad);
                restaurar.push({ regla, propiedad, valor, prioridad });
            }
        }
    }

    return () => {
        for (const { regla, propiedad, valor, prioridad } of restaurar) {
            regla.style.removeProperty(propiedad);
            regla.style.setProperty(propiedad, valor, prioridad);
        }
    };
};

export const generarPDF = async (selector, nombre = 'documento', config = {}) => {
    const elemento = document.querySelector(selector);
    if (!elemento) {
        console.error(`No se encontró el elemento con el selector "${selector}"`);
        return;
    }

    // 🔹 Clonar el nodo para no alterar el DOM original
    const cloned = elemento.cloneNode(true);

    // 🔹 Quitar atributos/estado que puedan romper el renderizado de html2canvas
    cloned.removeAttribute('inert');
    cloned.removeAttribute('hidden');
    cloned.querySelectorAll('[inert]').forEach((el) => el.removeAttribute('inert'));
    cloned.querySelectorAll('[hidden]').forEach((el) => el.removeAttribute('hidden'));

    // Fijar un ancho explícito para que html2canvas no colapse el layout
    const width = elemento.offsetWidth || elemento.getBoundingClientRect().width || 600;
    cloned.style.width = `${width}px`;
    cloned.style.background = '#ffffff';

    // 🔹 Crear nombre único para el archivo
    const fecha = new Date();
    const fechaISO = fecha.toISOString().replace(/[-:.TZ]/g, '');
    const idUnico = Math.random().toString(36).substring(2, 6);
    const nombreFinal = `${nombre}_${fechaISO}_${idUnico}.pdf`;

    const opcionesPorDefecto = {
        margin: 8,
        filename: nombreFinal,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    const opciones = { ...opcionesPorDefecto, ...config };

    // 🔹 Crear un contenedor temporal fuera del flujo del documento
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.width = `${width}px`;
    wrapper.appendChild(cloned);
    document.body.appendChild(wrapper);

    let restaurarColores = () => {};

    try {
        // 1) Neutraliza oklch()/lab()/color-mix() en todas las hojas legibles,
        //    reescribiendo los valores por su equivalente rgb().
        restaurarColores = neutralizarColores();

        // 2) Con las hojas ya saneadas, copia los colores resueltos como inline
        //    (rgb) en el clon: html2canvas usará el inline y no releerá nada raro.
        inlineColoresComputados(elemento, cloned);

        console.log('Generando PDF...');
        await html2pdf().set(opciones).from(cloned).save();
        console.log(`✅ PDF "${opciones.filename}" generado con éxito.`);
    } catch (error) {
        console.error('❌ Error al generar el PDF:', error);
        alert('Error al generar el PDF. Intenta nuevamente.');
    } finally {
        restaurarColores();
        wrapper.remove();
    }
};
