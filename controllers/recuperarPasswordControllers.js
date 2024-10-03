const logger = require('../config/logger.js');
const { sendEmailWithDB  } = require('../config/email');


const usuariosServices = require('../services/usuarios-services/usuarioServices.js');

/**
 * Recuperar Password
 * @returns
 */
async function recuperarPassword(req, res) {
  try {
    console.log(req.body.usuario);
    const username = req.body.usuario;
    logger.info(`Iniciamos la función recuperarPassword controllers`);
   
    const getUser = await usuariosServices.getUserName(username);

    if(getUser.existe){
      const claveAleatoria = await generarClaveAleatoria(6);
      const email = getUser.email;
      const idUsuario = getUser.idUsuario;

      data= {
        password : claveAleatoria,
        email,
        idUsuario
      }
      let response = await sendEmailWithDB(data);
      
      if(response.status === 200){
       
        const updateUsers = await usuariosServices.editUserID(data);

        res.status(200).json({mensaje : getUser});
      }
    }else{
      res.status(200).json({mensaje : getUser});
    }

    
  } catch (error) {
    // Manejamos cualquier error ocurrido durante el proceso
    logger.error(`Error en recuperarPassword: ${error.message}`);
    res.status(500).json({
      error: `Error en el servidor [recuperarPassword] :  ${error.message}`,
    });
  } 
}

// Función para generar una clave aleatoria de 6 caracteres
async function generarClaveAleatoria(longitud) {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let resultado = '';
  for (let i = 0; i < longitud; i++) {
    const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
    resultado += caracteres[indiceAleatorio];
  }
  return resultado;
}


module.exports = {
  recuperarPassword
};
