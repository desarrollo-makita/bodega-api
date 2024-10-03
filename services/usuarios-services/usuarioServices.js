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
  let transaction;
  try {
    const dataRequest = data;
    let responseData = [];
    let missingParams = [];

    logger.info(`Iniciamos la función crearUsuarios`);
    const {
      nombre: Nombre,
      apellido: Apellido,
      email: Email,
      area: Area,
      rol: Rol,
      estado: Estado,
      fechaInicio: FechaInicio,
      fechaFin: FechaFin,
      nombreUsuario: NombreUsuario,
      clave: Clave,
      actividad: Actividad,
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
      .input('Apellido', sql.VarChar(50), Apellido)
      .input('Email', sql.VarChar(100), Email)
      .input('Area', sql.VarChar(50), Area)
      .input('Rol', sql.VarChar(50), Rol)
      .input('Estado', sql.VarChar(20), Estado)
      .input('FechaInicio', sql.VarChar, formatDate(FechaInicio))
      .input('FechaFin', sql.VarChar, formatDate(FechaFin))
      .input('NombreUsuario', sql.VarChar(50), NombreUsuario)
      .input('ClaveHash', sql.VarChar(256), ClaveHash)
      .input('Actividad', sql.VarChar(50), Actividad)
      .output('ResultadoID', sql.VarChar)
      .output('Mensaje', sql.VarChar)
      .execute('Crear_Usuario_SP');

    result.data = dataRequest;

    let resul = {
      output: result.output,
      data: result.data,
    };

    responseData.push(resul);

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
    const getAllusers = await request.query('SELECT * FROM Usuarios');

    console.log('*******', getAllusers);
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
    let query = `
            UPDATE Usuarios 
            SET Nombre = @Nombre,
                Apellido = @Apellido,
                Email = @Email,
                Area = @Area,
                Rol = @Rol,
                Estado = @Estado,
                FechaInicio = @FechaInicio,
                FechaFin = @FechaFin,
                NombreUsuario = @NombreUsuario,
                Actividad = @Actividad
        `;

    // Agregar ClaveHash solo si está definido
    if (claveHash) {
      query += `, ClaveHash = @ClaveHash`;
      request.input('ClaveHash', sql.VarChar, claveHash); // Añadir parámetro para ClaveHash
    }

    query += ` WHERE UsuarioID = @UsuarioID`;

    // Añadir todos los parámetros
    request.input('Nombre', sql.VarChar, data.nombre);
    request.input('Apellido', sql.VarChar, data.apellido);
    request.input('Email', sql.VarChar, data.email);
    request.input('Area', sql.VarChar, data.area);
    request.input('Rol', sql.VarChar, data.role);
    request.input('Estado', sql.VarChar, data.usuarioActivo);
    request.input('FechaInicio', sql.Date, data.fechaInicio);
    request.input('FechaFin', sql.Date, data.fechaFin);
    request.input('NombreUsuario', sql.VarChar, data.usuario);
    request.input('Actividad', sql.VarChar, data.actividad);
    request.input('UsuarioID', sql.Int, data.IdUsario); // Asume que UsuarioID es un entero

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
    if (transaction) await transaction.rollback(); // Revertir cambios en caso de error
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

/**
 * Traemos el suario desde la base de datos
 * @param {*} username
 * @returns true/false
 */
async function getUserName(username) {
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

    // Ejecutar la consulta de actualización dentro de la transacción
    const updateUsers = await request.query(`
            DELETE FROM Usuarios 
            WHERE UsuarioID = ${usuarioID}
        `);

    logger.info(`updateUsers usuariosServices :  ${updateUsers}`);
    if (updateUsers.rowsAffected[0] > 0) {
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
    let query = ` Update  Usuarios Set ClaveHash = '${claveHash}' where UsuarioID = ${data.idUsuario} `;

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

module.exports = {
  getAllUser,
  crearUsuarios,
  editUser,
  getUserName,
  deleteUser,
  editUserID,
};
