const sql = require('mssql');
const {connectToDatabase,closeDatabaseConnection} = require('../../config/database.js');
const logger = require('../../config/logger.js');

async function getAllActividades() {
  try {
    logger.info(`Iniciamos la función getAllActividades services`);
    await connectToDatabase('BodegaMantenedor');
    const request = new sql.Request();

    // Buscar el la acividad por NombreActividad
    const actividades = await request.query('SELECT nombreActividad as nombreActividad, codigoActividad as codigoActividad FROM Actividades');
    
    if (actividades.recordset.length === 0) {
      return { status: 404, error: 'No existen Actividades para mostrar' };
    }

    const areaList = actividades.recordset;

    return { status: 200, data: areaList };
  } catch (error) {
      return { status: 500, error: 'Error en el servidor getAllActividades' };
  } finally {
      await closeDatabaseConnection();
  }
}

module.exports = {
  getAllActividades
  };
