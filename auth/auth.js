const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'makita-ti-chile';

// Función para generar un token JWT
const generateToken = (user, vigencia) => {
  return jwt.sign(
    {
      id: user.data.UsuarioID,
      username: user.data.Nombre,
      role: user.data.Rol,
      apellidoPaterno: user.data.ApellidoPaterno,
      ApellidoMaterno: user.data.ApellidoMaterno,
      fechaInicio: user.data.FechaInicio,
      fechaFin: user.data.FechaFin,
      vigencia: vigencia,
      cardCode: user.data.CardCode,
      area : user.data.Area
    },
    SECRET_KEY,
    { expiresIn: '8h' }
  );
};

// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // 'Bearer <token>'

  if (!token) {
    return res.status(403).send({ mensaje: 'Token requerido' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ mensaje: 'Token expirado' });
    }

    req.user = decoded; // Puedes usar req.user en tus rutas
    next();
  });
};

module.exports = { generateToken, verifyToken };
