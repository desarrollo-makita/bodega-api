const bcrypt = require('bcrypt');
const sql = require('mssql');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');


async function loginServices(data) {
    try {
        
        const { nombreUsuario, clave } = data;
        
        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();
        
        // Buscar el usuario por NombreUsuario
        const result = await request
            .input('NombreUsuario', sql.VarChar(50), nombreUsuario)
            .query('SELECT * FROM Usuarios WHERE NombreUsuario = @NombreUsuario');
        
        if (result.recordset.length === 0) {
            return ({status : 401 ,  error: 'Usuario o clave incorrectos' });
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
        throw { status: 500, error: 'Error en el servidor' };
    } finally {
        await closeDatabaseConnection();
    }
}

module.exports = {
    loginServices
};
