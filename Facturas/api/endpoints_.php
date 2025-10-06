<?php
// ACTIVAR DEBUG TEMPORALMENTE
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
// api/endpoints.php - Versión corregida sin errores de sintaxis
error_reporting(E_ALL);
ini_set('display_errors', 0); // Desactivar para producción
ini_set('log_errors', 1);

// Configurar sesión
session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'domain' => $_SERVER['HTTP_HOST'] ?? 'localhost',
    'secure' => false, // Cambiar a true en HTTPS
    'httponly' => true,
    'samesite' => 'Strict'
]);

session_start();

// Headers CORS y JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Función para enviar respuesta JSON
function sendJsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Función para manejar errores
function handleError($message, $details = null) {
    error_log("API Error: $message" . ($details ? " - Details: " . print_r($details, true) : ""));
    sendJsonResponse([
        'success' => false,
        'error' => true,
        'message' => $message
    ], 500);
}

// Obtener la acción de la URL
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Log de la petición
error_log("API Request: action=$action, method=$method, IP=" . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));

try {
    // Switch principal de acciones
    switch ($action) {
        case 'test_connection':
            sendJsonResponse([
                'success' => true,
                'message' => 'Conexión exitosa desde endpoints.php',
                'timestamp' => date('Y-m-d H:i:s'),
                'method' => $method,
                'php_version' => PHP_VERSION,
                'server' => $_SERVER['HTTP_HOST'] ?? 'localhost'
            ]);
            break;
            
        case 'check_database':
            // Verificar conexión a base de datos
            if (!file_exists('../config/database.php')) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Archivo config/database.php no encontrado'
                ]);
            }
            
            require_once '../config/database.php';
            
            try {
                $database = new Database();
                $pdo = $database->getConnection();
                
                if (!$pdo) {
                    throw new Exception('No se pudo establecer conexión con la base de datos');
                }
                
                // Probar consulta simple
                $stmt = $pdo->query("SELECT 1 as test, NOW() as fecha_actual");
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                sendJsonResponse([
                    'success' => true,
                    'message' => 'Conexión a base de datos exitosa',
                    'test_result' => $result
                ]);
                
            } catch (Exception $e) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de base de datos: ' . $e->getMessage()
                ]);
            }
            break;
            
        case 'login':
            if ($method !== 'POST') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || !isset($data['username']) || !isset($data['password'])) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Datos incompletos'
                ]);
            }
            
            // Cargar clases necesarias
            require_once '../config/database.php';
            require_once '../classes/Auth.php';
            
            $database = new Database();
            $pdo = $database->getConnection();
            
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            $auth = new Auth($pdo);
            $result = $auth->login($data['username'], $data['password']);
            
            sendJsonResponse($result);
            break;
            
        case 'verificar_sesion':
            if ($method !== 'GET') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            if (isset($_SESSION['admin_id'])) {
                sendJsonResponse([
                    'success' => true,
                    'user' => [
                        'id' => $_SESSION['admin_id'],
                        'username' => $_SESSION['admin_username'] ?? 'admin',
                        'nombre' => $_SESSION['admin_nombre'] ?? 'Administrador'
                    ]
                ]);
            } else {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'No hay sesión activa'
                ]);
            }
            break;
            
        case 'logout':
            if ($method !== 'POST') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            // Cargar clases necesarias
            require_once '../config/database.php';
            require_once '../classes/Auth.php';
            
            $database = new Database();
            $pdo = $database->getConnection();
            $auth = new Auth($pdo);
            $result = $auth->logout();
            
            sendJsonResponse($result);
            break;
            
        case 'crear_usuario':
            if ($method !== 'POST') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Datos no válidos'
                ]);
            }
            
            // Cargar clases necesarias
            require_once '../config/database.php';
            require_once '../classes/Usuario.php';
            require_once '../classes/Factura.php';
            
            $database = new Database();
            $pdo = $database->getConnection();
            
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            $usuario = new Usuario($pdo);
            $factura = new Factura($pdo);
            
            // Crear usuario
            $usuarioId = $usuario->crear($data);
            
            if ($usuarioId) {
                // Crear factura inicial si se proporcionaron datos
                if (isset($data['tipoServicio']) && isset($data['precio'])) {
                    $facturaData = [
                        'usuario_id' => $usuarioId,
                        'tipo_servicio' => $data['tipoServicio'],
                        'descripcion' => $data['descripcion'] ?? obtenerDescripcionServicio($data['tipoServicio']),
                        'precio' => $data['precio'],
                        'forma_pago' => $data['formaPago'] ?? 'No especificado',
                        'fecha_pago' => $data['fechaPago'] ?? date('Y-m-d')
                    ];
                    
                    $facturaId = $factura->crear($facturaData);
                    
                    sendJsonResponse([
                        'success' => true,
                        'message' => 'Usuario y factura creados exitosamente',
                        'usuario_id' => $usuarioId,
                        'factura_id' => $facturaId
                    ]);
                } else {
                    sendJsonResponse([
                        'success' => true,
                        'message' => 'Usuario creado exitosamente',
                        'usuario_id' => $usuarioId
                    ]);
                }
            } else {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error al crear el usuario'
                ]);
            }
            break;
            
        case 'buscar_usuarios':
            if ($method !== 'GET') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            $termino = $_GET['termino'] ?? '';
            
            if (empty($termino)) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Término de búsqueda requerido'
                ]);
            }
            
            // Cargar clases necesarias
            require_once '../config/database.php';
            require_once '../classes/Usuario.php';
            
            $database = new Database();
            $pdo = $database->getConnection();
            
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            $usuario = new Usuario($pdo);
            $resultados = $usuario->buscar($termino);
            
            sendJsonResponse($resultados);
            break;
            
        case 'listar_todos_usuarios':
            if ($method !== 'GET') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            // Cargar clases necesarias
            require_once '../config/database.php';
            require_once '../classes/Usuario.php';
            
            $database = new Database();
            $pdo = $database->getConnection();
            
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            $usuario = new Usuario($pdo);
            $todos = $usuario->obtenerTodos();
            
            sendJsonResponse($todos);
            break;
            
        case 'obtener_usuario':
            if ($method !== 'GET') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            $id = $_GET['id'] ?? 0;
            
            if (!$id) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'ID de usuario requerido'
                ]);
            }
            
            // Cargar clases necesarias
            require_once '../config/database.php';
            require_once '../classes/Usuario.php';
            
            $database = new Database();
            $pdo = $database->getConnection();
            
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            $usuario = new Usuario($pdo);
            $resultado = $usuario->obtenerPorId($id);
            
            sendJsonResponse($resultado);
            break;
            
        case 'cambiar_estado_usuario':
            if ($method !== 'POST') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || !isset($data['id']) || !isset($data['activo'])) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Datos incompletos'
                ]);
            }
            
            // Cargar clases necesarias
            require_once '../config/database.php';
            require_once '../classes/Usuario.php';
            
            $database = new Database();
            $pdo = $database->getConnection();
            
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            $usuario = new Usuario($pdo);
            $result = $usuario->actualizarEstado($data['id'], $data['activo']);
            
            sendJsonResponse(['success' => $result]);
            break;
            
        case 'crear_factura':
            if ($method !== 'POST') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Datos no válidos'
                ]);
            }
            
            // Cargar clases necesarias
            require_once '../config/database.php';
            require_once '../classes/Factura.php';
            
            $database = new Database();
            $pdo = $database->getConnection();
            
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            $factura = new Factura($pdo);
            $tipoServicio = $data['tipoServicio2'] ?? $data['tipoServicio'] ?? '';
            $descripcion = $data['descripcion'] ?? obtenerDescripcionServicio($tipoServicio);
            
            $facturaData = [
                'usuario_id' => $data['usuarioId'],
                'tipo_servicio' => $tipoServicio,
                'descripcion' => $descripcion,
                'precio' => $data['precio2'] ?? $data['precio'] ?? 0,
                'forma_pago' => $data['formaPago2'] ?? $data['formaPago'] ?? 'No especificado',
                'fecha_pago' => $data['fechaPago2'] ?? $data['fechaPago'] ?? date('Y-m-d')
            ];
            
            $facturaId = $factura->crear($facturaData);
            
            if ($facturaId) {
                sendJsonResponse([
                    'success' => true,
                    'message' => 'Factura creada exitosamente',
                    'factura_id' => $facturaId
                ]);
            } else {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error al crear la factura'
                ]);
            }
            break;
            
        case 'facturas_mes':
            if ($method !== 'GET') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            $mes = $_GET['mes'] ?? '';
            $año = $_GET['año'] ?? '';
            
            if (empty($mes) || empty($año)) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Mes y año son requeridos'
                ]);
            }
            
            // Cargar clases necesarias
            require_once '../config/database.php';
            require_once '../classes/Factura.php';
            
            $database = new Database();
            $pdo = $database->getConnection();
            
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            $factura = new Factura($pdo);
            $resultados = $factura->obtenerPorMes($mes, $año);
            
            sendJsonResponse($resultados);
            break;
            
        case 'obtener_factura':
            if ($method !== 'GET') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            $id = $_GET['id'] ?? 0;
            
            if (!$id) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'ID de factura requerido'
                ]);
            }
            
            // Cargar clases necesarias
            require_once '../config/database.php';
            require_once '../classes/Factura.php';
            
            $database = new Database();
            $pdo = $database->getConnection();
            
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            $factura = new Factura($pdo);
            $resultado = $factura->obtenerPorId($id);
            
            sendJsonResponse($resultado);
            break;
            
        case 'obtener_configuracion':
            if ($method !== 'GET') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            try {
                // Cargar clases necesarias
                require_once '../config/database.php';
                
                $database = new Database();
                $pdo = $database->getConnection();
                
                if ($pdo) {
                    $stmt = $pdo->query("SELECT clave, valor FROM configuracion");
                    $config = [];
                    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        $config[$row['clave']] = $row['valor'];
                    }
                    sendJsonResponse($config);
                } else {
                    // Configuración por defecto si no hay BD
                    sendJsonResponse([
                        'prefijo_factura' => 'IMPERIUMBOXGR',
                        'iva_porcentaje' => '21',
                        'empresa_nombre' => 'Ruben Hinojosa Valle',
                        'empresa_nif' => '31725301K',
                        'empresa_direccion' => 'Arabial 45, CC NEPTUNO. IMPERIUM, Local 79',
                        'empresa_localidad' => '18004, Granada, España',
                        'empresa_email' => 'hello@imperiumcrosstraining.com'
                    ]);
                }
            } catch (Exception $e) {
                // Configuración por defecto en caso de error
                sendJsonResponse([
                    'prefijo_factura' => 'IMPERIUMBOXGR',
                    'iva_porcentaje' => '21',
                    'empresa_nombre' => 'Ruben Hinojosa Valle',
                    'empresa_nif' => '31725301K',
                    'empresa_direccion' => 'Arabial 45, CC NEPTUNO. IMPERIUM, Local 79',
                    'empresa_localidad' => '18004, Granada, España',
                    'empresa_email' => 'hello@imperiumcrosstraining.com'
                ]);
            }
            break;
            
        case 'siguiente_numero_factura':
            if ($method !== 'GET') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            // Cargar clases necesarias
            require_once '../config/database.php';
            require_once '../classes/Factura.php';
            
            $database = new Database();
            $pdo = $database->getConnection();
            
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            $factura = new Factura($pdo);
            $siguiente = $factura->obtenerSiguienteNumero();
            
            sendJsonResponse(['siguiente_numero' => $siguiente]);
            break;
            
        case 'importar_excel':
            if ($method !== 'POST') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || !isset($data['usuarios'])) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Datos no válidos'
                ]);
            }
            
            $usuarios = $data['usuarios'];
            
            // Cargar clases necesarias
            require_once '../config/database.php';
            require_once '../classes/Usuario.php';
            
            $database = new Database();
            $pdo = $database->getConnection();
            
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            $usuario = new Usuario($pdo);
            
            $resultados = [
                'exitosos' => 0,
                'errores' => 0,
                'detalles' => []
            ];
            
            foreach ($usuarios as $userData) {
                try {
                    $usuarioId = $usuario->crear($userData);
                    if ($usuarioId) {
                        $resultados['exitosos']++;
                        $resultados['detalles'][] = "✅ Usuario creado: {$userData['nombre']} {$userData['primerApellido']}";
                    } else {
                        $resultados['errores']++;
                        $resultados['detalles'][] = "❌ Error al crear: {$userData['nombre']} {$userData['primerApellido']}";
                    }
                } catch (Exception $e) {
                    $resultados['errores']++;
                    $resultados['detalles'][] = "❌ Error con {$userData['nombre']} {$userData['primerApellido']}: " . $e->getMessage();
                }
            }
            
            sendJsonResponse([
                'success' => true,
                'resultados' => $resultados
            ]);
            break;
            
        case '':
            sendJsonResponse([
                'success' => false,
                'message' => 'Acción no especificada'
            ]);
            break;
			
			
