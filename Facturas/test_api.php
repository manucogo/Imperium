<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Test básico
echo "PHP funciona correctamente<br>";

// Test de la acción específica
try {
    $_GET['action'] = 'listar_todos_usuarios';
    include 'api/endpoints.php';
} catch (Exception $e) {
    echo "Error capturado: " . $e->getMessage();
}
?>