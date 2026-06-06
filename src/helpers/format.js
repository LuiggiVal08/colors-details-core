export const formatearPrecio = (valor) => {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') {
        if (/^-?\d+(\.\d{1,2})?$/.test(valor)) return parseFloat(valor);
        return parseFloat(valor.replace(/\./g, '').replace(',', '.'));
    }
    return 0;
};
