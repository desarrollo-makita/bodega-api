const express = require('express');
const router = express.Router();
const { generateToken, verifyToken } = require('../auth/auth');
const { crearUsuarios , getAllUsers , editUser , getUserName } = require('../controllers/usuariosControllers');
const { login } = require('../controllers/login');
const { getAllMenu } = require('../controllers/menu');

router.post('/crear-usuarios' ,crearUsuarios);
router.put('/editar-usuarios', verifyToken , editUser);
router.get('/get-all-users', verifyToken ,getAllUsers);
router.post('/login', login);
router.get('/get-all-menu',verifyToken, getAllMenu);
router.get('/get-nombre-usuario',  getUserName);


module.exports = router;
