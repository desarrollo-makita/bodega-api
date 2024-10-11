const sql = require('mssql');
const logger = require('../config/logger');
const { connectToDatabase, closeDatabaseConnection } = require('../config/database');

async function insertarInfo(req, res) {
    
    logger.info(`Iniciamos funcion insertarInfo  - ${JSON.stringify(req.body)}`);
    try {
        // Obtener el ID de la URL
        const { dataDispositivo } = req.body;
        const { usuario, modelo, fabricante, sistemaOperativo, numeroSerie, idAndroid } = dataDispositivo;

        // Conectar a la base de datos
        await connectToDatabase("BodegaMantenedor");    
        
        // Crear un nuevo objeto de solicitud para la consulta
        const request = new sql.Request();

        // Definir los parámetros
        request.input('usuario', sql.VarChar, usuario);
        request.input('modelo', sql.VarChar, modelo);
        request.input('fabricante', sql.VarChar, fabricante);
        request.input('sistemaOperativo', sql.VarChar, sistemaOperativo);
        request.input('numeroSerie', sql.VarChar, numeroSerie);
        request.input('idAndroid', sql.VarChar, idAndroid);

        // Consulta SQL para insertar datos
        const query = `
            INSERT INTO BodegaMantenedor.dbo.Dispositivos (nombreUsuario, modelo, fabricante, sistemaOperativo, numeroSerie, idAndroid, fechaInicio)
            VALUES (@usuario, @modelo, @fabricante, @sistemaOperativo, @numeroSerie, @idAndroid, GETDATE());
        `;

        // Ejecutar la consulta
        await request.query(query);

        // Responder con el resultado en formato JSON
        res.json({ message: 'Información del dispositivo guardada exitosamente.' });
        
        logger.info(`Fin de la funcion insertarInfo`);
        
    } catch (error) {
        // Manejar errores
        logger.error(`Error al obtener la ubicación del item: ${error.message}`);
        res.status(500).json({ error: "Error interno del servidor" });
    }
    finally{
        await closeDatabaseConnection();
    }
}


module.exports = {
    insertarInfo,
};
