
const sql = require('mssql');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');
const logger = require('../../config/logger.js');


async function deleteAsignacion(data) {
    logger.info(
      `Iniciamos la función deleteUser areasServices ${JSON.stringify(data)}`
    );
    let transaction;
    try {
      const capturador = data.capturador;
     
      if (capturador === undefined || capturador === null) {
        console.error('capturador es undefined o null');
      } else {
        console.log('capturador:', capturador);
      }
      await connectToDatabase('BodegaMantenedor');
  
      // Crear una nueva transacción
      transaction = new sql.Transaction();
      await transaction.begin();
      const request = new sql.Request(transaction); // Usa la transacción en la solicitud
  
      // Ejecutar la consulta de actualización dentro de la transacción
      const areaResponse = await request.query(`
              DELETE FROM BodegaMantenedor.dbo.asignaCapturador 
              WHERE Capturador = '${capturador}'
          `);
  
      logger.info(`deleteAsignacion deleteAsignacion :  ${areaResponse}`);
      if (areaResponse.rowsAffected[0] > 0) {
        await transaction.commit(); // Confirma la transacción si todo va bien
        return { status: 200, message: 'deleteAsignacion eliminada correctamente' };
      } else {
        await transaction.rollback(); // Revertir cambios si no se realizó ninguna actualización
        return {
          status: 401,
          error: 'No existen Asignaciones o no se realizaron cambios',
        };
      }
    } catch (error) {
      console.log(error, 'eeror');
      if (transaction) await transaction.rollback(); // Revertir cambios en caso de error
        console.log('error : ', error);
        return { status: 500, error: 'Error en el servidor deleteAsignacion' };
    } finally {
      await closeDatabaseConnection();
    }
  }

module.exports = {
    deleteAsignacion
};
