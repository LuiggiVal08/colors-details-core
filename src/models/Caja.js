import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Empresa from './Empresa.js';
import { formatearPrecio } from '../helpers/format.js';
class Caja extends Model {}

Caja.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        empresa_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Empresa, key: 'id' } },
        nombre: DataTypes.STRING,
        ubicacion: DataTypes.TEXT,
        activo: DataTypes.BOOLEAN,
        tipo: {
            type: DataTypes.ENUM('fisica', 'digital'),
            allowNull: false,
            defaultValue: 'fisica',
        },
        cuenta_receptora: {
            type: DataTypes.STRING(160),
            allowNull: true,
        },
        monto: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        monto_usd: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        modelName: 'Caja',
        tableName: 'caja',
        hooks: {
            beforeUpdate: async (caja) => {
                if (caja.changed('monto') && caja.monto != null) caja.monto = formatearPrecio(caja.monto);
                if (caja.changed('monto_usd') && caja.monto_usd != null) {
                    caja.monto_usd = formatearPrecio(caja.monto_usd);
                }
            },
        },
    },
);

Caja.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasMany(Caja, { foreignKey: 'empresa_id', as: 'cajas' });

export default Caja;
