const express = require('express');
const router = express.Router();
const { generateToken, verifyToken } = require('../auth/auth');
const { crearUsuarios } = require('../controllers/crearUsuariosControllers');
const { login } = require('../controllers/login');
const { getAllMenu } = require('../controllers/menu');

router.post('/crear-usuarios', verifyToken , crearUsuarios);
router.post('/login', login);
router.get('/get-all-menu',verifyToken, getAllMenu);

module.exports = router;
