import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Empresa from './Empresa.js';

class ServicioEmpresa extends Model {}

ServicioEmpresa.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        empresa_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Empresa, key: 'id' },
        },
        nombre: DataTypes.STRING,
        descripcion: DataTypes.TEXT,
        proveedor: DataTypes.STRING,
        dia_corte: DataTypes.INTEGER,
    },
    {
        sequelize,
        modelName: 'ServicioEmpresa',
        tableName: 'servicio_empresa',
    },
);
ServicioEmpresa.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });
Empresa.hasMany(ServicioEmpresa, { foreignKey: 'empresa_id', as: 'servicios' });

export default ServicioEmpresa;
