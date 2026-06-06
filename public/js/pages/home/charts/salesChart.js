export const renderSalesChart = async (http, { start }) => {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return; // Validación de existencia

    const res = await http.get('/shopping');
    let data = res.data || res;

    data = data.filter((s) => new Date(s.fecha) >= new Date(start));

    const salesByDate = {};
    data.forEach((sale) => {
        const dateKey = new Date(sale.fecha).toISOString().slice(0, 10);
        salesByDate[dateKey] = (salesByDate[dateKey] || 0) + parseFloat(sale.total);
    });

    const labels = Object.keys(salesByDate).sort();
    const values = labels.map((label) => salesByDate[label]);

    new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Total Ventas ($)',
                    data: values,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                },
            ],
        },
    });
};
