const logger = require('../../config/logger.js');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');
const sql = require('mssql');
require('dotenv').config();
const moment = require('moment');

const asignarReconteosService = require('../../services/inventario/asignarReconteosServices.js')
  /**
 * Asignar reconteos a los usuarios * @param {*} req
 * @param {*} res
 */
async function asignarReconteos(req, res) {
  try {
     // console.log("Parámetros de entrada:", req.body);

      const data = req.body;

    //  logger.info(`Iniciamos la función asignarReconteos - Controllers ${JSON.stringify(data)}`);

      const result = await asignarReconteosService.asignarReconteos(data);

      res.status(result.status).json(result);
  } catch (error) {
      console.error("Error en asignarReconteos:", error);
      res.status(500).json({ error: 'Error en el servidor al asignar capturador' });
  } finally {
      await closeDatabaseConnection();
  }
}


async function validarCantidadReconteos(req, res) {
  try {
      console.log("Parámetros de entrada validarCantidadReconteos:", req.query);
    
      const data = req.query;

      logger.info(`Iniciamos la función validarCantidadReconteos - Controllers ${JSON.stringify(data)}`);

      const result = await asignarReconteosService.validarCantidadReconteos(data);

      res.status(result.status).json(result);
  } catch (error) {
      console.error("Error en validarCantidadReconteos:", error);
      res.status(500).json({ error: 'Error en el servidor al validarCantidadReconteos' });
  } finally {
      await closeDatabaseConnection();
  }
}

