const express = require('express');
const router = express.Router();
const { generateToken, verifyToken } = require('../auth/auth');
const {
  crearUsuarios,
  getAllUsers,
  editUser,
  getUserName,
  deletetUser,
  editUserID,
} = require('../controllers/usuariosControllers');
const { login, validaClaveActual } = require('../controllers/login');
const { getAllMenu } = require('../controllers/menu');
const {obtenerUbicacionItem,actualizaUbicacion} = require('../controllers/obtenerUbicacionControllers');
const {recuperarPassword , replacePassword} = require('../controllers/recuperarPasswordControllers')
const {insertarInfo} = require('../controllers/insertarInfoDispositivoControllers')
const {getAllareas , deletetArea , insertarArea} = require('../controllers/areasControllers');
const {getAllActividades} = require('../controllers/actividadesControllers');


// endpoint de usuarios
router.post('/crear-usuarios', crearUsuarios);
router.put('/editar-usuarios', verifyToken, editUser);
router.get('/get-all-users', verifyToken, getAllUsers);
router.get('/get-nombre-usuario', getUserName);
router.delete('/delete-usuario', verifyToken, deletetUser);
router.put('/editar-usuarios-id', verifyToken, editUserID); // reisar endpoint al parecer no esta siendo utiñlizado

// endpoint login
router.post('/login', login);
router.post('/valida-clave-actual', validaClaveActual);
router.post('/recuperar-password', recuperarPassword);
router.put('/replace-password-id', replacePassword);

// endpoint Menu
router.get('/get-all-menu', verifyToken, getAllMenu);

// endpoint ubicaciones
router.get('/obtener-ubicacion/:item', obtenerUbicacionItem);
router.put('/actualiza-ubicacion/', actualizaUbicacion);

// guarda info dispositivo
router.post('/insertar-info-dispositivo', insertarInfo);

// Endpoint para mantenedor de Areas 
router.get('/get-all-areas', getAllareas);
router.delete('/delete-area', deletetArea);
router.post('/insertar-nueva-area', insertarArea);

// Endpoint para mantenedor de Actividades
router.get('/get-all-actividades' , getAllActividades)



module.exports = router;
