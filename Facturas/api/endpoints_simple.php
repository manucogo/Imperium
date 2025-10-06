<?php
// api/endpoints_simple.php - Endpoints simplificados para debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Función para enviar respuesta
function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Función para registrar errores
function logError($message, $details = null) {
    $logMessage = date('Y-m-d H:i:s') . " - $message";
    if ($details) {
        $logMessage .= " - Details: " . print_r($details, true);
    }
    error_log($logMessage);
}

// Obtener la acción
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Log de la petición
logError("Request received", [
    'action' => $action,
    'method' => $method,
    'server' => $_SERVER['HTTP_HOST'] ?? 'unknown',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
]);

try {
    switch ($action) {
        case 'test_connection':
            sendResponse([
                'success' => true,
                'message' => 'Conexión exitosa desde endpoints_simple.php',
                'timestamp' => date('Y-m-d H:i:s'),
                'method' => $method,
                'php_version' => PHP_VERSION,
                'server' => $_SERVER['HTTP_HOST'] ?? 'localhost'
            ]);
            break;
            
        case 'check_files':
            $files = [
                'config/database.php' => file_exists('../config/database.php'),
                'classes/Auth.php' => file_exists('../classes/Auth.php'),
                'classes/Usuario.php' => file_exists('../classes/Usuario.php'),
                'classes/Factura.php' => file_exists('../classes/Factura.php')
            ];
            
            sendResponse([
                'success' => true,
                'files' => $files,
                'all_files_exist' => !in_array(false, $files)
            ]);
            break;
            
        case 'test_database':
            if (!file_exists('../config/database.php')) {
                sendResponse([
                    'success' => false,
                    'message' => 'Archivo config/database.php no encontrado'
                ]);
            }
            
            try {
                require_once '../config/database.php';
                $db = new Database();
                $pdo = $db->getConnection();
                
                // Probar consulta simple
                $stmt = $pdo->query("SELECT 1 as test, NOW() as fecha_actual");
                $result = $stmt->fetch();
                
                sendResponse([
                    'success' => true,
                    'message' => 'Conexión a base de datos exitosa',
                    'test_result' => $result
                ]);
                
            } catch (Exception $e) {
                sendResponse([
                    'success' => false,
                    'message' => 'Error de base de datos: ' . $e->getMessage(),
                    'error_details' => [
                        'file' => $e->getFile(),
                        'line' => $e->getLine()
                    ]
                ]);
            }
            break;
            
        case 'test_auth':
            try {
                if (!file_exists('../config/database.php')) {
                    throw new Exception('config/database.php no encontrado');
                }
                if (!file_exists('../classes/Auth.php')) {
                    throw new Exception('classes/Auth.php no encontrado');
                }
                
                require_once '../config/database.php';
                require_once '../classes/Auth.php';
                
                $db = new Database();
                $pdo = $db->getConnection();
                $auth = new Auth($pdo);
                
                // Verificar si existe el usuario admin
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM administradores WHERE username = 'admin'");
                $stmt->execute();
                $adminExists = $stmt->fetchColumn() > 0;
                
                sendResponse([
                    'success' => true,
                    'message' => 'Clase Auth funciona correctamente',
                    'admin_exists' => $adminExists
                ]);
                
            } catch (Exception $e) {
                sendResponse([
                    'success' => false,
                    'message' => 'Error en Auth: ' . $e->getMessage(),
                    'error_details' => [
                        'file' => $e->getFile(),
                        'line' => $e->getLine()
                    ]
                ]);
            }
            break;
            
        case 'login':
            if ($method === 'POST') {
                try {
                    $input = file_get_contents('php://input');
                    $data = json_decode($input, true);
                    
                    if (!$data || !isset($data['username']) || !isset($data['password'])) {
                        sendResponse([
                            'success' => false,
                            'message' => 'Datos incompletos'
                        ]);
                    }
                    
                    require_once '../config/database.php';
                    require_once '../classes/Auth.php';
                    
                    $db = new Database();
                    $pdo = $db->getConnection();
                    $auth = new Auth($pdo);
                    
                    $result = $auth->login($data['username'], $data['password']);
                    sendResponse($result);
                    
                } catch (Exception $e) {
                    sendResponse([
                        'success' => false,
                        'message' => 'Error en login: ' . $e->getMessage(),
                        'error_details' => [
                            'file' => $e->getFile(),
                            'line' => $e->getLine()
                        ]
                    ]);
                }
            }
            break;
            
        case 'verificar_sesion':
            if ($method === 'GET') {
                try {
                    session_start();
                    if (isset($_SESSION['admin_id'])) {
                        sendResponse([
                            'success' => true,
                            'user' => [
                                'id' => $_SESSION['admin_id'],
                                'username' => $_SESSION['admin_username'] ?? 'admin',
                                'nombre' => $_SESSION['admin_nombre'] ?? 'Administrador'
                            ]
                        ]);
                    } else {
                        sendResponse([
                            'success' => false,
                            'message' => 'No hay sesión activa'
                        ]);
                    }
                } catch (Exception $e) {
                    sendResponse([
                        'success' => false,
                        'message' => 'Error al verificar sesión: ' . $e->getMessage()
                    ]);
                }
            }
            break;
            
        case 'obtener_configuracion':
            if ($method === 'GET') {
                // Devolver configuración por defecto
                sendResponse([
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
            
        case '':
            sendResponse([
                'success' => false,
                'message' => 'Acción no especificada'
            ]);
            break;
            
        default:
            sendResponse([
                'success' => false,
                'message' => 'Acción no válida: ' . $action
            ]);
            break;
    }
    
} catch (Exception $e) {
    logError("Error general", [
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    
    sendResponse([
        'success' => false,
        'error' => true,
        'message' => $e->getMessage(),
        'details' => [
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ], 500);
}
?>