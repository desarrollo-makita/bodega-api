const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'makita-ti-chile';

// Función para generar un token JWT
const generateToken = (user) => {
    return jwt.sign({ id: user.data.UsuarioID, username: user.data.Nombre }, SECRET_KEY, { expiresIn: '8h' });
};

// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // 'Bearer <token>'

    if (!token) {
        return res.status(403).send('Token requerido');
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send('Token inválido');
        }
        req.user = decoded; // Puedes usar req.user en tus rutas
        next();
    });
};

module.exports = { generateToken, verifyToken };
