<?php
// api/pdf_functions.php - Funciones comunes para generación de PDFs

// Función principal para generar PDF robusto
function generarFacturaPDFRobusto($facturaData, $numeroFactura, $config) {
    error_log("Iniciando generación de PDF para: $numeroFactura");
    
    // Método 1: Intentar con wkhtmltopdf
    if (function_exists('shell_exec')) {
        $pdfContent = generarPDFConWkhtmltopdf($facturaData, $numeroFactura, $config);
        if ($pdfContent && strlen($pdfContent) > 100) {
            error_log("PDF generado exitosamente con wkhtmltopdf");
            return $pdfContent;
        }
        error_log("wkhtmltopdf falló o no disponible");
    }
    
    // Método 2: Intentar con TCPDF si está disponible
    if (class_exists('TCPDF') || file_exists('../vendor/tecnickcom/tcpdf/tcpdf.php')) {
        $pdfContent = generarPDFConTCPDF($facturaData, $numeroFactura, $config);
        if ($pdfContent && strlen($pdfContent) > 100) {
            error_log("PDF generado exitosamente con TCPDF");
            return $pdfContent;
        }
        error_log("TCPDF falló o no disponible");
    }
    
    // Método 3: Usar mPDF si está disponible
    if (class_exists('Mpdf\Mpdf') || file_exists('../vendor/mpdf/mpdf/src/Mpdf.php')) {
        $pdfContent = generarPDFConMPDF($facturaData, $numeroFactura, $config);
        if ($pdfContent && strlen($pdfContent) > 100) {
            error_log("PDF generado exitosamente con mPDF");
            return $pdfContent;
        }
        error_log("mPDF falló o no disponible");
    }
    
    // Método 4: DomPDF si está disponible
    if (class_exists('Dompdf\Dompdf') || file_exists('../vendor/dompdf/dompdf/src/Dompdf.php')) {
        $pdfContent = generarPDFConDomPDF($facturaData, $numeroFactura, $config);
        if ($pdfContent && strlen($pdfContent) > 100) {
            error_log("PDF generado exitosamente con DomPDF");
            return $pdfContent;
        }
        error_log("DomPDF falló o no disponible");
    }
    
    // Método 5: HTML optimizado para conversión manual
    error_log("Generando HTML como fallback");
    return generarHTMLParaPDF($facturaData, $numeroFactura, $config);
}

// Método 1: wkhtmltopdf
function generarPDFConWkhtmltopdf($facturaData, $numeroFactura, $config) {
    // Verificar si wkhtmltopdf está disponible
    $which = shell_exec('which wkhtmltopdf 2>/dev/null');
    if (empty(trim($which))) {
        $which = shell_exec('where wkhtmltopdf 2>nul'); // Windows
        if (empty(trim($which))) {
            return false;
        }
    }
    
    $html = generarHTMLFactura($facturaData, $numeroFactura, $config);
    
    // Crear archivos temporales
    $tempHtml = sys_get_temp_dir() . '/factura_' . uniqid() . '.html';
    $tempPdf = sys_get_temp_dir() . '/factura_' . uniqid() . '.pdf';
    
    // Escribir HTML
    if (!file_put_contents($tempHtml, $html)) {
        return false;
    }
    
    // Comando wkhtmltopdf
    $command = sprintf(
        'wkhtmltopdf --page-size A4 --margin-top 15mm --margin-bottom 15mm --margin-left 15mm --margin-right 15mm --encoding UTF-8 --disable-smart-shrinking --quiet "%s" "%s" 2>/dev/null',
        escapeshellarg($tempHtml),
        escapeshellarg($tempPdf)
    );
    
    // Ejecutar
    exec($command, $output, $return_var);
    
    $pdfContent = '';
    if ($return_var === 0 && file_exists($tempPdf) && filesize($tempPdf) > 0) {
        $pdfContent = file_get_contents($tempPdf);
    }
    
    // Limpiar archivos temporales
    if (file_exists($tempHtml)) unlink($tempHtml);
    if (file_exists($tempPdf)) unlink($tempPdf);
    
    return $pdfContent;
}

