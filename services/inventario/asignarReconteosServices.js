
const sql = require('mssql');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');
const logger = require('../../config/logger.js');
const { js2xml } = require('xml-js');

async function iniciarReconteo(data) {
    const { local, bodega, fechaInventario, tipoItem } = data;

    const [anio, mesStr] = fechaInventario.split('-');
    const mes = parseInt(mesStr);
    const periodo = parseInt(anio);
    
    const empresa = 'Makita';

    const data2 = {
        empresa,
        local,
        bodega,
        fechaInventario,
        tipoItem,
        mes,
        periodo
    };

    console.log("Iniciamos la función iniciarReconteos services", data2);

    try {
        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();

        const result = await request
            .input('Empresa', sql.VarChar(50), data2.empresa)
            .input('Agno', sql.VarChar(50), data2.periodo.toString())
            .input('Mes', sql.Int, data2.mes)
            .input('FechaInventario', sql.Date, data2.fechaInventario)
            .input('Local', sql.VarChar, data2.local)
            .input('Grupo', sql.Int, data2.bodega)
            .input('TipoItem', sql.VarChar, data2.tipoItem)
            .output('NumeroID', sql.Int)
            .execute('sp_CrearReconteo');

        logger.info(`Finalizó la ejecución de iniciarReconteos ${JSON.stringify(result)}`);

        return { status: 200, message: "Actualización realizada con éxito." };
    } catch (error) {
        console.log("Error:", error);
        return { status: 500, error: 'Error en el servidor al iniciarReconteos' };
    } finally {
        await closeDatabaseConnection();
    }
}


async function obtenerReconteos(data) {
    const { local, bodega, fechaInventario, tipoItem } = data;

    if (tipoItem === '01-HERRAMIENTAS') {
        tipoProducto = 'HERRAMIENTAS';
        console.log('Entro en el if de HERRAMIENTAS');
    } else if (tipoItem === '03-ACCESORIOS') {
        tipoProducto = 'ACCESORIOS';
        console.log('Entro en el if de ACCESORIOS');
    } else if (tipoItem === '04-REPUESTOS') {
        tipoProducto = 'REPUESTOS';
        console.log('Entro en el if de REPUESTOS');
    } else {
        console.log('El tipoItem no coincide con ninguno de los casos previstos:', tipoItem);
    }

    const [anio, mesStr] = fechaInventario.split('-');
    const mes = parseInt(mesStr);
    const periodo = parseInt(anio);

    const empresa = 'Makita';

    const data2 = {
        empresa,
        local,
        bodega,
        fechaInventario,
        tipoProducto,
        mes,
        periodo
    };

    try {
        logger.info(`Iniciamos la función obtenerItemsReconteos services`, data2);

        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();

        // Definimos los parámetros
        const empresaParam = empresa;
        const localParam = local;
        const bodegaParam = bodega;
        const fechaInventarioParam = fechaInventario;
        const tipoItemParam = tipoProducto;

        // Log de los parámetros reales antes de ejecutar la consulta
        console.log('Parámetros seteados:', {
            empresa: empresaParam,
            local: localParam,
            bodega: bodegaParam,
            fechaInventario: fechaInventarioParam,
            tipoItem: tipoItemParam
        });

        // Consulta SQL con valores dinámicos (usando los parámetros reales)
        const query = `
            SELECT * FROM BodegaMantenedor.dbo.Reconteos 
            WHERE Empresa = '${empresaParam}'
              AND NumeroLocal = '${localParam}'
              AND GrupoBodega = ${bodegaParam}
              AND FechaInventario = '${fechaInventarioParam}'
              AND Clasif1 = '${tipoItemParam}'
              AND Estado = 'EnProceso'
            ORDER BY Ubicacion DESC
        `;

        // Log de la consulta SQL con los valores reales
       console.log('Consulta SQL con valores reales:', query);

        // Ejecutamos la consulta y obtenemos el resultado
        const responseReconteos = await request.query(query);

        return { status: 200, data: responseReconteos.recordset };
    } catch (error) {
        console.log(`Error al obtener reconteos: ${error.message}`);
        console.log("Error:", error);

        return { status: 500, error: `Error en el servidor al obtener reconteos: ${error.message}` };
    } finally {
        await closeDatabaseConnection();
    }
}



