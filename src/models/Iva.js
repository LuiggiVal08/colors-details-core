import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Usuario from './Usuario.js';
import { formatearPrecio } from '../helpers/format.js';

class Iva extends Model {}

Iva.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Usuario, key: 'id' },
        },
        porcentaje: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        fecha: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        observacion: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        activa: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        modelName: 'Iva',
        tableName: 'iva',
        hooks: {
            beforeCreate: (iva, options) => {
                iva.porcentaje = formatearPrecio(iva.porcentaje);
            },
        },
    },
);

// Relaciones
Iva.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Iva, { foreignKey: 'usuario_id', as: 'ivas' });

export default Iva;
