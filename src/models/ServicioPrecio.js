import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import ServicioEmpresa from './ServicioEmpresa.js';
import { formatearPrecio } from '../helpers/format.js';

class ServicioPrecio extends Model {}

ServicioPrecio.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        servicio_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: ServicioEmpresa, key: 'id' },
        },
        precio: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        fecha_inicio: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        fecha_fin: {
            type: DataTypes.DATEONLY,
            allowNull: true, // null = vigente hasta nuevo cambio
        },
        creado_por: {
            type: DataTypes.INTEGER,
            allowNull: true, // usuario que cambió precio (opcional)
        },
    },
    {
        sequelize,
        modelName: 'ServicioPrecio',
        tableName: 'servicio_precio',
        timestamps: true,
        updatedAt: 'actualizado_en',
        createdAt: 'creado_en',
        hooks: {
            beforeCreate: (servicio, options) => {
                servicio.precio = formatearPrecio(servicio.precio);
            },
            beforeUpdate: (servicio, options) => {
                servicio.precio = formatearPrecio(servicio.precio);
            },
        },
    },
);

ServicioPrecio.belongsTo(ServicioEmpresa, { foreignKey: 'servicio_id', as: 'servicio' });
ServicioEmpresa.hasMany(ServicioPrecio, { foreignKey: 'servicio_id', as: 'precios' });

export default ServicioPrecio;