case 'crear_usuario_con_factura':
    try {
        // Log entrada
        error_log("=== CREAR USUARIO CON FACTURA INICIADO ===");
        
        $input = json_decode(file_get_contents('php://input'), true);
        error_log("Input recibido: " . json_encode($input));
        
        if (!$input || !isset($input['usuario']) || !isset($input['factura'])) {
            throw new Exception('Datos incompletos. Se requieren datos de usuario y factura.');
        }
        
        $datosUsuario = $input['usuario'];
        $datosFactura = $input['factura'];
        
        error_log("Datos usuario: " . json_encode($datosUsuario));
        error_log("Datos factura: " . json_encode($datosFactura));
        
        // Validar datos obligatorios del usuario
        if (empty($datosUsuario['nombre']) || empty($datosUsuario['primerApellido']) || empty($datosUsuario['dni'])) {
            throw new Exception('Nombre, primer apellido y DNI son obligatorios');
        }
        
        // Validar datos obligatorios de la factura
        if (empty($datosFactura['tipoServicio']) || empty($datosFactura['precio']) || 
            empty($datosFactura['formaPago']) || empty($datosFactura['fechaPago'])) {
            throw new Exception('Todos los campos de facturación son obligatorios: ' . 
                json_encode(['tipo' => $datosFactura['tipoServicio'], 'precio' => $datosFactura['precio'], 
                'pago' => $datosFactura['formaPago'], 'fecha' => $datosFactura['fechaPago']]));
        }
        
        // Validar formato de precio
        if (!is_numeric($datosFactura['precio']) || floatval($datosFactura['precio']) <= 0) {
            throw new Exception('El precio debe ser un número mayor que 0. Recibido: ' . $datosFactura['precio']);
        }
        
        // Iniciar transacción
        $pdo->beginTransaction();
        error_log("Transacción iniciada");
        
        try {
            // 1. Verificar si el usuario ya existe
            $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE dni = ?");
            $stmt->execute([$datosUsuario['dni']]);
            
            if ($stmt->fetch()) {
                throw new Exception('Ya existe un usuario con este DNI: ' . $datosUsuario['dni']);
            }
            
            // 2. Crear el usuario
            $queryUsuario = "
                INSERT INTO usuarios (
                    nombre, primer_apellido, segundo_apellido, dni, email, telefono, 
                    direccion, codigo_postal, localidad, activo, fecha_registro
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ";
            
            error_log("Query usuario: " . $queryUsuario);
            
            $stmt = $pdo->prepare($queryUsuario);
            
            $parametrosUsuario = [
                $datosUsuario['nombre'],
                $datosUsuario['primerApellido'],
                $datosUsuario['segundoApellido'] ?? '',
                $datosUsuario['dni'],
                $datosUsuario['email'] ?? '',
                $datosUsuario['telefono'] ?? '',
                $datosUsuario['direccion'] ?? '',
                $datosUsuario['codigoPostal'] ?? '',
                $datosUsuario['localidad'] ?? 'Granada',
                $datosUsuario['activo'] ?? 1
            ];
            
            error_log("Parámetros usuario: " . json_encode($parametrosUsuario));
            
            $resultado = $stmt->execute($parametrosUsuario);
            
            if (!$resultado) {
                $errorInfo = $stmt->errorInfo();
                error_log("Error al crear usuario: " . json_encode($errorInfo));
                throw new Exception('Error al crear el usuario: ' . $errorInfo[2]);
            }
            
            $usuarioId = $pdo->lastInsertId();
            error_log("Usuario creado con ID: " . $usuarioId);
            
            if (!$usuarioId || $usuarioId == 0) {
                throw new Exception('No se pudo obtener el ID del usuario creado');
            }
            
            // 3. Crear la factura asociada
            $queryFactura = "
                INSERT INTO facturas (
                    usuario_id, tipo_servicio, descripcion, precio, 
                    forma_pago, fecha_pago, fecha_creacion
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())
            ";
            
            error_log("Query factura: " . $queryFactura);
            
            $stmt = $pdo->prepare($queryFactura);
            
            $parametrosFactura = [
                $usuarioId,
                $datosFactura['tipoServicio'],
                $datosFactura['descripcion'] ?? 'Servicio sin descripción',
                floatval($datosFactura['precio']),
                $datosFactura['formaPago'],
                $datosFactura['fechaPago']
            ];
            
            error_log("Parámetros factura: " . json_encode($parametrosFactura));
            
            $resultadoFactura = $stmt->execute($parametrosFactura);
            
            if (!$resultadoFactura) {
                $errorInfo = $stmt->errorInfo();
                error_log("Error al crear factura: " . json_encode($errorInfo));
                throw new Exception('Error al crear la factura: ' . $errorInfo[2]);
            }
            
            $facturaId = $pdo->lastInsertId();
            error_log("Factura creada con ID: " . $facturaId);
            
            if (!$facturaId || $facturaId == 0) {
                throw new Exception('No se pudo obtener el ID de la factura creada');
            }
            
            // Confirmar transacción
            $pdo->commit();
            error_log("Transacción confirmada exitosamente");
            
            // Verificar que se crearon correctamente
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM facturas WHERE usuario_id = ?");
            $stmt->execute([$usuarioId]);
            $numFacturas = $stmt->fetchColumn();
            error_log("Verificación: Usuario $usuarioId tiene $numFacturas facturas");
            
            // Respuesta exitosa
            echo json_encode([
                'success' => true,
                'message' => "Usuario '{$datosUsuario['nombre']} {$datosUsuario['primerApellido']}' creado exitosamente con factura de {$datosFactura['precio']}€",
                'usuario_id' => $usuarioId,
                'factura_id' => $facturaId,
                'verificacion' => [
                    'facturas_creadas' => $numFacturas,
                    'usuario_existe' => true
                ],
                'datos' => [
                    'usuario' => $datosUsuario['nombre'] . ' ' . $datosUsuario['primerApellido'],
                    'servicio' => $datosFactura['descripcion'] ?? $datosFactura['tipoServicio'],
                    'precio' => $datosFactura['precio'],
                    'forma_pago' => $datosFactura['formaPago']
                ]
            ]);
            
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $pdo->rollBack();
            error_log("Transacción revertida por error: " . $e->getMessage());
            throw $e;
        }
        
    } catch (Exception $e) {
        error_log("Error completo en crear_usuario_con_factura: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage(),
            'debug_info' => [
                'error_line' => $e->getLine(),
                'error_file' => basename($e->getFile())
            ]
        ]);
    }
    break;
