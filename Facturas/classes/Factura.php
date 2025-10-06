<?php
class Factura {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
   public function crear($data) {
    try {
        // Obtener siguiente número de factura si no se proporciona
        if (empty($data['numero_factura'])) { // Cambiar $datos por $data
            $data['numero_factura'] = $this->obtenerSiguienteNumero();
        }
        
        // Calcular IVA si no se proporciona
        if (!isset($data['precio_sin_iva']) || !isset($data['iva'])) {
            $precio = floatval($data['precio']);
            $data['precio_sin_iva'] = round($precio / 1.21, 2);
            $data['iva'] = round($precio - $data['precio_sin_iva'], 2);
        }
        
        // Si no se especifica fecha de factura, usar la fecha de pago
        if (empty($data['fecha_factura'])) {
            $data['fecha_factura'] = $data['fecha_pago'];
        }
        
        // Query ACTUALIZADA para incluir observaciones
        $query = "
            INSERT INTO facturas (
                usuario_id, numero_factura, tipo_servicio, descripcion, 
                precio, precio_sin_iva, iva, forma_pago, 
                fecha_pago, fecha_factura, observaciones, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ";
        
        $stmt = $this->pdo->prepare($query);
        
        $parametros = [
            $data['usuario_id'],
            $data['numero_factura'],
            $data['tipo_servicio'],
            $data['descripcion'],
            $data['precio'],
            $data['precio_sin_iva'],
            $data['iva'],
            $data['forma_pago'],
            $data['fecha_pago'],
            $data['fecha_factura'],
            $data['observaciones'] ?? null
        ];
        
        $resultado = $stmt->execute($parametros);
        
        if ($resultado) {
            $facturaId = $this->pdo->lastInsertId();
            
            // Log para servicios personalizados
            if ($data['tipo_servicio'] === 'personalizado') {
                error_log("Factura personalizada creada: ID {$facturaId}, Observaciones: " . 
                    ($data['observaciones'] ?? 'N/A'));
            }
            
            return $facturaId;
        } else {
            error_log("Error al crear factura: " . json_encode($stmt->errorInfo()));
            return false;
        }
        
    } catch (Exception $e) {
        error_log("Error en Factura::crear(): " . $e->getMessage());
        return false;
    }
}
    
    public function obtenerPorId($id) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT f.*, u.nombre, u.primer_apellido, u.segundo_apellido, u.dni, u.email, u.telefono, u.direccion, u.codigo_postal, u.localidad
                FROM facturas f
                JOIN usuarios u ON f.usuario_id = u.id
                WHERE f.id = ?
            ");
            $stmt->execute([$id]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            throw new Exception('Error al obtener factura: ' . $e->getMessage());
        }
    }
    
    public function obtenerPorMes($mes, $año) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT f.*, u.nombre, u.primer_apellido, u.segundo_apellido, u.dni, u.email, u.telefono, u.direccion, u.codigo_postal, u.localidad
                FROM facturas f
                JOIN usuarios u ON f.usuario_id = u.id
                WHERE MONTH(f.fecha_pago) = ? AND YEAR(f.fecha_pago) = ?
                ORDER BY f.fecha_pago DESC, f.numero_factura DESC
            ");
            
            $stmt->execute([$mes, $año]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            throw new Exception('Error al obtener facturas del mes: ' . $e->getMessage());
        }
    }
    
    public function obtenerSiguienteNumero() {
        try {
            // Obtener el prefijo de la configuración
            $stmt = $this->pdo->prepare("SELECT valor FROM configuracion WHERE clave = 'prefijo_factura'");
            $stmt->execute();
            $prefijo = $stmt->fetchColumn() ?: 'IMPERIUMBOXGR';
            
            // Obtener el último número de factura
            $stmt = $this->pdo->prepare("
                SELECT numero_factura FROM facturas 
                WHERE numero_factura LIKE ? 
                ORDER BY CAST(SUBSTRING_INDEX(numero_factura, '/', -1) AS UNSIGNED) DESC
                LIMIT 1
            ");
            $stmt->execute([$prefijo . '/%']);
            $ultimaFactura = $stmt->fetchColumn();
            
            if ($ultimaFactura) {
                $partes = explode('/', $ultimaFactura);
                $ultimoNumero = intval($partes[1] ?? 0);
                $siguienteNumero = $ultimoNumero + 1;
            } else {
                $siguienteNumero = 1;
            }
            
            return $prefijo . '/' . $siguienteNumero;
            
        } catch (Exception $e) {
            throw new Exception('Error al obtener siguiente número: ' . $e->getMessage());
        }
    }
    
    private function generarNumeroFactura() {
        return $this->obtenerSiguienteNumero();
    }
    
    private function calcularFechaFactura($fechaPago) {
        // Convertir la fecha de pago al último día del mes
        $fecha = new DateTime($fechaPago);
        $ultimoDiaMes = new DateTime($fecha->format('Y-m-t'));
        return $ultimoDiaMes->format('Y-m-d');
    }
    
    public function verificarNumeroExiste($numeroFactura) {
        try {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM facturas WHERE numero_factura = ?");
            $stmt->execute([$numeroFactura]);
            return $stmt->fetchColumn() > 0;
        } catch (Exception $e) {
            return false;
        }
    }
}

?>