const logger = require('../config/logger.js');
const {connectToDatabase,closeDatabaseConnection,
} = require('../config/database.js');
const sql = require('mssql');
require('dotenv').config();



const areasServices = require('../services/areas-services/areasServices.js');

/**
 * Retorna todos los combobox en forma de lista para pintar los comboBox de la vista
 * @param {*} req
 * @param {*} res
 */
async function getAllareas(req, res) {
  try {
    logger.info(`Iniciamos la función getAllareas controllers`);
    const allUsers = await areasServices.getAllareas();

    if (allUsers.status != 200) {
      res.status(404).json({ error: allUsers.error });
    } else {
      
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
 * Controlador para eliminar una area
 * @param {*} req
 * @param {*} res
 */
async function deletetArea(req, res) {
  try {
    logger.info(`Iniciamos la función deletetArea controllers`);
    const deleteArea = await areasServices.deleteArea(req.query);

    res.status(200).json(deleteArea);
  } catch (error) {
    // Manejamos cualquier error ocurrido durante el proceso
    logger.error(`Error al eliminar Area: : ${error.message}`);
    res.status(500).json({
      error: `Error en el servidor [areas-controllers] :  ${error.message}`,
    });
  } finally {
    await closeDatabaseConnection();
  }
}


/**
 * Controlador para insertar una area
 * @param {*} req
 * @param {*} res
 */
async function insertarArea(req, res) {
  try {
    logger.info(`Iniciamos la función insertarArea controllers`);
    const responseArea = await areasServices.insertarArea(req.body);

    res.status(200).json(responseArea);
  } catch (error) {
    // Manejamos cualquier error ocurrido durante el proceso
    logger.error(`Error al insertar Area: : ${error.message}`);
    res.status(500).json({
      error: `Error en el servidor [insertar-area-controllers] :  ${error.message}`,
    });
  } finally {
    await closeDatabaseConnection();
  }
}



module.exports = {
  getAllareas,
  deletetArea,
  insertarArea
};
