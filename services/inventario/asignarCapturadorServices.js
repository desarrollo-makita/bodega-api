
const sql = require('mssql');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');
const logger = require('../../config/logger.js');

async function asignarCapturador(data) {
    const { usuario, capturador, periodo, mes, producto } = data;

    try {
        logger.info(`Iniciamos la función asignarCapturador services`);

        await connectToDatabase('BodegaMantenedor');
        const request1 = new sql.Request();
        const request2 = new sql.Request();

        // Query para la tabla principal
        const query1 = `
            INSERT INTO BodegaMantenedor.dbo.asignaCapturador 
            (Empresa, Usuario, Capturador, Periodo, Mes, Fecha , TipoProducto) 
            VALUES (@empresa, @usuario, @capturador, @periodo, @mes, GETDATE(), @producto)
        `;

        // Query para la bitácora
        const query2 = `
            INSERT INTO BodegaMantenedor.dbo.BitacoraAsignacionCapturador 
            (Empresa, Usuario, Capturador, Periodo, Mes, Fecha , TipoProducto) 
            VALUES (@empresa, @usuario, @capturador, @periodo, @mes, GETDATE(), @producto)
        `;

        // Asignamos parámetros para ambas
        [request1, request2].forEach(request => {
            request.input('empresa', sql.VarChar, 'Makita');
            request.input('usuario', sql.VarChar, usuario);
            request.input('capturador', sql.VarChar, capturador);
            request.input('periodo', sql.VarChar, periodo);
            request.input('mes', sql.VarChar, mes);
            request.input('producto', sql.VarChar, producto);
        });

        logger.info(`Ejecutando inserts en ambas tablas...`);

        // Ejecutamos ambas inserciones
        await request1.query(query1);
        await request2.query(query2);

        return { status: 200, message: 'Capturador asignado correctamente y registrado en bitácora' };
    } catch (error) {
        logger.error(`Error al asignar capturador: ${error.message}`);
        console.log("Error:", error);

        if (error.message.includes('Violation of UNIQUE KEY constraint')) {
            return { status: 409, error: 'El capturador ya está asignado.' };
        }

        return { status: 500, error: `Error en el servidor al asignar capturador: ${error.message}` };
    } finally {
        await closeDatabaseConnection();
    }
}


module.exports = {
    asignarCapturador
};
