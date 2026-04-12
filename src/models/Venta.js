import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Cliente from './Cliente.js';
import Usuario from './Usuario.js';
import Iva from './Iva.js';
import { formatearPrecio } from '../helpers/format.js';

class Venta extends Model {}

Venta.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        cliente_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Cliente, key: 'id' },
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Usuario, key: 'id' },
        },
        iva_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Iva, key: 'id' },
        },
        fecha: DataTypes.DATE,
        total: DataTypes.DECIMAL(10, 2),
        observaciones: DataTypes.TEXT,
    },
    {
        sequelize,
        modelName: 'Venta',
        tableName: 'venta',
        hooks: {
            beforeCreate: (venta) => {
                venta.total = formatearPrecio(venta.total);
            },
            beforeUpdate: (venta) => {
                if (venta.changed('total')) {
                    venta.total = formatearPrecio(venta.total);
                }
            },
        },
    },
);

Venta.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Cliente.hasMany(Venta, { foreignKey: 'cliente_id', as: 'ventas' });

Venta.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Venta, { foreignKey: 'usuario_id', as: 'ventas' });

Venta.belongsTo(Iva, { foreignKey: 'iva_id', as: 'iva' });
Iva.hasMany(Venta, { foreignKey: 'iva_id', as: 'ventas' });

export default Venta;
