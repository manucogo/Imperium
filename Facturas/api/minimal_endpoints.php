<?php
// api/minimal_endpoints.php - Endpoints mínimos para debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Headers básicos
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Función para respuesta JSON
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Obtener acción
$action = $_GET['action'] ?? 'default';

try {
    switch ($action) {
        case 'test_connection':
            jsonResponse([
                'success' => true,
                'message' => 'Conexión exitosa desde minimal_endpoints.php',
                'timestamp' => date('Y-m-d H:i:s'),
                'php_version' => PHP_VERSION,
                'action' => $action,
                'method' => $_SERVER['REQUEST_METHOD']
            ]);
            break;
            
        case 'verificar_sesion':
            session_start();
            if (isset($_SESSION['admin_id'])) {
                jsonResponse([
                    'success' => true,
                    'user' => [
                        'id' => $_SESSION['admin_id'],
                        'username' => $_SESSION['admin_username'] ?? 'admin',
                        'nombre' => $_SESSION['admin_nombre'] ?? 'Administrador'
                    ]
                ]);
            } else {
                jsonResponse([
                    'success' => false,
                    'message' => 'No hay sesión activa'
                ]);
            }
            break;
            
        case 'login':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $input = file_get_contents('php://input');
                $data = json_decode($input, true);
                
                if ($data && $data['username'] === 'admin' && $data['password'] === 'imperium2024') {
                    session_start();
                    $_SESSION['admin_id'] = 1;
                    $_SESSION['admin_username'] = 'admin';
                    $_SESSION['admin_nombre'] = 'Administrador';
                    
                    jsonResponse([
                        'success' => true,
                        'message' => 'Login exitoso (modo básico)',
                        'user' => [
                            'id' => 1,
                            'username' => 'admin',
                            'nombre' => 'Administrador'
                        ]
                    ]);
                } else {
                    jsonResponse([
                        'success' => false,
                        'message' => 'Usuario o contraseña incorrectos'
                    ]);
                }
            }
            break;
            
        case 'logout':
            session_start();
            session_destroy();
            jsonResponse([
                'success' => true,
                'message' => 'Sesión cerrada'
            ]);
            break;
            
        case 'obtener_configuracion':
            jsonResponse([
                'prefijo_factura' => 'IMPERIUMBOXGR',
                'iva_porcentaje' => '21',
                'empresa_nombre' => 'Ruben Hinojosa Valle',
                'empresa_nif' => '31725301K',
                'empresa_direccion' => 'Arabial 45, CC NEPTUNO. IMPERIUM, Local 79',
                'empresa_localidad' => '18004, Granada, España',
                'empresa_email' => 'hello@imperiumcrosstraining.com'
            ]);
            break;
            
        case 'debug_info':
            jsonResponse([
                'success' => true,
                'server_info' => [
                    'php_version' => PHP_VERSION,
                    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
                    'request_method' => $_SERVER['REQUEST_METHOD'],
                    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
                    'http_host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
                    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'unknown'
                ],
                'session_info' => [
                    'session_id' => session_id(),
                    'session_status' => session_status(),
                    'session_data' => $_SESSION ?? []
                ],
                'files_exist' => [
                    'config_database' => file_exists('../config/database.php'),
                    'classes_auth' => file_exists('../classes/Auth.php'),
                    'classes_usuario' => file_exists('../classes/Usuario.php'),
                    'classes_factura' => file_exists('../classes/Factura.php')
                ]
            ]);
            break;
            
        default:
            jsonResponse([
                'success' => false,
                'message' => 'Acción no válida o no especificada',
                'action' => $action,
                'available_actions' => [
                    'test_connection',
                    'verificar_sesion', 
                    'login',
                    'logout',
                    'obtener_configuracion',
                    'debug_info'
                ]
            ]);
            break;
    }
    
} catch (Exception $e) {
    jsonResponse([
        'success' => false,
        'error' => true,
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], 500);
}
?>