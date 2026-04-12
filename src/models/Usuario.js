import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Empleado from './Empleado.js';
import TipoUsuario from './TipoUsuario.js';

class Usuario extends Model {}

Usuario.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        empleado_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: Empleado, key: 'id' } },
        tipo_usuario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: TipoUsuario, key: 'id' } },
        username: DataTypes.STRING,
        password: DataTypes.STRING,
        activo: DataTypes.BOOLEAN,
    },
    {
        sequelize,
        modelName: 'Usuario',
        tableName: 'usuario',
    },
);

Usuario.belongsTo(Empleado, { foreignKey: 'empleado_id', as: 'empleado' });
Empleado.hasOne(Usuario, { foreignKey: 'empleado_id', as: 'usuario' });

Usuario.belongsTo(TipoUsuario, { foreignKey: 'tipo_usuario_id', as: 'tipo' });
TipoUsuario.hasMany(Usuario, { foreignKey: 'tipo_usuario_id', as: 'usuarios' });

export default Usuario;
