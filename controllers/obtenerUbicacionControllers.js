const sql = require('mssql');
const logger = require('../config/logger');
const { connectToDatabase, closeDatabaseConnection } = require('../config/database');

async function obtenerUbicacionItem(req, res) {
    
    logger.info(`Iniciamos funcion obtenerUbicacionItem  - ${JSON.stringify(req.params)}`);
    try {
        // Obtener el ID de la URL
        const { item } = req.params;

        await connectToDatabase('DTEBdQMakita');
        // Construir la consulta utilizando el item como filtro
        const consulta = `SELECT texto2 AS Ubicacion, descripcion, item, tipoItem 
            FROM Item 
            WHERE Item = '${item}' 
            AND vigencia = 'S' 
            AND tipoItem != '50-ITEMSU';`;
        logger.info(`Query que ejecuta:   - ${consulta}`);
        
        const result = await sql.query(consulta);
        logger.info(`Resultado de la consulta:   - ${JSON.stringify(result)}`);

        // Verificar si se encontraron resultados
        if (result.recordset.length > 0) {
            // Responder con el resultado en formato JSON
            res.json(result.recordset);
        } else {
            // Si no se encontraron resultados, responder con un mensaje
            res.status(404).json({ error: "No se encontraron datos para el item scaneado" });
        }
        logger.info(`Fin de la funcion obtenerUbicacionItem`);

        
    } catch (error) {
        // Manejar errores
        logger.error(`Error al obtener la ubicación del item: ${error.message}`);
        res.status(500).json({ error: "Error interno del servidor" });
    }
    finally{
        await closeDatabaseConnection();
    }
}

async function actualizaUbicacion(req, res) {
    logger.info(`Iniciamos funcion actualizaUbicacion`);
    try {
        
        const { nuevaUbicacion , empresa , item, tipoItem } = req.body;

         // Verificar si algún campo está vacío, es null o undefined
        if (!nuevaUbicacion || !empresa || !item || !tipoItem) {
            logger.error(`Error faltan parametros de entrada a la solicitud`);
            return res.status(400).json({ error: `Todos los campos son requeridos.` });
        }
        await connectToDatabase('DTEBdQMakita');
        
        // Construir la consulta utilizando el item como filtro
        const consulta = `update item set Texto2 = '${nuevaUbicacion}' where Empresa ='${empresa}' and item = '${item}' and TipoItem = '${tipoItem}' `;
        logger.info(`UPDATE a ejecutar : ${consulta}`);
        
        const result = await sql.query(consulta);
        logger.info(`Resultado de UPDATE ${JSON.stringify(result)}`);

        // Verificar si se encontraron resultados
        if (result.rowsAffected[0] > 0) {
            // Responder con el resultado en formato JSON
            res.json({ mensaje: `Se actualizo ubicacion para el item ${item}, su nueva ubicacion es ${nuevaUbicacion}` });
        } else {
            // Si no se encontraron resultados, responder con un mensaje
            res.status(200).json({ mensaje: "No se encontraron datos para el item proporcionado" });
        }
        logger.info(`Fin de la funcion UPDATE actualizaUbicacion`);
    } catch (error) {
        // Manejar errores
        logger.error(`Error al obtener la ubicación del item:, ${error.message}`);
        res.status(500).json({ error: "Error interno del servidor" });
    }finally{
        await closeDatabaseConnection();
    }
}

module.exports = {
    obtenerUbicacionItem, actualizaUbicacion
};
