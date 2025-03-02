const sql = require('mssql');
const logger = require('../../config/logger');
const {connectToDatabase,closeDatabaseConnection} = require('../../config/database.js');

async function obtenerHerramienta(req, res) {
    
    logger.info(`Iniciamos funcion obtenerHerramienta  - ${req.params}`);
    try {
        // Obtener el ID de la URL
        const  item = req.params.Item.trim();

        await connectToDatabase('BdQMakita');
        // Construir la consulta 
        const consulta = ` select distinct b.item, b.descripcion,a.CodigoChile1
                         from HerramientasCargador a
                         ,item b
                       where a.Item = rtrim('${item}') 
                         and a.vigencia ='S'
                         and a.tipoitem = '01-HERRAMIENTAS' 
                         and a.item =  b.item 
                         and a.tipoitem = b.tipoitem;`;

        logger.info(`Query que ejecuta:   - ${consulta}`);

        
        const result = await sql.query(consulta);
        logger.info(`Resultado de la consulta:   - ${JSON.stringify(result)}`);
        console.log("salida",result.recordset)
        // Verificar si se encontraron resultados
        if (result.recordset.length > 0) {
            // Responder con el resultado en formato JSON
            res.json(  result.recordset );
        } else {
            // Si no se encontraron resultados, responder con un mensaje
            res.status(200).json([{Advertencia: "No se encontraron datos"} ] );
        }
        logger.info(`Fin de la funcion obtenerHerramienta`);

        
    } catch (error) {
        // Manejar errores
        logger.error(`Error obtenerHerramienta: ${error.message}`);
        res.status(500).json({ Advertencia: "Error interno del servidor 2" });
    }finally
    {
        await closeDatabaseConnection();
    }
}


module.exports = {
    obtenerHerramienta
};
