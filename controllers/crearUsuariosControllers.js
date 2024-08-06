
const logger = require('../config/logger.js');
const { connectToDatabase, closeDatabaseConnection } = require('../config/database.js');
const sql = require('mssql');
require('dotenv').config();
const moment = require('moment');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10; // Número de rondas de sal para bcrypt


/**
 * Insertamos un nuevo usuario de bodega
 * @returns 
 */
async function crearUsuarios(req, res) {
    try {
        console.log(req.body);
        const dataRequest = req.body;
        let responseData = [];
        let missingParams = [];

        logger.info(`Iniciamos la función crearUsuarios`);
        const {
            nombre: Nombre,
            apellido: Apellido,
            email: Email,
            area   : Area,
            rol: Rol,
            estado : Estado,
            fechaInicio: FechaInicio,
            fechaFin: FechaFin,
            nombreUsuario: NombreUsuario,
            clave: Clave
            
        } = dataRequest;

        // Verificación de parámetros requeridos
        const requiredParams = {
            Nombre,
            Apellido,
            Email,
            Area,
            Rol,
            Estado,
            FechaInicio,
            FechaFin,
            NombreUsuario,
            Clave
        };

        for (const [key, value] of Object.entries(requiredParams)) {
            if (!value || value === '') {
                missingParams.push(key);
            }
        }

        if (missingParams.length > 0) {
            const missingParamsMessage = `Los siguientes parámetros no pueden estar vacíos: ${missingParams.join(', ')}`;
            logger.error(missingParamsMessage);
            return res.status(400).json({ error: missingParamsMessage });
        }

        // Encriptar la contraseña
        const ClaveHash = await bcrypt.hash(Clave, SALT_ROUNDS);

        await connectToDatabase('BodegaMantenedor');
            
        const request = new sql.Request(); // Nueva instancia de request en caditeracióna 
        
        // Ejecutar el procedimiento almacenado con los parámetros
            result = await request
            .input('Nombre', sql.VarChar(50), Nombre)
            .input('Apellido', sql.VarChar(50), Apellido)
            .input('Email', sql.VarChar(100), Email)
            .input('Area', sql.VarChar(50), Area)
            .input('Rol', sql.VarChar(50), Rol)
            .input('Estado', sql.VarChar(20), Estado)
            .input('FechaInicio', sql.VarChar, formatDate(FechaInicio))
            .input('FechaFin', sql.VarChar, formatDate(FechaFin))
            .input('NombreUsuario', sql.VarChar(50), NombreUsuario)
            .input('ClaveHash', sql.VarChar(256), ClaveHash)
            
            
            .output('ResultadoID', sql.VarChar)
            .output('Mensaje', sql.VarChar)
            .execute('Crear_Usuario_SP');
            
            result.data = dataRequest;
            
            let resul = {
                output : result.output,
                data: result.data,
                
            }

            responseData.push(resul);

            logger.info(`Fin de la funcion crearUsuarios ${JSON.stringify(responseData)}`);
            
            res.status(200).json(responseData);
    
    } catch (error) {
        // Manejamos cualquier error ocurrido durante el proceso
        logger.error(`Error en crearUsuarios: ${error.message}`);
        res.status(500).json({ error: `Error en el servidor [crear-Usuarios] :  ${error.message}`  });
    }finally{
        await closeDatabaseConnection();
    }
}

/**
 * Formateamos Fecha
 * @param {*} date 
 * @returns 
 */
function formatDate(date) {
    
    if(date != null){
        const fechaMoment = moment(date, "DD-MM-YYYY");
        const fechaFormateada = fechaMoment.format("YYYY-MM-DD");
        return fechaFormateada;
    }
}


module.exports = {
    crearUsuarios
};
