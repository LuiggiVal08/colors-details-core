import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import ServicioEmpresa from './ServicioEmpresa.js';
import Usuario from './Usuario.js';
import { formatearPrecio } from '../helpers/format.js';

class ServicioPeriodo extends Model {}

ServicioPeriodo.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        servicio_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: ServicioEmpresa, key: 'id' },
        },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Usuario, key: 'id' },
        },

        // Período
        mes: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 12 } },
        anualidad: { type: DataTypes.INTEGER, allowNull: false },

        // fechas
        fecha_generada: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
        fecha_corte: { type: DataTypes.DATEONLY, allowNull: false },

        // monto base a pagar para este periodo (según tarifa vigente al generarse)
        amount_due: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

        // saldo restante (amount_due - sum(pagos aplicados))
        amount_balance: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },

        descripcion: { type: DataTypes.TEXT, allowNull: true },

        // estado: pending, partial, paid, canceled
        estado: {
            type: DataTypes.ENUM('pending', 'partial', 'paid', 'canceled'),
            defaultValue: 'pending',
        },

        pago_tardio: { type: DataTypes.BOOLEAN, defaultValue: false },

        // marca si existe (al menos) un pago registrado (no confundir con paid)
        tiene_pagos: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
        sequelize,
        modelName: 'ServicioPeriodo',
        tableName: 'servicio_periodo',
        timestamps: true,
        createdAt: 'creado_en',
        updatedAt: 'actualizado_en',
        hooks: {
            beforeCreate: (servicio, options) => {
                servicio.amount_due = formatearPrecio(servicio.amount_due);
                servicio.amount_balance = formatearPrecio(servicio.amount_balance);
            },
            beforeUpdate: (servicio, options) => {
                servicio.amount_due = formatearPrecio(servicio.amount_due);
                servicio.amount_balance = formatearPrecio(servicio.amount_balance);
            },
        },
    },
);

ServicioPeriodo.belongsTo(ServicioEmpresa, { foreignKey: 'servicio_id', as: 'servicio' });
ServicioEmpresa.hasMany(ServicioPeriodo, { foreignKey: 'servicio_id', as: 'periodos' });

ServicioPeriodo.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(ServicioPeriodo, { foreignKey: 'usuario_id', as: 'periodos' });

export default ServicioPeriodo;
