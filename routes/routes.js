const express = require('express');
const router = express.Router();
const { generateToken, verifyToken } = require('../auth/auth');
const {
  crearUsuarios,
  getAllUsers,
  editUser,
  getUserName,
  deletetUser,
  editUserID,
} = require('../controllers/usuariosControllers');
const { login, validaClaveActual } = require('../controllers/login');
const { getAllMenu } = require('../controllers/menu');
const {obtenerUbicacionItem,actualizaUbicacion} = require('../controllers/obtenerUbicacionControllers');
const {recuperarPassword , replacePassword} = require('../controllers/recuperarPasswordControllers');
const {insertarInfo} = require('../controllers/insertarInfoDispositivoControllers');
const {getAllareas , deletetArea , insertarArea} = require('../controllers/areasControllers');
const {getAllActividades , getActividadId} = require('../controllers/actividadesControllers');
const{insertarRegistroUbicacion , obtenerUbicacionFecha} = require('../controllers/insertarRegistroUbicacionControllers');
const {getListadoPicking , getPickingFolio , getPickingFolioDetalle} = require('../controllers/capturadorSerie/listadoPickingControllers');
const {updateEnProcesoCaptura  , insertarCapturas, updateSolicitadoCaptura , insertarCapturasAccesorios} = require('../controllers/capturadorSerie/updateCapturaSerieControllers');
const {obtenerHerramienta} = require('../controllers/generarEtiqueta/generarEtiquetaControllers');
const {obtenerStock} = require('../controllers/obtenerStock/obtenerStockControllers');
const {generarPdf417 , consultarCargador, consultarEquivalenciaItem , insertaDataBitacoraEquisZ} = require('../controllers/generarPDF417/generarPDF417Controllers');
const {obtenerListaKit,insertarItemKitCabecera , insertarDataKitDetalle ,eliminarDataKitDetalle, eliminarItemKitCabecera} = require('../controllers/consultarKIT/consultarKITControllers');
const {
  consultarInventario , 
  asignarCapturador , 
  consultarAsignacion , 
  deletetAsignacion, 
  consultarAsignacionFiltro, 
  validarInicioInventario,
  insertarInventario,
  obtenerUltimaUbicacion,
  validarUbicacionProducto,
  validarTipoItem,
  consularGrupoBodega,
  iniciarInventario,
  actualizarConteoCierre,
  actualizarConteoSinCierre,
  validarCierreInventario,
  obtenerItemsreconteos,
  iniciarReconteos,
  siguienteReconteo
  
} = require('../controllers/inventario/inventarioControllers');

const {
  asignarReconteos , 
  validarCantidadReconteos,
  insertarReconteo,
  obtenerReconteo,  
  obtenerGrupoBodega} = require('../controllers/inventario/reconteosControllers');




// endpoint de usuarios
router.post('/crear-usuarios', crearUsuarios);
router.put('/editar-usuarios', verifyToken, editUser);
router.get('/get-all-users', verifyToken, getAllUsers);
router.get('/get-nombre-usuario', getUserName);
router.delete('/delete-usuario', verifyToken, deletetUser);
router.put('/editar-usuarios-id', verifyToken, editUserID);

// endpoint login
router.post('/login', login);
router.post('/valida-clave-actual', validaClaveActual);
router.post('/recuperar-password', recuperarPassword);
router.put('/replace-password-id', replacePassword);

// endpoint Menu
router.get('/get-all-menu', getAllMenu);

// endpoint ubicaciones
router.get('/obtener-ubicacion/:item', obtenerUbicacionItem);
router.put('/actualiza-ubicacion/', actualizaUbicacion);
router.post('/insertar-registro-ubicacion', insertarRegistroUbicacion);
router.get('/obtener-bitacora-ubicacion-fecha/:fecha', obtenerUbicacionFecha);// bitacora ubicaciones

// guarda info dispositivo
router.post('/insertar-info-dispositivo', insertarInfo);

