
const sql = require('mssql');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');
const logger = require('../../config/logger.js');


async function asignarCapturador(data) {
    const { usuario, capturador, periodo, mes  , producto} = data; // Desestructuramos los valores del objeto 'data'

    try {
        logger.info(`Iniciamos la función asignarCapturador services`);

        // Conectamos a la base de datos
        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();

        // Definimos la query con parámetros para prevenir SQL Injection
        const query = `
            INSERT INTO BodegaMantenedor.dbo.asignaCapturador 
            (Empresa, Usuario, Capturador, Periodo, Mes, Fecha , TipoProducto) 
            VALUES (@empresa, @usuario, @capturador, @periodo, @mes, GETDATE() , @producto)
        `;

        // Asignamos los valores a los parámetros
        request.input('empresa', sql.VarChar, 'Makita');
        request.input('usuario', sql.VarChar, usuario);
        request.input('capturador', sql.VarChar, capturador);
        request.input('periodo', sql.VarChar, periodo);
        request.input('mes', sql.VarChar, mes);
        request.input('producto', sql.VarChar, producto);

        logger.info(`Ejecutamos la query de asignación: ${query}`);

        // Ejecutamos la consulta
        await request.query(query);

        return { status: 200, message: 'Capturador asignado correctamente' };
    } catch (error) {
        logger.error(`Error al asignar capturador: ${error.message}`);
        console.log("Error:", error);

        // Verificamos si el error es una violación de clave única
        if (error.message.includes('Violation of UNIQUE KEY constraint')) {
            // En caso de duplicado, devolvemos HTTP 409
            return { status: 409, error: 'El capturador ya está asignado.' };
        }

        // Para otros errores, devolvemos HTTP 500
        return { status: 500, error: `Error en el servidor al asignar capturador: ${error.message}` };
    } finally {
        await closeDatabaseConnection();
    }
}


module.exports = {
    asignarCapturador
};
