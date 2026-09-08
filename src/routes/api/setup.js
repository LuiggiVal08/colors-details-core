import { Router } from 'express';
import { models } from '../../models/index.js';
import handleErrorsController from '../../helpers/handdleErrorsController.js';
import { DB_NAME, DB_PASSWORD, DB_URL, DB_USER } from '../../constants.js';
import { unlink, writeFile } from 'fs/promises';
import fs from 'fs'; // el viejo confiable, para sync
import bcrypt from 'bcryptjs';
import { exec, spawn } from 'child_process';
import { execSync } from 'child_process';
import path from 'path';
import { tmpdir } from 'os';
import multer from 'multer';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            const tmpPath = path.resolve('tmp');
            if (!fs.existsSync(tmpPath)) fs.mkdirSync(tmpPath);
            cb(null, tmpPath);
        } catch (error) {
            cb(new Error(error.message || 'Error al crear carpeta tmp'));
        }
    },
    filename: (req, file, cb) => {
        cb(null, 'restore.sql');
    },
});
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext === '.sql') cb(null, true);
    else cb(new Error('Solo se permiten archivos .sql'));
};
const upload = multer({ storage, fileFilter });
const uploadMiddleware = (req, res, next) => {
    upload.single('backup')(req, res, (err) => {
        if (err) {
            return handleErrorsController(new Error(err.message), res, req);
        }
        next();
    });
};
const router = Router();

// Resuelve la ruta de un binario de MySQL de forma portable (env o PATH).
const resolveBin = (name, envKey) => {
    const fromEnv = process.env[envKey];
    if (fromEnv) return fromEnv;
    try {
        return execSync(`command -v ${name} 2>/dev/null || which ${name} 2>/dev/null`)
            .toString()
            .trim();
    } catch {
        return name; // que falle con el nombre y dé un error claro
    }
};

// Middleware de autorización para operaciones de base de datos (solo admin/superadmin).
const requireAdmin = (req, res, next) => {
    const user = req.user || res.locals.user;
    const role = user?.tipo_usuario_name;
    if (role === 'admin' || role === 'superadmin') return next();
    return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
};

// Extrae host, puerto y credenciales del servidor MySQL desde DB_URL
// (p. ej. mysql://root:@db:3306/colorsanddetails). Usa las mismas credenciales
// que la app para que el CLI siempre coincida con Sequelize.
const mysqlCredentials = () => {
    try {
        const url = new URL(DB_URL);
        const user = decodeURIComponent(url.username);
        const password = decodeURIComponent(url.password);
        return { host: url.hostname, port: url.port || '3306', user, password };
    } catch {
        return { host: 'localhost', port: '3306', user: DB_USER, password: DB_PASSWORD };
    }
};

router.get('/', async (req, res) => {
    try {
        const empresaExist = await models.Empresa.findOne();
        if (empresaExist) return res.status(200).json({ message: 'Empresa ya existe' });

        const securityQuestions = [
            '¿Cuál es tu comida favorita?',
            '¿Cómo se llama tu mejor amigo de la infancia?',
            '¿Cuál es el nombre de tu primera mascota?',
            '¿Cuál es tu postre favorito?',
            '¿Cuál es tu película favorita?',
        ];
        const existingQuestions = await models.PreguntaSeguridad.findAll();
        if (existingQuestions.length > 0) return res.status(200).json({ message: 'Preguntas ya existentes' });

        await models.PreguntaSeguridad.bulkCreate(securityQuestions.map((question) => ({ pregunta: question })));

        const empresa = await models.Empresa.create({
            nombre: 'Colores y Detalles',
            rif: 'J-12345678-1',
            direccion: 'Direccion',
            telefono: '+58 (414) 123-4567',
            email: 'email@email.com',
            logo: 'logo.png',
            sitio_web: 'https://www.coloresydetalles.com',
            descripcion: 'Empresa dedicada a la venta de productos de ferretería y decoración.',
            slogan: 'Venta de productos de ferretería y decoración.',
            ciudad: 'Boconó',
        });

        const roles = ['superadmin', 'admin', 'user'];
        await models.TipoUsuario.bulkCreate(roles.map((rol) => ({ nombre: rol })));
        const tipoUsuario = await models.TipoUsuario.findOne({ where: { nombre: 'superadmin' } });

        const empleado = await models.Empleado.create({
            cedula: '12 345 678',
            nombre: 'Administrador',
            apellido: 'Sistema',
            telefono: '+58 (414) 123-4567',
            email: 'admin@admin.com',
            direccion: 'Direccion',
            salario_base: '0,00',
            activo: true,
            fecha_ingreso: new Date(),
            empresa_id: empresa.id,
        });

        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('Admin.123', salt);
        const admin = await models.Usuario.create({
            username: 'admin',
            password,
            tipo_usuario_id: tipoUsuario.id,
            empleado_id: empleado.id,
            activo: true,
        });

        return res.status(201).json({ empresa, admin });
    } catch (error) {
        handleErrorsController(error, res, req);
    }
});

router.get('/db/dump', isAuthenticated, requireAdmin, async (req, res) => {
    try {
        const mysqldump = resolveBin('mysqldump', 'DB_MYSQL_DUMP');
        const { host, port, user, password } = mysqlCredentials();
        // --ssl-verify-server-cert=0: el servidor MySQL 8.4 trae certificado
        // self-signed; el cliente CLI (MariaDB/Alpine) exige verificarlo.
        const command = `"${mysqldump}" --ssl-verify-server-cert=0 -h${host} -P${port} -u${user} --password=${password} ${DB_NAME}`;

        exec(command, async (error, stdout, stderr) => {
            if (error) {
                return handleErrorsController(`Error al generar dump: ${stderr || error.message}`, res, req);
            }
            const filePath = path.join(tmpdir(), `${DB_NAME}_backup.sql`);
            try {
                await writeFile(filePath, stdout);
                res.download(filePath, `${DB_NAME}_backup.sql`, async (err) => {
                    if (err) return handleErrorsController(err, res, req);
                    await unlink(filePath);
                });
            } catch (err) {
                handleErrorsController(err, res, req);
            }
        });
    } catch (error) {
        handleErrorsController(error, res, req);
    }
});

router.post('/db/restore', isAuthenticated, requireAdmin, uploadMiddleware, async (req, res) => {
    try {
        const filePath = path.resolve('tmp', 'restore.sql');
        const mysql = resolveBin('mysql', 'DB_MYSQL');
        const { host, port, user, password } = mysqlCredentials();

        const restoreProcess = spawn(mysql, [`--ssl-verify-server-cert=0`, `-h${host}`, `-P${port}`, `-u${user}`, `--password=${password}`, DB_NAME]);

        const sqlStream = fs.createReadStream(filePath);
        sqlStream.pipe(restoreProcess.stdin);

        restoreProcess.stderr.on('data', (data) => {
            console.error('Error al restaurar DB:', data.toString());
        });

        restoreProcess.on('close', async (code) => {
            if (code !== 0) {
                return handleErrorsController(`Falló la restauración con código: ${code}`, res, req);
            }
            await fs.promises.unlink(filePath);
            res.status(200).json({ message: 'Base de datos restaurada con éxito' });
        });
    } catch (error) {
        handleErrorsController(error, res, req);
    }
});
export default router;