case 'debug_facturas':
    try {
        // Contar usuarios y facturas
        $stmt = $pdo->query("SELECT COUNT(*) FROM usuarios");
        $totalUsuarios = $stmt->fetchColumn();
        
        $stmt = $pdo->query("SELECT COUNT(*) FROM facturas");
        $totalFacturas = $stmt->fetchColumn();
        
        // Obtener usuarios con sus facturas
        $stmt = $pdo->query("
            SELECT u.id, u.nombre, u.primer_apellido, u.dni, 
                   COUNT(f.id) as num_facturas,
                   GROUP_CONCAT(f.id) as facturas_ids
            FROM usuarios u 
            LEFT JOIN facturas f ON u.id = f.usuario_id 
            GROUP BY u.id
            ORDER BY u.id DESC
            LIMIT 10
        ");
        
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Estructura de tabla facturas
        $stmt = $pdo->query("DESCRIBE facturas");
        $estructuraFacturas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Últimas facturas creadas
        $stmt = $pdo->query("
            SELECT f.*, u.nombre, u.primer_apellido 
            FROM facturas f 
            JOIN usuarios u ON f.usuario_id = u.id 
            ORDER BY f.fecha_creacion DESC 
            LIMIT 5
        ");
        $ultimasFacturas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'total_usuarios' => $totalUsuarios,
                'total_facturas' => $totalFacturas,
                'usuarios_recientes' => $usuarios,
                'estructura_facturas' => $estructuraFacturas,
                'ultimas_facturas' => $ultimasFacturas
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
    break;
			case 'crear_factura_simple':
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['usuario_id']) || !isset($input['factura'])) {
            throw new Exception('Datos incompletos');
        }
        
        $usuarioId = $input['usuario_id'];
        $datosFactura = $input['factura'];
        
        // Validar que el usuario existe
        $stmt = $pdo->prepare("SELECT nombre, primer_apellido FROM usuarios WHERE id = ?");
        $stmt->execute([$usuarioId]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario) {
            throw new Exception('Usuario no encontrado');
        }
        
        // Crear factura
        $stmt = $pdo->prepare("
            INSERT INTO facturas (
                usuario_id, tipo_servicio, descripcion, precio, 
                forma_pago, fecha_pago, fecha_creacion
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $resultado = $stmt->execute([
            $usuarioId,
            $datosFactura['tipoServicio'],
            $datosFactura['descripcion'],
            $datosFactura['precio'],
            $datosFactura['formaPago'],
            $datosFactura['fechaPago']
        ]);
        
        if (!$resultado) {
            throw new Exception('Error al crear la factura');
        }
        
        echo json_encode([
            'success' => true,
            'message' => "Factura creada exitosamente para {$usuario['nombre']} {$usuario['primer_apellido']}",
            'factura_id' => $pdo->lastInsertId()
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
    break;
			
			
			
			
			
			
            
        default:
            sendJsonResponse([
                'success' => false,
                'message' => 'Acción no válida: ' . $action
            ]);
            break;
    }
    
} catch (Exception $e) {
    handleError('Error interno del servidor: ' . $e->getMessage(), [
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
}

// Función auxiliar para obtener descripción del servicio
function obtenerDescripcionServicio($tipoServicio) {
    $servicios = [
        'open_2dias' => 'OPEN 2 días semana',
        'open_3dias' => 'OPEN 3 días semana',
        'open_4dias' => 'OPEN 4 días semana',
        'open_ilimitado' => 'OPEN Ilimitado',
        'clases_2dias' => 'CLASES 2 días semana',
        'clases_3dias' => 'CLASES 3 días semana',
        'clases_4dias' => 'CLASES 4 días semana',
        'clases_ilimitado' => 'CLASES Ilimitado',
        'bono_1sesion' => 'BONO 1 Sesión (CLASE/OPEN)',
        'bono_10sesiones' => 'BONO 10 Sesiones (CLASES/OPEN)',
        'bono_3clases_1open' => 'BONO 3 Días Clases + 1 Día Open',
        'bono_3clases_2open' => 'BONO 3 Días Clases + 2 Días Open'
    ];
    
    return $servicios[$tipoServicio] ?? 'Servicio de entrenamiento';
}
?>