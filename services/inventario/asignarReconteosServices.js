
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

async function siguienteReconteo(data) {
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
            .output('NumeroID', sql.Int)
            .output('MensajeID', sql.Varchar)
            .execute('sp_GenerarSiguienteReconteo');

        logger.info(`Finalizó la ejecución de sp_GenerarSiguienteReconteo ${JSON.stringify(result)}`);

        return { status: 200, message: "Actualización realizada con éxito." };
    } catch (error) {
        console.log("Error:", error);
        return { status: 500, error: 'Error en el servidor al sp_GenerarSiguienteReconteo' };
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
        console.log('Iniciamos la función asignarReconteos services' , data);

        // Agrupar los datos por nombre
        const listaReconteos = data;

        console.log('Conexión a la base de datos establecida.');
        await connectToDatabase('BodegaMantenedor'); // Establecer conexión con la base de datos

        // Procesar cada grupo de datos por nombre
        for (let reconteo of listaReconteos) {
            console.log(`Procesando reconteo de ${reconteo.nombre}`);
            const { nombre , cantidad} = reconteo;
            const cantidadFinal = cantidad === undefined ? 1 : cantidad;
            // Iterar sobre los elementos en el arreglo 'data' dentro de cada grupo
            for (let itemData of reconteo.data) {
                const item = itemData.Item; // Obtener el Item de cada objeto
                console.log(`Procesando el Item: ${item}`);
                
                // Aquí realizamos directamente el UPDATE
                try {
                    const request = new sql.Request(); // Crear la solicitud SQL
                    
                    // Obtener los valores que necesitas para el UPDATE
                    const { Item } = itemData;

                    console.log(`
                        UPDATE reconteos
                        SET usuario = '${nombre}'
                        FROM reconteos r
                        INNER JOIN BodegaMantenedor.dbo.asignaCapturador A ON A.Usuario = '${nombre}'
                        WHERE r.Item = '${Item}'
                        and numeroReconteo = '${cantidadFinal}'
                    `);

                    // Crear la consulta SQL de actualización
                    const query = `
                        UPDATE reconteos
                            SET usuario = @nombre,
                            NombreDispositivo = A.Capturador
                            FROM reconteos r
                            INNER JOIN BodegaMantenedor.dbo.asignaCapturador A ON A.Usuario = @nombre
                            WHERE r.Item = @Item
                            and numeroReconteo = @cantidadFinal
                    `;

                    // Asignamos los parámetros para evitar inyecciones SQL
                    request.input('Item', sql.NVarChar, Item); // El parámetro para identificar el 'Item'
                    request.input('nombre', sql.NVarChar, nombre);
                    request.input('cantidadFinal', sql.Int, cantidadFinal);  
                    // Ejecutar la consulta SQL
                    const result = await request.query(query);

                    // Verificar si se actualizó algún registro
                    if (result.rowsAffected > 0) {
                        console.log(`Reconteo para el item ${item} procesado correctamente.`);
                    } else {
                        console.log(`No se pudo procesar el reconteo para el item ${item}.`);
                    }
                } catch (error) {
                    console.error(`Error al procesar el item ${item}:`, error);
                }
            }
        }

        return { status: 200, message: 'Reconteos procesados correctamente.' };

    } catch (error) {
        console.error("Error:", error);
        return { status: 500, error: 'Error al procesar los reconteos.' };
    }finally{
        await closeDatabaseConnection(); // Cerrar la conexión a la base de datos
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
    validarCantidadReconteos,   
    siguienteReconteo

    
};