// Método 2: TCPDF
function generarPDFConTCPDF($facturaData, $numeroFactura, $config) {
    try {
        // Intentar cargar TCPDF
        if (file_exists('../vendor/tecnickcom/tcpdf/tcpdf.php')) {
            require_once('../vendor/tecnickcom/tcpdf/tcpdf.php');
        } elseif (!class_exists('TCPDF')) {
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
        return $pdf->Output('', 'S');
        
    } catch (Exception $e) {
        error_log("Error con TCPDF: " . $e->getMessage());
        return false;
    }
}

// Método 3: mPDF
function generarPDFConMPDF($facturaData, $numeroFactura, $config) {
    try {
        // Intentar cargar mPDF
        if (file_exists('../vendor/mpdf/mpdf/src/Mpdf.php')) {
            require_once('../vendor/mpdf/mpdf/src/Mpdf.php');
        } elseif (!class_exists('Mpdf\Mpdf')) {
            return false;
        }
        
        // Crear instancia de mPDF
        $mpdf = new \Mpdf\Mpdf([
            'format' => 'A4',
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 15,
            'margin_bottom' => 15,
            'default_font' => 'Arial'
        ]);
        
        // Configurar información del documento
        $mpdf->SetTitle('Factura ' . $numeroFactura);
        $mpdf->SetAuthor($config['empresa_nombre']);
        $mpdf->SetCreator('Imperium Box System');
        
        // Generar HTML
        $html = generarHTMLFactura($facturaData, $numeroFactura, $config);
        
        // Escribir HTML
        $mpdf->WriteHTML($html);
        
        // Obtener contenido del PDF
        return $mpdf->Output('', 'S');
        
    } catch (Exception $e) {
        error_log("Error con mPDF: " . $e->getMessage());
        return false;
    }
}

// Método 4: DomPDF
function generarPDFConDomPDF($facturaData, $numeroFactura, $config) {
    try {
        // Intentar cargar DomPDF
        if (file_exists('../vendor/dompdf/dompdf/src/Dompdf.php')) {
            require_once('../vendor/dompdf/dompdf/src/Dompdf.php');
        } elseif (!class_exists('Dompdf\Dompdf')) {
            return false;
        }
        
        // Crear instancia de DomPDF
        $dompdf = new \Dompdf\Dompdf();
        
        // Configurar opciones
        $dompdf->getOptions()->setChroot('../');
        $dompdf->getOptions()->setIsRemoteEnabled(true);
        
        // Generar HTML
        $html = generarHTMLFactura($facturaData, $numeroFactura, $config);
        
        // Cargar HTML
        $dompdf->loadHtml($html);
        
        // Configurar papel
        $dompdf->setPaper('A4', 'portrait');
        
        // Renderizar PDF
        $dompdf->render();
        
        // Obtener contenido del PDF
        return $dompdf->output();
        
    } catch (Exception $e) {
        error_log("Error con DomPDF: " . $e->getMessage());
        return false;
    }
}

// Generar HTML optimizado para conversión manual
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
    
    return $instrucciones . $html;
}

// Generar HTML principal de la factura
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

