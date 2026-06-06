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
        monto: {
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
                if (caja.monto) caja.monto = formatearPrecio(caja.monto);
            },
        },
    },
);

Caja.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasMany(Caja, { foreignKey: 'empresa_id', as: 'cajas' });

export default Caja;
