const logger = require('../../config/logger.js');
const {connectToDatabase,closeDatabaseConnection,
} = require('../../config/database.js');
const sql = require('mssql');
require('dotenv').config();


const inventarioService = require('../../services/inventario/inventarioServices.js')
const asignarCapturadorService = require('../../services/inventario/asignarCapturadorServices.js')
const consultarAsignacionService = require('../../services/inventario/consultarAsignacionServices.js')
const eliminarAsignacionService = require('../../services/inventario/eliminarAsignacionServices.js')

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

/**
 * Retorna Consulta de asignacion
 * @param {*} req
 * @param {*} res
 */
async function consultarAsignacion(req, res) {
  try {
      
      
      logger.info(`Iniciamos la función consultarAsignacion - Controllers`);
    
      const asignacionList = await consultarAsignacionService.consultarAsignaicon();

      res.status(200).json(asignacionList);
    
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
async function deletetAsignacion(req, res) {
  try {
    logger.info(`Iniciamos la función deletetAsignacion controllers`);
    const deleteAsig= await eliminarAsignacionService.deleteAsignacion(req.query);

    res.status(200).json(deleteAsig);
  } catch (error) {
    // Manejamos cualquier error ocurrido durante el proceso
    logger.error(`Error al eliminar la asignacion: : ${error.message}`);
    res.status(500).json({
      error: `Error en el servidor [deleteAsignacion-controllers] :  ${error.message}`,
    });
  } 
}


module.exports = {
    consultarInventario,
    asignarCapturador,
    consultarAsignacion,
    deletetAsignacion
  };