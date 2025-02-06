const sql = require('mssql');
const logger = require('../../config/logger');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database');
const bwipjs = require('bwip-js');


async function obtenerListaKit(req, res) {
    
    logger.info(`Iniciamos funcion obtenerListaKit  - ${JSON.stringify(req.params.item)}`);
    try {
        // Obtener el ID de la URL
       
        const { item} = req.params
        // Conectar a la base de datos
        await connectToDatabase("BdQMakita");    
        // Crear un nuevo objeto de solicitud para la consulta
        const request = new sql.Request();

        // Ejecutar la consulta con el parámetro 'item'
        request.input('item', sql.NVarChar, `%${item}%`);
        
        
        // Consulta SQL para insertar datos
        const query = `SELECT tipoitem  , item , Clasif7 , Clasif9 from Item where Empresa  = 'Makita'  and clasif7  = '${item}'`;

        
        console.log("query: ", query); 

        // Ejecutar la consulta
        const result = await request.query(query);

        console.log("result: ", result.recordset);  

        const filteredItems = result.recordset.filter(item => item.tipoitem.includes("02-KIT"));
        // Devolver el resultado de la consulta
        res.status(200).json(filteredItems);

        logger.info(`Fin de la funcion obtenerListaKit`);
        
    } catch (error) {
        // Manejar errores
        console.log("Error" , error);
        logger.error(`Error al consultar ite en obtenerListaKit: ${error}`);
        res.status(500).json({ error: "Error interno del servidor" });
    }
    finally{
       await closeDatabaseConnection();
    }
}


async function insertarDataKitDetalle(req, res) {
    let data = req.body;
    logger.info(`Iniciamos la funcion insertarDataKitDetalle ${JSON.stringify(data)}`);

    try {
        let itemsProcesados = []; // Arreglo para almacenar los datos procesados

        await connectToDatabase('BodegaMantenedor');

        for (const codigo of data.listaCodigos) {
            const request = new sql.Request();
            request.input("selectedItem", sql.VarChar(100), data.selectedItem);
            request.input("item", sql.VarChar(100), codigo.item);
            request.input("serieInicio", sql.VarChar(100), codigo.serieInicio);
            request.input("serieHasta", sql.VarChar(100), codigo.serieHasta);
            request.input("letraFabrica", sql.VarChar(10), codigo.letraFabrica);
            request.input("ean", sql.VarChar(100), codigo.ean);

            // Ejecutamos el procedimiento almacenado y obtenemos la respuesta
            const result = await request.execute("InsertDataKit");

            // Determinar el estado del proceso (0 = éxito, 1 = error)
            let proceso = (result.recordset.length > 0 && result.recordset[0].status === "error") ? 1 : 0;

            // Agregar el resultado al array
            itemsProcesados.push({
                item: codigo.item,
                serieInicio: codigo.serieInicio,
                serieHasta: codigo.serieHasta,
                letraFabrica: codigo.letraFabrica,
                ean: codigo.ean,
                proceso: proceso
            });
        }

        const itemEncontrado = data.listaCodigos.find(codigo =>
            data.selectedItem.toLowerCase().includes(codigo.item.toLowerCase())
        );

        logger.info(`Fin de la función insertarDataKitDetalle ${JSON.stringify(itemsProcesados)}`);

        // Crear la respuesta final con la estructura deseada
        const response = {
            ean: itemEncontrado ? itemEncontrado.ean : null,
            serieInicio: itemEncontrado ? itemEncontrado.serieInicio : null,
            itemEncontrado: itemsProcesados
        };

        // Enviar la respuesta con el array de items procesados
        res.status(200).json(response);

    } catch (error) {
        logger.error(`Error en insertarDataKitDetalle: ${error.message}`);
        if (!res.headersSent) { // Solo enviamos si no se ha enviado una respuesta ya
            res.status(500).json({
                error: `Error en el servidor [insertarDataKitDetalle]: ${error.message}`,
            });
        }
    } finally {
        await closeDatabaseConnection();
    }
}




async function insertarItemKitCabecera(req, res) {
    const data = req.body; // Datos enviados en la solicitud
    logger.info(`Iniciamos la función insertarItemKitDetalle ${JSON.stringify(data)}`);

    try {
        // Establece la conexión a la base de datos
        await connectToDatabase('BodegaMantenedor');

        // Llamamos al procedimiento para cada item en la lista
        const request = new sql.Request();
        request.input("ItemKitID", sql.VarChar(100), data.ItemKitID);  // 'GA4530-3'
        request.input("tipoItem", sql.VarChar(100), '02-KIT');  // 'GA4530-3'
        request.input("empresa", sql.VarChar(100), 'Makita');  // 'GA4530-3'
        request.input("ean", sql.VarChar(100), data.ean);  // '0088381096959'

        // Ejecutamos el procedimiento almacenado
        const result = await request.execute("InsertItemKitWithSerie");

        logger.info(`Fin de la función insertarItemKitDetalle ${JSON.stringify(result.recordset)}`);

        let serieInicioKit = result.recordset[0].serieDesde
        
        await actualizarSeriesEnBD(data.ItemKitID, data.series , serieInicioKit);
        
        res.status(200).json(result.recordset[0]);  // Respuesta de éxito con los datos insertados
    } catch (error) {
        logger.error(`Error en insertarItemKitDetalle: ${error.message}`);
        res.status(500).json({
            error: `Error en el servidor [insertarItemKitDetalle]: ${error.message}`,
        });
    }finally{
        await closeDatabaseConnection();
    }
}

