const sql = require('mssql');
const {
  connectToDatabase,
  closeDatabaseConnection,
} = require('../../config/database.js');
const bcrypt = require('bcrypt');
const logger = require('../../config/logger.js');
const moment = require('moment');

const SALT_ROUNDS = 10; // Número de rondas de sal para bcrypt

/**
 * Insertamos un nuevo usuario de bodega
 * @returns
 */
async function crearUsuarios(data) {
  console.log("datos del usuario : " ,data);
  let transaction;
  try {
    const dataRequest = data;
    const actividades = data.actividad;
    let missingParams = [];

    logger.info(`Iniciamos la función crearUsuarios ${JSON.stringify(data)}`);
    const {
      nombre: Nombre,
      apellidoPaterno: ApellidoPaterno,
      apellidoMaterno: ApellidoMaterno,
      email: Email,
      area: Area,
      rol: Rol,
      estado: Estado,
      fechaInicio: FechaInicio,
      fechaFin: FechaFin,
      nombreUsuario: NombreUsuario,
      clave: Clave,
      
    } = dataRequest;

    // Verificación de parámetros requeridos
    const requiredParams = {
      Nombre,
      ApellidoPaterno,
      ApellidoMaterno,
      Email,
      Area,
      Rol,
      Estado,
      FechaInicio,
      FechaFin,
      NombreUsuario,
      Clave,
     
    };

    for (const [key, value] of Object.entries(requiredParams)) {
      if (!value || value === '') {
        missingParams.push(key);
      }
    }

    if (missingParams.length > 0) {
      const missingParamsMessage = `Los siguientes parámetros no pueden estar vacíos: ${missingParams.join(
        ', '
      )}`;
      logger.error(missingParamsMessage);
      return { status: 400, error: missingParamsMessage };
    }

    // Encriptar la contraseña
    const ClaveHash = await bcrypt.hash(Clave, SALT_ROUNDS);

    // Conectar a la base de datos y comenzar la transacción
    await connectToDatabase('BodegaMantenedor');
    transaction = new sql.Transaction();
    await transaction.begin();

    const request = new sql.Request(transaction); // Pasar la transacción al request

    // Ejecutar el procedimiento almacenado con los parámetros
    const result = await request
      .input('Nombre', sql.VarChar(50), Nombre)
      .input('ApellidoPaterno', sql.VarChar(50), ApellidoPaterno)
      .input('ApellidoMaterno', sql.VarChar(50), ApellidoMaterno)
      .input('Email', sql.VarChar(100), Email)
      .input('Area', sql.VarChar(50), Area)
      .input('Rol', sql.VarChar(50), Rol)
      .input('Estado', sql.VarChar(20), Estado)
      .input('FechaInicio', sql.VarChar, formatDate(FechaInicio))
      .input('FechaFin', sql.VarChar, formatDate(FechaFin))
      .input('NombreUsuario', sql.VarChar(50), NombreUsuario)
      .input('ClaveHash', sql.VarChar(256), ClaveHash)
      .output('Mensaje', sql.VarChar)
      .output('StatusID', sql.Int)
      .output('UsuarioID', sql.Int)
      .execute('Crear_Usuario_SP');

    result.data = dataRequest;

    let resul = {
      output: result.output,
      data: result.data,
    };

    logger.info(`Fin de la función crearUsuarios ${JSON.stringify(resul)}`);
    // Hacer commit de la transacción
  await transaction.commit();
    return { status: 200, resul };
  
  } catch (error) {
    // Si ocurre un error, hacer rollback de la transacción
    if (transaction) {
      await transaction.rollback();
    }
    logger.error(`Error en crearUsuarios services: ${error.message}`);
    return {
      status: 500,
      error: `Error en el servidor [crear-Usuarios] :  ${error.message}`,
    };
  } finally {
    await closeDatabaseConnection();
  }
}