// Endpoint para mantenedor de Areas 
router.get('/get-all-areas', getAllareas);
router.delete('/delete-area', deletetArea);
router.post('/insertar-nueva-area', insertarArea);

// Endpoint para mantenedor de Actividades
router.get('/get-all-actividades' , getAllActividades)
router.get('/get-actividad-id/:idActividad' , getActividadId)

//Listado de picking , proceso captura de serie Por numero Folio
router.get('/get-all-pickingList/:area' , getListadoPicking )
router.get('/get-picking-folio/:folio' , getPickingFolio )
router.get('/get-picking-correlativo-detalle/:correlativo/:area' , getPickingFolioDetalle )

//actualiza estado de captura enProceso y procesado
router.put('/actualiza-glosa-enproceso/', updateEnProcesoCaptura);
router.post('/insertar-datos-capturados', insertarCapturas);
router.post('/insertar-datos-capturados-accesorios', insertarCapturasAccesorios);
router.put('/update-glosa-solicitado', updateSolicitadoCaptura);

//generacion pdf417 etiquetado
router.get('/generar-etiquetaC/:Item', obtenerHerramienta);

//Consulta stock por item bodega 02
router.get('/consultar-stock-item/:item', obtenerStock);

//Generar PDF417 para item Z
router.post('/generar-pdf417', generarPdf417);
router.get('/get-item-cargador/:item' , consultarCargador )
router.get('/get-equivalencia-item/:item' , consultarEquivalenciaItem )
router.post('/inserta-data-bitacora-equisZ' , insertaDataBitacoraEquisZ )

//KIT
router.get('/get-lista-kit/:item' , obtenerListaKit )
router.post('/inserta-data-kit-detalle' , insertarDataKitDetalle )
router.post('/inserta-data-cabecera-kit' , insertarItemKitCabecera )
// Nuevas rutas para eliminar datos en caso de error
router.delete('/elimina-data-kit-detalle', eliminarDataKitDetalle);
router.delete('/elimina-data-cabecera-kit', eliminarItemKitCabecera);

//inventario
router.get('/consultar-inventario' , consultarInventario );
router.post('/asignar-capturador' , asignarCapturador );
router.get('/consultar-asignacion' , consultarAsignacion );
router.delete('/delete-asignacion',  deletetAsignacion);
router.get('/validar-inicio-inventario/:fechaInventario',  validarInicioInventario);
router.get('/consultar-asignacion-filtro/:capturador/:mes/:periodo',  consultarAsignacionFiltro);
router.post('/insertar-inventario/', insertarInventario);
router.get('/insertar-inventario/:tipoinventario/:tipoitem/:usuario/:fechainventario/:bodega', obtenerUltimaUbicacion);
router.get('/insertar-inventario/:fechainventario/:item/:ubicacion/:usuario', validarUbicacionProducto);
router.get('/insertar-inventario/:item/:tipoitem', validarTipoItem);
router.get('/consultar-grupo-bodega' , consularGrupoBodega );
router.post('/iniciar-inventario' , iniciarInventario );
router.post('/actualizar-conteo-cierre' , actualizarConteoCierre );
router.post('/actualizar-conteo-sin-cierre' , actualizarConteoSinCierre );
router.get('/validar-cierre-inventario',  validarCierreInventario);
router.post('/consultar-reconteos' , obtenerItemsreconteos );
router.post('/asignar-reconteos' , asignarReconteos );
router.post('/iniciar-reconteos' , iniciarReconteos );
router.get('/validar-cantidad-reconteos',  validarCantidadReconteos);

router.post('/insertar-inventario-reconteo/', insertarReconteo);
router.get('/insertar-inventario/:empresa/:agno/:mes/:tipoinventario/:numerolocal/:tipoitem/:usuario/:grupobodega', obtenerReconteo);
router.get('/insertar-inventario-grupo/:empresa/:NumeroLocal', obtenerGrupoBodega);

router.post('/siguiente-reconteo' , siguienteReconteo );


module.exports = router;
