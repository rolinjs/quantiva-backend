import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    // El token se envía en el header Authorization: Bearer <TOKEN>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token no proporcionado'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token inválido'
            });
        }
        // El payload del token se asigna a req.user
        req.user = user;
        next();
    });
};