async function eliminarDataKitDetalle(req, res) {
    console.log('req.body.selectedItem*****', req.body.selectedItem);
    let transaction;
    try {
        const selectedItem = req.body.selectedItem;

        // Validar que el selectedItem esté presente
        if (!selectedItem) {
            return res.status(400).json({ error: "selectedItem es requerido." });
        }

        await connectToDatabase('BodegaMantenedor');

        // Crear una nueva transacción
        transaction = new sql.Transaction();
        await transaction.begin();
        const request = new sql.Request(transaction); // Usa la transacción en la solicitud

        // Usar parámetros en lugar de concatenar directamente en la consulta SQL
        request.input('selectedItem', sql.VarChar, selectedItem);

        // Ejecutar la consulta de eliminación dentro de la transacción
        const kitDetalleResponse = await request.query(`
            DELETE FROM BodegaMantenedor.dbo.ItemKitDetalle
            WHERE ItemKitId = @selectedItem
        `);

        // Si la eliminación afectó filas, confirmamos la transacción
        if (kitDetalleResponse.rowsAffected[0] > 0) {
            await transaction.commit(); // Confirma la transacción si todo va bien
            console.log(`Kit detalle ${selectedItem} eliminada correctamente`);
            return res.status(200).json({ message: `Kit detalle ${selectedItem} eliminada correctamente` });
        } else {
            await transaction.rollback(); // Revertir cambios si no se encontró nada
            return res.status(404).json({ message: `No se encontró el kit con el ID ${selectedItem}` });
        }
        
    } catch (error) {
        console.error(error, 'Error al eliminar kit detalle');
        if (transaction) await transaction.rollback(); // Revertir cambios en caso de error
        return res.status(500).json({ error: 'Error en el servidor al eliminar kit detalle' });
    } finally {
        await closeDatabaseConnection();
    }
}


async function eliminarItemKitCabecera(req, res) {
    const data = req.body; // Datos enviados en la solicitud
    logger.info(`Iniciamos la función eliminarItemKitCabecera ${JSON.stringify(data)}`);

    try {
        // Conectar a la base de datos
        await connectToDatabase('BodegaMantenedor');

        const request = new sql.Request();
        request.input("ItemKitID", sql.VarChar(100), data.ItemKitID);  // 'GA4530-3'
        request.input("tipoItem", sql.VarChar(100), '02-KIT');  // '02-KIT'
        request.input("empresa", sql.VarChar(100), 'Makita');  // 'Makita'
        request.input("ean", sql.VarChar(100), data.ean);  // '0088381096959'

        // Ejecutar la consulta DELETE directamente en la tabla ItemKit
        const result = await request.query(`
            DELETE FROM ItemKit
            WHERE ItemKitID = @ItemKitID
            AND tipoItem = @tipoItem
            AND empresa = @empresa
            AND ean = @ean
        `);

        // Verificar si se eliminaron filas
        if (result.rowsAffected[0] > 0) {
            logger.info(`Cabecera del kit con ID ${data.ItemKitID} eliminada correctamente`);
            res.status(200).json({ message: `Cabecera del kit con ID ${data.ItemKitID} eliminada correctamente` });
        } else {
            logger.warn(`No se encontró la cabecera del kit con ID ${data.ItemKitID}`);
            res.status(404).json({ message: `No se encontró la cabecera del kit con ID ${data.ItemKitID}` });
        }
        
    } catch (error) {
        logger.error(`Error en eliminarItemKitCabecera: ${error.message}`);
        res.status(500).json({
            error: `Error en el servidor [eliminarItemKitCabecera]: ${error.message}`,
        });
    } finally {
        await closeDatabaseConnection();
    }
}

async function actualizarSeriesEnBD(ItemKitID, series , serieInicioKit) {
    try {
        for (const serie of series) {
            await connectToDatabase('BodegaMantenedor');
            // Construir la consulta utilizando el item como filtro
            const update = `update BodegaMantenedor.dbo.ItemKitDetalle set serieKitAsociada  = '${serieInicioKit}' where serieDesde = '${serie}' `;
            logger.info(`UPDATE  ejecutar : ${update}`);
        
            const result = await sql.query(update);
            logger.info(`Resultado de UPDATE ${JSON.stringify(result)}`);
        }
    } catch (error) {
        logger.error(`Error al actualizar series: ${error.message}`);
    }
}

module.exports = {
    obtenerListaKit,
    insertarDataKitDetalle,
    insertarItemKitCabecera,
    eliminarDataKitDetalle,
    eliminarItemKitCabecera
};