async function insertarReconteo(req, res) {
    logger.info(`Iniciamos funcion insertarReconteo`);
    console.log("Parámetros de entrada:", req.body);
    try {
        await connectToDatabase('BodegaMantenedor');

        const { Id,Empresa,Agno,Mes,FechaInventario,TipoInventario
            ,NumeroReconteo,NumeroLocal,GrupoBodega,Clasif1
            ,Ubicacion,Item,Cantidad,Estado,Usuario,NombreDispositivo 
        } = req.body;

       // Verificar si algún campo está vacío, es null o undefined
        if (!Empresa || !Agno || !Mes  || !FechaInventario || !TipoInventario 
            || !NumeroReconteo  || !NumeroLocal 
            || !GrupoBodega || !Clasif1  || !Item || !Cantidad || !Estado|| !Usuario || !NombreDispositivo) {
            logger.error(`Error faltan parametros de entrada a la solicitud`);
            return res.status(400).json({ error: `Todos los campos son requeridos INSERTA.` });
        }

        const fechaFormateada = moment().format('YYYY-MM-DD HH:mm:ss');
        const fechaFormateada2 = moment(FechaInventario, ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY']).format('DD-MM-YYYY');

        const fecha = new Date();
        //  console.log("fecha1",fecha.toISOString()); 

        const fecha2 = fecha.toLocaleString('sv-SE', { timeZone: 'America/Santiago' }) + '.' + fecha.getMilliseconds().toString().padStart(3, '0');
        //console.log("fecha2", fecha2);

        var fecha3 = new Date();
        var fecha4 = fecha3.toISOString().replace("T", " ").replace("Z", ""); // Formato "YYYY-MM-DD HH:MM:SS"
        
        var fechaActual = new Date().toLocaleString("es-CL", {
            timeZone: "America/Santiago",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }).replace(",", "");
        
        var fechaActual = new Date().toLocaleString("es-CL", {
          timeZone: "America/Santiago",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
      }).replace(",", "");
      let fechahoy = new Date().toISOString().substr(0, 10);
      
      const consulta = `
      INSERT INTO RespuestaReconteos (Empresa,Agno,Mes,FechaInventario
      ,TipoInventario,NumeroReconteo,NumeroLocal,GrupoBodega,tipoitem
      ,Ubicacion,Item,Cantidad,Estado,Usuario,NombreDispositivo,Proceso,FechaProceso) 
      VALUES ('${Empresa}', '${Agno}'
      , '${Mes}', '${FechaInventario}'
      , '${TipoInventario}'
      , '${NumeroReconteo}'
      ,  SUBSTRING('${NumeroLocal}', 1, 2)
      , '${GrupoBodega}', '${Clasif1}', '${Ubicacion}'
      , '${Item}'
      ,  ${Cantidad}
      , '${Estado}'
      , '${Usuario}'
      , '${NombreDispositivo}'
      ,'EnProceso'
      , '${fecha2}'
      );
  `;
    logger.info(`INSERT a ejecutar : ${consulta}`);
  
    const result = await sql.query(consulta);
    
    if (result.rowsAffected && result.rowsAffected[0] > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
        res.json({ mensaje: `Se ingresó RespuestaReconteos para el item ${Item}` });
    } else {
        res.status(200).json({ mensaje: "No se insertaron datos para el item proporcionado" });
    }

    } catch (error) {
      // Manejar errores
      logger.error(`Error al insertar RespuestaReconteos: ${error.message}`);
      res.status(500).json({ error: "Error interno del servidor" });
    }
    finally {
        await closeDatabaseConnection();
    }
}

async function obtenerReconteo(req, res) {
    logger.info(`Iniciamos función obtenerReconteo - ${JSON.stringify(req.params)}`);
  
    try {
        await connectToDatabase('BodegaMantenedor');
        // Obtener el ID de la URL
        const { empresa,agno,mes,tipoinventario, numerolocal, tipoitem, usuario,grupobodega } = req.params;
        const consulta = ` select Clasif1,Item,Ubicacion,NumeroReconteo
                            from Reconteos
                            where empresa = '${empresa}'
                                AND Agno = '${agno}'
                                AND Mes = '${mes}'
                                AND TipoInventario = '${tipoinventario}'
                                AND NumeroLocal =   SUBSTRING('${numerolocal}', 1, 2)
                                AND clasif1 = '${tipoitem}'
                                AND usuario = '${usuario}'
                                AND GrupoBodega = '${grupobodega}'
                                AND estado ='EnProceso'
                                order by ubicacion, item
                                ` ;

        
        logger.info(`Query que ejecuta:   - ${consulta}`);
        
        const result = await sql.query(consulta);
        logger.info(`Resultado de la consulta:   - ${JSON.stringify(result)}`);

        // Verificar si se encontraron resultados
        if (result.recordset.length > 0) {
            // Responder con el resultado en formato JSON
            res.json(result.recordset);
        } 
        else
        {
            // Si no se encontraron resultados, responder con un mensaje
            res.status(404).json({ error: "No se encontraron datos" });
        }
       
        
    } catch (error) {
        // Manejar errores
        logger.error(`Error al obtener en los parametros: ${error.message}`);
        res.status(500).json({ error: "Error interno del servidor" });
    }finally{
        await closeDatabaseConnection();
    }      
}

async function obtenerGrupoBodega(req, res) {
    logger.info(`Iniciamos funcion obtenerGrupoBodega XXXX - ${JSON.stringify(req.params)}`);
    try {
        await connectToDatabase('BodegaMantenedor');
        // Obtener el ID de la URL
        const { empresa,NumeroLocal } = req.params;

        if ( !NumeroLocal  || !empresa ) {
            logger.error(`Error faltan parametros de entrada a la solicitud`);
            return res.status(400).json({ error: `Todos los campos son requeridos.` });
        }


        
        //logger.info(`PASA 1 - ${fechaFormateada}`);

        // Construir la consulta utilizando el item como filtro
        const consulta = ` SELECT distinct GrupoBodega,NombreGrupoBodega
                            FROM grupobodega
                            WHERE empresa = '${empresa}'
                            AND Numerolocal = '${NumeroLocal}'`;
                                
        logger.info(`Query que ejecuta:   - ${consulta}`);
        
        const result = await sql.query(consulta);

        // Verificar si se encontraron resultados
        if (result.recordset.length > 0) {
            // Responder con el resultado en formato JSON
            res.json(result.recordset);
            // res.status(800).json({ error: "OK ULTIMA" });
        } 
        else
        {
            // Si no se encontraron resultados, responder con un mensaje
            res.status(404).json({ error: "NOOK ULTIMA" });
        }
        // logger.info(`Fin de la funcion obtenerGrupoBodega`);

        
    } catch (error) {
        // Manejar errores
        logger.error(`Error al obtener la grupo bodega: ${error.message}`);
        res.status(500).json({ error: "Error interno del servidor" });
    }finally{
        await closeDatabaseConnection();
    }
}

/**
 * Retorna datos de almacenamiento para la consulta de inventario
 * @param {*} req
 * @param {*} res
 */
async function obtenerAlmacenamiento(req, res) {
    try {
        console.log("parametros de entrada obtenerAlmacenamiento : " , req.query);

        const data  = req.query;
        
        logger.info(`Iniciamos la función obtenerAlmacenamiento (TODO)- Controllers ${JSON.stringify(data)}`);
      
        const almacenmamientoList = await asignarReconteosService.obtenerAlmacenamiento(data);
  
        res.status(200).json(almacenmamientoList);
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error en el servidor' });
    } finally {
      await closeDatabaseConnection();
    }
  }


module.exports = {
  asignarReconteos,
  validarCantidadReconteos,
  insertarReconteo,
  obtenerReconteo,  
  obtenerGrupoBodega ,
  obtenerAlmacenamiento};