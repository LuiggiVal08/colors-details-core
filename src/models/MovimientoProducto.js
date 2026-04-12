import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Producto from './Producto.js';
import Usuario from './Usuario.js';

class MovimientoProducto extends Model {}

MovimientoProducto.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        producto_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Producto, key: 'id' },
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Usuario, key: 'id' },
        },
        tipo: {
            type: DataTypes.ENUM('entrada', 'salida'),
            allowNull: false,
        },
        cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        stock_antes: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        stock_despues: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        fecha: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        observacion: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'MovimientoProducto',
        tableName: 'movimiento_producto',
    },
);

// Relaciones
MovimientoProducto.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
Producto.hasMany(MovimientoProducto, { foreignKey: 'producto_id', as: 'movimientos' });

MovimientoProducto.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(MovimientoProducto, { foreignKey: 'usuario_id', as: 'movimientos' });

export default MovimientoProducto;
