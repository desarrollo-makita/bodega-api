const bcrypt = require('bcrypt');
const sql = require('mssql');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');
const logger = require('../../config/logger.js');

async function loginServices(data) {
    try {
        
        const { nombreUsuario, clave } = data;
        logger.info(`Iniciamos la función loginServices services`);
        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();
        
        // Buscar el usuario por NombreUsuario
        const result = await request
            .input('NombreUsuario', sql.VarChar(50), nombreUsuario)
            .query('SELECT * FROM Usuarios WHERE NombreUsuario = @NombreUsuario');
        
        if (result.recordset.length === 0) {
            return ({status : 404 ,  error: 'Usuario o clave incorrectos' });
        }

        const user = result.recordset[0];
        const claveValida = await bcrypt.compare(clave, user.ClaveHash);
        
        if (!claveValida) {
            return ({status : 401 ,  error: 'Usuario o clave incorrectos' });
        }

        // Desestructurar el objeto para omitir la propiedad ClaveHash
        const { ClaveHash, ...restData } = user;

        // Usuario autenticado, puedes devolver información del usuario y tokens de sesión
        return({ status : 200 , message: 'Inicio de sesión exitoso', data: restData });
        
    } catch (error) {
        console.log("error : " , error);
        throw { status: 500, error: 'Error en el servidor' };
    } finally {
        await closeDatabaseConnection();
    }
}

async function validaClaveActual(data) {
    try {
        logger.info(`Iniciamos la función validaClaveActual Services`);
        const { nombreUsuario, clave } = data;
        console.log("Datos recibidos validaClaveActual : ", data);

        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();

        console.log('Ejecutando consulta SQL para buscar usuario...');
        const result = await request
            .input('NombreUsuario', sql.VarChar(50), nombreUsuario)
            .query('SELECT * FROM Usuarios WHERE NombreUsuario = @NombreUsuario');

        if (result.recordset.length === 0) {
            return {status: 404, error: 'Usuario no encontrado'};
        }

        const user = result.recordset[0];
        const claveValida = await bcrypt.compare(clave, user.ClaveHash);

        if (!claveValida) {
            return {status: 401, error: 'La clave actual no coincide con la registrada.'};
        }

       
        const { ClaveHash, ...restData } = user;

        return {status: 200, message: 'Las claves son iguales'};
    } catch (error) {
        console.error('Error al validar clave:', error); // Mejor manejo del error
        throw {status: 500, error: 'Error en el servidor'};
    } finally {
        await closeDatabaseConnection();
    }
}


module.exports = {
    loginServices,
    validaClaveActual
};
