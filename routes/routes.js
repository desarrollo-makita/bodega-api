const express = require('express');
const router = express.Router();
const { generateToken, verifyToken } = require('../auth/auth');
const { crearUsuarios , getAllUsers , editUser , getUserName , deletetUser } = require('../controllers/usuariosControllers');
const { login , validaClaveActual } = require('../controllers/login');
const { getAllMenu } = require('../controllers/menu');
const { obtenerUbicacionItem , actualizaUbicacion } = require('../controllers/obtenerUbicacionControllers');


router.post('/crear-usuarios' ,crearUsuarios);
router.put('/editar-usuarios', verifyToken , editUser);
router.get('/get-all-users', verifyToken ,getAllUsers);
router.post('/login', login);
router.get('/get-all-menu',verifyToken, getAllMenu);
router.get('/get-nombre-usuario',  getUserName);
router.delete('/delete-usuario', verifyToken , deletetUser);
router.get('/obtener-ubicacion/:item', obtenerUbicacionItem);
router.put('/actualiza-ubicacion/', actualizaUbicacion);
router.post('/valida-clave-actual', login);


module.exports = router;
