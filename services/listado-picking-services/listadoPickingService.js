const sql = require('mssql');
const {connectToDatabase,closeDatabaseConnection} = require('../../config/database.js');
const logger = require('../../config/logger.js');

async function getPickingList() {
  try {
    logger.info(`Iniciamos la función getPickingList services`);
    await connectToDatabase('BdQMakita');
    const request = new sql.Request();

    // Buscar el la acividad por NombreActividad
    const  listaPicking = await request.query(`SELECT DISTINCT 
                                              a.empresa,
                                              a.correlativo,
                                              a.entidad,
                                              a.nombrecliente,
                                              a.Direccion,
                                              a.comuna,
                                              a.Ciudad,
                                              a.Bodorigen,
                                              a.Boddestino,
                                              a.DocumentoOrigen,
                                              a.CorrelativoOrigen,
                                              a.glosa,
                                              d.Fecha,
                                              (SELECT COUNT(*) 
                                              FROM CapturaDet x 
                                              WHERE x.empresa = a.empresa 
                                              AND x.Tipodocumento = a.TipoDocumento 
                                              AND x.correlativo = a.correlativo 
                                              AND x.proceso = a.proceso) AS Total_Items
                                              FROM 
                                              Captura a,
                                              capturadet b,
                                              item i,
                                              Documento d
                                              WHERE 
                                              a.proceso = 'Solicitado'
                                              and a.Tipodocumento = 'PICKING'
                                              AND a.empresa = b.empresa
                                              AND a.Tipodocumento = b.Tipodocumento
                                              AND a.Correlativo = b.Correlativo
                                              AND b.empresa = i.Empresa
                                              AND b.Tipoitem = i.TipoItem
                                              AND b.item = i.item
                                              and a.Correlativo = d.Correlativo 
                                              --AND i.Clasif1 =  '" + DatosCliente.TipoItemSQL + "' 
                                              order by d.Fecha asc;`);
                                              
    if (listaPicking.recordset.length === 0) {
      return { status: 404, error: 'No existen picking para mostrar' };
    }

    const responsePickingList = listaPicking.recordset;
    responsePickingList.forEach(item => {
      console.log(item.Direccion);
      if (item.Direccion) {
        // Reemplaza el # por una cadena vacía
        item.Direccion = item.Direccion.replace('#', '').trim();
        
      }
    });
    

    return { status: 200, data: responsePickingList };
  } catch (error) {
    console.log("error : " , error);
      return { status: 500, error: 'Error en el servidor getPickingList' };
  } finally {
      await closeDatabaseConnection();
  }
}


async function getPickingFolio(folio) {
  try {
    logger.info(`Iniciamos la función getPickingFolio services`);
    await connectToDatabase('BdQMakita');
    const request = new sql.Request();

    // Buscar el la acividad por NombreActividad
    const  pickingFolio = await request.query(`SELECT DISTINCT 
                                                a.empresa,
                                                a.correlativo,
                                                a.entidad,
                                                a.nombrecliente,
                                                a.Direccion,
                                                a.comuna,
                                                a.Ciudad,
                                                a.Bodorigen,
                                                a.Boddestino,
                                                a.DocumentoOrigen,
                                                a.CorrelativoOrigen,
                                                a.glosa,
                                                d.Fecha,
                                                (SELECT COUNT(*) 
                                                FROM CapturaDet x 
                                                WHERE x.empresa = a.empresa 
                                                AND x.Tipodocumento = a.TipoDocumento 
                                                AND x.correlativo = a.correlativo 
                                                AND x.proceso = a.proceso) AS Total_Items
                                                FROM 
                                                Captura a,
                                                capturadet b,
                                                item i,
                                                Documento d
                                                WHERE 
                                                a.proceso = 'Solicitado'
                                                AND a.Tipodocumento = 'PICKING'
                                                AND a.empresa = b.empresa
                                                AND a.Tipodocumento = b.Tipodocumento
                                                AND a.Correlativo = b.Correlativo
                                                AND b.empresa = i.Empresa
                                                AND b.Tipoitem = i.TipoItem
                                                AND b.item = i.item
                                                and a.Correlativo = d.Correlativo 
                                                and a.CorrelativoOrigen like '%${folio}%'
                                                order by d.Fecha asc `);
                                              
    
    

    console.log("resultado PickingFolio : " ,pickingFolio );
    
    if (pickingFolio.recordset.length === 0) {
      return { status: 404, error: 'No existen picking para mostrar' };
    }

    const responsePickingFolio= pickingFolio.recordset;
    responsePickingFolio.forEach(item => {
      console.log(item.Direccion);
      if (item.Direccion) {
        // Reemplaza el # por una cadena vacía
        item.Direccion = item.Direccion.replace('#', '').trim();
        
      }
    });

    return { status: 200, data: responsePickingFolio};
  } catch (error) {
    console.log("error : " , error);
      return { status: 500, error: 'Error en el servidor getPickingFolio' };
  } finally {
      await closeDatabaseConnection();
  }
}


async function getPickingFolioDetalle(correlativo) {
  try {
    logger.info(`Iniciamos la función getPickingFolioDetalle services`);
    await connectToDatabase('BdQMakita');
    const request = new sql.Request();

    // Buscar el la acividad por NombreActividad
    const  pickingFolioDetalle = await request.query(`SELECT 
                                                          linea, 
                                                          item, 
                                                          Descripcion, 
                                                          CAST(ROUND(cantidad, 0) AS INT) AS Cantidad, 
                                                          CAST(ROUND(CantidadPedida, 0) AS INT) AS CantidadPedida, 
                                                          TipoDocumento, 
                                                          Tipoitem, 
                                                          Unidad, 
                                                          Ubicacion 
                                                      FROM 
                                                          CapturaDet 
                                                      WHERE 
                                                          empresa = 'Makita' 
                                                          AND Tipodocumento = 'PICKING' 
                                                          AND correlativo = ${correlativo}
                                                        -- AND tipoitem = @axTipoItem 
                                                      ORDER BY 
                                                          Ubicacion, 
                                                          linea; `);
                                              
    
    

    console.log("resultado PickingFolio : " ,pickingFolioDetalle );
    
    if (pickingFolioDetalle.recordset.length === 0) {
      return { status: 404, error: 'No existen picking para mostrar' };
    }

    const responsePickingFolio= pickingFolioDetalle.recordset;

    responsePickingFolio.forEach(item => {
      console.log(item.Direccion);
      if (item.Direccion) {
        // Reemplaza el # por una cadena vacía
        item.Direccion = item.Direccion.replace('#', '').trim();
        console.log("WWWWWWWWWWWWWWWWWWWWW : ", item.Direccion);
      }
    });

    return { status: 200, data: responsePickingFolio};
  } catch (error) {
    console.log("error : " , error);
      return { status: 500, error: 'Error en el servidor getPickingFolio' };
  } finally {
      await closeDatabaseConnection();
  }
}

module.exports = {
  getPickingList,
  getPickingFolio,
  getPickingFolioDetalle
  };