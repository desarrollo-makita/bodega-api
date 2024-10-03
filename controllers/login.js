const sql = require('mssql');
const { generateToken } = require('../auth/auth.js');
const loginServices = require('../services/login-services/loginServices.js');
const menuServices = require('../services/menu-services/menuServices.js');
const moment = require('moment');
const logger = require('../config/logger.js');

async function login(req, res) {
  logger.info(`Iniciamos la función login controllers`);
  let showMenu;
  try {
    const { nombreUsuario, clave } = req.body;
    console.log(req.body);
    const data = {
      nombreUsuario: nombreUsuario,
      clave: clave,
    };

    const login = await loginServices.loginServices(data);
    console.log('loginResponse :;', login);
    if (login.status === 401) {
      res.status(401).json({ error: login.error });
    } else {
      // Validar las fechas de inicio y fin
      const { FechaInicio, FechaFin } = login.data;

      // Convierte las fechas a objetos de tipo moment, ajustando a la fecha sin hora
      const fechaInicio = moment(FechaInicio).startOf('day');

      const fechaFin = moment(FechaFin).endOf('day'); // Ajuste al final del día

      const fechaActual = moment().startOf('day'); // Fecha actual sin hora

      const vigencia = fechaFin.diff(fechaActual, 'days'); // Días de vigencia

      // Comprueba si la fecha actual está fuera del rango de FechaInicio y FechaFin
      if (fechaActual.isBefore(fechaInicio) || fechaActual.isAfter(fechaFin)) {
        return res.status(403).json({
          status: 403,
          message: 'Usuario fuera del periodo de acceso permitido',
        });
      }

      const token = generateToken(login, vigencia);
      console.log('token : ', token);
      console.log('login : ', login);
      // Usuario autenticado, puedes devolver información del usuario y tokens de sesión

      if (login.data.Rol === 'Administrador') {
        showMenu = await menuServices.getAllMenuService();
      } else {
        showMenu = await menuServices.perfilConsulta();
      }

      const response = {
        ...login,
        data: {
          ...login.data,
          menu: showMenu,
          token: token,
          vigencia: vigencia, // Aquí agregas allMenu como una propiedad del objeto data
        },
      };

      console.log('response : ', response);
      res.status(login.status).json(response);
    }
  } catch (error) {
    console.log('error', error);
    res
      .status(500)
      .json({ error: `Error en el servidor ${JSON.stringify(error)}` });
  }
}

async function validaClaveActual(req, res) {
  logger.info(`Iniciamos la función validaClaveActual controllers`);
  console.log('ingresamos al validaClaveActual', req.body);
  try {
    const { nombreUsuario, password } = req.body;
    const data = {
      nombreUsuario: nombreUsuario,
      password: password,
    };
    const claveActual = await loginServices.validaClaveActual(data);
    console.log('clave actual : ', claveActual);

    if (claveActual.status === 401 || claveActual.status === 404) {
      res
        .status(401)
        .json({ mensaje: claveActual.mensaje, status: claveActual.status });
    } else {
      const response = claveActual;
      console.log('response : ', claveActual);
      res.status(claveActual.status).json(response);
    }
  } catch (error) {
    console.log('error', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
}

module.exports = {
  login,
  validaClaveActual,
};
