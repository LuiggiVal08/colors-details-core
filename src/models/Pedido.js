import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Cliente from './Cliente.js';
import Usuario from './Usuario.js';
import { formatearPrecio } from '../helpers/format.js';
import Iva from './Iva.js';

class Pedido extends Model {}

Pedido.init(
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
        fecha_entrega: DataTypes.DATE,
        estado: DataTypes.STRING,
        total: DataTypes.DECIMAL(10, 2),
        observaciones: DataTypes.TEXT,
    },
    {
        sequelize,
        modelName: 'Pedido',
        tableName: 'pedido',
        hooks: {
            beforeCreate: async (pedido) => {
                pedido.total = formatearPrecio(pedido.total);
            },
        },
    },
);

Pedido.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Cliente.hasMany(Pedido, { foreignKey: 'cliente_id', as: 'pedidos' });

Pedido.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Pedido, { foreignKey: 'usuario_id', as: 'pedidos' });

Pedido.belongsTo(Iva, { foreignKey: 'iva_id', as: 'iva' });
Iva.hasMany(Pedido, { foreignKey: 'iva_id', as: 'pedidos' });
export default Pedido;
