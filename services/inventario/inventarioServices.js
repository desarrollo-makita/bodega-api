
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


async function validarInicioInventario(data) {
    const { periodo, mes } = data;
    const empresa = 'Makita';
    await connectToDatabase('BodegaMantenedor');

    try {
        logger.info(`Iniciamos la función iniciarInventario services ${periodo}  - ${mes}`);

        const request = new sql.Request();

        // Parámetros para el query
        request.input('empresa', sql.VarChar(50), empresa);
        request.input('periodo', sql.Int, periodo);
        request.input('mes', sql.Int, mes);

        logger.info(`Ejecutamos el SELECT en la tabla bitacoraInventario`);

        // Ejecutar la consulta
        const result = await request.query(`
            SELECT * 
            FROM bitacoraInventario 
            WHERE empresa = @empresa 
            AND mes = @mes 
            AND agno = @periodo
        `);

        logger.info(`Consulta ejecutada correctamente, registros encontrados: ${result.recordset.length}`);

        return { status: 200, data: result.recordset };
    } catch (error) {
        console.error("Error:", error);
        return { status: 500, error: 'Error en el servidor al obtener inventario' };
    } finally {
        await closeDatabaseConnection();
    }
}


async function registraInicioInventario(data) {
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


async function getGrupoBodega(data) {
    
    let query;

    try {
        
        logger.info(`Iniciamos la función getGrupoBodega services`);
        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();

        // Usamos los valores desestructurados en la consulta
        query = `SELECT DISTINCT NumeroLocal , NombreGrupoBodega, GrupoBodega
                    FROM grupobodega
                    WHERE numerolocal IN ('01', '04', '03', '05');`;


        logger.info(`Ejecutamos la query de getGrupoBodega: ${query}`);

        const grupoBodegaResponse = await request.query(query);

        return { status: 200, data: grupoBodegaResponse.recordset }; 
    } catch (error) {
        console.log("Error:", error);
        return { status: 500, error: 'Error en el servidor grupoBodegaResponse' };
    } finally {
        await closeDatabaseConnection();
    }
}


async function iniciarInventario(data) {
    const { periodo, mes, numeroLocal, grupoBodega, categorias } = data;
    const empresa = 'Makita';

    const mensaje = 'Inventario iniciado correctamente';
    try {
        logger.info(`Iniciamos la función iniciarInventario services`);

        await connectToDatabase('BodegaMantenedor');

        const resultados = [];

        for (const tipoItem of categorias) {
            const request = new sql.Request();

            request.input('Empresa', sql.VarChar(20), empresa);
            request.input('Agno', sql.VarChar(40), periodo);
            request.input('Mes', sql.Int, mes);
            request.input('TipoItem', sql.VarChar(20), tipoItem);
            request.input('Local', sql.VarChar(40), numeroLocal);
            request.input('Grupo', sql.Int, grupoBodega);

            logger.info(`Ejecutamos el procedimiento almacenado sp_RegistroInventario para TipoItem: ${tipoItem}`);
    
            const result = await request.execute('sp_RegistroInventario');
            resultados.push({ tipoItem, mensaje});
        }

        logger.info(`Finalizó la ejecución de sp_RegistroInventario para todas las categorías`);

        return { status: 200, resultados };
    } catch (error) { 
        console.error("Error001:", error);
        await eliminarBitacoraInventario(empresa, periodo, mes, numeroLocal, grupoBodega);
        return { status: 500, error: 'Error en el servidor al iniciar inventario' };
    } finally {
        await closeDatabaseConnection();
    }
}


async function eliminarBitacoraInventario(empresa, periodo, mes, numeroLocal, grupoBodega) {
    try {
        const request = new sql.Request();

        request.input('Empresa', sql.VarChar(20), empresa);
        request.input('Agno', sql.VarChar(40), periodo);
        request.input('Mes', sql.Int, mes);
        request.input('Local', sql.VarChar(40), numeroLocal);
        request.input('Grupo', sql.Int, grupoBodega);

        logger.info(`Eliminando registros de bitacoraInventario para TipoItem: ${tipoItem}`);

        const query = `
            DELETE FROM bitacoraInventario 
            WHERE Empresa = @Empresa 
            AND Agno = @Agno 
            AND Mes = @Mes 
            AND TipoItem = @TipoItem 
            AND Local = @Local 
            AND Grupo = @Grupo
        `;

        await request.query(query);
        logger.info(`Registros eliminados de bitacoraInventario para TipoItem: ${tipoItem}`);
    } catch (error) {
        logger.error(`Error al eliminar registros de bitacoraInventario para TipoItem: ${tipoItem}: ${error}`);
    }
}



module.exports = {
    consultarInv,
    validarInicioInventario,
    registraInicioInventario,
    getGrupoBodega,
    iniciarInventario
};
