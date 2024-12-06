const sql = require('mssql');
const logger = require('../../config/logger');
const {connectToDatabase,closeDatabaseConnection} = require('../../config/database.js');

async function obtenerStock(req, res) {
    
    logger.info(`Iniciamos funcion obtenerStock  - ${req.params}`);
    try {
        // Obtener el ID de la URL
        const  item = req.params.item.trim();
        await connectToDatabase('BdQMakita');
        // Construir la consulta 
        const consulta = ` SELECT 
                            item.TipoItem, 
                            Item.Descripcion, 
                            DocumentoDet.Bodega, 
                            Sum(
                                documentodet.cantidad*documentodet.factorinventario) 
                                as StockFinal, '*' as Ver, '***' as 'Analisis Despacho'
                            FROM 
                                Item Item with (nolock)
                                left JOIN DocumentoDet DocumentoDet with (nolock) ON 
                                Item.Empresa=DocumentoDet.Empresa and Item.TipoItem=DocumentoDet.TipoItem and Item.Item=DocumentoDet.Item
                                left JOIN Documento Documento with (nolock) ON DocumentoDet.Empresa=Documento.Empresa and DocumentoDet.TipoDocumento=Documento.TipoDocumento and DocumentoDet.Correlativo=Documento.Correlativo
                            WHERE 
                                Item.Empresa='Makita'
                                and Item.Item='${item}' 
                                and documento.estado = 'S'
                                and documentodet.factorinventario <>0
                                and documentodet.bodega in ('02','15')
                            GROUP BY item.TipoItem, Item.Descripcion, DocumentoDet.Bodega;`;

        logger.info(`Query que ejecuta:   - ${consulta}`);

        
        const result = await sql.query(consulta);
        logger.info(`Resultado de la consulta:   - ${JSON.stringify(result)}`);
        
        console.log("salida",result.recordset)
        // Verificar si se encontraron resultados
        if (result.recordset.length > 0) {
            // Responder con el resultado en formato JSON

            res.status(200).json(result.recordset );
        } else {
            // Si no se encontraron resultados, responder con un mensaje
            res.status(200).json([{Advertencia: "No se encontraron datos"} ] );
        }
        logger.info(`Fin de la funcion obtenerHerramienta`);

        
    } catch (error) {
        // Manejar errores
        logger.error(`Error obtenerHerramienta: ${error.message}`);
        res.status(500).json({ Advertencia: "Error interno del servidor 2" });
        await closeDatabaseConnection();
    
    }
}


module.exports = {
    obtenerStock
};
