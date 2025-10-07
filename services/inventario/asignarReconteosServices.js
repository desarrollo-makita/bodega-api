
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

        return { status: 200, message: "iniciarReconteos realizada con éxito." };
    } catch (error) {
        console.log("Error:", error);
        return { status: 500, error: 'Error en el servidor al iniciarReconteos' };
    } finally {
        await closeDatabaseConnection();
    }
}

async function siguienteReconteo(data) {
    const { local, bodega, fechaInventario, tipoItem, almacenamiento } = data;
    console.log("data _  siguienteReconteo", data);

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
        periodo,
        almacenamiento
    };

    console.log("Iniciamos la función siguienteReconteo services", data2);

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
            .input('SumaSiNo', sql.VarChar, data2.almacenamiento)
            .output('NumeroID', sql.Int)
            .output('MensajeID', sql.VarChar(255))
            .execute('sp_GenerarSiguienteReconteo');

        const numeroID = result.output.NumeroID;
        const mensajeID = result.output.MensajeID;

        logger.info(`Resultado SP: NumeroID=${numeroID}, MensajeID=${mensajeID}`);

        // Evaluar resultado del SP y devolver respuesta adecuada
        if (numeroID === 100) {
            return { status: 200, message: mensajeID };
        } else {
            return {
                status: 400,
                message: mensajeID,
                code: numeroID
            };
        }
    } catch (error) {
        console.error("Error al ejecutar sp_GenerarSiguienteReconteo:", error);
        return {
            status: 500,
            error: 'Error en el servidor al ejecutar sp_GenerarSiguienteReconteo'
        };
    } finally {
        await closeDatabaseConnection();
    }
}



async function obtenerReconteos(data) {
    const { local, fechaInventario, tipoItem, numeroReconteo } = data;
    let tipoProducto;

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
        fechaInventario,
        tipoProducto,
        mes,
        periodo
    };

    try {
        logger.info(`Iniciamos la función obtenerItemsReconteos services`, data2);

        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();

        const query = `
            SELECT * FROM BodegaMantenedor.dbo.Reconteos 
            WHERE Empresa = '${empresa}'
              AND NumeroLocal = '${local}'
              AND FechaInventario = '${fechaInventario}'
              AND Clasif1 = '${tipoProducto}'
              AND NumeroReconteo = ${numeroReconteo}
            ORDER BY Ubicacion DESC
        `;

        console.log('Consulta SQL con valores reales:', query);

        const responseReconteos = await request.query(query);
        const resultados = responseReconteos.recordset;

        const itemsContados = resultados.filter(item => item.Estado === 'Recibido').length;
        const reconteoTotal = resultados.length;

        return {
            status: 200,
            data: resultados,
            itemsContados,
            reconteoTotal
        };
    } catch (error) {
        console.log(`Error al obtener reconteos: ${error.message}`);
        return { status: 500, error: `Error en el servidor al obtener reconteos: ${error.message}` };
    } finally {
        await closeDatabaseConnection();
    }
}


async function asignarReconteos2(data) {
    try {
        console.log('Iniciamos la función asignarReconteos services');

        // Agrupar los datos por nombre
        const listaReconteos = data;
        const nombres = [...new Set(listaReconteos.map(item => item.nombre))]; // Extraemos los nombres únicos

        console.log('Conexión a la base de datos establecida.');
        await connectToDatabase('BodegaMantenedor');

        // Procesar cada grupo de datos por nombre
        for (let nombre of nombres) {
            console.log(`Procesando datos para el nombre: ${nombre}`);

            // Filtrar los datos por nombre
            const datosPorNombre = listaReconteos.filter(item => item.nombre === nombre);

            // Dividir los datos en lotes de 10
            const lotes = divideEnLotes(datosPorNombre, 100);  // Experimenta con tamaños más pequeños si es necesario
            console.log(`Datos divididos en ${lotes.length} lotes de 10 registros cada uno para el nombre: ${nombre}.`);

            // Procesar los lotes en paralelo usando Promise.all
            const lotePromises = lotes.map(async (lote, index) => {
                console.log(`Procesando lote ${index + 1} de ${lotes.length} con ${lote.length} registros.`);

                // Filtrar solo los campos necesarios
                const jsonParaXml = {
                    Reconteos: {
                        Persona: lote.map(item => ({
                            nombre: item.nombre,
                            Datos: {
                                Dato: item.data.map(dato => ({
                                    Id: dato.Id,
                                    Empresa: dato.Empresa,
                                    Agno: dato.Agno,
                                    Mes: dato.Mes,
                                    FechaInventario: dato.FechaInventario,
                                }))
                            }
                        }))
                    }
                };

                // Convertir el objeto JSON a XML usando js2xml
                const opciones = { compact: true, ignoreComment: true, spaces: 4 };
                const xmlFinal = js2xml(jsonParaXml, opciones);

                console.log(`XML generado para el lote ${index + 1}. Tamaño del XML: ${xmlFinal.length} caracteres.`);

                // Enviar el XML al procedimiento almacenado
                const request = new sql.Request();
                request.input('ListaDatos', sql.XML, xmlFinal);

                // Ejecutar el procedimiento almacenado
                const result = await request.execute('ActualizarUsuariosReconteo');
                console.log(`Resultado del SP para el lote ${index + 1}:`, result);

                console.log(`Lote ${index + 1} procesado exitosamente.`);
            });

            // Esperamos que todos los lotes del nombre se procesen en paralelo
            await Promise.all(lotePromises);
        }

        console.log(`Finalizó la ejecución del procedimiento almacenado ActualizarUsuariosReconteo`);

        return { status: 200, message: 'XML generado y enviado al SP' };

    } catch (error) {
        console.error("Error:", error);
        return { status: 500, error: 'Error en el servidor al asignar reconteos' };
    }
}


