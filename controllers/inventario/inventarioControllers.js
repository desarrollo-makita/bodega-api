const logger = require('../../config/logger.js');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');
const sql = require('mssql');
require('dotenv').config();
const moment = require('moment');


const inventarioService = require('../../services/inventario/inventarioServices.js')
const asignarCapturadorService = require('../../services/inventario/asignarCapturadorServices.js')
const consultarAsignacionService = require('../../services/inventario/consultarAsignacionServices.js')
const eliminarAsignacionService = require('../../services/inventario/eliminarAsignacionServices.js')
const consultarAsignacionFiltroService = require('../../services/inventario/consultarAsignacionFiltroServices.js')

/**
 * Retorna Consulta de inventario
 * @param {*} req
 * @param {*} res
 */
async function consultarInventario(req, res) {
    try {
        console.log("parametros de entrada : " , req.query)

        const data  = req.query
        
        logger.info(`Iniciamos la función consultarInventario - Controllers ${JSON.stringify(data)}`);
      
        const inventarioList = await inventarioService.consultarInv(data);
  
        res.status(200).json(inventarioList);
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error en el servidor' });
    } finally {
      await closeDatabaseConnection();
    }
  }

  /**
 * Asigna un capturador a un usuario
 * @param {*} req
 * @param {*} res
 */
async function asignarCapturador(req, res) {
  try {
      console.log("Parámetros de entrada:", req.body);

      const data = req.body;

      logger.info(`Iniciamos la función asignarCapturador - Controllers ${JSON.stringify(data)}`);

      const result = await asignarCapturadorService.asignarCapturador(data);

      res.status(result.status).json(result);
  } catch (error) {
      console.error("Error en asignarCapturador:", error);
      res.status(500).json({ error: 'Error en el servidor al asignar capturador' });
  } finally {
      await closeDatabaseConnection();
  }
}

/**
 * Retorna Consulta de asignacion
 * @param {*} req
 * @param {*} res
 */
async function consultarAsignacion(req, res) {
  try {
      
      
      logger.info(`Iniciamos la función consultarAsignacion - Controllers`);
    
      const asignacionList = await consultarAsignacionService.consultarAsignaicon();

      res.status(200).json(asignacionList);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  } finally {
    await closeDatabaseConnection();
  }
}
  
/**
 * Controlador para eliminar una area
 * @param {*} req
 * @param {*} res
 */
async function deletetAsignacion(req, res) {
  try {
    logger.info(`Iniciamos la función deletetAsignacion controllers`);
    const deleteAsig= await eliminarAsignacionService.deleteAsignacion(req.query);

    res.status(200).json(deleteAsig);
  } catch (error) {
    // Manejamos cualquier error ocurrido durante el proceso
    logger.error(`Error al eliminar la asignacion: : ${error.message}`);
    res.status(500).json({
      error: `Error en el servidor [deleteAsignacion-controllers] :  ${error.message}`,
    });
  } 
}


