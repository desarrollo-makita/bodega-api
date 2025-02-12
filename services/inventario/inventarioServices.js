
const sql = require('mssql');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');
const logger = require('../../config/logger.js');


async function consultarInv(data) {
    const { periodo, mes, tipoItem, local } = data;  // Desestructuramos los valores del objeto 'data'

    let query;

    try {
        
        logger.info(`Iniciamos la función consultarInv services`);
        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();

        // Usamos los valores desestructurados en la consulta
        query = `SELECT * FROM BodegaMantenedor.dbo.RegistroInventario 
            WHERE empresa = 'Makita' 
            AND ano = @periodo 
            AND mes = @mes 
            AND tipoItem = @tipoItem 
            AND local = @local`;

        // Prevenimos SQL Injection usando parámetros en la consulta
        request.input('periodo', sql.Int, periodo);
        request.input('mes', sql.Int, mes);
        request.input('tipoItem', sql.VarChar, tipoItem);
        request.input('local', sql.VarChar, local);

        logger.info(`Ejecutamos la query de Inventario: ${query}`);

        const inventarioResponse = await request.query(query);

        return { status: 200, data: inventarioResponse };
    } catch (error) {
        console.log("Error:", error);
        return { status: 500, error: 'Error en el servidor al consultar inventario' };
    } finally {
        await closeDatabaseConnection();
    }
}
  

module.exports = {
    consultarInv
};
