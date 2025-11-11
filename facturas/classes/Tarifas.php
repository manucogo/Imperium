<?php
// classes/Tarifas.php - Clase para manejar tarifas
class Tarifas {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function obtenerTodas() {
        try {
            $stmt = $this->pdo->query("
                SELECT codigo, categoria, descripcion, precio, activo 
                FROM tarifas 
                WHERE activo = 1 
                ORDER BY categoria, precio
            ");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            // Si la tabla no existe, devolver tarifas por defecto
            return $this->obtenerTarifasPorDefecto();
        }
    }
    
    public function obtenerPorCodigo($codigo) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT codigo, categoria, descripcion, precio, activo 
                FROM tarifas 
                WHERE codigo = ? AND activo = 1
            ");
            $stmt->execute([$codigo]);
            $tarifa = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$tarifa) {
                // Buscar en tarifas por defecto
                $tarifasPorDefecto = $this->obtenerTarifasPorDefecto();
                foreach ($tarifasPorDefecto as $t) {
                    if ($t['codigo'] === $codigo) {
                        return $t;
                    }
                }
            }
            
            return $tarifa;
        } catch (Exception $e) {
            return null;
        }
    }
    
    public function obtenerPrecio($codigo) {
        $tarifa = $this->obtenerPorCodigo($codigo);
        return $tarifa ? $tarifa['precio'] : 0;
    }
    
    public function obtenerDescripcion($codigo) {
        $tarifa = $this->obtenerPorCodigo($codigo);
        return $tarifa ? $tarifa['descripcion'] : $codigo;
    }
    
    private function obtenerTarifasPorDefecto() {
        return [
            // OPEN
            ['codigo' => 'open_2dias', 'categoria' => 'OPEN', 'descripcion' => 'OPEN 2 días semana', 'precio' => 55.00, 'activo' => 1],
            ['codigo' => 'open_3dias', 'categoria' => 'OPEN', 'descripcion' => 'OPEN 3 días semana', 'precio' => 65.00, 'activo' => 1],
            ['codigo' => 'open_4dias', 'categoria' => 'OPEN', 'descripcion' => 'OPEN 4 días semana', 'precio' => 75.00, 'activo' => 1],
            ['codigo' => 'open_ilimitado', 'categoria' => 'OPEN', 'descripcion' => 'OPEN Ilimitado', 'precio' => 85.00, 'activo' => 1],
            
            // CLASES
            ['codigo' => 'clases_2dias', 'categoria' => 'CLASES', 'descripcion' => 'CLASES 2 días semana', 'precio' => 55.00, 'activo' => 1],
            ['codigo' => 'clases_3dias', 'categoria' => 'CLASES', 'descripcion' => 'CLASES 3 días semana', 'precio' => 65.00, 'activo' => 1],
            ['codigo' => 'clases_4dias', 'categoria' => 'CLASES', 'descripcion' => 'CLASES 4 días semana', 'precio' => 75.00, 'activo' => 1],
            ['codigo' => 'clases_ilimitado', 'categoria' => 'CLASES', 'descripcion' => 'CLASES Ilimitado', 'precio' => 85.00, 'activo' => 1],
            
            // BONOS
            ['codigo' => 'bono_1sesion', 'categoria' => 'BONOS', 'descripcion' => 'BONO 1 Sesión (CLASE/OPEN)', 'precio' => 10.00, 'activo' => 1],
            ['codigo' => 'bono_10sesiones', 'categoria' => 'BONOS', 'descripcion' => 'BONO 10 Sesiones (CLASES/OPEN)', 'precio' => 80.00, 'activo' => 1],
            ['codigo' => 'bono_3clases_1open', 'categoria' => 'BONOS', 'descripcion' => 'BONO 3 Días Clases + 1 Día Open', 'precio' => 75.00, 'activo' => 1],
            ['codigo' => 'bono_3clases_2open', 'categoria' => 'BONOS', 'descripcion' => 'BONO 3 Días Clases + 2 Días Open', 'precio' => 85.00, 'activo' => 1],
            
            // Compatibilidad con valores antiguos
            ['codigo' => '3wod_1mes', 'categoria' => 'LEGACY', 'descripcion' => 'OPEN 3 días semana', 'precio' => 65.00, 'activo' => 1],
            ['codigo' => 'libre_1mes', 'categoria' => 'LEGACY', 'descripcion' => 'OPEN Ilimitado', 'precio' => 85.00, 'activo' => 1],
            ['codigo' => '3wod_3meses', 'categoria' => 'LEGACY', 'descripcion' => 'OPEN 3 días semana (3 meses)', 'precio' => 165.00, 'activo' => 1],
            ['codigo' => 'libre_3meses', 'categoria' => 'LEGACY', 'descripcion' => 'OPEN Ilimitado (3 meses)', 'precio' => 225.00, 'activo' => 1]
        ];
    }
    
    public function crear($codigo, $categoria, $descripcion, $precio) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO tarifas (codigo, categoria, descripcion, precio) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$codigo, $categoria, $descripcion, $precio]);
            return $this->pdo->lastInsertId();
        } catch (Exception $e) {
            throw new Exception('Error al crear tarifa: ' . $e->getMessage());
        }
    }
    
    public function actualizar($codigo, $precio) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE tarifas 
                SET precio = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE codigo = ?
            ");
            $stmt->execute([$precio, $codigo]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            throw new Exception('Error al actualizar tarifa: ' . $e->getMessage());
        }
    }
    
    public function eliminar($codigo) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE tarifas 
                SET activo = 0, updated_at = CURRENT_TIMESTAMP 
                WHERE codigo = ?
            ");
            $stmt->execute([$codigo]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            throw new Exception('Error al eliminar tarifa: ' . $e->getMessage());
        }
    }
}
?>