async function asignarReconteos(data) {
    const listaReconteos = data;

    try {
        logger.info(`Iniciamos la función iniciarInventario services ${listaReconteos}`);

        await connectToDatabase('BodegaMantenedor');

        // 1. Convertir JSON a XML
        const jsonParaXml = {
            Reconteos: {
                Persona: listaReconteos.map(item => ({
                    nombre: item.nombre,
                    Datos: {
                        Dato: item.data.map(dato => ({
                            Id: dato.Id,
                            Empresa: dato.Empresa,
                            Agno: dato.Agno,
                            Mes: dato.Mes,
                            FechaInventario: dato.FechaInventario,
                            TipoInventario: dato.TipoInventario,
                            NumeroReconteo: dato.NumeroReconteo,
                            NumeroLocal: dato.NumeroLocal,
                            GrupoBodega: dato.GrupoBodega,
                            Clasif1: dato.Clasif1,
                            Ubicacion: dato.Ubicacion,
                            Item: dato.Item,
                            Cantidad: dato.Cantidad,
                            Estado: dato.Estado,
                            Usuario: dato.Usuario,
                            NombreDispositivo: dato.NombreDispositivo
                        }))
                    }
                }))
            }
        };
        

        const opciones = { compact: true, ignoreComment: true, spaces: 4 };
        
        const xmlFinal = js2xml(jsonParaXml, opciones);


        logger.info('XML generado:', xmlFinal); // Opcional: puedes comentarlo si es muy largo
        console.log("XML generado:\n", xmlFinal);

        // 2. Enviar el XML al SP
        const request = new sql.Request();
        request.input('ListaDatos', sql.XML, xmlFinal);


        // Aquí llamaremos al SP cuando lo tengas listo
        const result = await request.execute('ActualizarUsuariosReconteo'); // Asegúrate de que el nombre del SP sea correcto
        logger.info('Resultado del SP:', result);

        logger.info(`Finalizó la ejecución del procedimiento almacenado ActualizarUsuariosReconteo`);

        return { status: 200, message: 'XML generado y enviado al SP (cuando esté listo)' };
    } catch (error) {
        console.error("Error:", error);
        return { status: 500, error: 'Error en el servidor al asignar reconteos' };
    }
}

async function validarCantidadReconteos(data) {
    const { tipoItem, local, fechaInventario } = data;
    const empresa = 'Makita';
    const accion = 'RECONTEO';
    await connectToDatabase('BodegaMantenedor');

    try {
        logger.info(`Iniciamos la función validarCantidadReconteos services ${tipoItem}-${local}-${fechaInventario}`);

        const request = new sql.Request();

        // Parámetros para el query
        request.input('empresa', sql.VarChar(50), empresa);
        request.input('accion', sql.VarChar(80), accion);
        request.input('tipoItem', sql.VarChar(80), tipoItem);
        request.input('local', sql.VarChar(80), local);
        request.input('fechaInventario', sql.Date, new Date(fechaInventario));


        // Mostrar la consulta SQL con valores interpolados
        const query = `
           SELECT *
            FROM BodegaMantenedor.dbo.BitacoraInventario
            WHERE FechaInventario = '${fechaInventario}'
            AND FechaTermino = (
            SELECT MAX(FechaTermino)
            FROM BitacoraInventario
            WHERE FechaInventario = '${fechaInventario}'
            AND tipoItem = '${tipoItem}'
            AND Local = '${local}'
            AND empresa = '${empresa}'
            AND ACCION LIKE '%${accion}%'  
  );
        `;

        logger.info(`Ejecutando consulta SQL: ${query}`);

        // Ejecutar la consulta
        const result = await request.query(`
           SELECT *
            FROM BodegaMantenedor.dbo.BitacoraInventario
            WHERE FechaInventario = @fechaInventario
            AND FechaTermino = (
                SELECT MAX(FechaTermino)
                FROM BitacoraInventario
                WHERE FechaInventario = @fechaInventario
                    AND tipoItem = @tipoItem
                    AND Local = @local
                    AND empresa = @empresa
                    AND ACCION LIKE '%' + @accion + '%'
  );
        `);

        logger.info(`Consulta ejecutada correctamente, registros encontrados: ${JSON.stringify(result)}`);

        if (result.recordset.length === 0) {
            return { status: 200, data: { mensaje: 'sin registro de cierre', estado: 0 } };
        } else {
            return { status: 200, data: result.recordset[0] };
        }
    } catch (error) {
        console.error("Error:", error);
        return { status: 500, error: 'Error en el servidor al validarCierreInventario' };
    } finally {
        await closeDatabaseConnection();
    }
}



module.exports = {
    obtenerReconteos,
    asignarReconteos,
    iniciarReconteo,
    validarCantidadReconteos
    
};
