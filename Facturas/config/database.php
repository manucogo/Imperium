<?php
class Database {
    private $host = 'localhost';
    private $database = 'imperium_box';
    private $username = 'root';
    private $password = '';
    private $charset = 'utf8mb4';
    private $pdo;

    public function __construct() {
        $dsn = "mysql:host={$this->host};dbname={$this->database};charset={$this->charset}";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            $this->pdo = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            error_log("Error de conexión a BD: " . $e->getMessage());
            throw new PDOException("Error de conexión a la base de datos", (int)$e->getCode());
        }
    }

    public function getConnection() {
        return $this->pdo;
    }
    
    public function testConnection() {
        try {
            $stmt = $this->pdo->query("SELECT 1");
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}
?>