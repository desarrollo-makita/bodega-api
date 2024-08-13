const express = require('express');
const router = express.Router();
const { generateToken, verifyToken } = require('../auth/auth');
const { crearUsuarios } = require('../controllers/usuariosControllers');
const { getAllUsers} = require('../controllers/usuariosControllers');
const { login } = require('../controllers/login');
const { getAllMenu } = require('../controllers/menu');

router.post('/crear-usuarios', verifyToken ,crearUsuarios);
router.get('/get-all-users', verifyToken ,getAllUsers);
router.post('/login', login);
router.get('/get-all-menu',verifyToken, getAllMenu);

module.exports = router;
