import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';

class MetodoPago extends Model {}

MetodoPago.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: DataTypes.STRING,
        descripcion: DataTypes.TEXT,
        tipo: DataTypes.STRING,
        activo: DataTypes.BOOLEAN,
    },
    {
        sequelize,
        modelName: 'MetodoPago',
        tableName: 'metodo_pago',
    },
);

export default MetodoPago;