async function consultarAsignacionFiltro(req, res) {
   try {
     
      const { capturador , mes, periodo } = req.params;
      
      logger.info(`Iniciamos la función consultarAsignacionFiltro controllers con filtro ${capturador} - ${mes} - ${periodo}`);
     
      const data = await consultarAsignacionFiltroService.consultarAsignaiconFiltro(capturador, mes, periodo);
                                                    
      if (data.status != 200) {
        res.status(404).json(data );
      }
      else {
        res.status(200).json(data);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error en el servidor' });
    } finally {
      await closeDatabaseConnection();
    }
  }

  async function iniciarInventario(req, res) {
    try {
        console.log("Parámetros de entrada:", req.params);
      
        const data = req.params;
  
        logger.info(`Iniciamos la función iniciarInventario - Controllers ${JSON.stringify(data)}`);
  
        const result = await inventarioService.iniciarInventario(data);
  
        res.status(result.status).json(result);
    } catch (error) {
        console.error("Error en iniciarInventario:", error);
        res.status(500).json({ error: 'Error en el servidor al iniciar inventario' });
    } finally {
        await closeDatabaseConnection();
    }
  }

  async function insertarInventario(req, res) {
    logger.info(`Iniciamos funcion insertarInventario`);
    
   
    try {
      await connectToDatabase('BodegaMantenedor');
        const { 
            Id, Empresa, FechaInventario, TipoInventario, Bodega, Clasif1, 
            Ubicacion, Item, Cantidad, Estado, Usuario, NombreDispositivo 
        } = req.body;

         // Verificar si algún campo está vacío, es null o undefined
        if (!Empresa || !FechaInventario || !TipoInventario || !Bodega || !Clasif1 || !Ubicacion || !Item || !Cantidad) {
            logger.error(`Error faltan parametros de entrada a la solicitud`);
            return res.status(400).json({ error: `Todos los campos son requeridos.` });
        }

        const consulta = `
        INSERT INTO inventario (Empresa, FechaInventario, TipoInventario, Clasif1, Bodega, Ubicacion, Item, Cantidad, Estado, Usuario, NombreDispositivo) 
        VALUES ('${Empresa}', '${FechaInventario}', '${TipoInventario}', '${Clasif1}', '${Bodega}', '${Ubicacion}', '${Item}', ${Cantidad}, '${Estado}', '${Usuario}', '${NombreDispositivo}');
    `;
    //logger.info(`INSERT a ejecutar : ${consulta}`);
    
    const result = await sql.query(consulta);
    //logger.info(`Resultado de INSERT ${JSON.stringify(result)}`);

    if (result.rowsAffected && result.rowsAffected[0] > 0) {
        res.json({ mensaje: `Se ingresó inventario para el item ${Item}` });
    } else {
        res.status(200).json({ mensaje: "No se insertaron datos para el item proporcionado" });
    }

   // logger.info(`Fin de la funcion insertarInventario`);
    } catch (error) {
        // Manejar errores
        logger.error(`Error al insertar inventario: ${error.message}`);
        res.status(500).json({ error: "Error interno del servidor" });
    } finally {
      await closeDatabaseConnection();
    }
  }

  async function obtenerUltimaUbicacion(req, res) {
    try {
        // Conexión a la base de datos
        await connectToDatabase('BodegaMantenedor');

        // Obtener parámetros de la URL
        const { tipoinventario, tipoitem, usuario, fechainventario, bodega } = req.params;

        // Convertir fecha a formato YYYY-MM-DD
        const fechaFormateada = moment(fechainventario, ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY']).format('YYYY-MM-DD');

        // Log para ver la fecha formateada
        logger.info(`Fecha formateada: ${fechaFormateada}`);

        // Crear la consulta SQL con parámetros
        const consulta = `
            SELECT DISTINCT ubicacion
            FROM BodegaMantenedor.dbo.inventario
            WHERE TipoInventario = @tipoinventario
              AND clasif1 = @tipoitem
              AND usuario = @usuario
              AND CAST(FechaInventario AS date) = @fechainventario
              AND Bodega = @bodega
              AND id IN (
                  SELECT MAX(id)
                 FROM BodegaMantenedor.dbo.inventario
                  WHERE TipoInventario = @tipoinventario
                    AND clasif1 = @tipoitem
                    AND usuario = @usuario
                    AND CAST(FechaInventario AS date) = @fechainventario
                    AND Bodega = @bodega
              );
        `;

        // Crear el objeto de la consulta
        const request = new sql.Request();

        // Pasar los parámetros a la consulta
        request.input('tipoinventario', sql.NVarChar, tipoinventario);
        request.input('tipoitem', sql.NVarChar, tipoitem);
        request.input('usuario', sql.NVarChar, usuario);
        request.input('fechainventario', sql.Date, fechaFormateada);
        request.input('bodega', sql.NVarChar, bodega);

        // Log de la consulta para revisión
        logger.info(`Ejecutando consulta: ${consulta}`);

        // Ejecutar la consulta con los parámetros
        const result = await request.query(consulta);
        logger.info(`result ${JSON.stringify(result.recordset)}`);
        // Verificar si se encontraron resultados
        if (result.recordset.length > 0) {
            // Responder con el resultado en formato JSON
            res.json(result.recordset);
        } else {
          const resultVacio = []
          logger.info(`Respuesta 404: ${JSON.stringify(resultVacio)}`);
          res.status(200).json(resultVacio);
        }

    } catch (error) {
        // Manejar errores
        logger.error(`Error al obtener la ubicación del item: ${error.message}`);
        res.status(500).json({ error: "Error interno del servidor" });
    } finally {
        // Asegurarse de cerrar la conexión a la base de datos
        await closeDatabaseConnection();
    }
  }
  

  async function validarUbicacionProducto(req, res) 
{
    logger.info(`Iniciamos función validarUbicacionProducto - ${JSON.stringify(req.params)}`);

    try {
      await connectToDatabase('BodegaMantenedor');
        const { fechainventario, item, ubicacion, usuario } = req.params;    

        const fechaFormateada = moment(fechainventario, ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY']).format('YYYY-MM-DD');

        logger.info(`Se formatea fecha  - ${fechaFormateada}`);

        logger.info(`PASA  - ${fechaFormateada}`);

      
        const consulta = `SELECT DISTINCT item 
                          FROM inventario  
                          WHERE cast(FechaInventario as date) =  '${fechaFormateada}'
                            AND item =  '${item}'
                            AND ubicacion = '${ubicacion}'
                            AND usuario = '${usuario}'
                            AND estado = 'Ingresado'`;

        logger.info(`Ejecutando consulta: ${consulta}`);
     
        const result = await sql.query(consulta);
       // logger.info(`Resultado de la consulta:   - ${JSON.stringify(result)}`);

        // Verificar si se encontraron resultados
        if (result.recordset.length > 0) {
            // Responder con el resultado en formato JSON
            logger.info(`Resultados encontrados: ${result.recordset.length}`);
            return res.json("SI");
           // res.status(800).json({ error: "OK ULTIMA" });
        } 
        else
        {
            logger.info(`Resultados no encontrados: ${result.recordset.length}`);
            return res.json("NO");
        }
  

    } 
    catch (error) {
        logger.error(`Error en validarUbicacionProducto: ${error.message} - ${error.stack}`);
        return res.status(500).json({ error: "Error interno del servidor" });
    }finally {
      await closeDatabaseConnection();
    }
    
  }

  async function validarTipoItem(req, res) 
{
    logger.info(`Iniciamos función validarTipoItem - ${JSON.stringify(req.params)}`);

    try {

      await connectToDatabase('BodegaMantenedor');
        const { item, tipoitem } = req.params;    

        
        const consulta = `SELECT DISTINCT item 
                          FROM  BdQMakita.dbo.item
                          WHERE item =  '${item}'
                            AND Clasif1 = '${tipoitem}'`;

        logger.info(`Ejecutando consulta: ${consulta}`);
     
        const result = await sql.query(consulta);
       // logger.info(`Resultado de la consulta:   - ${JSON.stringify(result)}`);

        // Verificar si se encontraron resultados
        if (result.recordset.length > 0) {
            // Responder con el resultado en formato JSON
            logger.info(`Resultados encontrados: ${result.recordset.length}`);
            return res.json("SI");
           // res.status(800).json({ error: "OK ULTIMA" });
        } 
        else
        {
            logger.info(`Resultados no encontrados: ${result.recordset.length}`);
            return res.json("NO");
        }
  

    } 
    catch (error) {
        logger.error(`Error en validarTipoItem: ${error.message} - ${error.stack}`);
        return res.status(500).json({ error: "Error interno del servidor" });
    }finally {
      await closeDatabaseConnection();
    }
    
}


module.exports = {
    consultarInventario,
    asignarCapturador,
    consultarAsignacion,
    deletetAsignacion,
    consultarAsignacionFiltro,
    iniciarInventario,
    insertarInventario,
    obtenerUltimaUbicacion,
    validarUbicacionProducto,
    validarTipoItem
  };