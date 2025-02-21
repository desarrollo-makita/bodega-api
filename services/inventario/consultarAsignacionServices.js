
const sql = require('mssql');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');
const logger = require('../../config/logger.js');


async function consultarAsignaicon() {
    let query;

    try {
        logger.info(`Iniciamos la función consultarAsignaicon services`);
        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();

        // Usamos los valores desestructurados en la consulta
        query = `SELECT Usuario, Capturador FROM BodegaMantenedor.dbo.asignaCapturador`;

        logger.info(`Ejecutamos la query de consultarAsignaicon: ${query}`);

        const result = await request.query(query);

       
        // Transformamos el resultado para que tenga el formato deseado
        const data = result.recordset.map(item => ({
            Usuario: item.Usuario,
            Capturador: item.Capturador
        }));

        return { status: 200, data: data };  // Retornamos el nuevo formato de datos
    } catch (error) {
        console.log("Error:", error);
        return { status: 500, error: 'Error en el servidor al consultar asignación' };
    } finally {
        await closeDatabaseConnection();
    }
}


module.exports = {
    consultarAsignaicon
};
