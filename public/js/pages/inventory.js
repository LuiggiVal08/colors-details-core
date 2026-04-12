import fillTable from '../helpers/fillTable.js';
import { Format } from '../helpers/Format.js';
import { openModal, closeModal } from '../helpers/handleModal.js';
import { httpClient } from '../index.js';
import setupTabs from '../helpers/setupTabs.js';
import { setupModalLifecycle } from '../helpers/handleModalEvents.js';
import showToast from '../helpers/Toast.js';
import { setupFilteredTable } from '../helpers/setupFilteredTable.js';
import badge from '../helpers/badge.js';

document.addEventListener('DOMContentLoaded', async () => {
    const responseCategory = await httpClient.get('/category');
    const { data: categories } = responseCategory;
    setupFilteredTable({
        data: categories,
        filterInputs: {
            search: document.querySelector('#searchCategory'),
        },
        filterFn: (category, inputs) => {
            const texto = inputs.search.value.toLowerCase().trim();
            return texto.length === 0 || category.nombre.toLowerCase().includes(texto);
        },
        fillTableOptions: {
            templateId: 'fila-ejemplo-category',
            tableSelector: '#categoryTable',
            actions: {
                editar: (e) => {
                    editCategory(e.currentTarget.dataset.idModel);
                },
            },
            formatters: {
                creado_en: (dato) => new Date(dato.creado_en).toLocaleDateString(),
                productos: (dato) => dato.productos.length.toString(),
            },
        },
        paginationButtons: {
            prev: document.querySelector('#btnAnteriorCategory'),
            next: document.querySelector('#btnSiguienteCategory'),
        },
        itemsPerPage: 4,
    });
});
document.addEventListener('DOMContentLoaded', async () => {
    const responseProduct = await httpClient.get('/product');
    const responseTasa = await httpClient.get('/exchange-rate/actual');

    const { data: products } = responseProduct;
    const { data: tasa } = responseTasa;
    setupFilteredTable({
        data: products,
        filterInputs: {
            searchProduct: document.querySelector('#searchProduct'),
            categoriaSearchProduct: document.querySelector('#categoriaSearchProduct'),
            checkboxLowStock: document.querySelector('#checkboxLowStock'),
        },
        filterFn: (product, inputs) => {
            const texto = inputs.searchProduct.value.toLowerCase().trim();
            const categoria = inputs.categoriaSearchProduct.value.toLowerCase().trim();
            const checkboxLowStock = inputs.checkboxLowStock.checked ? product.stock < 10 : true;
            const filtroNombre = texto.length === 0 || product.nombre.toLowerCase().includes(texto);
            const filtroCategoria = categoria ? product.categoria.id == categoria : true;
            return filtroNombre && filtroCategoria && checkboxLowStock;
        },
        fillTableOptions: {
            templateId: 'fila-ejemplo-product',
            tableSelector: '#productTable',
            actions: {
                editar: (e) => {
                    editProduct(e.currentTarget.dataset.idModel);
                },
            },
            formatters: {
                stock: (dato) => dato.stock.toString(),
                precio: (dato) => `$${Format.float(dato.precio)}`,
                precio_bs: (dato) => {
                    const tasaValue = tasa?.tasa ?? 1; // si tasa es null/undefined, usa 1

                    console.log(tasaValue);

                    const precio = Number(dato.precio) * Number(tasaValue);
                    return `${Format.float(precio.toFixed(2))} Bs.s`;
                },
                categoria: (dato) => dato.categoria?.nombre || 'Sin categoría',
                estado: (dato) => {
                    let text = '';
                    let classes = [];

                    if (!dato.stock || dato.stock == 0) {
                        text = 'No Disponible';
                        classes = ['bg-red-400/10', 'text-red-500'];
                    } else if (dato.stock < 10) {
                        text = 'Poco Stock';
                        classes = ['bg-yellow-400/10', 'text-yellow-500'];
                    } else {
                        text = 'En Stock';
                        classes = ['bg-green-400/10', 'text-green-500'];
                    }

                    return badge(text, {
                        html: false,
                        classes: [...classes, 'rounded-full', 'px-2', 'text-xs'],
                    });
                },
                precio_iva_dollar: (dato) => {
                    const precioConIva = (Number(dato.precio) * 1.12).toFixed(2);
                    return `$${Format.float(precioConIva)} (USD)`;
                },
                precio_iva_bs: (dato) => {
                    const tasaValue = tasa?.tasa ?? 1;
                    const precioConIva = (Number(dato.precio) * 1.12).toFixed(2);
                    return `${Format.float((Number(precioConIva) * Number(tasaValue)).toFixed(2))}Bs.s`;
                },
            },
        },
        paginationButtons: {
            prev: document.querySelector('#btnAnteriorProducts'),
            next: document.querySelector('#btnSiguienteProducts'),
        },
        itemsPerPage: 4,
    });
});
document.addEventListener('DOMContentLoaded', async () => {
    const responseMovement = await httpClient.get('/product-movement');
    const { data: movement } = responseMovement;
    setupFilteredTable({
        data: movement,
        filterInputs: {
            searchTypeMovement: document.querySelector('#searchTypeMovement'),
        },
        filterFn: (product, inputs) => {
            const texto = inputs.searchTypeMovement.value.toLowerCase().trim();
            const filtroTipo = texto.length === 0 || product.tipo.toLowerCase().includes(texto);
            return filtroTipo;
        },
        fillTableOptions: {
            templateId: 'fila-ejemplo-movement',
            tableSelector: '#productMovementTable',

            formatters: {
                fecha: (dato) =>
                    new Date(dato.fecha).toLocaleDateString() + ' ' + new Date(dato.fecha).toLocaleTimeString() || '',
                producto: (dato) => dato.producto.nombre,
                stock_antes: (dato) => dato.stock_antes || '0',
                tipo: (dato) => {
                    let text = dato.tipo.toLowerCase();
                    let classes = [
                        dato.tipo == 'entrada' ? '!bg-gray-900' : '!bg-gray-300',
                        dato.tipo == 'entrada' ? '!text-white' : '!text-gray-800',
                    ];

                    return badge(text, {
                        // html: false,
                        classes: ['rounded-full', 'px-2', 'text-xs', ...classes],
                    });
                },
            },
        },
        paginationButtons: {
            prev: document.querySelector('#paginador-tabla-movimiento .btn-paginar:first-child'),
            next: document.querySelector('#paginador-tabla-movimiento .btn-paginar:last-child'),
        },
        itemsPerPage: 4,
    });
});

