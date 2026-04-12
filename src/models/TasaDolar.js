import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Usuario from './Usuario.js';

class TasaDolar extends Model {}

TasaDolar.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Usuario, key: 'id' },
        },
        tasa: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        cambio: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true, // puede estar vacío si es la primera tasa
            comment: 'Valor anterior de la tasa de cambio',
        },
        activa: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        fecha: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'TasaDolar',
        tableName: 'tasa_dolar',
        hooks: {
            beforeCreate: (exchangeRate, options) => {
                exchangeRate.tasa = formatearPrecio(exchangeRate.tasa);
            },
            // beforeUpdate: (exchangeRate, options) => {
            //     exchangeRate.tasa = formatearPrecio(exchangeRate.tasa);
            // },
        },
    },
);

const formatearPrecio = (valor) => parseFloat(valor.replace(/\./g, '').replace(',', '.'));
// Relaciones
TasaDolar.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(TasaDolar, { foreignKey: 'usuario_id', as: 'tasas_dolar' });

export default TasaDolar;
