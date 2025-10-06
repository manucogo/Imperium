<?php
// debug_api.php - Diagnosticar errores específicos de la API
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/html; charset=UTF-8');

echo "<h1>🔍 Debug API - Facturas</h1>";

// Simular autenticación para debug
session_start();
if (!isset($_SESSION['admin_id'])) {
    $_SESSION['admin_id'] = 1;
    $_SESSION['admin_username'] = 'admin';
    $_SESSION['admin_nombre'] = 'Debug Admin';
    echo "<p style='color: orange;'>⚠️ Simulando sesión para debug</p>";
}

echo "<div style='background: #f0f0f0; padding: 15px; margin: 15px 0; border-radius: 5px;'>";
echo "<h2>1. Test directo de endpoints.php</h2>";

// Test 1: Verificar que el archivo existe
if (!file_exists('api/endpoints.php')) {
    echo "<p style='color: red;'>❌ ERROR: api/endpoints.php no existe</p>";
    exit;
}

echo "<p style='color: green;'>✅ Archivo api/endpoints.php existe</p>";

// Test 2: Verificar sintaxis PHP
$output = [];
$return_var = 0;
exec('php -l api/endpoints.php 2>&1', $output, $return_var);

if ($return_var === 0) {
    echo "<p style='color: green;'>✅ Sintaxis PHP correcta en endpoints.php</p>";
} else {
    echo "<p style='color: red;'>❌ ERROR de sintaxis PHP:</p>";
    echo "<pre>" . implode("\n", $output) . "</pre>";
}

echo "</div>";

// Test 3: Verificar clases necesarias
echo "<div style='background: #f0f0f0; padding: 15px; margin: 15px 0; border-radius: 5px;'>";
echo "<h2>2. Test de clases PHP</h2>";

$clases = [
    'config/database.php' => 'Database',
    'classes/Factura.php' => 'Factura', 
    'classes/Usuario.php' => 'Usuario',
    'classes/Auth.php' => 'Auth'
];