async function getAllUser() {
  try {
    
    logger.info(`Iniciamos la función getAllUser services`);
    await connectToDatabase('BodegaMantenedor');
    const request = new sql.Request();

    // Buscar el usuario por NombreUsuario
    const getAllusers = await request.query(`
      SELECT u.*, ua.actividadID, ua.nombreActividad
      FROM usuarios u
      LEFT JOIN UsuarioActividades ua ON u.UsuarioID = ua.usuarioId`);
    
      if (getAllusers.recordset.length === 0) {
      return { status: 404, error: 'No existen Usuarios' };
    }

    const usuarios = getAllusers.recordset;

    return { status: 200, data: usuarios };
  } catch (error) {
    return { status: 500, error: 'Error en el servidor getAllUser' };
  } finally {
    await closeDatabaseConnection();
  }
}

async function editUser(data) {
 
  let transaction;
  try {
    logger.info(`Iniciamos la función editUser ${JSON.stringify(data)}`);
   
    const {
      IdUsuario: UsuarioID,
      nombre: Nombre,
      apellidoPaterno: ApellidoPaterno,
      apellidoMaterno:ApellidoMaterno,
      email: Email,
      area: Area,
      role: Rol,
      usuarioActivo: Estado,
      fechaInicio: FechaInicio,
      fechaFin: FechaFin,
      usuario: NombreUsuario,
      
      
    } = data;
    console.log("dataaaa: " , data);
    
    
    // Encriptar la contraseña solo si se proporciona
    let claveHash = data.clave ? await bcrypt.hash(data.clave, SALT_ROUNDS) : null;
    console.log('claveHash : ', claveHash);
   
  // Conectar a la base de datos y comenzar la transacción
  await connectToDatabase('BodegaMantenedor');
  
  const request = new sql.Request(transaction); // Pasar la transacción al request

  // Ejecutar el procedimiento almacenado con los parámetros
  const result = await request
    .input('Nombre', sql.VarChar(50), Nombre)
    .input('ApellidoPaterno', sql.VarChar(50), ApellidoPaterno)
    .input('ApellidoMaterno', sql.VarChar(50), ApellidoMaterno)
    .input('Email', sql.VarChar(100), Email)
    .input('Area', sql.VarChar(50), Area)
    .input('Rol', sql.VarChar(50), Rol)
    .input('Estado', sql.VarChar(20), Estado)
    .input('FechaInicio', sql.DateTime, formatDate(FechaInicio))
    .input('FechaFin', sql.DateTime, formatDate(FechaFin))
    .input('NombreUsuario', sql.VarChar(50), NombreUsuario)
    .input('ClaveHash', sql.VarChar(256), claveHash)
    .input('UsuarioID' , sql.Int, UsuarioID)
    .output('Mensaje', sql.VarChar)
    .output('StatusID', sql.Int)
    
    .execute('Update_Usuario_SP');
    
    logger.info(`Fin de la  la función editUser ${JSON.stringify(result)}`);
    if(result.output.StatusID === 1){
     
      return { status: 200, message: result.output.Mensaje , codigoMensaje : result.output.StatusID , dataUsuario : data};
    }else{
     
      return { status: 200, message: result.output.Mensaje , codigoMensaje : result.output.StatusID , dataUsuario: data };
    }
    
    
    
  } catch (error) {
    
    console.log('error : ', error);
    return { status: 500, error: 'Error en el servidor editUser' };
  } finally {
    await closeDatabaseConnection();
  }
}


/**
 * Formateamos Fecha
 * @param {*} date
 * @returns
 */
function formatDate(date) {
  console.log('date _: ', date);
  if (date != null) {
    const fechaMoment = moment(date);
    const fechaFormateada = fechaMoment.format('YYYY-MM-DD');
    console.log('Fecha dos : ', fechaFormateada);
    return fechaFormateada;
  }
}

