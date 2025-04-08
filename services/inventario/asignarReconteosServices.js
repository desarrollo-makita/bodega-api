
const sql = require('mssql');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');
const logger = require('../../config/logger.js');
const { js2xml } = require('xml-js');


async function obtenerReconteos(data) {
    const {local , grupoBodega , fechaInventario , tipoItem} = data; // Desestructuramos los valores del objeto 'data'

    try {
        logger.info(`Iniciamos la función obtenerItemsReconteos services ${data}`);

        // Conectamos a la base de datos
        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();

        // Definimos la query con parámetros para prevenir SQL Injection
       const query = `
           select * from BodegaMantenedor.dbo.Reconteos 
			where Empresa = 'Makita'
            and NumeroLocal = '01' 
			and GrupoBodega  = 1
			and FechaInventario = '2025-03-28'
			and Clasif1  = 'ACCESORIOS' 
            order by Ubicacion desc
        `;

        // Asignamos los valores a los parámetros
        request.input('empresa', sql.VarChar, 'Makita');
        request.input('FechaInventario', sql.Date, fechaInventario);
        request.input('NumeroLocal', sql.VarChar, local);
        request.input('GrupoBodega', sql.VarChar, grupoBodega);
        request.input('Clasif1', sql.VarChar, 'HERRAMIENTAS');
        
        logger.info(`Ejecutamos la query de asignación: ${query}`);
        
        const responseReconteos =  await request.query(query);

        return { status: 200, data : responseReconteos.recordset };
    } catch (error) {
        logger.error(`Error al asignar capturador: ${error.message}`);
        console.log("Error:", error);

        // Verificamos si el error es una violación de clave única
        if (error.message.includes('Violation of UNIQUE KEY constraint')) {
            // En caso de duplicado, devolvemos HTTP 409
            return { status: 409, error: 'El capturador ya está asignado.' };
        }

        // Para otros errores, devolvemos HTTP 500
        return { status: 500, error: `Error en el servidor al asignar capturador: ${error.message}` };
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



module.exports = {
    obtenerReconteos,
    asignarReconteos
    
};
