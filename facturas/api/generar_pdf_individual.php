<?php
// api/generar_pdf_individual.php - Versión corregida
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Función para manejar errores
function handleError($message, $code = 500) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['error' => true, 'message' => $message]);
    exit;
}

// Función para log de errores
function logError($message) {
    error_log(date('Y-m-d H:i:s') . " - PDF Error: " . $message);
}

try {
    // Verificar autenticación
    session_start();
    if (!isset($_SESSION['admin_id'])) {
        handleError('No autorizado - Debe estar logueado', 401);
    }

    // Obtener datos
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data || !isset($data['id'])) {
        handleError('Datos inválidos - ID de factura requerido', 400);
    }

    logError("Generando PDF para factura ID: " . $data['id']);

    // Incluir clases necesarias
    $required_files = [
        '../config/database.php',
        '../classes/Factura.php'
    ];
    
    foreach ($required_files as $file) {
        if (!file_exists($file)) {
            handleError("Archivo requerido no encontrado: $file");
        }
        require_once $file;
    }

    // Conectar a BD y obtener datos de la factura
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!$pdo) {
        handleError('No se pudo conectar a la base de datos');
    }
    
    $factura = new Factura($pdo);
    $facturaData = $factura->obtenerPorId($data['id']);

    if (!$facturaData) {
        handleError('Factura no encontrada', 404);
    }

    // Obtener configuración
    $configuracion = [
        'prefijo_factura' => 'IMPERIUMBOXGR',
        'iva_porcentaje' => '21',
        'empresa_nombre' => 'Ruben Hinojosa Valle',
        'empresa_nif' => '31725301K',
        'empresa_direccion' => 'Arabial 45, CC NEPTUNO. IMPERIUM, Local 79',
        'empresa_localidad' => '18004, Granada, España',
        'empresa_email' => 'hello@imperiumcrosstraining.com'
    ];

    try {
        $stmt = $pdo->query("SELECT clave, valor FROM configuracion");
        while ($row = $stmt->fetch()) {
            $configuracion[$row['clave']] = $row['valor'];
        }
    } catch (Exception $e) {
        logError("Error cargando configuración: " . $e->getMessage());
    }

    // Generar PDF usando múltiples métodos
    $numeroFactura = $data['numero'] ?? ($configuracion['prefijo_factura'] . '/1');
    $pdfContent = generarFacturaPDFRobusto($facturaData, $numeroFactura, $configuracion);

    if (!$pdfContent) {
        handleError('Error generando PDF - No se pudo crear el contenido');
    }

    // Verificar que el contenido sea válido
    if (strlen($pdfContent) < 100) {
        handleError('Error generando PDF - Contenido demasiado pequeño');
    }

    // Limpiar nombre de archivo
    $nombreArchivo = 'factura_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $numeroFactura) . '.pdf';
    
    // Enviar PDF
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $nombreArchivo . '"');
    header('Content-Length: ' . strlen($pdfContent));
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: no-cache');
    
    echo $pdfContent;
    exit;

} catch (Exception $e) {
    logError("Error general: " . $e->getMessage());
    handleError('Error interno del servidor: ' . $e->getMessage());
}

// Función principal para generar PDF con múltiples métodos
function generarFacturaPDFRobusto($facturaData, $numeroFactura, $config) {
    logError("Iniciando generación de PDF para: $numeroFactura");
    
    // Método 1: Intentar con wkhtmltopdf
    if (function_exists('shell_exec')) {
        $pdfContent = generarPDFConWkhtmltopdf($facturaData, $numeroFactura, $config);
        if ($pdfContent && strlen($pdfContent) > 100) {
            logError("PDF generado exitosamente con wkhtmltopdf");
            return $pdfContent;
        }
        logError("wkhtmltopdf falló o no disponible");
    }
    
    // Método 2: Intentar con TCPDF si está disponible
    if (class_exists('TCPDF') || file_exists('../vendor/tecnickcom/tcpdf/tcpdf.php')) {
        $pdfContent = generarPDFConTCPDF($facturaData, $numeroFactura, $config);
        if ($pdfContent && strlen($pdfContent) > 100) {
            logError("PDF generado exitosamente con TCPDF");
            return $pdfContent;
        }
        logError("TCPDF falló o no disponible");
    }
    
    // Método 3: Generar HTML optimizado para conversión manual
    logError("Generando HTML como fallback");
    return generarHTMLParaPDF($facturaData, $numeroFactura, $config);
}

