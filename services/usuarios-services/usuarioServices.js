const sql = require('mssql');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');

async function getAllUser(data) {
    try {
        
        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();
        
        // Buscar el usuario por NombreUsuario
        const getAllusers = await request.query('SELECT * FROM Usuarios');
        
       
        if (getAllusers.recordset.length === 0) {
            return ({ status: 401 ,  error: 'No existen Usuarios' });
        }

        const usuarios = getAllusers.recordset;
       
        return usuarios;

    } catch (error) {
        return { status: 500, error: 'Error en el servidor getAllUser' };
    } finally {
        await closeDatabaseConnection();
    }
}

module.exports = {
    getAllUser
}
