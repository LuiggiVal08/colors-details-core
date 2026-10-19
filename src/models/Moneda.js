import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';

class Moneda extends Model {}

Moneda.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        codigo: { type: DataTypes.STRING(10), allowNull: false, unique: true },
        simbolo: { type: DataTypes.STRING(10), allowNull: false },
        nombre: { type: DataTypes.STRING(60), allowNull: false },
    },
    {
        sequelize,
        modelName: 'Moneda',
        tableName: 'moneda',
        timestamps: false,
    },
);

export default Moneda;