async function insertarActividades(actividadList, usuarioID, nombreUsuario) {
  let responseActividad;
  let result;

  console.log("actividadList", actividadList);
  try {
      
      // Iniciamos la conexión solo una vez
      await connectToDatabase('BodegaMantenedor');

      logger.info(`Iniciamos la función insertarActividades ${JSON.stringify(actividadList)} , ${usuarioID}`);

      // Recorremos la lista de actividades
      for (const actividad of actividadList) {
          const request = new sql.Request(); // Nueva instancia de request en cada iteración

          result = await request
              .input('UsuarioID', sql.Int, usuarioID)
              .input('NombreUsuario', sql.NVarChar(50), nombreUsuario)
              .input('NombreActividad', sql.NVarChar(50), actividad.nombreActividad)
              .input('CodigoActividad', sql.Int, actividad.codigoActividad)
              .execute('Insertar_Actividad_SP'); // Asegúrate de usar await aquí

          logger.info(`Actividad ${actividad.nombreActividad} insertada correctamente.`);
      }

      responseActividad = result;
      logger.info(`Finalizamos la función insertarActividades ${JSON.stringify(actividadList)} , ${usuarioID}`);

      return responseActividad;

  } catch (error) {
      logger.error(`Error en insertarActividades: ${error.message}`);
  }
}


/**
 * Traemos el usuario desde la base de datos
 * @param {*} username
 * @returns true/false
 */
async function getUserNameService(username) {
  let emai;
  try {
    logger.info(`Iniciamos la función getUserName usuarioService`);
    await connectToDatabase('BodegaMantenedor');
    const request = new sql.Request();

    // Buscar el usuario por NombreUsuario
    const user = await request.query(
      `SELECT *  FROM Usuarios where NombreUsuario =  '${username}'`
    );

    if (user.recordset && user.recordset.length > 0) {
      user.recordset.forEach(element => {
        email = element.Email;
        usuarioID =element.UsuarioID
      });
      return { status: 200, mensaje: 'usuario encontrado', existe: true , email: email , idUsuario : usuarioID };
    } else {
      return {status: 200, mensaje: 'usuario no encontrado', existe: (boolean = false),
        
      };
    }
  } catch (error) {
    return {
      status: 500,
      error: `Error en el servidor getUserName ${error.message}`,
    };
  } finally {
    await closeDatabaseConnection();
  }
}

async function deleteUser(data) {
  logger.info(
    `Iniciamos la función deleteUser usuariosServices ${JSON.stringify(data)}`
  );
  let transaction;
  try {
    const usuarioID = data.idUsuario;
    if (usuarioID === undefined || usuarioID === null) {
      console.error('UsuarioID es undefined o null');
    } else {
      console.log('UsuarioID:', usuarioID);
    }
    await connectToDatabase('BodegaMantenedor');

    // Crear una nueva transacción
    transaction = new sql.Transaction();
    await transaction.begin();
    const request = new sql.Request(transaction); // Usa la transacción en la solicitud

    const result = await request
      .input('usuarioID', sql.VarChar(50), usuarioID)
      .execute('Eliminar_Usuario_SP');

    logger.info(`deleteUser deleteUserServices :  ${JSON.stringify(result)}`);
    if (result.rowsAffected[0] > 0) {
      await transaction.commit(); // Confirma la transacción si todo va bien
      return { status: 200, message: 'Usuario eliminado correctamente' };
    } else {
      await transaction.rollback(); // Revertir cambios si no se realizó ninguna actualización
      return {
        status: 401,
        error: 'No existen Usuarios o no se realizaron cambios',
      };
    }
  } catch (error) {
    console.log(error, 'eeror');
    if (transaction) await transaction.rollback(); // Revertir cambios en caso de error
    console.log('error : ', error);
    return { status: 500, error: 'Error en el servidor deleteUser' };
  } finally {
    await closeDatabaseConnection();
  }
}

