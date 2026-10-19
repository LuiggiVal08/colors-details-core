import { Router } from 'express';
import { models } from '../../models/index.js';
import handleErrorsController from '../../helpers/handdleErrorsController.js';
import { DB_NAME, DB_PASSWORD, DB_URL, DB_USER } from '../../constants.js';
import fs from 'fs'; // el viejo confiable, para sync
import bcrypt from 'bcryptjs';
import { execFileSync, spawn } from 'child_process';
import path from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import multer from 'multer';
import isAuthenticated from '../../middlewares/isAuthenticate.js';
import logger from '../../config/logger.js';

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
        cb(null, `restore-${Date.now()}-${randomUUID()}.sql`);
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

// Resuelve la ruta de un binario de MySQL de forma portable (env, PATH o XAMPP).
const resolveBin = (name, envKey) => {
    const fromEnv = process.env[envKey];
    if (fromEnv) return fromEnv;

    const candidatos = [];

    if (process.platform === 'win32') {
        try {
            const encontrados = execFileSync('where', [name], {
                stdio: ['ignore', 'pipe', 'ignore'],
            })
                .toString()
                .split(/\r?\n/)
                .filter(Boolean);
            candidatos.push(...encontrados);
        } catch {
            /* no está en PATH */
        }
        candidatos.push(
            `C:\\xampp\\mysql\\bin\\${name}.exe`,
            `C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\${name}.exe`,
            `C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\${name}.exe`,
        );
    } else {
        try {
            candidatos.push(
                execFileSync('which', [name], { stdio: ['ignore', 'pipe', 'ignore'] })
                    .toString()
                    .trim(),
            );
        } catch {
            /* no está en PATH */
        }
        candidatos.push(`/usr/bin/${name}`, `/usr/local/bin/${name}`, `/opt/homebrew/bin/${name}`);
    }

    return candidatos.find((ruta) => ruta && fs.existsSync(ruta)) || name;
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
    const mysqldump = resolveBin('mysqldump', 'DB_MYSQL_DUMP');
    const { host, port, user, password } = mysqlCredentials();
    const filePath = path.join(tmpdir(), `${DB_NAME}_backup_${randomUUID()}.sql`);
    const out = fs.createWriteStream(filePath);
    const args = ['--ssl-verify-server-cert=0', `-h${host}`, `-P${port}`, `-u${user}`, DB_NAME];
    const env = { ...process.env, ...(password ? { MYSQL_PWD: password } : {}) };

    const child = spawn(mysqldump, args, { env });
    let stderr = '';
    let exitCode = null;
    let finished = false;
    let respondido = false;

    const limpiar = () => {
        try {
            fs.unlinkSync(filePath);
        } catch {
            /* el archivo puede no existir */
        }
    };

    const fallar = (mensaje) => {
        if (respondido) return;
        respondido = true;
        limpiar();
        logger.error(`Error al generar dump: ${mensaje}`);
        if (!res.headersSent) {
            handleErrorsController(`Error al generar dump: ${mensaje}`, res, req);
        }
    };

    const descargar = () => {
        if (respondido) return;
        respondido = true;
        res.download(filePath, `${DB_NAME}_backup.sql`, (err) => {
            if (err) logger.error(`Error al descargar dump: ${err.message}`);
            limpiar();
        });
    };

    child.on('error', (err) => fallar(err.message));
    child.on('close', (code) => {
        exitCode = code;
        if (code !== 0) return fallar(stderr || `mysqldump terminó con código ${code}`);
        if (finished) descargar();
    });
    child.stderr.on('data', (data) => {
        stderr += data.toString();
    });
    child.stdout.pipe(out);
    out.on('error', (err) => fallar(err.message));
    out.on('finish', () => {
        finished = true;
        if (exitCode === 0) descargar();
        else if (exitCode !== null) fallar(stderr || `mysqldump terminó con código ${exitCode}`);
    });
});

let restauracionEnCurso = false;

router.post('/db/restore', isAuthenticated, requireAdmin, uploadMiddleware, async (req, res) => {
    const filePath = req.file?.path;
    if (!filePath) {
        return res.status(400).json({ message: 'Debes adjuntar un archivo .sql' });
    }

    if (restauracionEnCurso) {
        try {
            fs.unlinkSync(filePath);
        } catch {
            /* noop */
        }
        return res.status(409).json({ message: 'Ya hay una restauración de base de datos en curso' });
    }

    restauracionEnCurso = true;

    const mysql = resolveBin('mysql', 'DB_MYSQL');
    const { host, port, user, password } = mysqlCredentials();
    const args = ['--ssl-verify-server-cert=0', `-h${host}`, `-P${port}`, `-u${user}`, DB_NAME];
    const env = { ...process.env, ...(password ? { MYSQL_PWD: password } : {}) };

    let respondido = false;
    let stderr = '';

    const limpiar = () => {
        try {
            fs.unlinkSync(filePath);
        } catch {
            /* el archivo puede no existir */
        }
    };

    const finalizar = (status, mensaje) => {
        if (respondido) return;
        respondido = true;
        restauracionEnCurso = false;
        limpiar();
        if (!res.headersSent) res.status(status).json({ message: mensaje });
    };

    const restoreProcess = spawn(mysql, args, { env });
    const sqlStream = fs.createReadStream(filePath);

    restoreProcess.on('error', (err) => {
        logger.error(`No se pudo ejecutar mysql: ${err.message}`);
        finalizar(500, `No se pudo ejecutar mysql: ${err.message}`);
    });
    sqlStream.on('error', (err) => {
        logger.error(`No se pudo leer el archivo SQL: ${err.message}`);
        finalizar(500, `No se pudo leer el archivo SQL: ${err.message}`);
    });
    restoreProcess.stdin.on('error', (err) => {
        logger.error(`Error al enviar el SQL a mysql: ${err.message}`);
        if (err.code === 'EPIPE') finalizar(500, `Mysql cerró la conexión: ${stderr || err.message}`);
    });
    restoreProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        logger.warn(`mysql: ${data.toString().trim()}`);
    });
    restoreProcess.on('close', (code) => {
        if (code !== 0) {
            logger.error(`Falló la restauración con código ${code}: ${stderr}`);
            return finalizar(500, `Falló la restauración con código: ${code}. ${stderr}`.trim());
        }
        finalizar(200, 'Base de datos restaurada con éxito');
    });

    sqlStream.pipe(restoreProcess.stdin);
});

export default router;
