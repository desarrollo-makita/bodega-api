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
    logger.info(`Iniciamos la funcion insertarDataKit ${JSON.stringify(data)}`);

    try {
        
        let itemEncontrado = null; // Variable para almacenar el objeto encontrado
        let proceso = 0; // Variable para el proceso (0 = éxito, 1 = error)

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

            // Verificamos si hay algún error
            if (result.recordset.length > 0 && result.recordset[0].status === "error") {
                // Si hay un error, cambiamos el proceso a 1
                proceso = 1;
            }

            // Buscar coincidencias parciales con LIKE usando includes()
            if (!itemEncontrado) {
                itemEncontrado = data.listaCodigos.find(codigo => 
                    data.selectedItem.toLowerCase().includes(codigo.item.toLowerCase())
                );
            }
        }

        logger.info(`Fin de la funcion insertarDataKit ${JSON.stringify(itemEncontrado)}`);

        // Enviar la respuesta con el objeto y el proceso (0 si exitoso, 1 si error)
        res.status(200).json({
            itemEncontrado: {
                ...itemEncontrado,
                proceso: proceso // Indicar el estado del proceso
            }
        });
        
    } catch (error) {
        logger.error(`Error en insertarDataKit: ${error.message}`);
        if (!res.headersSent) { // Solo enviamos si no se ha enviado una respuesta ya
            res.status(500).json({
                error: `Error en el servidor [insertarDataKit]: ${error.message}`,
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

        logger.info(`Fin de la función insertarItemKitDetalle ${JSON.stringify(result.recordset[0])}`);
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

module.exports = {
    obtenerListaKit,
    insertarDataKitDetalle,
    insertarItemKitCabecera
};
