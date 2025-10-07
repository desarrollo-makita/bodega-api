const bcrypt = require('bcrypt');
const sql = require('mssql');
const { connectToDatabase, closeDatabaseConnection } = require('../../config/database.js');


async function getAllMenuService(data) {
    try {
        
        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();
        
        // Buscar el usuario por NombreUsuario
        const getAllMenu = await request.query(`SELECT * FROM Menu WHERE ACTIVO ='SI'`);
        
       
        if (getAllMenu.recordset.length === 0) {
            return ({ status: 401 ,  error: 'No hay menu' });
        }

        const menu = getAllMenu.recordset;
       
        return menu;

    } catch (error) {
        return { status: 500, error: 'Error en el servidor' };
    } finally {
        await closeDatabaseConnection();
    }
}

async function perfilConsulta(data) {
    try {
        
        await connectToDatabase('BodegaMantenedor');
        const request = new sql.Request();
        
        // Buscar el usuario por NombreUsuario
        const consultaMenu = await request.query(`SELECT * FROM Menu where nombre  = 'inventario' `);
       
        if (consultaMenu.recordset.length === 0) {
            return ({ status: 401 ,  error: 'No hay menu' });
        }

        const menuConsulta = consultaMenu.recordset;
       
        return menuConsulta;

    } catch (error) {
        return { status: 500, error: 'Error en el servidor' };
    } finally {
        await closeDatabaseConnection();
    }
}

module.exports = {
    getAllMenuService , perfilConsulta
};