// Método 1: Generar PDF con wkhtmltopdf
function generarPDFConWkhtmltopdf($facturaData, $numeroFactura, $config) {
    // Verificar si wkhtmltopdf está disponible
    $which = shell_exec('which wkhtmltopdf 2>/dev/null');
    if (empty(trim($which))) {
        $which = shell_exec('where wkhtmltopdf 2>nul'); // Windows
        if (empty(trim($which))) {
            logError("wkhtmltopdf no encontrado en el sistema");
            return false;
        }
    }
    
    $html = generarHTMLFactura($facturaData, $numeroFactura, $config);
    
    // Crear archivos temporales
    $tempHtml = sys_get_temp_dir() . '/factura_' . uniqid() . '.html';
    $tempPdf = sys_get_temp_dir() . '/factura_' . uniqid() . '.pdf';
    
    // Escribir HTML
    if (!file_put_contents($tempHtml, $html)) {
        logError("No se pudo escribir archivo HTML temporal");
        return false;
    }
    
    // Comando wkhtmltopdf con opciones específicas
    $command = sprintf(
        'wkhtmltopdf --page-size A4 --margin-top 15mm --margin-bottom 15mm --margin-left 15mm --margin-right 15mm --encoding UTF-8 --disable-smart-shrinking --print-media-type "%s" "%s" 2>&1',
        escapeshellarg($tempHtml),
        escapeshellarg($tempPdf)
    );
    
    logError("Ejecutando comando: $command");
    
    // Ejecutar comando
    $output = [];
    $return_var = 0;
    exec($command, $output, $return_var);
    
    logError("Comando ejecutado. Return code: $return_var, Output: " . implode("\n", $output));
    
    $pdfContent = '';
    if ($return_var === 0 && file_exists($tempPdf) && filesize($tempPdf) > 0) {
        $pdfContent = file_get_contents($tempPdf);
        logError("PDF generado exitosamente. Tamaño: " . strlen($pdfContent) . " bytes");
    } else {
        logError("Error generando PDF con wkhtmltopdf. Return code: $return_var");
    }
    
    // Limpiar archivos temporales
    if (file_exists($tempHtml)) unlink($tempHtml);
    if (file_exists($tempPdf)) unlink($tempPdf);
    
    return $pdfContent;
}

// Método 2: Generar PDF con TCPDF
function generarPDFConTCPDF($facturaData, $numeroFactura, $config) {
    try {
        // Intentar cargar TCPDF
        if (file_exists('../vendor/tecnickcom/tcpdf/tcpdf.php')) {
            require_once('../vendor/tecnickcom/tcpdf/tcpdf.php');
        } elseif (class_exists('TCPDF')) {
            // Ya está cargado
        } else {
            logError("TCPDF no está disponible");
            return false;
        }
        
        // Crear instancia de TCPDF
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
        
        // Configurar información del documento
        $pdf->SetCreator('Imperium Box System');
        $pdf->SetAuthor($config['empresa_nombre']);
        $pdf->SetTitle('Factura ' . $numeroFactura);
        
        // Configurar márgenes
        $pdf->SetMargins(15, 15, 15);
        $pdf->SetHeaderMargin(10);
        $pdf->SetFooterMargin(10);
        
        // Agregar página
        $pdf->AddPage();
        
        // Generar contenido HTML para TCPDF
        $html = generarHTMLFacturaTCPDF($facturaData, $numeroFactura, $config);
        
        // Escribir HTML
        $pdf->writeHTML($html, true, false, true, false, '');
        
        // Obtener contenido del PDF
        $pdfContent = $pdf->Output('', 'S');
        
        logError("PDF generado con TCPDF. Tamaño: " . strlen($pdfContent) . " bytes");
        return $pdfContent;
        
    } catch (Exception $e) {
        logError("Error con TCPDF: " . $e->getMessage());
        return false;
    }
}

// Método 3: Generar HTML optimizado para conversión manual
function generarHTMLParaPDF($facturaData, $numeroFactura, $config) {
    $html = generarHTMLFactura($facturaData, $numeroFactura, $config);
    
    // Agregar instrucciones para conversión manual
    $instrucciones = '
    <!-- INSTRUCCIONES PARA CONVERTIR A PDF -->
    <!-- 1. Abrir este archivo en un navegador web -->
    <!-- 2. Presionar Ctrl+P (Imprimir) -->
    <!-- 3. Seleccionar "Guardar como PDF" -->
    <!-- 4. Configurar márgenes mínimos -->
    <!-- 5. Guardar el archivo -->
    ';
    
    logError("Generando HTML como fallback. Tamaño: " . strlen($html) . " caracteres");
    return $instrucciones . $html;
}

