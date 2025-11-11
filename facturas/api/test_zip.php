<?php
// api/test_zip_simple.php - Prueba simple para verificar que la ruta funciona
header('Content-Type: text/html; charset=UTF-8');

echo "<h1>🧪 Test Simple de ZIP</h1>";
echo "<p><strong>Archivo:</strong> " . __FILE__ . "</p>";
echo "<p><strong>Directorio:</strong> " . __DIR__ . "</p>";
echo "<p><strong>URL accedida:</strong> " . $_SERVER['REQUEST_URI'] . "</p>";

// Verificar ZipArchive
if (class_exists('ZipArchive')) {
    echo "<p style='color: green;'>✅ ZipArchive disponible</p>";
    
    // Crear un ZIP de prueba muy simple
    $zipPath = sys_get_temp_dir() . '/test_' . uniqid() . '.zip';
    $zip = new ZipArchive();
    
    if ($zip->open($zipPath, ZipArchive::CREATE) === TRUE) {
        $zip->addFromString('prueba.txt', 'Hola mundo - ' . date('Y-m-d H:i:s'));
        $zip->close();
        
        if (file_exists($zipPath)) {
            echo "<p style='color: green;'>✅ ZIP de prueba creado exitosamente</p>";
            echo "<p>Tamaño: " . filesize($zipPath) . " bytes</p>";
            
            // Ofrecer descarga
            echo "<p><a href='?download=1' style='background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>⬇️ Descargar ZIP de Prueba</a></p>";
            
            // Si se solicita descarga
            if (isset($_GET['download'])) {
                header('Content-Type: application/zip');
                header('Content-Disposition: attachment; filename="prueba.zip"');
                header('Content-Length: ' . filesize($zipPath));
                readfile($zipPath);
                unlink($zipPath);
                exit;
            }
            
            unlink($zipPath);
        } else {
            echo "<p style='color: red;'>❌ No se pudo crear el ZIP</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ No se pudo abrir ZIP para escritura</p>";
    }
} else {
    echo "<p style='color: red;'>❌ ZipArchive NO disponible</p>";
}

// Verificar archivos necesarios
echo "<h2>📁 Verificación de Archivos</h2>";
$archivos = [
    '../config/database.php',
    '../classes/Factura.php',
    'generar_zip.php'
];

foreach ($archivos as $archivo) {
    if (file_exists($archivo)) {
        echo "<p style='color: green;'>✅ $archivo existe</p>";
    } else {
        echo "<p style='color: red;'>❌ $archivo NO existe</p>";
    }
}

// Información de debug
echo "<h2>🔍 Información de Debug</h2>";
echo "<p><strong>PHP Version:</strong> " . PHP_VERSION . "</p>";
echo "<p><strong>Servidor:</strong> " . $_SERVER['SERVER_SOFTWARE'] . "</p>";
echo "<p><strong>Directorio temp:</strong> " . sys_get_temp_dir() . "</p>";
echo "<p><strong>Permisos temp:</strong> " . (is_writable(sys_get_temp_dir()) ? 'Escribible' : 'No escribible') . "</p>";

// Test de sesión
session_start();
echo "<p><strong>Sesión activa:</strong> " . (isset($_SESSION['admin_id']) ? 'Sí (ID: ' . $_SESSION['admin_id'] . ')' : 'No') . "</p>";

echo "<br><p><a href='../index.html'>← Volver al sistema</a></p>";
?>