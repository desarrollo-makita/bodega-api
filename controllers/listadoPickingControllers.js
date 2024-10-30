const logger = require('../config/logger.js');
const {connectToDatabase,closeDatabaseConnection,
} = require('../config/database.js');
const sql = require('mssql');
require('dotenv').config();



const pickingService = require('../services/listado-picking-services/listadoPickingService.js')

/**
 * Retorna Lista de Picking
 * @param {*} req
 * @param {*} res
 */
async function getListadoPicking(req, res) {
  try {
    logger.info(`Iniciamos la función getListadoPicking controllers`);
    const responsePickingList = await pickingService.getPickingList();

    if (responsePickingList.status != 200) {
      res.status(404).json({ error: responsePickingList.error });
    } else {
      
      res.status(200).json(responsePickingList);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  } finally {
    await closeDatabaseConnection();
  }
}


/**
 * Retorna Picking segun su numero de folio
 * @param {*} req
 * @param {*} res
 */
async function getPickingFolio(req, res) {
  try {
   
    const { folio } = req.params;
    
    let numeroFolio = folio
    
    logger.info(`Iniciamos la función getPickingFolio controllers con Folio ${numeroFolio}`);
    const responsePickingFolio= await pickingService.getPickingFolio(numeroFolio);

    if (responsePickingFolio.status != 200) {
      res.status(404).json({ error: responsePickingFolio.error });
    } else {
      
      res.status(200).json(responsePickingFolio);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  } finally {
    await closeDatabaseConnection();
  }
}






module.exports = {
  getListadoPicking,
  getPickingFolio
};
