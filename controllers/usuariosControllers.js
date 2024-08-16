
const logger = require('../config/logger.js');
const { connectToDatabase, closeDatabaseConnection } = require('../config/database.js');
const sql = require('mssql');
require('dotenv').config();



const usuariosServices = require('../services/usuarios-services/usuarioServices.js');

/**
 * Insertamos un nuevo usuario de bodega
 * @returns 
 */
async function crearUsuarios(req, res) {
    try {
        console.log(req.body.data);
        logger.info(`Iniciamos la función crearUsuarios controllers`);
        const createUsers = await usuariosServices.crearUsuarios(req.body.data);
       
        res.status(200).json(createUsers);
    
    } catch (error) {
        // Manejamos cualquier error ocurrido durante el proceso
        logger.error(`Error en crearUsuarios: ${error.message}`);
        res.status(500).json({ error: `Error en el servidor [crear-Usuarios] :  ${error.message}`  });
    }finally{
        await closeDatabaseConnection();
    }
}

/**
 * Retorna todos los usuarios del sistema
 * @param {*} req 
 * @param {*} res 
 */
async function getAllUsers(req, res) {
    try {
        
        const allUsers = await usuariosServices.getAllUser();

        if(allUsers.status === 401){
            res.status(401).json({ error: allUsers.error });
        }else{
            // Usuario autenticado, puedes devolver información del usuario y tokens de sesión
            res.status(200).json(allUsers);
        }
        
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        await closeDatabaseConnection();
    }
}

/**
 * Insertamos un nuevo usuario de bodega
 * @returns 
 */
async function editUser(req, res) {
    try {
        logger.info(`Iniciamos la función editarUsuarios controllers`);
        const updateUsers = await usuariosServices.editUser(req.body);
       
        res.status(200).json(updateUsers);
    
    } catch (error) {
        // Manejamos cualquier error ocurrido durante el proceso
        logger.error(`Error al editar usuarios: ${error.message}`);
        res.status(500).json({ error: `Error en el servidor [editar-Usuarios] :  ${error.message}`  });
    }finally{
        await closeDatabaseConnection();
    }
}

/**
 * Retorna true si el usuario esta registrado y false si el usuario no esta registrado
 * @param {*} req 
 * @param {*} res 
 */
async function getUserName(req, res) {
    try {
        logger.info(`Iniciamos la función getUserName controllers`);
        const username = req.query.username; // Obtener el username del query string
        console.log("username : " , username);

        const existUser = await usuariosServices.getUserName(username);
        
        // Usuario autenticado, puedes devolver información del usuario y tokens de sesión
        res.status(200).json(existUser);

        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        await closeDatabaseConnection();
    } 
}




module.exports = {
    getAllUsers, 
    crearUsuarios,
    editUser,
    getUserName
};
