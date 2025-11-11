<?php
// classes/Auth.php
class Auth {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function login($username, $password) {
        try {
            // Buscar usuario
            $stmt = $this->pdo->prepare("
                SELECT id, username, password, nombre, email, activo 
                FROM administradores 
                WHERE username = ? AND activo = 1
            ");
            $stmt->execute([$username]);
            $admin = $stmt->fetch();
            
            if ($admin && password_verify($password, $admin['password'])) {
                // Iniciar sesión
                $_SESSION['admin_id'] = $admin['id'];
                $_SESSION['admin_username'] = $admin['username'];
                $_SESSION['admin_nombre'] = $admin['nombre'];
                
                return [
                    'success' => true,
                    'message' => 'Login exitoso',
                    'user' => [
                        'id' => $admin['id'],
                        'username' => $admin['username'],
                        'nombre' => $admin['nombre'],
                        'email' => $admin['email']
                    ]
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Usuario o contraseña incorrectos'
                ];
            }
            
        } catch (Exception $e) {
            error_log("Error en login: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error del sistema'
            ];
        }
    }
    
    public function logout() {
        session_destroy();
        return [
            'success' => true,
            'message' => 'Sesión cerrada'
        ];
    }
    
    public function verificarSesion() {
        if (isset($_SESSION['admin_id'])) {
            return [
                'success' => true,
                'user' => [
                    'id' => $_SESSION['admin_id'],
                    'username' => $_SESSION['admin_username'],
                    'nombre' => $_SESSION['admin_nombre']
                ]
            ];
        } else {
            return [
                'success' => false,
                'message' => 'No hay sesión activa'
            ];
        }
    }
}