const sql = require('mssql');
const logger = require('../../config/logger');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database');
const bwipjs = require('bwip-js');

async function generarPdf417(req, res) {
    
    logger.info(`Iniciamos funcion generarPdf417  - ${JSON.stringify(req.body)}`);
    try {
        // Obtener el ID de la URL
       
        const { productoZeta} = req.body

        let item = productoZeta.substring(0, 20).trim();
        let serieInicio = productoZeta.substring(20 ,29);
        let serieFinal = productoZeta.substring(29 ,38);
        let letraFabrica = productoZeta.substring(38,39);
        let ean  = productoZeta.substring(39).trim();
        
        // Conectar a la base de datos
        await connectToDatabase("BodegaMantenedor");    
        // Crear un nuevo objeto de solicitud para la consulta
        const request = new sql.Request();
        // Definir los parámetros
        request.input('item', sql.VarChar, item);
        request.input('serieInicio', sql.VarChar, serieInicio);
        request.input('serieFinal', sql.VarChar, serieFinal);
        request.input('letraFabrica', sql.VarChar, letraFabrica);
        request.input('ean', sql.VarChar, ean);
        request.input('empresa', sql.VarChar, 'Makita');

        // Consulta SQL para insertar datos
        const query = `
            INSERT INTO BodegaMantenedor.dbo.Pdf417 (item, serieInicio, serieFinal, letraFabrica, ean, empresa)
            VALUES (@item, @serieInicio, @serieFinal, @letraFabrica, @ean , @empresa);
        `;

        // Ejecutar la consulta
        const result = await request.query(query);

        // Generar el código PDF417 usando bwip-js
        bwipjs.toBuffer({
            bcid: 'pdf417',        // Tipo de código de barras
            text: productoZeta,    // El texto a codificar
            scale: 3,              // Escala (tamaño de las barras)
            height: 10,            // Altura de las barras
            includetext: true,     // Incluir texto legible
            textxalign: 'center',  // Alinear el texto al centro
        }, function (err, png) {
            if (err) {
                logger.error(`Error generando PDF417: ${err}`);
                res.status(500).json({ error: "Error al generar el código PDF417" });
                return;
            }

            // Convertir PDF417 a ZPL (esto dependerá de cómo quieras enviar el ZPL)
            const zplCode = `
                ^XA
                ^FO100,100
                ^B7N,100,Y,N
                ^FD${png.toString('base64')}^FS
                ^XZ
            `;

            // Responder con el ZPL
            res.json({ 
                message: 'Datos insertados exitosamente en la tabla Pdf417.',
                zpl: zplCode // Aquí retornamos el ZPL
            });
        });

        logger.info(`Fin de la funcion generarPdf417`);
        
    } catch (error) {
        // Manejar errores
        console.log("Errrorr" , error);
        logger.error(`Error al insertar item Z: ${error}`);
        res.status(500).json({ error: "Error interno del servidor" });
    }
    finally{
       await closeDatabaseConnection();
    }
}


async function consultarCargador(req, res) {
    
    logger.info(`Iniciamos funcion consultarCargador  - ${JSON.stringify(req.params.item)}`);
    try {
        // Obtener el ID de la URL
       
        const { item} = req.params
        // Conectar a la base de datos
        await connectToDatabase("BdQMakita");    
        // Crear un nuevo objeto de solicitud para la consulta
        const request = new sql.Request();
        
        // Consulta SQL para insertar datos
        const query = `SELECT * FROM HerramientasCargador WHERE ItemPadre LIKE @item`;

        // Ejecutar la consulta con el parámetro 'item'
        request.input('item', sql.NVarChar, `%${item}%`);
        
        console.log("query: ", query); 

        // Ejecutar la consulta
        const result = await request.query(query);

        // Devolver el resultado de la consulta
        res.status(200).json(result.recordset);

        logger.info(`Fin de la funcion consultarCargador`);
        
    } catch (error) {
        // Manejar errores
        console.log("Error" , error);
        logger.error(`Error al consultar ite en HerramientasCargador: ${error}`);
        res.status(500).json({ error: "Error interno del servidor" });
    }
    finally{
       await closeDatabaseConnection();
    }
}


async function consultarEquivalenciaItem(req, res) {
    
    logger.info(`Iniciamos funcion consultarEquivalenciaItem  - ${JSON.stringify(req.params.item)}`);
    try {
        // Obtener el ID de la URL
       
        const { item} = req.params
        // Conectar a la base de datos
        await connectToDatabase("BodegaMantenedor");    
        // Crear un nuevo objeto de solicitud para la consulta
        const request = new sql.Request();

        // Ejecutar la consulta con el parámetro 'item'
        request.input('item', sql.NVarChar, `%${item}%`);
        
        
        // Consulta SQL para insertar datos
        const query = `SELECT * FROM BodegaMantenedor.dbo.EquisZ WHERE item  = '${item}'`;

        
        console.log("query: ", query); 

        // Ejecutar la consulta
        const result = await request.query(query);

        console.log("result: ", result.recordset);  
        // Devolver el resultado de la consulta
        res.status(200).json(result.recordset);

        logger.info(`Fin de la funcion consultarCargador`);
        
    } catch (error) {
        // Manejar errores
        console.log("Error" , error);
        logger.error(`Error al consultar ite en HerramientasCargador: ${error}`);
        res.status(500).json({ error: "Error interno del servidor" });
    }
    finally{
       await closeDatabaseConnection();
    }
}

async function insertaDataBitacoraEquisZ(req, res) {
    
    logger.info(`Iniciamos funcion insertaDataBitacoraEquisZ  - ${JSON.stringify(req.body)}`);
    try {
        // Obtener el ID de la URL
       
        const { itemAnterior , serieDesde , serieHasta , letraFabrica , ean , itemNuevo , cargador , bateria} = req.body
       
        // Conectar a la base de datos
        await connectToDatabase("BodegaMantenedor");    
        // Crear un nuevo objeto de solicitud para la consulta
        const request = new sql.Request();
        // Definir los parámetros
        request.input('itemEquivalente', sql.VarChar, itemNuevo);
        request.input('itemAnterior', sql.VarChar, itemAnterior);
        request.input('serieDesde', sql.VarChar, serieDesde);
        request.input('serieHasta', sql.VarChar, serieHasta);
        request.input('ean', sql.VarChar, ean);
        request.input('cargador', sql.VarChar, cargador);
        request.input('bateria', sql.VarChar, cargador);

        // Consulta SQL para insertar datos
        const query = `
            INSERT INTO BodegaMantenedor.dbo.BitacoraEquisZ (itemEquivalente, itemAnterior, serieDesde, serieHasta, ean, cargador, bateria)
            VALUES (@itemEquivalente, @itemAnterior, @serieDesde, @serieHasta, @ean , @cargador , @bateria);
        `;

        // Ejecutar la consulta
        const result = await request.query(query);

        res.json({ message: 'Datos insertados exitosamente en la tabla BitacoraEquisZ.'});

        logger.info(`Fin de la funcion insertaDataBitacoraEquisZ`);
        
    } catch (error) {
        // Manejar errores
        console.log("Errrorr" , error);
        logger.error(`Error al insertar item Z: ${error}`);
        res.status(500).json({ error: "Error interno del servidor" });
    }
    finally{
       await closeDatabaseConnection();
    }
}




module.exports = {
    generarPdf417,
    consultarCargador,
    consultarEquivalenciaItem,
    insertaDataBitacoraEquisZ
};