async function editUserID(data) {
  let transaction;
  try {
    console.log('data : ', data);
    // Encriptar la contraseña solo si se proporciona
    let claveHash = data.password
      ? await bcrypt.hash(data.password, SALT_ROUNDS)
      : null;
    console.log('claveHash : ', claveHash);

    await connectToDatabase('BodegaMantenedor');
    // Crear una nueva transacción
    transaction = new sql.Transaction();
    await transaction.begin();
    const request = new sql.Request(transaction); // Usa la transacción en la solicitud

    // Construir la consulta SQL de manera dinámica
    let query = ` Update  Usuarios Set ClaveHash = '${claveHash}' , recuperarClave = 1  where UsuarioID = ${data.idUsuario} `;

    request.input('UsuarioID', sql.Int, data.IdUsuario); // Asume que UsuarioID es un entero

    // Ejecutar la consulta de actualización dentro de la transacción
    const updateUsers = await request.query(query);

    console.log('updateUser', updateUsers);
    if (updateUsers.rowsAffected[0] > 0) {
      await transaction.commit(); // Confirma la transacción si todo va bien
      return { status: 200, message: 'Usuario actualizado correctamente' };
    } else {
      await transaction.rollback(); // Revertir cambios si no se realizó ninguna actualización
      return {
        status: 401,
        error: 'No existen Usuarios o no se realizaron cambios',
      };
    }
  } catch (error) {
    console.log('errorrr', error);
    if (transaction) await transaction.rollback(); // Revertir cambios en caso de error
    console.log('error : ', error);
    return { status: 500, error: 'Error en el servidor editUser' };
  } finally {
    await closeDatabaseConnection();
  }
}

async function replacePasswordId(data) {
  let transaction;
  try {
   
    // Encriptar la contraseña solo si se proporciona
    let claveHash = data.password
      ? await bcrypt.hash(data.password, SALT_ROUNDS)
      : null;
    console.log('claveHash : ', claveHash);

    await connectToDatabase('BodegaMantenedor');
    // Crear una nueva transacción
    transaction = new sql.Transaction();
    await transaction.begin();
    const request = new sql.Request(transaction); // Usa la transacción en la solicitud

    // Construir la consulta SQL de manera dinámica
    let query = ` Update  Usuarios Set ClaveHash = '${claveHash}' , recuperarClave = 0  where UsuarioID = ${data.idUsuario} `;

    request.input('UsuarioID', sql.Int, data.IdUsuario); // Asume que UsuarioID es un entero

    // Ejecutar la consulta de actualización dentro de la transacción
    const updateUsers = await request.query(query);

    console.log('updateUser', updateUsers);
    if (updateUsers.rowsAffected[0] > 0) {
      await transaction.commit(); // Confirma la transacción si todo va bien
      return { status: 200, message: 'Usuario actualizado correctamente' };
    } else {
      await transaction.rollback(); // Revertir cambios si no se realizó ninguna actualización
      return {
        status: 401,
        error: 'No existen Usuarios o no se realizaron cambios',
      };
    }
  } catch (error) {
    console.log('errorrr', error);
    if (transaction) await transaction.rollback(); // Revertir cambios en caso de error
    console.log('error : ', error);
    return { status: 500, error: 'Error en el servidor editUser' };
  } finally {
    await closeDatabaseConnection();
  }
}

async function eliminarActividades(usuarioID) {
  try {

    await connectToDatabase('BodegaMantenedor');
    logger.info(`Iniciamos la función eliminarActividades services ${usuarioID}`);
      const request = new sql.Request();
      await request
          .input('UsuarioID', sql.Int, usuarioID)
          .execute('Eliminar_Actividades_SP'); // Crea este SP para eliminar todas las actividades de un usuario

      logger.info(`Actividades del usuario ${usuarioID} eliminadas correctamente.`);

  } catch (error) {
      logger.error(`Error al eliminar actividades: ${error.message}`);
      throw error; // Lanzamos el error para que no continúe si hay un problema
  }
}

module.exports = {
  getAllUser,
  crearUsuarios,
  editUser,
  getUserNameService,
  deleteUser,
  editUserID,
  replacePasswordId,
  insertarActividades,
  eliminarActividades
};
