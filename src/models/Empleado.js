import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Empresa from './Empresa.js';

class Empleado extends Model {}

Empleado.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        empresa_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Empresa, key: 'id' },
        },
        nombre: DataTypes.STRING,
        apellido: DataTypes.STRING,
        cedula: DataTypes.STRING,
        telefono: DataTypes.STRING,
        email: DataTypes.STRING,
        direccion: DataTypes.TEXT,
        fecha_ingreso: DataTypes.DATEONLY,
        salario_base: DataTypes.DECIMAL(10, 2),
        activo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        modelName: 'Empleado',
        tableName: 'empleado',
        hooks: {
            beforeCreate: (paymentMethod, options) => {
                paymentMethod.salario_base = formatearPrecio(paymentMethod.salario_base);
            },
            beforeUpdate: (paymentMethod, options) => {
                paymentMethod.salario_base = formatearPrecio(paymentMethod.salario_base);
            },
        },
    },
);
const formatearPrecio = (valor) => parseFloat(valor.replace(/\./g, '').replace(',', '.'));
Empleado.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasMany(Empleado, { foreignKey: 'empresa_id', as: 'empleados' });

export default Empleado;