// Generar HTML de la factura
function generarHTMLFactura($facturaData, $numeroFactura, $config) {
    // Calcular fecha del último día del mes
    $fechaPago = new DateTime($facturaData['fecha_pago']);
    $ultimoDiaMes = $fechaPago->format('t/m/Y');
    
    // Calcular precios
    $precio = floatval($facturaData['precio']);
    $precioSinIva = $precio / 1.21;
    $iva = $precio - $precioSinIva;
    
    // Limpiar datos para HTML
    $cliente = htmlspecialchars(trim($facturaData['nombre'] . ' ' . $facturaData['primer_apellido'] . ' ' . ($facturaData['segundo_apellido'] ?? '')));
    $descripcion = htmlspecialchars($facturaData['descripcion'] ?? 'Servicio de entrenamiento');
    $dni = htmlspecialchars($facturaData['dni'] ?? '');
    $email = htmlspecialchars($facturaData['email'] ?? '');
    $telefono = htmlspecialchars($facturaData['telefono'] ?? '');
    $direccion = htmlspecialchars($facturaData['direccion'] ?? 'Granada, España');
    
    return '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura ' . htmlspecialchars($numeroFactura) . '</title>
    <style>
        @page { 
            size: A4; 
            margin: 15mm;
        }
        body { 
            font-family: "Arial", "Helvetica", sans-serif; 
            font-size: 12px; 
            line-height: 1.4; 
            color: #333;
            margin: 0;
            padding: 0;
            background: white;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
        }
        .logo-section { 
            display: flex; 
            align-items: center; 
            gap: 15px; 
        }
        .logo { 
            width: 60px; 
            height: 60px; 
            background: linear-gradient(45deg, #ff6b6b, #feca57); 
            color: white; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border-radius: 8px; 
            font-weight: bold; 
            font-size: 20px; 
        }
        .empresa-info h3 { 
            margin: 0 0 5px 0; 
            font-size: 16px; 
            font-weight: bold;
        }
        .empresa-info p { 
            margin: 2px 0; 
            font-size: 11px; 
            color: #666; 
        }
        .factura-info { 
            text-align: right; 
            background: #f0f8ff; 
            padding: 15px; 
            border: 2px solid #4a90e2;
            border-radius: 8px; 
            min-width: 200px;
        }
        .factura-info h2 { 
            margin: 0 0 10px 0; 
            color: #4a90e2; 
            font-size: 24px; 
        }
        .factura-info p { 
            margin: 5px 0; 
            font-size: 12px; 
        }
        .cliente-info { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 25px 0; 
            border-left: 4px solid #4a90e2; 
        }
        .cliente-info h4 { 
            margin: 0 0 10px 0; 
            color: #333; 
            font-size: 14px;
        }
        .cliente-info p { 
            margin: 5px 0; 
            font-size: 12px;
        }
        .detalle-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 25px 0; 
            border: 1px solid #ddd; 
        }
        .detalle-table th { 
            background: #4a90e2; 
            color: white; 
            padding: 12px 8px; 
            text-align: left; 
            font-weight: bold; 
            font-size: 11px;
        }
        .detalle-table td { 
            padding: 12px 8px; 
            border-bottom: 1px solid #eee; 
            font-size: 11px;
        }
        .totales { 
            margin-left: auto; 
            width: 300px; 
            background: #f8f9fa; 
            border: 1px solid #ddd; 
            border-radius: 8px; 
            overflow: hidden; 
        }
        .totales table { 
            width: 100%; 
            border-collapse: collapse; 
        }
        .totales td { 
            padding: 10px 15px; 
            border-bottom: 1px solid #ddd; 
            font-size: 11px;
        }
        .total-final { 
            background: #e8f5e8; 
            font-weight: bold; 
            font-size: 14px !important;
        }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            font-size: 10px; 
            color: #666; 
            line-height: 1.3; 
        }
        @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <div class="logo">IB</div>
            <div class="empresa-info">
                <h3>' . htmlspecialchars($config['empresa_nombre']) . '</h3>
                <p><strong>NIF:</strong> ' . htmlspecialchars($config['empresa_nif']) . '</p>
                <p>' . htmlspecialchars($config['empresa_direccion']) . '</p>
                <p>' . htmlspecialchars($config['empresa_localidad']) . '</p>
                <p><strong>Email:</strong> ' . htmlspecialchars($config['empresa_email']) . '</p>
            </div>
        </div>
        <div class="factura-info">
            <h2>FACTURA</h2>
            <p><strong>Número:</strong><br>' . htmlspecialchars($numeroFactura) . '</p>
            <p><strong>Fecha:</strong><br>' . $ultimoDiaMes . '</p>
        </div>
    </div>

    <div class="cliente-info">
        <h4>DATOS DEL CLIENTE</h4>
        <p><strong>' . $cliente . '</strong></p>
        <p>' . $direccion . '</p>
        <p><strong>DNI/NIF:</strong> ' . $dni . '</p>
        ' . ($email ? '<p><strong>Email:</strong> ' . $email . '</p>' : '') . '
        ' . ($telefono ? '<p><strong>Teléfono:</strong> ' . $telefono . '</p>' : '') . '
    </div>

    <table class="detalle-table">
        <thead>
            <tr>
                <th>DESCRIPCIÓN DEL SERVICIO</th>
                <th>CANT.</th>
                <th>PRECIO UNIT.</th>
                <th>IVA</th>
                <th>IMPORTE TOTAL</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>' . $descripcion . '</td>
                <td>1</td>
                <td>' . number_format($precio, 2, ',', '.') . ' €</td>
                <td>' . $config['iva_porcentaje'] . '%</td>
                <td><strong>' . number_format($precio, 2, ',', '.') . ' €</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="totales">
        <table>
            <tr>
                <td><strong>Base Imponible:</strong></td>
                <td style="text-align: right;">' . number_format($precioSinIva, 2, ',', '.') . ' €</td>
            </tr>
            <tr>
                <td><strong>IVA (' . $config['iva_porcentaje'] . '%):</strong></td>
                <td style="text-align: right;">' . number_format($iva, 2, ',', '.') . ' €</td>
            </tr>
            <tr class="total-final">
                <td><strong>TOTAL FACTURA:</strong></td>
                <td style="text-align: right;"><strong>' . number_format($precio, 2, ',', '.') . ' €</strong></td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p><strong>Forma de pago:</strong> ' . htmlspecialchars(ucfirst($facturaData['forma_pago'] ?? 'Efectivo')) . '</p>
        <p><strong>Observaciones:</strong> Gracias por confiar en nuestros servicios de entrenamiento.</p>
        <br>
        <p><em>Según el Reglamento General de Protección de Datos Personales, los datos serán tratados de forma confidencial con el fin de gestionar la contabilidad, podrán ser cedidos a Bancos y administraciones públicas para cumplir con las obligaciones legales exigibles. Los datos serán conservados por los plazos legales establecidos. Puede ejercitar sus derechos a través de ' . htmlspecialchars($config['empresa_email']) . '</em></p>
    </div>
