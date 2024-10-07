const sql = require('mssql');
const { connectToDatabase , closeDatabaseConnection} = require('../config/database.js');

async function sendEmailWithDB(data) {
    try {
         let body;
         
         await connectToDatabase('BdQMakita');
       
        console.log("dataaaaaaaaaaa : ", data);
        const request = new sql.Request(); // Nueva instancia de request en cada iteración
        let currentDate = new Date();
        let formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;

        let subject = `Cambio de clave`;
        let correo = data.email;
        let idUsuario = data.idUsuario;
        
        body = `Su clave temporal es: \n\n${data.password} \n\nAtte.:\nAdministrador - Sistemas\nMCL`;
        
        await request
            .input('profile_name', sql.VarChar, 'Sistemas')
            .input('recipients', sql.VarChar, correo)
            .input('copy_recipients', sql.VarChar, '')
            .input('subject', sql.VarChar, subject)
            .input('body', sql.VarChar, body)
            .input('importance', sql.VarChar, 'High')
            .input('body_format', sql.VarChar, 'TEXT')
            .execute('msdb.dbo.sp_send_dbmail');
            
            return ({status : 200});
    } catch (error) {
       
        throw error;
    } finally {
        await closeDatabaseConnection();
    }
}

module.exports = {
    sendEmailWithDB
};