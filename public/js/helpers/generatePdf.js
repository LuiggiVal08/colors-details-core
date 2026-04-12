/**
 * Genera un PDF desde un elemento HTML,
 * clonando su contenido y aplicando fallbacks para evitar errores de color.
 */
export const generarPDF = async (selector, nombre = 'documento', config = {}) => {
    const elemento = document.querySelector(selector);
    if (!elemento) {
        console.error(`No se encontró el elemento con el selector "${selector}"`);
        return;
    }

    // 🔹 Clonar el nodo para no alterar el DOM original
    const cloned = elemento.cloneNode(true);
    cloned.classList.add('fallback-pdf');

    // 🔹 Mapa de clases conflictivas → clases fallback
    const replacements = {
        'bg-gray-100': 'fallback-bg-gray-100',
        'bg-gray-50': 'fallback-bg-gray-50',
        'bg-red-400': 'fallback-bg-red-400',
        'bg-red-500': 'fallback-bg-red-500',
        'bg-blue-400': 'fallback-bg-blue-400',
        'bg-blue-500': 'fallback-bg-blue-500',
        'text-gray-800': 'fallback-text-gray-800',
        'text-gray-900': 'fallback-text-gray-900',
        'border-gray-200': 'fallback-border-gray-200',
        'border-gray-400/50': 'fallback-border-gray-400',
        'shadow-lg': 'fallback-shadow-lg',
    };

    // 🔹 Función para escapar correctamente nombres de clases para querySelectorAll
    const escapeClass = (cls) => cls.replace(/([!\"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');

    // 🔹 Reemplazar todas las clases conflictivas en el clon
    for (const [tw, fb] of Object.entries(replacements)) {
        const selectorSeguro = '.' + escapeClass(tw);
        cloned.querySelectorAll(selectorSeguro).forEach((el) => el.classList.add(fb));
    }

    // 🔹 Crear nombre único para el archivo
    const fecha = new Date();
    const fechaISO = fecha.toISOString().replace(/[-:.TZ]/g, '');
    const idUnico = Math.random().toString(36).substring(2, 6);
    const nombreFinal = `${nombre}_${fechaISO}_${idUnico}.pdf`;

    const opcionesPorDefecto = {
        margin: 8,
        filename: nombreFinal,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    const opciones = { ...opcionesPorDefecto, ...config };

    // 🔹 Crear un contenedor temporal fuera del flujo del documento
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.appendChild(cloned);
    document.body.appendChild(wrapper);

    try {
        console.log('Generando PDF...');
        await html2pdf().set(opciones).from(cloned).save();
        console.log(`✅ PDF "${opciones.filename}" generado con éxito.`);
    } catch (error) {
        console.error('❌ Error al generar el PDF:', error);
        alert('Error al generar el PDF. Intenta nuevamente.');
    } finally {
        wrapper.remove();
    }
};
