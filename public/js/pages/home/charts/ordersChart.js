export const renderOrdersChart = async (http, { start }) => {
    const canvas = document.getElementById('ordersChart');
    if (!canvas) return;

    const res = await http.get('/orders');
    let data = res.data || res;

    data = data.filter((o) => new Date(o.fecha) >= new Date(start));

    const ordersByMonth = {};
    data.forEach((order) => {
        const month = new Date(order.fecha).toISOString().slice(0, 7);
        ordersByMonth[month] = (ordersByMonth[month] || 0) + 1;
    });

    const labels = Object.keys(ordersByMonth).sort();
    const values = labels.map((label) => ordersByMonth[label]);

    new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Número de Pedidos',
                    data: values,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    tension: 0.3,
                    fill: true,
                },
            ],
        },
    });
};
