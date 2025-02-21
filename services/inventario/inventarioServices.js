
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


async function iniciarInventario(data) {
    const { periodo, mes, accion } = data;
    const empresa = 'Makita';

    try {
        logger.info(`Iniciamos la función iniciarInventario services`);
        
        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();

        request.input('empresa', sql.VarChar(50), empresa);
        request.input('periodo', sql.Int, periodo);
        request.input('mes', sql.Int, mes);
        request.input('accion', sql.VarChar(255), accion);

        // Definir los parámetros de salida correctamente
        request.output('mensaje', sql.VarChar(100));
        request.output('codigo', sql.Int);

        logger.info(`Ejecutamos el procedimiento almacenado sp_GestionarBitacoraInventario`);

        // Ejecutar el procedimiento almacenado
        const result = await request.execute('sp_GestionarBitacoraInventario');

        // Leer los valores de salida
        const mensaje = result.output.mensaje ?? 'Mensaje no recibido';
        const codigo = result.output.codigo ?? -1;

        logger.info(`Respuesta del SP -> Mensaje: ${mensaje}, Código: ${codigo}`);

        return { status: 200, data: { mensaje, codigo } };
    } catch (error) {
        console.error("Error:", error);
        return { status: 500, error: 'Error en el servidor al iniciar inventario' };
    } finally {
        await closeDatabaseConnection();
    }
}


module.exports = {
    consultarInv,
    iniciarInventario
};
