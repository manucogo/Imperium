<?php
// generate_password.php - Archivo temporal para generar hash
echo "<h1>🔐 Generador de Hash de Contraseña</h1>";

// Diferentes contraseñas para probar
$passwords = [
    'admin123',
    'imperium2024', 
    'admin',
    'imperium25'
];

echo "<h2>📋 Hashes Generados:</h2>";

foreach ($passwords as $password) {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    echo "<div style='margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;'>";
    echo "<strong>Contraseña:</strong> <code style='background: #e8e8e8; padding: 3px;'>$password</code><br>";
    echo "<strong>Hash:</strong> <code style='background: #e8e8e8; padding: 3px; font-size: 12px;'>$hash</code><br>";
    
    echo "<strong>SQL para insertar:</strong><br>";
    echo "<textarea style='width: 100%; height: 60px; font-family: monospace; font-size: 12px;'>";
    echo "DELETE FROM administradores WHERE username = 'admin';\n";
    echo "INSERT INTO administradores (username, password, nombre, email, activo) VALUES ('admin', '$hash', 'Administrador', 'admin@imperiumbox.com', 1);";
    echo "</textarea>";
    echo "</div><hr>";
}

// Test de verificación
echo "<h2>🧪 Test de Verificación</h2>";
echo "<p>Para verificar que un hash funciona:</p>";

$test_password = 'admin123';
$test_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

if (password_verify($test_password, $test_hash)) {
    echo "✅ El hash predeterminado SÍ funciona con 'admin123'<br>";
} else {
    echo "❌ El hash predeterminado NO funciona con 'admin123'<br>";
}

// Limpiar este archivo después de usar
echo "<br><hr>";
echo "<p style='color: red;'><strong>⚠️ IMPORTANTE:</strong> Elimina este archivo después de generar las contraseñas por seguridad.</p>";
?>