async function asignarReconteos(data) {
    try {
        console.log('Iniciamos la función asignarReconteos services', JSON.stringify(data));

        const listaReconteos = data;

        console.log('Conexión a la base de datos establecida.');
        await connectToDatabase('BodegaMantenedor');

        const fallidos = [];

        for (let reconteo of listaReconteos) {
            console.log(`Procesando reconteo de: ${reconteo.nombre}`);
            const { nombre, cantidad } = reconteo;
            const cantidadFinal = cantidad === undefined ? 1 : cantidad;

            for (let itemData of reconteo.data) {
                const item = itemData.Item;
                console.log(`Procesando el Item: ${JSON.stringify(itemData)}`);

                try {
                    const request = new sql.Request();

                    const query = `
                        UPDATE reconteos
                        SET usuario = @nombre,
                            NombreDispositivo = A.Capturador
                        FROM reconteos r
                        INNER JOIN BodegaMantenedor.dbo.asignaCapturador A ON A.Usuario = @nombre
                        WHERE r.Item = @Item
                          AND r.numeroReconteo = @cantidadFinal
                    `;

                    // Asignar parámetros con logs
                    console.log('--- Parámetros del UPDATE ---');
                    console.log('Item:', item);
                    console.log('nombre:', nombre);
                    console.log('cantidadFinal:', cantidadFinal);
                    console.log('------------------------------');

                    request.input('Item', sql.NVarChar, item);
                    request.input('nombre', sql.NVarChar, nombre);
                    request.input('cantidadFinal', sql.Int, cantidadFinal);

                    const result = await request.query(query);

                    console.log(`Resultado SQL: ${JSON.stringify(result)}`);
                    if (result.rowsAffected[0] === 0) {
                        console.warn(`No se pudo procesar el reconteo para el item ${item}.`);
                        fallidos.push({ item, usuario: nombre });
                    } else {
                        console.log(`Reconteo para el item ${item} procesado correctamente.`);
                    }
                } catch (error) {
                    console.error(`Error al procesar el item ${item}:`, error);
                    fallidos.push({ item, usuario: nombre, error: error.message });
                }
            }
        }

        return {
            status: 200,
            message: 'Reconteos procesados correctamente.',
            fallidos
        };

    } catch (error) {
        console.error("Error general en asignarReconteos:", error);
        return { status: 500, error: 'Error al procesar los reconteos.' };
    } finally {
        await closeDatabaseConnection();
    }
}


async function validarCantidadReconteos(data) {
    const { tipoItem, local, fechaInventario, grupo } = data;
    const empresa = 'Makita';
    const accion = 'RECONTEO';
    await connectToDatabase('BodegaMantenedor');

    try {
        logger.info(`Iniciamos la función validarCantidadReconteos services ${tipoItem}-${local}-${fechaInventario} ${grupo}`);

        const request = new sql.Request();
        let tipoProducto;

        // Determinar el tipoProducto según el tipoItem
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

        // Parámetros para el query
        request.input('empresa', sql.VarChar(50), empresa);
        request.input('accion', sql.VarChar(80), accion);
        request.input('tipoProducto', sql.VarChar(80), tipoProducto);
        request.input('local', sql.VarChar(80), local);
        request.input('fechaInventario', sql.Date, new Date(fechaInventario));
        request.input('grupo', sql.Int, grupo);

        // Construir el query dinámicamente
        let query = `
            SELECT *
            FROM Reconteos
            WHERE FechaInventario = @fechaInventario
            AND NumeroReconteo = (
                SELECT MAX(NumeroReconteo)
                FROM Reconteos
                WHERE FechaInventario = @fechaInventario
                AND Clasif1 = @tipoProducto
                AND NumeroLocal = @local
                AND Empresa = @empresa
                AND grupoBodega = @grupo
                )`;

        logger.info(`Query ejecutado para validarCantidadReconteos: ${query}`);

        // Ejecutar la consulta
        const result = await request.query(query);
        
        const enProceso = result.recordset.filter(item => item.Estado === "EnProceso").length;
        const sinAsignar = result.recordset.filter(item => item.Usuario === "" && item.NombreDispositivo === "").length;
        const itemsRecibidos = result.recordset.filter(item => item.Estado === "Recibido").length;

        if (result.recordset.length === 0) {
            return { status: 200, data: { mensaje: 'sin registro de cierre de conteo', estado: 0 } };
        } else {
            return { status: 200, data: result.recordset[0], enProceso: enProceso  , sinAsignar : sinAsignar , itemsRecibidos:itemsRecibidos};
        }
    } catch (error) {
        console.error("Error:", error);
        return { status: 500, error: 'Error en el servidor al validarCierreInventario' };
    } finally {
      //  await closeDatabaseConnection();
    }
}

