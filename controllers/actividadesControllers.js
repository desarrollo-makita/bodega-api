const logger = require('../config/logger.js');
const {connectToDatabase,closeDatabaseConnection,
} = require('../config/database.js');
const sql = require('mssql');
require('dotenv').config();



const actividadServices = require('../services/actividades-services/actividadesServices.js')

/**
 * Retorna todos los combobox en forma de lista para pintar los comboBox de la vista
 * @param {*} req
 * @param {*} res
 */
async function getAllActividades(req, res) {
  try {
    logger.info(`Iniciamos la función getAllActividades controllers`);
    const allActivity = await actividadServices.getAllActividades();

    if (allActivity.status != 200) {
      res.status(404).json({ error: allActivity.error });
    } else {
      
      res.status(200).json(allActivity);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  } finally {
    await closeDatabaseConnection();
  }
}

module.exports = {
  getAllActividades
};