</body>
</html>';
}

// Generar HTML específico para TCPDF
function generarHTMLFacturaTCPDF($facturaData, $numeroFactura, $config) {
    // TCPDF tiene limitaciones de CSS, usar versión simplificada
    $fechaPago = new DateTime($facturaData['fecha_pago']);
    $ultimoDiaMes = $fechaPago->format('t/m/Y');
    
    $precio = floatval($facturaData['precio']);
    $precioSinIva = $precio / 1.21;
    $iva = $precio - $precioSinIva;
    
    return '<h1>FACTURA ' . htmlspecialchars($numeroFactura) . '</h1>
<p><strong>Fecha:</strong> ' . $ultimoDiaMes . '</p>
<hr>
<h3>EMPRESA</h3>
<p>' . htmlspecialchars($config['empresa_nombre']) . '<br>
NIF: ' . htmlspecialchars($config['empresa_nif']) . '<br>
' . htmlspecialchars($config['empresa_direccion']) . '<br>
' . htmlspecialchars($config['empresa_localidad']) . '</p>

<h3>CLIENTE</h3>
<p><strong>' . htmlspecialchars($facturaData['nombre'] . ' ' . $facturaData['primer_apellido']) . '</strong><br>
DNI: ' . htmlspecialchars($facturaData['dni']) . '<br>
' . htmlspecialchars($facturaData['direccion'] ?? 'Granada, España') . '</p>

<h3>DETALLE</h3>
<table border="1" cellpadding="5">
<tr><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr>
<tr><td>' . htmlspecialchars($facturaData['descripcion']) . '</td><td>1</td><td>' . number_format($precio, 2) . ' €</td><td>' . number_format($precio, 2) . ' €</td></tr>
</table>

<h3>TOTALES</h3>
<table border="1" cellpadding="5">
<tr><td>Base Imponible:</td><td>' . number_format($precioSinIva, 2) . ' €</td></tr>
<tr><td>IVA (21%):</td><td>' . number_format($iva, 2) . ' €</td></tr>
<tr><td><strong>TOTAL:</strong></td><td><strong>' . number_format($precio, 2) . ' €</strong></td></tr>
</table>

<p><strong>Forma de pago:</strong> ' . htmlspecialchars($facturaData['forma_pago']) . '</p>';
}
?>