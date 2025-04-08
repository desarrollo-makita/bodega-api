const logger = require('../../config/logger.js');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');
const sql = require('mssql');
require('dotenv').config();
const moment = require('moment');

const asignarReconteosService = require('../../services/inventario/asignarReconteosServices.js')
  /**
 * Asignar reconteos a los usuarios * @param {*} req
 * @param {*} res
 */
async function asignarReconteos(req, res) {
  try {
      console.log("Parámetros de entrada:", req.body);

      const data = req.body;

      logger.info(`Iniciamos la función asignarReconteos - Controllers ${JSON.stringify(data)}`);

      const result = await asignarReconteosService.asignarReconteos(data);

      res.status(result.status).json(result);
  } catch (error) {
      console.error("Error en asignarReconteos:", error);
      res.status(500).json({ error: 'Error en el servidor al asignar capturador' });
  } finally {
      await closeDatabaseConnection();
  }
}





module.exports = {
  asignarReconteos
};