// Generar HTML específico para TCPDF (CSS limitado)
function generarHTMLFacturaTCPDF($facturaData, $numeroFactura, $config) {
    $fechaPago = new DateTime($facturaData['fecha_pago']);
    $ultimoDiaMes = $fechaPago->format('t/m/Y');
    
    $precio = floatval($facturaData['precio']);
    $precioSinIva = $precio / 1.21;
    $iva = $precio - $precioSinIva;
    
    return '<h1 style="color: #4a90e2; text-align: center;">FACTURA ' . htmlspecialchars($numeroFactura) . '</h1>
<p style="text-align: center;"><strong>Fecha:</strong> ' . $ultimoDiaMes . '</p>
<hr>

<table width="100%" cellpadding="5" style="margin-bottom: 20px;">
<tr>
<td width="50%">
<h3 style="color: #333;">EMPRESA</h3>
<p>' . htmlspecialchars($config['empresa_nombre']) . '<br>
<strong>NIF:</strong> ' . htmlspecialchars($config['empresa_nif']) . '<br>
' . htmlspecialchars($config['empresa_direccion']) . '<br>
' . htmlspecialchars($config['empresa_localidad']) . '<br>
<strong>Email:</strong> ' . htmlspecialchars($config['empresa_email']) . '</p>
</td>
<td width="50%">
<h3 style="color: #333;">CLIENTE</h3>
<p><strong>' . htmlspecialchars($facturaData['nombre'] . ' ' . $facturaData['primer_apellido']) . '</strong><br>
<strong>DNI:</strong> ' . htmlspecialchars($facturaData['dni']) . '<br>
' . htmlspecialchars($facturaData['direccion'] ?? 'Granada, España') . '</p>
</td>
</tr>
</table>

<h3 style="color: #333;">DETALLE DE SERVICIOS</h3>
<table border="1" cellpadding="8" width="100%" style="border-collapse: collapse;">
<tr style="background-color: #4a90e2; color: white;">
<th>Descripción</th>
<th>Cantidad</th>
<th>Precio Unit.</th>
<th>IVA</th>
<th>Total</th>
</tr>
<tr>
<td>' . htmlspecialchars($facturaData['descripcion']) . '</td>
<td style="text-align: center;">1</td>
<td style="text-align: right;">' . number_format($precio, 2, ',', '.') . ' €</td>
<td style="text-align: center;">' . $config['iva_porcentaje'] . '%</td>
<td style="text-align: right;"><strong>' . number_format($precio, 2, ',', '.') . ' €</strong></td>
</tr>
</table>

<table width="40%" cellpadding="5" style="margin-left: auto; margin-top: 20px; border: 1px solid #ddd;">
<tr>
<td><strong>Base Imponible:</strong></td>
<td style="text-align: right;">' . number_format($precioSinIva, 2, ',', '.') . ' €</td>
</tr>
<tr>
<td><strong>IVA (' . $config['iva_porcentaje'] . '%):</strong></td>
<td style="text-align: right;">' . number_format($iva, 2, ',', '.') . ' €</td>
</tr>
<tr style="background-color: #e8f5e8;">
<td><strong>TOTAL FACTURA:</strong></td>
<td style="text-align: right;"><strong>' . number_format($precio, 2, ',', '.') . ' €</strong></td>
</tr>
</table>

<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 10px;">
<p><strong>Forma de pago:</strong> ' . htmlspecialchars($facturaData['forma_pago']) . '</p>
<p><strong>Observaciones:</strong> Gracias por confiar en nuestros servicios de entrenamiento.</p>
<br>
<p style="color: #666;"><em>Según el Reglamento General de Protección de Datos Personales, los datos serán tratados de forma confidencial con el fin de gestionar la contabilidad, podrán ser cedidos a Bancos y administraciones públicas para cumplir con las obligaciones legales exigibles. Los datos serán conservados por los plazos legales establecidos. Puede ejercitar sus derechos a través de ' . htmlspecialchars($config['empresa_email']) . '</em></p>
</div>';
}

// Función para generar resumen PDF robusto
function generarResumenPDFRobusto($facturas, $mes, $anio, $config, $total) {
    // Intentar con wkhtmltopdf primero
    if (function_exists('shell_exec')) {
        $which = shell_exec('which wkhtmltopdf 2>/dev/null');
        if (!empty(trim($which))) {
            return generarResumenConWkhtmltopdf($facturas, $mes, $anio, $config, $total);
        }
    }
    
    // Fallback a HTML
    return generarResumenHTML($facturas, $mes, $anio, $config, $total);
}

// Generar resumen con wkhtmltopdf
function generarResumenConWkhtmltopdf($facturas, $mes, $anio, $config, $total) {
    $html = generarResumenHTML($facturas, $mes, $anio, $config, $total);
    
    $tempHtml = sys_get_temp_dir() . '/resumen_' . uniqid() . '.html';
    $tempPdf = sys_get_temp_dir() . '/resumen_' . uniqid() . '.pdf';
    
    file_put_contents($tempHtml, $html);
    
    $command = sprintf(
        'wkhtmltopdf --page-size A4 --orientation Portrait --margin-top 15mm --margin-bottom 15mm --margin-left 15mm --margin-right 15mm --encoding UTF-8 --quiet "%s" "%s" 2>/dev/null',
        escapeshellarg($tempHtml),
        escapeshellarg($tempPdf)
    );
    
    exec($command, $output, $return_var);
    
    $pdfContent = '';
    if ($return_var === 0 && file_exists($tempPdf) && filesize($tempPdf) > 0) {
        $pdfContent = file_get_contents($tempPdf);
    }
    
    if (file_exists($tempHtml)) unlink($tempHtml);
    if (file_exists($tempPdf)) unlink($tempPdf);
    
    return $pdfContent ?: $html;
}

