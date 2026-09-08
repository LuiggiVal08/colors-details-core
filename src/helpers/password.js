import bcrypt from 'bcryptjs';

const isBcryptHash = (hash) => typeof hash === 'string' && /^\$2[aby]\$/.test(hash);

export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * Verifica una contraseña contra un usuario.
 * Soporta hashes bcrypt y datos legacy en texto plano (importados desde el dump).
 */
export const verificarPassword = async (password, usuario) => {
    if (isBcryptHash(usuario.password)) {
        return bcrypt.compare(password, usuario.password);
    }
    return password === usuario.password;
};

/**
 * Si la contraseña almacenada está en texto plano (legacy), la rehashea y guarda.
 * Úsalo tras una autenticación correcta para migrar el dato en silencio.
 */
export const rehashIfPlain = async (password, usuario) => {
    if (!isBcryptHash(usuario.password)) {
        usuario.password = await hashPassword(password);
        await usuario.save();
    }
};