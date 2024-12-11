const express = require('express');
const { connectToDatabase } = require('./config/database');
const routes = require('./routes/routes');
require('dotenv').config();

const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 4000;
const SECRET_KEY = process.env.SECRET_KEY || 'makita-ti-chile';

// Middleware para habilitar CORS
app.use(cors({
  origin: 'http://localhost:4200', // Ajusta esto según el origen permitido
  methods: 'GET,POST,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
}));

// Middleware para manejar solicitudes grandes (de tamaño 100mb)
app.use(express.json({ limit: '100mb' })); // Asegúrate de que esta línea esté antes de las rutas
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Configurar rutas de la API
app.use('/api', routes);

// Iniciar el servidor después de la conexión a la base de datos
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1); // Termina el proceso con un código de error
  });
