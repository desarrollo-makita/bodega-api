const sql = require('mssql');
const logger = require('../config/logger');
const { connectToDatabase, closeDatabaseConnection } = require('../config/database');

async function insertarRegistroUbicacion(req, res) {
    
    logger.info(`Iniciamos funcion insertarRegistroUbicacion  - ${JSON.stringify(req.body)}`);
    try {
        // Obtener el ID de la URL
       
        const { usuario , item,fechaCambio,tipoItem,ubicacionAntigua,nuevaUbicacion, operacion} = req.body
        
        // Conectar a la base de datos
        await connectToDatabase("BodegaMantenedor");    
        // Crear un nuevo objeto de solicitud para la consulta
        const request = new sql.Request();
        
        // Establecer los parámetros para el SP
        request.input('Usuario', sql.VarChar(50), usuario);
        request.input('Item', sql.VarChar(50), item);
        request.input('FechaCambio', sql.VarChar(50), fechaCambio); // Enviamos como VARCHAR
        request.input('TipoItem', sql.VarChar(50), tipoItem);
        request.input('UbicacionAntigua', sql.VarChar(100), ubicacionAntigua);
        request.input('NuevaUbicacion', sql.VarChar(100), nuevaUbicacion);
        request.input('Operacion', sql.VarChar(100), operacion);

        // Ejecutar el procedimiento almacenado
        const result = await request.execute('Insertar_CambioUbicacion_SP');

        console.log("result :_",result);
        // Responder con el resultado en formato JSON
        res.json({ message: 'Información del Registro de ubicaciones guardada exitosamente.' });
        
        logger.info(`Fin de la funcion insertarInfo`);
        
    } catch (error) {
        // Manejar errores
        console.log("Errrorr" , error);
        logger.error(`Error al insertar registro de ubicaciones: ${error}`);
        res.status(500).json({ error: "Error interno del servidor" });
    }
    finally{
        await closeDatabaseConnection();
    }
}

async function obtenerUbicacionFecha(req, res) {
    
    logger.info(`Iniciamos funcion obtenerUbicacionFecha  - ${JSON.stringify(req.params)}`);
    try {
        // Obtener el ID de la URL
        const { fecha } = req.params;
        
        // Conectar a la base de datos
        await connectToDatabase("BodegaMantenedor");
        // Crear un nuevo objeto de solicitud para la consulta
        const request = new sql.Request();  
        // Buscar el usuario por NombreUsuario
        
        const getRegitroUbicaciones = await request.query(`
          SELECT *
          FROM CambioUbicaciones 
          WHERE CONVERT(DATE, FechaCambio) = '${fecha}'`);
        

          logger.info(`Fin de la funcion obtenerUbicacionFecha`);
          if(getRegitroUbicaciones.recordset.length > 0 ){
            res.json({ message: 'Información del Registro de ubicaciones consultada exitosamente.' , data: getRegitroUbicaciones.recordset });
          }else{
            res.json({ message: 'No se resgitra informacion para esa fecha.'});
          }
        } catch (error) {
        // Manejar errores
        logger.error(`Error al consultar registro de ubicaciones: ${error.message}`);
        res.status(500).json({ error: "Error interno del servidor" });
    }
    finally{
        await closeDatabaseConnection();
    }
}



module.exports = {
    insertarRegistroUbicacion,
    obtenerUbicacionFecha
};
