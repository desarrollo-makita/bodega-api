
const sql = require('mssql');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');
const logger = require('../../config/logger.js');


async function consultarAsignaiconFiltro(capturador  , mes  , periodo) {
    try {
        logger.info(`Iniciamos la función consultarAsignaiconFiltro services`);
    await connectToDatabase('BodegaMantenedor');
    const request = new sql.Request();

    // Definir la consulta inicial
    let query = `select * from BodegaMantenedor.dbo.asignaCapturador where Empresa = 'Makita' and Capturador = ${capturador} and periodo =${periodo}  and Mes = ${mes}  `;

    // Muestra el query en la consola
    console.log("Query ejecutado:", query);

    // Ejecuta el primer query
    let asignacionDispositivos = await request.query(query);

    console.log("respuesta de la consulta : " , asignacionDispositivos.recordset[0]);
    
    return { status: 200, data : asignacionDispositivos.recordset[0] } 
    
}catch (error) {
    console.error("error:", error);
    return { status: 500, error: 'Error en el servidor consultarAsignaiconFiltro' };
  } finally {
    await closeDatabaseConnection();
  }

}


module.exports = {
    consultarAsignaiconFiltro
};
