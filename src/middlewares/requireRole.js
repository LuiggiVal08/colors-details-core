const requireRole = (roles) => {
    return (req, res, next) => {
        const role = req.user?.tipo_usuario_name;

        if (!role) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }

        if (!roles.includes(role)) {
            return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
        }

        next();
    };
};

export default requireRole;