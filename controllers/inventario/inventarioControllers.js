const logger = require('../../config/logger.js');
const {connectToDatabase,closeDatabaseConnection,
} = require('../../config/database.js');
const sql = require('mssql');
require('dotenv').config();


const inventarioService = require('../../services/inventario/inventarioServices.js')

const asignarCapturadorService = require('../../services/inventario/asignarCapturadorServices.js')

/**
 * Retorna Consulta de inventario
 * @param {*} req
 * @param {*} res
 */
async function consultarInventario(req, res) {
    try {
        console.log("parametros de entrada : " , req.query)

        const data  = req.query
        
        logger.info(`Iniciamos la función consultarInventario - Controllers ${JSON.stringify(data)}`);
      
        const inventarioList = await inventarioService.consultarInv(data);
  
        res.status(200).json(inventarioList);
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error en el servidor' });
    } finally {
      await closeDatabaseConnection();
    }
  }

  /**
 * Asigna un capturador a un usuario
 * @param {*} req
 * @param {*} res
 */
async function asignarCapturador(req, res) {
  try {
      console.log("Parámetros de entrada:", req.body);

      const data = req.body;

      logger.info(`Iniciamos la función asignarCapturador - Controllers ${JSON.stringify(data)}`);

      const result = await asignarCapturadorService.asignarCapturador(data);

      res.status(result.status).json(result);
  } catch (error) {
      console.error("Error en asignarCapturador:", error);
      res.status(500).json({ error: 'Error en el servidor al asignar capturador' });
  } finally {
      await closeDatabaseConnection();
  }
}
  

module.exports = {
    consultarInventario,asignarCapturador
  };