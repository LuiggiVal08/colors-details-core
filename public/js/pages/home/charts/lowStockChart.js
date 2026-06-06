export const renderLowStockChart = async (http) => {
    const canvas = document.getElementById('lowStockChart');
    if (!canvas) return;

    const res = await http.get('/product?lowStock=true');
    const lowStockProducts = res.data || res;

    new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: lowStockProducts.map((p) => p.nombre),
            datasets: [
                {
                    label: 'Stock Actual',
                    data: lowStockProducts.map((p) => p.stock),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                },
            ],
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true },
            },
        },
    });
};
