const sql = require('mssql');
const logger = require('../../config/logger');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database');


async function updateEnProcesoCaptura(req, res) {
    logger.info(`Iniciamos funcion updateEnProcesoCaptura`);
    try {
        
        console.log(req.body);
        const { correlativo , item , linea } = req.body;
      
        // Verificar si algún campo está vacío, es null o undefined
        if (!correlativo || !linea || !item) {
            logger.error(`Error faltan parametros de entrada a la solicitud`);
            return res.status(400).json({ error: `Todos los campos son requeridos.` });
        }
        await connectToDatabase('BodegaMantenedor');
        transaction = new sql.Transaction();
        await transaction.begin();
    
        const request = new sql.Request(transaction); // Pasar la transacción al request
    
        // Ejecutar el procedimiento almacenado con los parámetros
        const result = await request
          .input('correlativo', sql.Int, correlativo)
          .input('linea', sql.VarChar(50), linea)
          .input('item', sql.VarChar(50), item)
          .execute('Update_Captura_Proceso_SP');
    
        logger.info(`Fin de la función updateEnProcesoCaptura ${JSON.stringify(result)}`);
        
        await transaction.commit();
        res.status(200).json(result);
    } catch (error) {
        // Manejar errores
        logger.error(`Error al obtener la updateEnProcesoCaptura:, ${error.message}`);
        res.status(500).json({ error: "Error interno del servidor" });
    }finally{
        await closeDatabaseConnection();
    }
}


async function insertarCapturas(req, res) {
    let data = req.body.data;
    logger.info(`Iniciamos la funcion insertarCapturas ${JSON.stringify(data)}`);
    let result;
    let responseData = [];

    try {
        // Conectarse a la base de datos 'telecontrol'
        await connectToDatabase("BodegaMantenedor");

        // Armamos data que vamos a mandar al procedimiento almacenado
        for (const captura of data) {
            const request = new sql.Request(); // Nueva instancia de request en cada iteración

            const {
                cantidad,
                cantidadPedida,
                correlativo, 
                descripcion, 
                empresa,
                fechaHoraActual, 
                item, 
                linea, 
                serieActual, 
                tipoDocumento,
                tipoItem, 
                ubicacion,
                unidad, 
                usuario 
            } = captura;

            // Ejecutar el procedimiento almacenado con los parámetros correspondientes
            result = await request
                .input("Empresa", sql.VarChar(50), empresa)
                .input("TipoDocumento", sql.VarChar(50), tipoDocumento)
                .input("Correlativo", sql.Int, parseInt(correlativo))
                .input("Linea", sql.VarChar(50), linea)
                .input("TipoItem", sql.VarChar(50), tipoItem)
                .input("Item", sql.VarChar(50), item)
                .input("Descripcion", sql.VarChar(255), descripcion)
                .input("Unidad", sql.VarChar(50), unidad)
                .input("Cantidad", sql.Int, parseInt(cantidad))
                .input("CantidadPedida", sql.Int, parseInt(cantidadPedida))
                .input("SerieActual", sql.VarChar(50), serieActual)
                .input("Ubicacion", sql.VarChar(50), ubicacion)
                .input("Proceso", sql.VarChar(50), "Procesada")
                .input("Usuario", sql.VarChar(50), usuario)
                .input("FechaHoraActual", sql.DateTime, new Date(fechaHoraActual)) // Convertir la fecha a formato adecuado
                .execute("InsertCaptura");

            responseData.push(result);
        }

        await closeDatabaseConnection();
        logger.info(`Fin de la funcion InsertCaptura ${JSON.stringify(responseData)}`);
        res.status(200).json(responseData);
    } catch (error) {
        // Manejamos cualquier error ocurrido durante el proceso
        logger.error(`Error en insertarCapturas: ${error.message}`);
        res.status(500).json({
            error: `Error en el servidor [insertar-capturas-ms]: ${error.message}`,
        });
    }
}


async function updateSolicitadoCaptura(req, res) {
    logger.info(`Iniciamos funcion updateSolicitadoCaptura`);
    try {
        
        console.log(req.body);
        const { correlativo } = req.body;
      
        // Verificar si algún campo está vacío, es null o undefined
        if (!correlativo) {
            logger.error(`Error faltan parametros de entrada a la solicitud`);
            return res.status(400).json({ error: `Todos los campos son requeridos.` });
        }
        await connectToDatabase('BodegaMantenedor');
        transaction = new sql.Transaction();
        await transaction.begin();
    
        const request = new sql.Request(transaction); // Pasar la transacción al request
    
        // Ejecutar el procedimiento almacenado con los parámetros
        const result = await request
          .input('correlativo', sql.Int, correlativo)
          .execute('Update_Captura_Solicitado_SP');
    
        logger.info(`Fin de la función updateSolicitadoCaptura ${JSON.stringify(result)}`);
        
        await transaction.commit();
        res.status(200).json(result);
    } catch (error) {
        // Manejar errores
        logger.error(`Error al obtener la updateSolicitadoCaptura:, ${error.message}`);
        res.status(500).json({ error: "Error interno del servidor" });
    }finally{
        await closeDatabaseConnection();
    }
}




module.exports = {
    updateEnProcesoCaptura,
    insertarCapturas,
    updateSolicitadoCaptura
};