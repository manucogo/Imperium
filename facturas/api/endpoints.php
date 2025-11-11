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

// Función para inicializar conexión a BD
function initDatabase() {
    try {
        if (!file_exists('../config/database.php')) {
            throw new Exception('Archivo config/database.php no encontrado');
        }
        
        require_once '../config/database.php';
        $database = new Database();
        $pdo = $database->getConnection();
        
        if (!$pdo) {
            throw new Exception('No se pudo establecer conexión con la base de datos');
        }
        
        return $pdo;
    } catch (Exception $e) {
        error_log("Error de BD: " . $e->getMessage());
        return null;
    }
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
            $pdo = initDatabase();
            
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            try {
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
            $pdo = initDatabase();
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            require_once '../classes/Auth.php';
            
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
            $pdo = initDatabase();
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            require_once '../classes/Auth.php';
            
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
            $pdo = initDatabase();
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            require_once '../classes/Factura.php';
			require_once '../classes/Usuario.php';


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
            $pdo = initDatabase();
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            require_once '../classes/Usuario.php';
            
            $usuario = new Usuario($pdo);
            $resultados = $usuario->buscar($termino);
            
            sendJsonResponse($resultados);
            break;
            
        case 'listar_todos_usuarios':
            if ($method !== 'GET') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }
            
            // Cargar clases necesarias
            $pdo = initDatabase();
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            require_once '../classes/Usuario.php';
            
            $usuario = new Usuario($pdo);
            $todos = $usuario->obtenerTodos();
            
            sendJsonResponse($todos);
            break;
 case 'importar_excel_con_facturas':
    if ($method !== 'POST') {
        sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
    }
    
    try {
        error_log("=== IMPORTAR FACTURAS INICIO ===");
        
        // Leer input
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Error al decodificar JSON: ' . json_last_error_msg());
        }
        
        if (!isset($data['registros']) || !is_array($data['registros'])) {
            throw new Exception('No se recibieron registros válidos');
        }
        
        error_log("Registros recibidos: " . count($data['registros']));
        
        // Inicializar BD
        $pdo = initDatabase();
        if (!$pdo) {
            throw new Exception('Error de conexión a la base de datos');
        }
        
        // Cargar clases
        require_once '../classes/Usuario.php';
        $usuarioObj = new Usuario($pdo);
        
        // Contadores
        $stats = [
            'usuariosEncontrados' => 0,
            'usuariosNoEncontrados' => 0,
            'facturasCreadas' => 0,
            'facturasDuplicadas' => 0,
            'errores' => 0,
            'detalles' => []
        ];
        
        // Procesar cada registro
        foreach ($data['registros'] as $index => $registro) {
            $fila = $registro['fila'] ?? ($index + 2);
            
            try {
                // Validar estructura
                if (!isset($registro['usuario']['dni'])) {
                    $stats['errores']++;
                    $stats['detalles'][] = "Fila $fila: Sin DNI";
                    continue;
                }
                
                if (!isset($registro['factura'])) {
                    $stats['errores']++;
                    $stats['detalles'][] = "Fila $fila: Sin datos de factura";
                    continue;
                }
                
                $dni = trim($registro['usuario']['dni']);
                $factura = $registro['factura'];
                
                // Buscar usuario
                $usuario = $usuarioObj->buscarPorDni($dni);
                
                if (!$usuario) {
                    $stats['usuariosNoEncontrados']++;
                    $stats['detalles'][] = "Fila $fila: DNI $dni no encontrado";
                    continue;
                }
                
                $usuarioId = $usuario['id'];
                $stats['usuariosEncontrados']++;
                
                // Extraer datos de factura - AHORA VIENE precioSinIva del Excel
                $precioSinIva = floatval($factura['precioSinIva'] ?? 0);
                $precio = floatval($factura['precio'] ?? 0);  // Ya calculado en JS
                $iva = floatval($factura['iva'] ?? 0);        // Ya calculado en JS
                $formaPago = trim($factura['formaPago'] ?? '');
                $fechaPago = trim($factura['fechaPago'] ?? '');
                $descripcion = trim($factura['descripcion'] ?? '');
                
                error_log("Fila $fila - Precio sin IVA: $precioSinIva, Precio total: $precio, IVA: $iva");
                
                // Validar datos obligatorios
                if (empty($formaPago) || empty($fechaPago) || empty($descripcion) || $precioSinIva <= 0) {
                    $stats['errores']++;
                    $stats['detalles'][] = "Fila $fila: Datos incompletos";
                    continue;
                }
                
                // Verificar duplicados
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) FROM facturas 
                    WHERE usuario_id = ? AND fecha_pago = ? AND precio = ? AND DATE(created_at) = CURDATE()
                ");
                $stmt->execute([$usuarioId, $fechaPago, $precio]);
                
                if ($stmt->fetchColumn() > 0) {
                    $stats['facturasDuplicadas']++;
                    $stats['detalles'][] = "Fila $fila: Factura duplicada";
                    continue;
                }
                
                // Generar número de factura
                $stmt = $pdo->query("
                    SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(numero_factura, '/', -1) AS UNSIGNED)), 0) + 1 
                    FROM facturas WHERE numero_factura LIKE 'IMPERIUMBOXGR/%'
                ");
                $siguiente = $stmt->fetchColumn();
                $numeroFactura = "IMPERIUMBOXGR/" . $siguiente;
                
                // Insertar factura con precio_sin_iva del Excel
                $stmt = $pdo->prepare("
                    INSERT INTO facturas (
                        usuario_id, numero_factura, tipo_servicio, descripcion, 
                        precio, precio_sin_iva, iva,
                        forma_pago, fecha_pago, fecha_factura, created_at
                    ) VALUES (?, ?, 'personalizado', ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                
                $resultado = $stmt->execute([
                    $usuarioId,
                    $numeroFactura,
                    $descripcion,
                    $precio,
                    $precioSinIva,  // Viene del Excel
                    $iva,           // Calculado en JS
                    $formaPago,
                    $fechaPago,
                    $fechaPago
                ]);
                
                if ($resultado) {
                    $stats['facturasCreadas']++;
                    $stats['detalles'][] = "Fila $fila: ✅ Factura $numeroFactura creada - Base: {$precioSinIva}€ + IVA: {$iva}€ = Total: {$precio}€";
                } else {
                    $stats['errores']++;
                    $stats['detalles'][] = "Fila $fila: Error al insertar";
                }
                
            } catch (Exception $e) {
                $stats['errores']++;
                $stats['detalles'][] = "Fila $fila: " . $e->getMessage();
                error_log("Error fila $fila: " . $e->getMessage());
            }
        }
        
        error_log("=== RESUMEN: {$stats['facturasCreadas']} facturas creadas ===");
        
        sendJsonResponse([
            'success' => true,
            'resultados' => $stats
        ]);
        
    } catch (Exception $e) {
        error_log("ERROR CRÍTICO: " . $e->getMessage());
        error_log("Stack: " . $e->getTraceAsString());
        
        sendJsonResponse([
            'success' => false,
            'error' => true,
            'message' => $e->getMessage()
        ], 500);
    }
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
            $pdo = initDatabase();
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            require_once '../classes/Usuario.php';
            
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
            $pdo = initDatabase();
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            require_once '../classes/Usuario.php';
            
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
    
    error_log("=== CREAR FACTURA INDIVIDUAL ===");
    error_log("Datos recibidos: " . json_encode($data));
    
    if (!$data) {
        sendJsonResponse([
            'success' => false,
            'message' => 'Datos no válidos'
        ]);
    }
    
    // Determinar qué campos usar (pueden venir con sufijo 2 del segundo formulario)
    $tipoServicio = $data['tipoServicio2'] ?? $data['tipoServicio'] ?? '';
    $precio = $data['precio2'] ?? $data['precio'] ?? 0;
    $formaPago = $data['formaPago2'] ?? $data['formaPago'] ?? '';
    $fechaPago = $data['fechaPago2'] ?? $data['fechaPago'] ?? '';
    $observaciones = $data['observaciones2'] ?? $data['observaciones'] ?? null;
    $usuarioId = $data['usuarioId'] ?? $data['usuario_id'] ?? 0;
    
    error_log("Datos procesados - Tipo: $tipoServicio, Precio: $precio, Usuario: $usuarioId");
    
    // VALIDACIÓN: Para servicios personalizados, verificar observaciones
    if ($tipoServicio === 'personalizado') {
        if (empty($observaciones) || trim($observaciones) === '') {
            error_log("ERROR: Servicio personalizado sin observaciones");
            sendJsonResponse([
                'success' => false,
                'message' => 'Para servicios personalizados, las observaciones son obligatorias'
            ]);
        }
        error_log("Servicio personalizado válido con observaciones: " . $observaciones);
    }
    
    // Validar datos obligatorios
    if (empty($usuarioId) || empty($tipoServicio) || empty($precio) || empty($formaPago) || empty($fechaPago)) {
        error_log("ERROR: Datos incompletos - Usuario: $usuarioId, Tipo: $tipoServicio, Precio: $precio");
        sendJsonResponse([
            'success' => false,
            'message' => 'Datos incompletos para crear la factura'
        ]);
    }
    
    // Validar precio
    $precioFloat = floatval($precio);
    if ($precioFloat <= 0) {
        error_log("ERROR: Precio inválido: $precio");
        sendJsonResponse([
            'success' => false,
            'message' => 'El precio debe ser mayor que 0'
        ]);
    }
    
    // Cargar clases necesarias
    $pdo = initDatabase();
    if (!$pdo) {
        sendJsonResponse([
            'success' => false,
            'message' => 'Error de conexión a la base de datos'
        ]);
    }
    
    // Verificar que el usuario existe
    try {
        $stmt = $pdo->prepare("SELECT nombre, primer_apellido FROM usuarios WHERE id = ?");
        $stmt->execute([$usuarioId]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario) {
            error_log("ERROR: Usuario no encontrado: $usuarioId");
            sendJsonResponse([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ]);
        }
        
        error_log("Usuario encontrado: {$usuario['nombre']} {$usuario['primer_apellido']}");
        
    } catch (Exception $e) {
        error_log("ERROR al verificar usuario: " . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'message' => 'Error al verificar usuario'
        ]);
    }
    
    // ⚠️ VERIFICAR DUPLICADOS - PREVENIR FACTURAS DUPLICADAS
    try {
        // Verificar si ya existe una factura similar en los últimos 5 minutos
        $stmt = $pdo->prepare("
            SELECT COUNT(*) 
            FROM facturas 
            WHERE usuario_id = ? 
            AND precio = ? 
            AND fecha_pago = ? 
            AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        ");
        $stmt->execute([$usuarioId, $precioFloat, $fechaPago]);
        $existeDuplicado = $stmt->fetchColumn();
        
        if ($existeDuplicado > 0) {
            error_log("⚠️ DUPLICADO DETECTADO: Ya existe una factura similar reciente");
            sendJsonResponse([
                'success' => false,
                'message' => 'Esta factura ya fue creada recientemente. Si deseas crear otra factura, espera unos minutos o cambia el monto.'
            ]);
        }
        
    } catch (Exception $e) {
        error_log("ERROR verificando duplicados: " . $e->getMessage());
    }
    
    // Preparar descripción del servicio
    $descripcion = $data['descripcion'] ?? obtenerDescripcionServicio($tipoServicio);
    
    // Si es servicio personalizado, usar observaciones como descripción
    if ($tipoServicio === 'personalizado' && !empty($observaciones)) {
        $descripcion = trim($observaciones);
        error_log("Usando observaciones como descripción: $descripcion");
    }
    
    // Obtener siguiente número de factura
    try {
        $stmt = $pdo->query("SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(numero_factura, '/', -1) AS UNSIGNED)), 0) + 1 AS siguiente FROM facturas WHERE numero_factura LIKE 'IMPERIUMBOXGR/%'");
        $siguienteNumero = $stmt->fetchColumn();
        $numeroFactura = "IMPERIUMBOXGR/" . $siguienteNumero;
        error_log("Número de factura generado: $numeroFactura");
    } catch (Exception $e) {
        $numeroFactura = "IMPERIUMBOXGR/" . (time() % 10000); // Fallback
        error_log("Error generando número, usando fallback: $numeroFactura");
    }
    
    // Calcular IVA
    $precioSinIva = round($precioFloat / 1.21, 2);
    $iva = round($precioFloat - $precioSinIva, 2);
    
    // Crear la factura
    try {
        $stmt = $pdo->prepare("
            INSERT INTO facturas (
                usuario_id, numero_factura, tipo_servicio, descripcion, 
                precio, precio_sin_iva, iva,
                forma_pago, fecha_pago, fecha_factura, observaciones, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $parametros = [
            $usuarioId,
            $numeroFactura,
            $tipoServicio,
            $descripcion,
            $precioFloat,
            $precioSinIva,
            $iva,
            $formaPago,
            $fechaPago,
            $fechaPago,
            $observaciones
        ];
        
        error_log("Ejecutando query con parámetros: " . json_encode($parametros));
        
        $resultado = $stmt->execute($parametros);
        
        if (!$resultado) {
            $errorInfo = $stmt->errorInfo();
            error_log("ERROR SQL: " . json_encode($errorInfo));
            throw new Exception('Error SQL: ' . $errorInfo[2]);
        }
        
        $facturaId = $pdo->lastInsertId();
        error_log("✅ Factura creada exitosamente con ID: $facturaId");
        
        // Mensaje de éxito personalizado
        $mensajeExito = "Factura $numeroFactura creada exitosamente para {$usuario['nombre']} {$usuario['primer_apellido']}";
        
        if ($tipoServicio === 'personalizado') {
            $mensajeExito .= " (Servicio personalizado: " . substr($descripcion, 0, 30) . 
                (strlen($descripcion) > 30 ? "..." : "") . ")";
        } else {
            $mensajeExito .= " - $descripcion - {$precioFloat}€";
        }
        
        sendJsonResponse([
            'success' => true,
            'message' => $mensajeExito,
            'factura_id' => $facturaId,
            'numero_factura' => $numeroFactura,
            'datos' => [
                'usuario' => $usuario['nombre'] . ' ' . $usuario['primer_apellido'],
                'servicio' => $descripcion,
                'precio' => $precioFloat,
                'es_personalizado' => $tipoServicio === 'personalizado',
                'observaciones' => $observaciones
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("ERROR al crear factura: " . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'message' => 'Error al crear la factura: ' . $e->getMessage()
        ]);
    }
    break;
 
            
       case 'facturas_mes':
    if ($method !== 'GET') {
        sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
    }
    
    // Obtener parámetros con mejor manejo de encoding
    $mes = $_GET['mes'] ?? '';
    $año = $_GET['año'] ?? $_GET['ano'] ?? ''; // Manejar tanto "año" como "ano"
    
    error_log("=== FACTURAS MES SOLICITADO ===");
    error_log("Mes recibido: '$mes'");
    error_log("Año recibido: '$año'");
    error_log("GET completo: " . json_encode($_GET));
    
    if (empty($mes) || empty($año)) {
        error_log("ERROR: Parámetros faltantes - Mes: '$mes', Año: '$año'");
        sendJsonResponse([
            'success' => false,
            'message' => 'Mes y año son requeridos'
        ]);
    }
    
    // Validar formato de mes y año
    $mesInt = intval($mes);
    $añoInt = intval($año);
    
    if ($mesInt < 1 || $mesInt > 12) {
        error_log("ERROR: Mes inválido: $mes");
        sendJsonResponse([
            'success' => false,
            'message' => 'Mes debe estar entre 1 y 12'
        ]);
    }
    
    if ($añoInt < 2020 || $añoInt > 2030) {
        error_log("ERROR: Año inválido: $año");
        sendJsonResponse([
            'success' => false,
            'message' => 'Año debe estar entre 2020 y 2030'
        ]);
    }
    
    // Cargar clases necesarias
    $pdo = initDatabase();
    if (!$pdo) {
        error_log("ERROR: No se pudo conectar a la base de datos");
        sendJsonResponse([
            'success' => false,
            'message' => 'Error de conexión a la base de datos'
        ]);
    }
    
    try {
        // Query ACTUALIZADA para incluir observaciones
        $query = "
            SELECT f.*, 
                   u.nombre, u.primer_apellido, u.segundo_apellido, 
                   u.dni, u.email, u.telefono, u.direccion, 
                   u.codigo_postal, u.localidad,
                   f.observaciones
            FROM facturas f 
            INNER JOIN usuarios u ON f.usuario_id = u.id 
            WHERE MONTH(f.fecha_pago) = ? AND YEAR(f.fecha_pago) = ?
            ORDER BY f.fecha_pago DESC, f.numero_factura DESC
        ";
        
        error_log("Ejecutando query con parámetros: Mes=$mesInt, Año=$añoInt");
        
        $stmt = $pdo->prepare($query);
        $resultado = $stmt->execute([$mesInt, $añoInt]);
        
        if (!$resultado) {
            $errorInfo = $stmt->errorInfo();
            error_log("ERROR SQL: " . json_encode($errorInfo));
            throw new Exception('Error en la consulta SQL: ' . $errorInfo[2]);
        }
        
        $facturas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Facturas encontradas: " . count($facturas));
        
        // Procesar facturas para incluir información adicional
        $facturasProcessadas = array_map(function($factura) {
            // Asegurar que los campos numéricos estén en el formato correcto
            $factura['precio'] = floatval($factura['precio']);
            $factura['precio_sin_iva'] = floatval($factura['precio_sin_iva'] ?? 0);
            $factura['iva'] = floatval($factura['iva'] ?? 0);
            
            // Agregar flag para servicios personalizados
            $factura['es_personalizado'] = $factura['tipo_servicio'] === 'personalizado';
            
            // Si es personalizado y tiene observaciones, usar observaciones como descripción principal
            if ($factura['es_personalizado'] && !empty($factura['observaciones'])) {
                $factura['descripcion_original'] = $factura['descripcion'];
                $factura['descripcion'] = $factura['observaciones'];
            }
            
            error_log("Factura procesada: {$factura['numero_factura']} - {$factura['descripcion']} - {$factura['precio']}€");
            
            return $factura;
        }, $facturas);
        
        // Calcular totales
        $totalFacturado = array_sum(array_column($facturasProcessadas, 'precio'));
        $totalFacturas = count($facturasProcessadas);
        
        error_log("RESUMEN: $totalFacturas facturas, Total: {$totalFacturado}€");
        
        sendJsonResponse([
            'success' => true,
            'facturas' => $facturasProcessadas,
            'resumen' => [
                'total_facturas' => $totalFacturas,
                'total_facturado' => round($totalFacturado, 2),
                'mes' => $mesInt,
                'año' => $añoInt
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("ERROR en facturas_mes: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        
        sendJsonResponse([
            'success' => false,
            'message' => 'Error al obtener facturas: ' . $e->getMessage()
        ]);
    }
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
            $pdo = initDatabase();
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            require_once '../classes/Factura.php';
            
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
                $pdo = initDatabase();
                
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
            $pdo = initDatabase();
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            require_once '../classes/Factura.php';
            
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
            $pdo = initDatabase();
            if (!$pdo) {
                sendJsonResponse([
                    'success' => false,
                    'message' => 'Error de conexión a la base de datos'
                ]);
            }
            
            require_once '../classes/Usuario.php';
            
            $usuario = new Usuario($pdo);
            
            $resultados = [
                'exitosos' => 0,
                'errores' => 0,
                'detalles' => []
            ];
            
            foreach ($usuarios as $userData) {
                try {
                    $usuarioId = $usuario->crear($userData);
                    $stmt = $pdo->prepare("SELECT id, nombre, primer_apellido FROM usuarios WHERE dni = ?");
$stmt->execute([$userData['dni']]);
$usuarioExistente = $stmt->fetch(PDO::FETCH_ASSOC);

if ($usuarioExistente) {
    $resultados['exitosos']++;
    $resultados['detalles'][] = "⚠️ Usuario ya existe: {$usuarioExistente['nombre']} {$usuarioExistente['primer_apellido']} (DNI: {$userData['dni']})";
} else {
    $usuarioId = $usuario->crear($userData);
    if ($usuarioId) {
        $resultados['exitosos']++;
        $resultados['detalles'][] = "✅ Usuario creado: {$userData['nombre']} {$userData['primerApellido']}";
    } else {
        $resultados['errores']++;
        $resultados['detalles'][] = "❌ Error al crear: {$userData['nombre']} {$userData['primerApellido']}";
    }
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
        
        // NUEVA VALIDACIÓN: Para servicios personalizados, verificar observaciones
        if ($datosFactura['tipoServicio'] === 'personalizado') {
            if (empty($datosFactura['observaciones']) || trim($datosFactura['observaciones']) === '') {
                throw new Exception('Para servicios personalizados, las observaciones son obligatorias');
            }
            error_log("Servicio personalizado detectado. Observaciones: " . $datosFactura['observaciones']);
        }
        
        // Validar formato de precio
        if (!is_numeric($datosFactura['precio']) || floatval($datosFactura['precio']) <= 0) {
            throw new Exception('El precio debe ser un número mayor que 0. Recibido: ' . $datosFactura['precio']);
        }
        
        // Inicializar BD
        $pdo = initDatabase();
        if (!$pdo) {
            throw new Exception('Error de conexión a la base de datos');
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
                    direccion, codigo_postal, localidad, activo, created_at
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
            
            // 3. Crear la factura asociada CON OBSERVACIONES
            $queryFactura = "
                INSERT INTO facturas (
                    usuario_id, tipo_servicio, descripcion, precio, 
                    forma_pago, fecha_pago, observaciones, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ";
            
            error_log("Query factura: " . $queryFactura);
            
            $stmt = $pdo->prepare($queryFactura);
            
            $parametrosFactura = [
                $usuarioId,
                $datosFactura['tipoServicio'],
                $datosFactura['descripcion'] ?? 'Servicio sin descripción',
                floatval($datosFactura['precio']),
                $datosFactura['formaPago'],
                $datosFactura['fechaPago'],
                $datosFactura['observaciones'] ?? null // NUEVO CAMPO
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
            $mensajeExito = "Usuario '{$datosUsuario['nombre']} {$datosUsuario['primerApellido']}' creado exitosamente";
            
            // Añadir información sobre servicio personalizado si aplica
            if ($datosFactura['tipoServicio'] === 'personalizado') {
                $mensajeExito .= " con servicio personalizado: " . substr($datosFactura['observaciones'], 0, 50) . 
                    (strlen($datosFactura['observaciones']) > 50 ? "..." : "");
            } else {
                $mensajeExito .= " con factura de {$datosFactura['precio']}€";
            }
            
            sendJsonResponse([
                'success' => true,
                'message' => $mensajeExito,
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
                    'forma_pago' => $datosFactura['formaPago'],
                    'es_personalizado' => $datosFactura['tipoServicio'] === 'personalizado',
                    'observaciones' => $datosFactura['observaciones'] ?? null
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
        sendJsonResponse([
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
                $pdo = initDatabase();
                if (!$pdo) {
                    throw new Exception('Error de conexión a la base de datos');
                }
                
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
                    ORDER BY f.created_at DESC 
                    LIMIT 5
                ");
                $ultimasFacturas = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                sendJsonResponse([
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
                sendJsonResponse([
                    'success' => false,
                    'message' => $e->getMessage()
                ]);
            }
            break;
            case 'importar_excel_facturas':
            if ($method !== 'POST') {
                sendJsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
            }

            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (!$data || !isset($data['registros']) || !is_array($data['registros'])) {
                sendJsonResponse(['success' => false, 'message' => 'Datos de importación incompletos o no válidos.'], 400);
            }

            $pdo = initDatabase();
            if (!$pdo) {
                sendJsonResponse(['success' => false, 'message' => 'Error de conexión a la base de datos']);
            }

            // Cargar clases necesarias para la operación
            require_once '../classes/Usuario.php';
            require_once '../classes/Factura.php';
            
            $usuarioManager = new Usuario($pdo);
            $facturaManager = new Factura($pdo);
            
            $detalles = [
                'facturasCreadas' => 0,
                'usuariosNoEncontrados' => 0,
                'erroresDatos' => 0
            ];

            foreach ($data['registros'] as $registro) {
                try {
                    $dni = $registro['usuario']['dni'] ?? null;
                    $facturaData = $registro['factura'] ?? null;
                    
                    if (!$dni || !$facturaData) {
                        $detalles['erroresDatos']++;
                        continue;
                    }
                    
                    // Buscar usuario por DNI
                    $usuario = $usuarioManager->buscarPorDni($dni);
                    
                    if ($usuario) {
                        $facturaData['usuario_id'] = $usuario['id'];
                        // Crear la factura asociada al usuario
                        $facturaManager->crear($facturaData);
                        $detalles['facturasCreadas']++;
                    } else {
                        $detalles['usuariosNoEncontrados']++;
                    }
                    
                } catch (Exception $e) {
                    error_log("Error al procesar registro: " . $e->getMessage());
                    $detalles['erroresDatos']++;
                }
            }

            sendJsonResponse([
                'success' => true,
                'message' => 'Proceso de importación completado.',
                'detalles' => $detalles
            ]);
            break;

        case 'crear_factura_simple':
            try {
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!$input || !isset($input['usuario_id']) || !isset($input['factura'])) {
                    throw new Exception('Datos incompletos');
                }
                
                $usuarioId = $input['usuario_id'];
                $datosFactura = $input['factura'];
                
                $pdo = initDatabase();
                if (!$pdo) {
                    throw new Exception('Error de conexión a la base de datos');
                }
                
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
                        forma_pago, fecha_pago, created_at
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
                
                sendJsonResponse([
                    'success' => true,
                    'message' => "Factura creada exitosamente para {$usuario['nombre']} {$usuario['primer_apellido']}",
                    'factura_id' => $pdo->lastInsertId()
                ]);
                
            } catch (Exception $e) {
                sendJsonResponse([
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
// Función auxiliar para validar fechas
function validarFecha($fecha) {
    if (empty($fecha)) return false;
    
    // Intentar varios formatos
    $formatos = ['Y-m-d', 'd/m/Y', 'm/d/Y', 'Y/m/d'];
    
    foreach ($formatos as $formato) {
        $date = DateTime::createFromFormat($formato, $fecha);
        if ($date && $date->format($formato) === $fecha) {
            return true;
        }
    }
    
    return false;
}
function procesarFechaExcel($fechaExcel) {
    if (empty($fechaExcel)) {
        return date('Y-m-d');
    }
    
    $fechaExcel = trim($fechaExcel);
    error_log("🔍 Procesando fecha Excel: '$fechaExcel'");
    
    // Si es número serial de Excel
    if (is_numeric($fechaExcel)) {
        $numeroSerial = intval($fechaExcel);
        
        // FÓRMULA DIRECTA Y PROBADA:
        // Timestamp para 31 de diciembre de 1899 (día antes del inicio de Excel)
        $baseTimestamp = strtotime('1899-12-31');
        $segundosPorDia = 86400;
        
        // Sumar los días directamente
        $timestampFinal = $baseTimestamp + ($numeroSerial * $segundosPorDia);
        
        $fechaFinal = date('Y-m-d', $timestampFinal);
        error_log("✅ CONVERSIÓN: Excel $numeroSerial -> $fechaFinal");
        
        return $fechaFinal;
    }
    
    // Para otros formatos...
    if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $fechaExcel, $matches)) {
        $dia = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
        $mes = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
        $año = $matches[3];
        return "$año-$mes-$dia";
    }
    
    try {
        return (new DateTime($fechaExcel))->format('Y-m-d');
    } catch (Exception $e) {
        return date('Y-m-d');
    }
}
?>