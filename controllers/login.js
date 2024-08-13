const bcrypt = require('bcrypt');
const sql = require('mssql');
const { generateToken } = require('../auth/auth.js');
const loginServices = require('../services/login-services/loginServices.js');
const menuServices = require('../services/menu-services/menuServices.js');


async function login(req, res) {

    let showMenu; 
    try {
        const { nombreUsuario, clave } = req.body;
        
        const data = {
            nombreUsuario : nombreUsuario,
            clave: clave

        }
        
        const login = await loginServices.loginServices(data);
        if(login.status === 401){
            res.status(401).json({ error: login.error });
        }else{
            
            const token = generateToken(login);
            console.log("token : " , token);
            // Usuario autenticado, puedes devolver información del usuario y tokens de sesión

            if(login.data.Rol === 'Administrador'){
                showMenu = await menuServices.getAllMenuService();

            }else{
                showMenu = await menuServices.perfilConsulta();
            }
            
            const response = {
                ...login,
                data: {
                    ...login.data,
                    menu: showMenu,
                    token : token// Aquí agregas allMenu como una propiedad del objeto data
                }
            };
            
            res.status(login.status).json(response);
        }
        
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
}

module.exports = {
    login
};