// Generar HTML del resumen
function generarResumenHTML($facturas, $mes, $anio, $config, $total) {
    $mesNombre = [1=>'Enero',2=>'Febrero',3=>'Marzo',4=>'Abril',5=>'Mayo',6=>'Junio',7=>'Julio',8=>'Agosto',9=>'Septiembre',10=>'Octubre',11=>'Noviembre',12=>'Diciembre'][$mes];
    
    $filas = '';
    foreach ($facturas as $f) {
        $filas .= '<tr>
            <td>' . htmlspecialchars($f['numero']) . '</td>
            <td>' . htmlspecialchars($f['cliente']) . '</td>
            <td>' . htmlspecialchars($f['descripcion']) . '</td>
            <td style="text-align: right;">' . number_format($f['precio'], 2, ',', '.') . ' €</td>
            <td>' . htmlspecialchars($f['forma_pago']) . '</td>
            <td>' . date('d/m/Y', strtotime($f['fecha'])) . '</td>
        </tr>';
    }
    
    return '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Resumen ' . $mesNombre . ' ' . $anio . '</title>
    <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 0; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .header h1 { color: #4a90e2; margin: 0; font-size: 24px; }
        .header h2 { color: #333; margin: 5px 0; font-size: 18px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { background: #f0f8ff; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #4a90e2; min-width: 120px; }
        .stat-number { font-size: 18px; font-weight: bold; color: #4a90e2; }
        .stat-label { font-size: 10px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 8px; text-align: left; border: 1px solid #ddd; font-size: 10px; }
        th { background: #4a90e2; color: white; font-weight: bold; }
        .total-row { background: #e8f5e8; font-weight: bold; }
        .empresa-info { margin-top: 30px; background: #f8f9fa; padding: 15px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 RESUMEN MENSUAL DE FACTURACIÓN</h1>
        <h2>' . $mesNombre . ' ' . $anio . '</h2>
        <p>Generado el ' . date('d/m/Y H:i:s') . '</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-number">' . count($facturas) . '</div>
            <div class="stat-label">Facturas Emitidas</div>
        </div>
        <div class="stat">
            <div class="stat-number">' . number_format($total, 2, ',', '.') . ' €</div>
            <div class="stat-label">Total Facturado</div>
        </div>
        <div class="stat">
            <div class="stat-number">' . number_format($total/1.21, 2, ',', '.') . ' €</div>
            <div class="stat-label">Base Imponible</div>
        </div>
        <div class="stat">
            <div class="stat-number">' . number_format($total - ($total/1.21), 2, ',', '.') . ' €</div>
            <div class="stat-label">IVA Total (21%)</div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>NÚMERO</th>
                <th>CLIENTE</th>
                <th>CONCEPTO</th>
                <th>IMPORTE</th>
                <th>PAGO</th>
                <th>FECHA</th>
            </tr>
        </thead>
        <tbody>
            ' . $filas . '
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="3"><strong>TOTAL GENERAL</strong></td>
                <td style="text-align: right;"><strong>' . number_format($total, 2, ',', '.') . ' €</strong></td>
                <td colspan="2"></td>
            </tr>
        </tfoot>
    </table>
    
    <div class="empresa-info">
        <h3>DATOS DE LA EMPRESA</h3>
        <p><strong>' . htmlspecialchars($config['empresa_nombre']) . '</strong></p>
        <p><strong>NIF:</strong> ' . htmlspecialchars($config['empresa_nif']) . '</p>
        <p><strong>Dirección:</strong> ' . htmlspecialchars($config['empresa_direccion']) . '</p>
        <p><strong>Localidad:</strong> ' . htmlspecialchars($config['empresa_localidad']) . '</p>
        <p><strong>Email:</strong> ' . htmlspecialchars($config['empresa_email']) . '</p>
    </div>
</body>
</html>';
}

// Función para generar CSV
function generarCSV($facturas) {
    $csv = "Numero,Cliente,Concepto,Importe,Forma_Pago,Fecha\n";
    foreach ($facturas as $f) {
        $csv .= sprintf('"%s","%s","%s","%.2f","%s","%s"' . "\n",
            str_replace('"', '""', $f['numero']),
            str_replace('"', '""', $f['cliente']),
            str_replace('"', '""', $f['descripcion']),
            $f['precio'],
            str_replace('"', '""', $f['forma_pago']),
            date('d/m/Y', strtotime($f['fecha']))
        );
    }
    return $csv;
}

// Función para limpiar nombres de archivo
function limpiarNombre($nombre) {
    $nombre = trim($nombre);
    $nombre = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $nombre);
    $nombre = preg_replace('/[^a-zA-Z0-9\s\-_]/', '', $nombre);
    $nombre = preg_replace('/\s+/', '_', $nombre);
    return strtolower($nombre);
}
?>