async function obtenerAlmacenamiento(data){
    
    let tipoProducto = '';
    console.log('Datos recibidos:', data);  // Log para ver los datos de entrada

    const { tipoItem, local , fechaInventario } = data;  // Desestructuramos los valores del objeto 'data'


    let query;

    try {
        logger.info(`Iniciamos la función obtenerAlmacenamiento services`);
        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();

        // Log para ver la consulta antes de ejecutarse
        console.log(`Ejecutamos la consulta con los parámetros obtenerAlmacenamiento : tipoItem=${tipoProducto}, local=${local}, fechaInventario=${fechaInventario}`);

        query = `SELECT * FROM BodegaMantenedor.dbo.registroInventarioAlmacen 
            WHERE empresa = 'MAKITA'
            AND tipoItem = @tipoItem
            AND local = @local
            And cast(fechaInventario as date) = @fechaInventario`;
            

        // Prevenimos SQL Injection usando parámetros en la consult
        request.input('tipoItem', sql.VarChar, tipoItem);
        request.input('local', sql.VarChar, local);
        request.input('fechaInventario', sql.Date, fechaInventario); // Asegúrate de que el tipo de dato sea correcto
     
        logger.info(`Ejecutamos la query de obtenerAlmacenamiento: ${query}`);

        const almacenamientoResponse = await request.query(query);

        console.log("=== Respuesta de la base de datos ===");
       // console.log("almacenamientoResponse",almacenamientoResponse);  
        
        if(almacenamientoResponse.recordset.length === 0) {
            return { status: 200, data: almacenamientoResponse  , info : { mensaje: `No hay datos en almacenmaientos para los filtros consultados`, estado: 0 } };
        }else{
            const totalItems = almacenamientoResponse.recordset.length;
            const totalCantidadAlmacen = almacenamientoResponse.recordset.reduce((total, item) => {
                return total + item.CantidadAlmacen;
              }, 0);

            return { status: 200, totalItems : totalItems , cantidadUnitaria : totalCantidadAlmacen  };
        }
  
    } catch (error) {
        console.log("Error:", error);  // Log del error
        return { status: 500, error: 'Error en el servidor al consultar almacenamiento' };
    } finally {
        await closeDatabaseConnection();
    }

}

async function obtenerAsignacionReconteos(data) {
    const { local, bodega, fechaInventario, tipoItem } = data;
    let tipoProducto;

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

    const data2 = {empresa, local, bodega,fechaInventario,tipoProducto, mes, periodo
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

async function obtenerResumenReconteos(data){
    
    let tipoProducto = '';
    console.log('Datos recibidos obtenerResumenReconteos :', data);  // Log para ver los datos de entrada

    const { tipoItem, numeroReconteo , fechaInventario } = data;  // Desestructuramos los valores del objeto 'data'

    
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
    
    let query;

    try {
        logger.info(`Iniciamos la función obtenerResumenReconteos services`);
        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();

        // Log para ver la consulta antes de ejecutarse
        console.log(`Ejecutamos la consulta obtenerResumenReconteos  con los parámetros  : tipoItem=${tipoProducto}, numeroReconteo=${numeroReconteo}, fechaInventario=${fechaInventario}`);

        query = `SELECT * FROM BodegaMantenedor.dbo.ResumenReconteos 
            WHERE empresa = 'MAKITA'
            AND tipoItem  = @tipoItem
            And cast(fechaInventario as date) = @fechaInventario`;
            

        // Prevenimos SQL Injection usando parámetros en la consult
        request.input('tipoItem', sql.VarChar, tipoProducto);
        request.input('fechaInventario', sql.Date, fechaInventario); // Asegúrate de que el tipo de dato sea correcto
     
        logger.info(`Ejecutamos la query de obtenerResumenReconteos: ${query}`);

        const resumenReconteoResponse = await request.query(query);

        console.log("=== Respuesta de la base de datos ===");
       // console.log("resumenReconteoResponse",resumenReconteoResponse);
       
       return { status: 200, data: resumenReconteoResponse.recordset };
    
    } catch (error) {
        console.log("Error:", error);  // Log del error
        return { status: 500, error: 'Error en el servidor al consultar almacenamiento' };
    } finally {
        await closeDatabaseConnection();
    }

}



module.exports = {
    obtenerReconteos,
    asignarReconteos,
    iniciarReconteo,
    validarCantidadReconteos,   
    siguienteReconteo,  
    obtenerAlmacenamiento,
    obtenerAsignacionReconteos,
    obtenerResumenReconteos
};
