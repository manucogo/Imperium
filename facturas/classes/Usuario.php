<?php
// classes/Usuario.php - Versión completamente corregida
class Usuario {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function crear($data) {
        try {
            // Validar DNI
            if (!$this->validarDNI($data['dni'])) {
                throw new Exception('DNI no válido');
            }
            
            // Verificar que el DNI no exista
            if ($this->existeDNI($data['dni'])) {
                throw new Exception('Ya existe un usuario con este DNI');
            }
            
            $stmt = $this->pdo->prepare("
                INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, dni, email, telefono, direccion, codigo_postal, localidad, activo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['nombre'],
                $data['primerApellido'],
                $data['segundoApellido'] ?? null,
                $data['dni'],
                $data['email'] ?? null,
                $data['telefono'] ?? null,
                $data['direccion'] ?? null,
                $data['codigoPostal'] ?? null,
                $data['localidad'] ?? 'Granada',
                $data['activo'] ?? 1  // CORRECCIÓN: Añadida coma faltante
            ]);
            
            return $this->pdo->lastInsertId();
            
        } catch (Exception $e) {
            throw new Exception('Error al crear usuario: ' . $e->getMessage());
        }
    }
    
public function buscar($termino) {
    try {
        $stmt = $this->pdo->prepare("
            SELECT u.*, 
                   COALESCE(COUNT(f.id), 0) as total_facturas,
                   COALESCE(SUM(f.precio), 0) as total_facturado
            FROM usuarios u
            LEFT JOIN facturas f ON u.id = f.usuario_id
            WHERE u.nombre LIKE ? 
               OR u.primer_apellido LIKE ? 
               OR u.segundo_apellido LIKE ? 
               OR u.dni LIKE ?
               OR u.email LIKE ?
            GROUP BY u.id, u.nombre, u.primer_apellido, u.segundo_apellido, u.dni, u.email, u.telefono, u.direccion, u.codigo_postal, u.localidad, u.activo, u.created_at, u.updated_at
            ORDER BY u.nombre, u.primer_apellido
        ");
        
        $searchTerm = '%' . $termino . '%';
        $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Procesar resultados para asegurar tipos correctos
        foreach ($usuarios as &$usuario) {
            $usuario['total_facturas'] = (int)$usuario['total_facturas'];
            $usuario['total_facturado'] = (float)$usuario['total_facturado'];
            $usuario['activo'] = (int)$usuario['activo'];
            $usuario['facturas'] = $this->obtenerFacturasUsuario($usuario['id']);
        }
        
        return $usuarios;
        
    } catch (Exception $e) {
        throw new Exception('Error al buscar usuarios: ' . $e->getMessage());
    }
}
    
    public function obtenerPorId($id) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT u.*, 
                       COALESCE(COUNT(f.id), 0) as total_facturas,
                       COALESCE(SUM(f.precio), 0) as total_facturado
                FROM usuarios u
                LEFT JOIN facturas f ON u.id = f.usuario_id
                WHERE u.id = ?
                GROUP BY u.id, u.nombre, u.primer_apellido, u.segundo_apellido, u.dni, u.email, u.telefono, u.direccion, u.codigo_postal, u.localidad, u.activo, u.created_at, u.updated_at
            ");
            $stmt->execute([$id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($usuario) {
                $usuario['total_facturas'] = (int)$usuario['total_facturas'];
                $usuario['total_facturado'] = (float)$usuario['total_facturado'];
                $usuario['activo'] = (int)$usuario['activo'];
                $usuario['facturas'] = $this->obtenerFacturasUsuario($id);
            }
            
            return $usuario;
            
        } catch (Exception $e) {
            throw new Exception('Error al obtener usuario: ' . $e->getMessage());
        }
    }
    
    // CORRECCIÓN: Función obtenerTodos movida antes de las funciones privadas
    public function obtenerTodos() {
        try {
            $stmt = $this->pdo->query("
            SELECT u.*, 
                   COALESCE(COUNT(f.id), 0) as total_facturas,
                   COALESCE(SUM(f.precio), 0) as total_facturado
            FROM usuarios u
            LEFT JOIN facturas f ON u.id = f.usuario_id
            GROUP BY u.id
            ORDER BY u.nombre, u.primer_apellido
        ");
            $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Procesar resultados para asegurar tipos correctos
            foreach ($usuarios as &$usuario) {
                $usuario['total_facturas'] = (int)$usuario['total_facturas'];
                $usuario['total_facturado'] = (float)$usuario['total_facturado'];
                $usuario['activo'] = (int)$usuario['activo'];
            }
            
            return $usuarios;
            
        } catch (Exception $e) {
            throw new Exception('Error al obtener usuarios: ' . $e->getMessage());
        }
    }
    
    // CORRECCIÓN: Función actualizarEstado movida aquí
    public function actualizarEstado($id, $activo) {
        try {
            $stmt = $this->pdo->prepare("
                UPDATE usuarios SET activo = ? WHERE id = ?
            ");
            $stmt->execute([$activo, $id]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            throw new Exception('Error al actualizar estado: ' . $e->getMessage());
        }
    }
    
    // CORRECCIÓN: Método renombrado para evitar conflictos
    public function listarTodos() {
        return $this->obtenerTodos();
    }
    
    private function obtenerFacturasUsuario($usuarioId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT * FROM facturas 
                WHERE usuario_id = ? 
                ORDER BY fecha_factura DESC, numero_factura DESC
            ");
            $stmt->execute([$usuarioId]);
            $facturas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Asegurar tipos correctos
            foreach ($facturas as &$factura) {
                $factura['precio'] = (float)$factura['precio'];
                $factura['precio_sin_iva'] = (float)($factura['precio_sin_iva'] ?? 0);
                $factura['iva'] = (float)($factura['iva'] ?? 0);
                $factura['usuario_id'] = (int)$factura['usuario_id'];
            }
            
            return $facturas;
            
        } catch (Exception $e) {
            error_log("Error al obtener facturas del usuario {$usuarioId}: " . $e->getMessage());
            return [];
        }
    }
    public function buscarPorDni($dni) {
        try {
            $stmt = $this->pdo->prepare("SELECT id, nombre, primer_apellido, dni FROM usuarios WHERE dni = ? LIMIT 1");
            $stmt->execute([$dni]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            error_log("Error al buscar usuario por DNI: " . $e->getMessage());
            return false;
        }
    }
    private function validarDNI($dni) {
        if (empty($dni)) {
            return false;
        }
        
        $dniPattern = '/^\d{8}[A-Za-z]$/';
        $niePattern = '/^[XYZxyz]\d{7}[A-Za-z]$/';
        
        return preg_match($dniPattern, trim($dni)) || preg_match($niePattern, trim($dni));
    }
    
    private function existeDNI($dni) {
        try {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM usuarios WHERE dni = ?");
            $stmt->execute([$dni]);
            return $stmt->fetchColumn() > 0;
        } catch (Exception $e) {
            error_log("Error al verificar DNI: " . $e->getMessage());
            return false;
        }
    }
}
?>