const PIE_COLORS = [
    '#be123c',
    '#e11d48',
    '#f43f5e',
    '#fb7185',
    '#fda4af',
    '#fecdd3',
    '#14b8a6',
    '#06b6d4',
    '#8b5cf6',
    '#f59e0b',
];

const getPieColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(PIE_COLORS[i % PIE_COLORS.length]);
    }
    return colors;
};

export const renderStockChart = async (http) => {
    const canvas = document.getElementById('stockChart');
    const emptyEl = document.getElementById('stockChart-empty');
    if (!canvas || !emptyEl) return;

    const [prodRes, catRes] = await Promise.all([http.get('/product'), http.get('/category')]);
    const products = prodRes.data || prodRes;
    const categories = catRes.data || catRes;

    const categoryMap = {};
    categories.forEach((cat) => (categoryMap[cat.id] = cat.nombre));

    const stockByCategory = {};
    products.forEach((prod) => {
        const catName = categoryMap[prod.categoria_id] || 'Sin Categoría';
        stockByCategory[catName] = (stockByCategory[catName] || 0) + +prod.stock;
    });

    const labels = Object.keys(stockByCategory);

    if (labels.length === 0) {
        canvas.classList.add('hidden');
        emptyEl.classList.remove('hidden');
        return;
    }

    canvas.classList.remove('hidden');
    emptyEl.classList.add('hidden');

    new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels,
            datasets: [
                {
                    data: Object.values(stockByCategory),
                    backgroundColor: getPieColors(labels.length),
                },
            ],
        },
    });
};
