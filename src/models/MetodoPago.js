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
        comision: DataTypes.DECIMAL(10, 2),
    },
    {
        sequelize,
        modelName: 'MetodoPago',
        tableName: 'metodo_pago',
        hooks: {
            beforeCreate: (paymentMethod, options) => {
                paymentMethod.comision = formatearPrecio(paymentMethod.comision);
            },
            beforeUpdate: (paymentMethod, options) => {
                paymentMethod.comision = formatearPrecio(paymentMethod.comision);
            },
        },
    },
);
const formatearPrecio = (valor) => parseFloat(valor.replace(/\./g, '').replace(',', '.'));

export default MetodoPago;
