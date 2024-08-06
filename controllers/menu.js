const bcrypt = require('bcrypt');
const sql = require('mssql');
const { connectToDatabase, closeDatabaseConnection } = require('../config/database.js');
const menuServices = require('../services/menu-services/menuServices.js');

async function getAllMenu(req, res) {
    try {
        
        const allMenu = await menuServices.getAllMenuService();

        if(allMenu.status === 401){
            res.status(401).json({ error: allMenu.error });
        }else{
            // Usuario autenticado, puedes devolver información del usuario y tokens de sesión
            res.status(200).json(allMenu);
        }
        
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    } finally {
        await closeDatabaseConnection();
    }
}

module.exports = {
    getAllMenu
};
