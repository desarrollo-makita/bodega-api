const sql = require('mssql');
const {connectToDatabase,closeDatabaseConnection} = require('../../config/database.js');
const logger = require('../../config/logger.js');
const moment = require('moment');

async function getAllareas() {
  try {
    logger.info(`Iniciamos la función getAllareas services`);
    await connectToDatabase('BodegaMantenedor');
    const request = new sql.Request();

    // Buscar el usuario por NombreUsuario
    const areas = await request.query('SELECT * FROM Areas');

   
    if (areas.recordset.length === 0) {
      return { status: 404, error: 'No existen Areas para mostrar' };
    }

    const areaList = areas.recordset;

    return { status: 200, data: areaList };
  } catch (error) {
      return { status: 500, error: 'Error en el servidor getAllareas' };
  } finally {
      await closeDatabaseConnection();
  }
}

async function deleteArea(data) {
  logger.info(
    `Iniciamos la función deleteUser areasServices ${JSON.stringify(data)}`
  );
  let transaction;
  try {
    const areaId = data.idArea;
    if (areaId === undefined || areaId === null) {
      console.error('UsuarioID es undefined o null');
    } else {
      console.log('UsuarioID:', areaId);
    }
    await connectToDatabase('BodegaMantenedor');

    // Crear una nueva transacción
    transaction = new sql.Transaction();
    await transaction.begin();
    const request = new sql.Request(transaction); // Usa la transacción en la solicitud

    // Ejecutar la consulta de actualización dentro de la transacción
    const areaResponse = await request.query(`
            DELETE FROM Areas 
            WHERE Id = ${areaId}
        `);

    logger.info(`areaResponse areasServices :  ${areaResponse}`);
    if (areaResponse.rowsAffected[0] > 0) {
      await transaction.commit(); // Confirma la transacción si todo va bien
      return { status: 200, message: 'Area eliminada correctamente' };
    } else {
      await transaction.rollback(); // Revertir cambios si no se realizó ninguna actualización
      return {
        status: 401,
        error: 'No existen Areas o no se realizaron cambios',
      };
    }
  } catch (error) {
    console.log(error, 'eeror');
    if (transaction) await transaction.rollback(); // Revertir cambios en caso de error
      console.log('error : ', error);
      return { status: 500, error: 'Error en el servidor deleteUser' };
  } finally {
    await closeDatabaseConnection();
  }
}


async function insertarArea(req, res) {
    
  logger.info(`Iniciamos funcion insertarArea Service  - ${JSON.stringify(req.dataArea)}`);
  try {
      console.log("req : " ,req);
      const { dataArea } = req;
      const { nombre } = dataArea;


      console.log(dataArea.nombre);

      // Conectar a la base de datos
      await connectToDatabase("BodegaMantenedor");    
      
      // Crear un nuevo objeto de solicitud para la consulta
      const request = new sql.Request();

      // Definir los parámetros
      request.input('Nombre', sql.VarChar, nombre);
      
      // Consulta SQL para insertar datos
      const query = `
          INSERT INTO BodegaMantenedor.dbo.Areas (nombre)
          VALUES (@nombre);
      `;

      console.log("query : " ,query);

      // Ejecutar la consulta
      await request.query(query);

      // Responder con el resultado en formato JSON
      return ({ message: 'Información del area guardada exitosamente.' });
      
      logger.info(`Fin de la funcion insertarArea`);
      
  } catch (error) {
      // Manejar errores
      logger.error(`Error al guardar Area ${error.message}`);
      res.status(500).json({ error: "Error interno del servidor" });
  }
  finally{
      await closeDatabaseConnection();
  }
}

module.exports = {
  getAllareas,
  deleteArea,
  insertarArea
  };
