
const sql = require('mssql');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');
const logger = require('../../config/logger.js');


async function consultarAsignaiconFiltro(capturador, mes, periodo) {
  try {
      logger.info(`Iniciamos la función consultarAsignacionFiltro services`);
      await connectToDatabase('BodegaMantenedor');
      const request = new sql.Request();

      // Usamos parámetros para prevenir SQL Injection
      request.input('capturador', sql.VarChar, capturador);
      request.input('mes', sql.Int, mes);
      request.input('periodo', sql.Int, periodo);

      // Definir la consulta con parámetros
      let query = `
          SELECT * 
          FROM BodegaMantenedor.dbo.asignaCapturador
          WHERE Empresa = 'Makita' 
          AND Capturador = @capturador 
          AND Periodo = @periodo
          AND Mes = @mes
      `;

      // Muestra el query en la consola con los parámetros
      console.log("Query ejecutado:", query);
      console.log("Parámetros:", capturador, mes, periodo);

      // Ejecutar la consulta
      let asignacionDispositivos = await request.query(query);

      // Verifica si hay resultados y maneja el caso de no encontrar datos
      if (asignacionDispositivos.recordset.length > 0) {
          console.log("Respuesta de la consulta:", asignacionDispositivos);
          return { status: 200, data: asignacionDispositivos.recordset[0] };
      } else {
          console.log("No se encontraron datos para la asignación");
          return { status: 204, data: "Capturador no asignado a ningun usuario" };
      }
  } catch (error) {
      console.error("Error:", error);
      return { status: 500, error: 'Error en el servidor consultarAsignacionFiltro' };
  } finally {
      await closeDatabaseConnection();
  }
}



module.exports = {
    consultarAsignaiconFiltro
};
