export const availableProductStock = (container, productId, stock, excludedItem = null) => {
    const stockCount = Number(stock);
    if (!Number.isFinite(stockCount) || stockCount <= 0) return 0;

    const reservedQuantity = [...container.querySelectorAll('.detalle-item')]
        .filter((item) => {
            if (item === excludedItem) return false;
            return item.querySelector('.producto-id-hidden')?.value === String(productId);
        })
        .reduce((total, item) => {
            const quantity = Number(item.querySelector('input[name*="[cantidad]"]')?.value);
            return total + (Number.isInteger(quantity) && quantity > 0 ? quantity : 0);
        }, 0);

    return Math.max(0, Math.floor(stockCount - reservedQuantity));
};

export const refreshStockLimits = (container, changedItem = null) => {
    container.querySelectorAll('.detalle-item').forEach((item) => {
        const productId = item.querySelector('.producto-id-hidden')?.value;
        const quantityInput = item.querySelector('input[name*="[cantidad]"]');
        const stock = Number(item.querySelector('.producto-id-hidden')?.dataset.stock);
        if (!productId || !quantityInput || !Number.isFinite(stock)) return;

        const available = availableProductStock(container, productId, stock, item);
        quantityInput.max = String(available);
        quantityInput.setCustomValidity('');

        if (item === changedItem && quantityInput.value && Number(quantityInput.value) > available) {
            quantityInput.value = available > 0 ? String(available) : '';
        }
    });
};