const editCategory = async (id) => {
    const modalEdit = document.querySelector('#modal-edit-category');
    if (!modalEdit) {
        console.error('Modal de edición de categoría no encontrado');
        return;
    }
    const response = await httpClient.get(`/category/${id}`);
    const { error, status, message, data } = response;
    if (error) {
        showToast({ title: `Error: ${status}`, message: message ?? 'Error inesperado', type: 'error', duration: 5000 });
        return;
    }
    const form = modalEdit.querySelector('form');
    if (form) {
        form.action = `/category/${id}`;
        form.querySelector('[name="nombre"]').value = data.nombre;
        form.querySelector('[name="descripcion"]').value = data.descripcion;
    }
    setupModalLifecycle(modalEdit);
};
const editProduct = async (id) => {
    const response = await httpClient.get(`/product/${id}`);
    const { error, status, message, data } = response;
    if (error) {
        showToast({ title: `Error: ${status}`, message: message ?? 'Error inesperado', type: 'error', duration: 5000 });
        return;
    }
    const modalEdit = document.querySelector('#modal-edit-product');
    if (!modalEdit) {
        console.error('Modal de edición de producto no encontrado');
        return;
    }
    const form = modalEdit.querySelector('form');
    if (form) {
        form.action = `/product/${id}`;
        form.querySelector('[name="nombre"]').value = data.nombre;
        form.querySelector('[name="precio"]').value = Format.float(data.precio);
        form.querySelector('[name="categoria_id"]').value = data.categoria_id;
        form.querySelector('[name="descripcion"]').value = data.descripcion;
        form.querySelector('[name="codigo"]').value = data.codigo;
    }
    setupModalLifecycle(modalEdit);
};

document.getElementById('btnAddCategory').addEventListener('click', () => {
    const modalCreate = document.querySelector('#modal-create-category');
    if (!modalCreate) {
        console.error('Modal de creación de categoría no encontrado');
        return;
    }
    setupModalLifecycle(modalCreate);
});
document.getElementById('btnAddProduct').addEventListener('click', () => {
    const modalCreate = document.querySelector('#modal-create-product');
    if (!modalCreate) {
        console.error('Modal de creación de Producto no encontrado');
        return;
    }
    setupModalLifecycle(modalCreate);
});
document.getElementById('btnAddMovement').addEventListener('click', async () => {
    const modalCreate = document.querySelector('#modal-create-movement');
    if (!modalCreate) {
        console.error('Modal de creación de Movimiento no encontrado');
        return;
    }
    setupModalLifecycle(modalCreate);
});
document.addEventListener('DOMContentLoaded', () => {
    setupTabs('#tabs-products'); // selector del contenedor donde están los botones
});
