import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import CategoriaProducto from './CategoriaProducto.js';
import { formatearPrecio } from '../helpers/format.js';

class Producto extends Model {}

Producto.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        categoria_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: CategoriaProducto, key: 'id' },
        },
        codigo: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        nombre: DataTypes.STRING,
        descripcion: DataTypes.TEXT,
        precio: DataTypes.DECIMAL(10, 2),
        stock: DataTypes.INTEGER,
        // imagen: DataTypes.STRING,
    },
    {
        sequelize,
        modelName: 'Producto',
        tableName: 'producto',
        hooks: {
            beforeCreate: (producto, options) => {
                const { precio, stock } = producto;
                const precioDecimal = formatearPrecio(precio);
                producto.stock = stock || 0;
                producto.precio = precioDecimal;
            },
            beforeUpdate: (producto) => {
                if (producto.changed('precio')) {
                    producto.precio = formatearPrecio(producto.precio);
                }

                if (producto.changed('stock') && (producto.stock === null || producto.stock === undefined)) {
                    producto.stock = 0;
                }
            },
        },
    },
);

Producto.belongsTo(CategoriaProducto, { foreignKey: 'categoria_id', as: 'categoria' });
CategoriaProducto.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });

export default Producto;
// This code defines a Sequelize model for a "Producto" (Product) entity, which includes fields for category, name, description, price, and stock. It establishes a relationship with the "CategoriaProducto" (Product Category) model, allowing each product to belong to a specific category. The model is configured to use the "producto" table in the database.
