import { httpClient } from '../index.js';

const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
    };
};

const loadCharts = async () => {
    try {
        const { start, end } = getDateRange();

        // Fetch sales
        const salesRes = await httpClient.get('/shopping');
        let salesData = salesRes.data || salesRes;
        console.log('1', salesData);
        salesData = salesData.filter((s) => new Date(s.fecha) >= new Date(start));
        console.log('2', salesData);
        // Process sales: group by date, sum total
        const salesByDate = {};
        console.log('3', salesByDate);
        salesData.forEach((sale) => {
            const dateKey = new Date(sale.fecha).toISOString().slice(0, 10); // YYYY-MM-DD
            salesByDate[dateKey] = (salesByDate[dateKey] || 0) + parseFloat(sale.total);
        });

        const salesLabels = Object.keys(salesByDate).sort();
        const salesValues = salesLabels.map((label) => salesByDate[label]);
        console.log(salesLabels);
        console.log(salesByDate);
        console.log(salesValues);

        // Fetch orders
        const ordersRes = await httpClient.get('/orders');
        let ordersData = ordersRes.data || ordersRes;
        ordersData = ordersData.filter((o) => new Date(o.fecha) >= new Date(start));

        const ordersByMonth = {};
        ordersData.forEach((order) => {
            const month = new Date(order.fecha).toISOString().slice(0, 7);
            ordersByMonth[month] = (ordersByMonth[month] || 0) + 1;
        });
        // 1. Extraemos las llaves (meses) y las ordenamos alfabéticamente
        const orderLabels = Object.keys(ordersByMonth).sort();

        // 2. Mapeamos los valores siguiendo el nuevo orden de las etiquetas
        const orderValues = orderLabels.map((label) => ordersByMonth[label]);
        // Fetch products and categories for stock
        const productsRes = await httpClient.get('/product');
        const products = productsRes.data || productsRes;

        const categoriesRes = await httpClient.get('/category');
        const categories = categoriesRes.data || categoriesRes;

        const categoryMap = {};
        categories.forEach((cat) => (categoryMap[cat.id] = cat.nombre));

        const stockByCategory = {};
        products.forEach((prod) => {
            const catName = categoryMap[prod.categoria_id] || 'Sin Categoría';
            stockByCategory[catName] = (stockByCategory[catName] || 0) + prod.stock;
        });

        // Fetch low stock products
        const lowStockRes = await httpClient.get('/product?lowStock=true');
        const lowStockProducts = lowStockRes.data || lowStockRes;

        // Create charts
        // Sales chart
        const salesCtx = document.getElementById('salesChart').getContext('2d');
        new Chart(salesCtx, {
            type: 'bar',
            data: {
                labels: salesLabels,
                datasets: [
                    {
                        label: 'Total Ventas ($)',
                        data: salesValues,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                    },
                ],
            },
        });

        // Orders chart
        const ordersCtx = document.getElementById('ordersChart').getContext('2d');
        new Chart(ordersCtx, {
            type: 'line',
            data: {
                labels: orderLabels,
                datasets: [
                    {
                        label: 'Número de Pedidos',
                        data: orderValues,
                        borderColor: 'rgba(153, 102, 255, 1)',
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        tension: 0.3,
                        fill: true,
                    },
                ],
            },
        });

        // Stock chart
        const stockCtx = document.getElementById('stockChart').getContext('2d');
        new Chart(stockCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(stockByCategory),
                datasets: [
                    {
                        data: Object.values(stockByCategory),
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
                    },
                ],
            },
        });

        // Low stock chart
        const lowStockCtx = document.getElementById('lowStockChart').getContext('2d');
        new Chart(lowStockCtx, {
            type: 'bar',
            data: {
                labels: lowStockProducts.map((p) => p.nombre),
                datasets: [
                    {
                        label: 'Stock',
                        data: lowStockProducts.map((p) => p.stock),
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                indexAxis: 'y',
            },
        });
    } catch (error) {
        console.error('Error loading charts:', error);
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = '<p>Error al cargar estadísticas. Verifica tu sesión.</p>';
        }
    }
};

document.addEventListener('DOMContentLoaded', loadCharts);
