const express = require('express');
const { connectToDatabase } = require('./config/database');
const routes = require('./routes/routes');
require('dotenv').config();

const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 4000;
const SECRET_KEY = process.env.SECRET_KEY || 'makita-ti-chile';

app.use(express.json());
// Middleware para habilitar CORS
app.use(cors({
  origin: 'http://localhost:4200', // Ajusta esto según el origen permitido
  methods: 'GET,POST,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
}));
const bodyParser = require('body-parser');

// Incrementar el límite de tamaño
app.use(bodyParser.json({ limit: '100mb' })); // Ajusta el tamaño según sea necesario
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
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