foreach ($clases as $archivo => $clase) {
    if (!file_exists($archivo)) {
        echo "<p style='color: red;'>❌ Archivo $archivo no existe</p>";
        continue;
    }
    
    // Verificar sintaxis
    $output = [];
    $return_var = 0;
    exec("php -l $archivo 2>&1", $output, $return_var);
    
    if ($return_var === 0) {
        echo "<p style='color: green;'>✅ $archivo - sintaxis correcta</p>";
        
        // Intentar incluir
        try {
            include_once $archivo;
            if (class_exists($clase)) {
                echo "<p style='color: green;'>✅ Clase $clase cargada correctamente</p>";
            } else {
                echo "<p style='color: red;'>❌ Clase $clase no encontrada en el archivo</p>";
            }
        } catch (Exception $e) {
            echo "<p style='color: red;'>❌ Error al cargar $archivo: " . $e->getMessage() . "</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ Error de sintaxis en $archivo:</p>";
        echo "<pre>" . implode("\n", $output) . "</pre>";
    }
}

echo "</div>";

// Test 4: Test de base de datos
echo "<div style='background: #f0f0f0; padding: 15px; margin: 15px 0; border-radius: 5px;'>";
echo "<h2>3. Test de Base de Datos</h2>";

try {
    if (class_exists('Database')) {
        $database = new Database();
        $pdo = $database->getConnection();
        echo "<p style='color: green;'>✅ Conexión a BD exitosa</p>";
        
        // Test específico de facturas
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM facturas");
        $total = $stmt->fetch()['total'];
        echo "<p style='color: green;'>✅ Tabla facturas accesible - $total registros</p>";
        
        // Test con parámetros específicos
        $mes = 1;
        $anio = 2025;
        
        if (class_exists('Factura')) {
            $factura = new Factura($pdo);
            echo "<p style='color: green;'>✅ Clase Factura instanciada</p>";
            
            try {
                $resultados = $factura->obtenerPorMes($mes, $anio);
                echo "<p style='color: green;'>✅ Método obtenerPorMes() funciona - " . count($resultados) . " resultados</p>";
                
                if (count($resultados) > 0) {
                    echo "<p style='color: blue;'>📊 Datos de ejemplo:</p>";
                    echo "<pre>" . json_encode($resultados[0], JSON_PRETTY_PRINT) . "</pre>";
                }
                
            } catch (Exception $e) {
                echo "<p style='color: red;'>❌ Error en obtenerPorMes(): " . $e->getMessage() . "</p>";
            }
        }
        
    } else {
        echo "<p style='color: red;'>❌ Clase Database no disponible</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Error de BD: " . $e->getMessage() . "</p>";
}

echo "</div>";

// Test 5: Simular request exacto
echo "<div style='background: #f0f0f0; padding: 15px; margin: 15px 0; border-radius: 5px;'>";
echo "<h2>4. Test del Request Exacto</h2>";

$test_url = "api/endpoints.php?action=facturas_mes&mes=1&anio=2025";
echo "<p><strong>URL de prueba:</strong> $test_url</p>";

// Usar cURL para simular la petición exacta
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://{$_SERVER['HTTP_HOST']}" . dirname($_SERVER['REQUEST_URI']) . "/" . $test_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "<p style='color: red;'>❌ Error cURL: $error</p>";
} else {
    echo "<p style='color: green;'>✅ Respuesta HTTP: $http_code</p>";
    
    // Separar headers y body
    list($headers, $body) = explode("\r\n\r\n", $response, 2);
    
    echo "<h3>Headers de respuesta:</h3>";
    echo "<pre>" . htmlspecialchars($headers) . "</pre>";
    
    echo "<h3>Body de respuesta:</h3>";
    echo "<pre>" . htmlspecialchars(substr($body, 0, 1000)) . "</pre>";
    
    // Verificar si es JSON válido
    $json_data = json_decode($body, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "<p style='color: green;'>✅ Respuesta es JSON válido</p>";
        echo "<p>Elementos en array: " . (is_array($json_data) ? count($json_data) : 'No es array') . "</p>";
    } else {
        echo "<p style='color: red;'>❌ Respuesta NO es JSON válido</p>";
        echo "<p>Error JSON: " . json_last_error_msg() . "</p>";
        
        // Buscar errores PHP comunes
        if (strpos($body, '<br />') !== false) {
            echo "<p style='color: red;'>🔍 ENCONTRADO: El error contiene '&lt;br /&gt;' - esto indica un error de PHP</p>";
        }
        if (strpos($body, 'Fatal error') !== false) {
            echo "<p style='color: red;'>🔍 ENCONTRADO: Fatal error de PHP</p>";
        }
        if (strpos($body, 'Warning') !== false) {
            echo "<p style='color: red;'>🔍 ENCONTRADO: Warning de PHP</p>";
        }
        if (strpos($body, 'Notice') !== false) {
            echo "<p style='color: red;'>🔍 ENCONTRADO: Notice de PHP</p>";
        }
    }
}

echo "</div>";

// Test 6: Ejecutar endpoints.php directamente
echo "<div style='background: #f0f0f0; padding: 15px; margin: 15px 0; border-radius: 5px;'>";
echo "<h2>5. Test Directo de endpoints.php</h2>";

echo "<p>Ejecutando endpoints.php directamente...</p>";

// Simular variables $_GET
$_GET['action'] = 'facturas_mes';
$_GET['mes'] = '1';
$_GET['anio'] = '2025';

// Capturar output
ob_start();
try {
    // Ejecutar endpoints.php
    include 'api/endpoints.php';
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
$output = ob_get_clean();

echo "<h3>Output directo:</h3>";
echo "<pre>" . htmlspecialchars($output) . "</pre>";

// Verificar si el output es JSON
$json_test = json_decode($output, true);
if (json_last_error() === JSON_ERROR_NONE) {
    echo "<p style='color: green;'>✅ Output directo es JSON válido</p>";
} else {
    echo "<p style='color: red;'>❌ Output directo NO es JSON válido</p>";
    echo "<p>Error: " . json_last_error_msg() . "</p>";
}

echo "</div>";

// Test 7: Información adicional
echo "<div style='background: #f0f0f0; padding: 15px; margin: 15px 0; border-radius: 5px;'>";
echo "<h2>6. Información del Sistema</h2>";
echo "<p><strong>PHP Version:</strong> " . PHP_VERSION . "</p>";
echo "<p><strong>Display Errors:</strong> " . (ini_get('display_errors') ? 'ON' : 'OFF') . "</p>";
echo "<p><strong>Error Reporting:</strong> " . error_reporting() . "</p>";
echo "<p><strong>Current Working Directory:</strong> " . getcwd() . "</p>";
echo "<p><strong>Include Path:</strong> " . get_include_path() . "</p>";

// Ver errores recientes del log
$error_log = ini_get('error_log');
if ($error_log && file_exists($error_log)) {
    echo "<h3>Últimas líneas del error log:</h3>";
    $lines = file($error_log);
    $recent_lines = array_slice($lines, -10);
    echo "<pre>" . htmlspecialchars(implode('', $recent_lines)) . "</pre>";
}

echo "</div>";

echo "<h2>🔧 Posibles Soluciones</h2>";
echo "<ol>";
echo "<li><strong>Si hay errores de sintaxis PHP:</strong> Corrige los archivos mostrados arriba</li>";
echo "<li><strong>Si hay errores de BD:</strong> Verifica conexión y tablas</li>";
echo "<li><strong>Si endpoints.php devuelve HTML:</strong> Revisa errores de PHP en el archivo</li>";
echo "<li><strong>Si faltan clases:</strong> Asegúrate de que todos los archivos existen</li>";
echo "<li><strong>Si hay warnings/notices:</strong> Activa error reporting completo</li>";
echo "</ol>";

echo "<p><a href='index.html'>← Volver al sistema</a></p>";
?>

<style>
body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
h1, h2 { color: #333; }
pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; max-height: 300px; }
</style>