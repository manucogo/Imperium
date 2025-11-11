<?php
// debug.php - Coloca este archivo en la raíz de tu proyecto
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>🔧 Debug del Sistema Imperium Box</h1>";

// 1. Verificar archivos
echo "<h2>📁 Verificación de Archivos</h2>";
$archivos_necesarios = [
    'config/database.php',
    'classes/Auth.php',
    'classes/Usuario.php',
    'api/endpoints.php'
];

foreach ($archivos_necesarios as $archivo) {
    if (file_exists($archivo)) {
        echo "✅ $archivo - <span style='color:green'>EXISTE</span><br>";
    } else {
        echo "❌ $archivo - <span style='color:red'>NO EXISTE</span><br>";
    }
}

// 2. Verificar conexión a BD
echo "<h2>🗄️ Conexión a Base de Datos</h2>";
try {
    if (file_exists('config/database.php')) {
        require_once 'config/database.php';
        $database = new Database();
        $pdo = $database->getConnection();
        
        if ($pdo) {
            echo "✅ Conexión exitosa<br>";
            
            // Verificar tablas
            echo "<h3>📋 Verificación de Tablas</h3>";
            $tablas = ['usuarios', 'facturas', 'administradores', 'configuracion'];
            
            foreach ($tablas as $tabla) {
                try {
                    $stmt = $pdo->query("SELECT COUNT(*) FROM $tabla");
                    $count = $stmt->fetchColumn();
                    echo "✅ Tabla '$tabla' - $count registros<br>";
                } catch (Exception $e) {
                    echo "❌ Tabla '$tabla' - ERROR: " . $e->getMessage() . "<br>";
                }
            }
            
            // Verificar administradores específicamente
            echo "<h3>👤 Administradores en la BD</h3>";
            try {
                $stmt = $pdo->query("SELECT id, username, nombre, email, activo FROM administradores");
                $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if (empty($admins)) {
                    echo "⚠️ <span style='color:orange'>NO HAY ADMINISTRADORES EN LA BD</span><br>";
                    echo "<strong>Solución:</strong> Necesitas insertar un administrador<br>";
                } else {
                    echo "<table border='1' style='border-collapse:collapse; margin:10px 0;'>";
                    echo "<tr><th>ID</th><th>Usuario</th><th>Nombre</th><th>Email</th><th>Activo</th></tr>";
                    foreach ($admins as $admin) {
                        echo "<tr>";
                        echo "<td>{$admin['id']}</td>";
                        echo "<td>{$admin['username']}</td>";
                        echo "<td>{$admin['nombre']}</td>";
                        echo "<td>{$admin['email']}</td>";
                        echo "<td>" . ($admin['activo'] ? 'Sí' : 'No') . "</td>";
                        echo "</tr>";
                    }
                    echo "</table>";
                }
            } catch (Exception $e) {
                echo "❌ Error al consultar administradores: " . $e->getMessage() . "<br>";
            }
            
        } else {
            echo "❌ No se pudo conectar a la BD<br>";
        }
    } else {
        echo "❌ Archivo config/database.php no existe<br>";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
}

// 3. Probar endpoints
echo "<h2>🔗 Prueba de Endpoints</h2>";
$base_url = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']);

// Test básico
echo "<a href='{$base_url}/api/endpoints.php?action=test_connection' target='_blank'>🧪 Test Connection</a><br>";
echo "<a href='{$base_url}/api/endpoints.php?action=check_database' target='_blank'>🗄️ Check Database</a><br>";

// 4. Generar hash de contraseña
echo "<h2>🔐 Generador de Contraseña</h2>";
$password = "admin123";
$hash = password_hash($password, PASSWORD_DEFAULT);
echo "Contraseña: <strong>$password</strong><br>";
echo "Hash: <code style='background:#f0f0f0; padding:5px;'>$hash</code><br>";

// 5. Script SQL para insertar admin
echo "<h2>📝 Script SQL para Crear Administrador</h2>";
echo "<textarea style='width:100%; height:100px; font-family:monospace;'>";
echo "INSERT INTO administradores (username, password, nombre, email, activo) VALUES \n";
echo "('admin', '$hash', 'Administrador', 'admin@imperiumbox.com', 1);\n";
echo "</textarea><br>";

// 6. Información del servidor
echo "<h2>ℹ️ Información del Servidor</h2>";
echo "PHP Version: " . PHP_VERSION . "<br>";
echo "Server: " . ($_SERVER['HTTP_HOST'] ?? 'localhost') . "<br>";
echo "Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'N/A') . "<br>";
echo "Current Script: " . __FILE__ . "<br>";

echo "<hr>";
echo "<h2>🚀 Pasos para Solucionar</h2>";
echo "<ol>";
echo "<li>Si no tienes administradores en la BD, ejecuta el script SQL mostrado arriba</li>";
echo "<li>Usa las credenciales: <strong>usuario:</strong> admin, <strong>contraseña:</strong> admin123</li>";
echo "<li>Verifica que todos los archivos existan en las rutas correctas</li>";
echo "<li>Prueba los endpoints haciendo clic en los enlaces</li>";
echo "</ol>";
?>
