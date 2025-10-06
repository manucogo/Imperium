<?php
// api/generar_zip.php - Versión corregida completa
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Función para manejar errores
function handleError($message) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => true, 'message' => $message]);
    exit;
}

// Función para log
function logError($message) {
    error_log(date('Y-m-d H:i:s') . " - ZIP Error: " . $message);
}

try {
    // Verificar autenticación
    session_start();
    if (!isset($_SESSION['admin_id'])) {
        handleError('No autorizado - Debe estar logueado');
    }

    // Verificar ZipArchive
    if (!class_exists('ZipArchive')) {
        handleError('ZipArchive no está disponible en este servidor');
    }

    // Obtener parámetros
    $mes = $_GET['mes'] ?? '';
    $anio = $_GET['anio'] ?? $_GET['año'] ?? '';
    
    if (!$mes || !$anio) {
        handleError('Mes y año son requeridos');
    }

    // Validar parámetros
    if (!is_numeric($mes) || !is_numeric($anio) || $mes < 1 || $mes > 12) {
        handleError('Parámetros inválidos: mes=' . $mes . ', anio=' . $anio);
    }

    // Verificar archivos necesarios
    $required_files = [
        '../config/database.php',
        '../classes/Factura.php',
        'pdf_functions.php'
    ];
    
    foreach ($required_files as $file) {
        if (!file_exists($file)) {
            handleError("Archivo requerido no encontrado: $file");
        }
    }

    // Incluir archivos
    require_once '../config/database.php';
    require_once '../classes/Factura.php';
    require_once 'pdf_functions.php';
    
    // Conectar a BD
    $database = new Database();
    $pdo = $database->getConnection();
    
    if (!$pdo) {
        handleError('No se pudo conectar a la base de datos');
    }
    
    $factura = new Factura($pdo);
    
    // Obtener facturas del mes
    $facturas = $factura->obtenerPorMes($mes, $anio);
    
    if (empty($facturas)) {
        handleError('No hay facturas para el período seleccionado: ' . $mes . '/' . $anio);
    }

    logError("Generando ZIP para " . count($facturas) . " facturas del mes $mes/$anio");

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
    
    // Crear nombre del archivo ZIP
    $zipFileName = "facturas_" . str_pad($mes, 2, '0', STR_PAD_LEFT) . "_" . $anio . "_" . date('Ymd_His') . ".zip";
    $zipPath = sys_get_temp_dir() . '/' . $zipFileName;
    
    logError("Creando ZIP en: $zipPath");
    
    // Crear ZIP
    $zip = new ZipArchive();
    $result = $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    
    if ($result !== TRUE) {
        handleError('No se pudo crear el archivo ZIP. Error código: ' . $result);
    }
    
    $contador = 0;
    $totalGeneral = 0;
    $resumenFacturas = [];
    $erroresGeneracion = [];
    
    foreach ($facturas as $facturaData) {
        $contador++;
        $numeroFactura = $configuracion['prefijo_factura'] . '/' . $contador;
        
        try {
            logError("Generando PDF para factura $contador: " . $facturaData['nombre']);
            
            // Generar PDF usando método robusto
            $pdfContent = generarFacturaPDFRobusto($facturaData, $numeroFactura, $configuracion);
            
            if (!$pdfContent) {
                $erroresGeneracion[] = "Error generando PDF para " . $facturaData['nombre'];
                logError("Error: No se pudo generar PDF para factura $contador");
                continue;
            }
            
            // Verificar que el contenido sea válido
            if (strlen($pdfContent) < 100) {
                $erroresGeneracion[] = "PDF demasiado pequeño para " . $facturaData['nombre'];
                logError("Error: PDF demasiado pequeño para factura $contador");
                continue;
            }
            
            // Nombre del archivo limpio
            $nombreCliente = limpiarNombre($facturaData['nombre'] . '_' . $facturaData['primer_apellido']);
            $nombreArchivo = sprintf("factura_%03d_%s.pdf", $contador, substr($nombreCliente, 0, 20));
            
            // Determinar si es PDF real o HTML
            $esPDF = (strpos($pdfContent, '%PDF') === 0);
            if (!$esPDF) {
                $nombreArchivo = str_replace('.pdf', '.html', $nombreArchivo);
                logError("Generando HTML en lugar de PDF para factura $contador");
            }
            
            // Agregar al ZIP
            if (!$zip->addFromString($nombreArchivo, $pdfContent)) {
                $erroresGeneracion[] = "Error agregando archivo al ZIP: $nombreArchivo";
                logError("Error agregando archivo al ZIP: $nombreArchivo");
            } else {
                logError("Archivo agregado exitosamente: $nombreArchivo (" . strlen($pdfContent) . " bytes)");
            }
            
        } catch (Exception $e) {
            $erroresGeneracion[] = "Excepción generando factura $contador: " . $e->getMessage();
            logError("Excepción en factura $contador: " . $e->getMessage());
        }
        
        // Acumular para resumen
        $precio = floatval($facturaData['precio']);
        $totalGeneral += $precio;
        $resumenFacturas[] = [
            'numero' => $numeroFactura,
            'cliente' => $facturaData['nombre'] . ' ' . $facturaData['primer_apellido'],
            'descripcion' => $facturaData['descripcion'],
            'precio' => $precio,
            'forma_pago' => $facturaData['forma_pago'],
            'fecha' => $facturaData['fecha_pago']
        ];
    }
    
    logError("Finalizadas " . count($facturas) . " facturas. Errores: " . count($erroresGeneracion));
    
    // Agregar resumen en PDF/HTML
    try {
        logError("Generando resumen mensual");
        $resumenContent = generarResumenPDFRobusto($resumenFacturas, $mes, $anio, $configuracion, $totalGeneral);
        if ($resumenContent) {
            $nombreResumen = (strpos($resumenContent, '%PDF') === 0) ? '00_RESUMEN_MENSUAL.pdf' : '00_RESUMEN_MENSUAL.html';
            $zip->addFromString($nombreResumen, $resumenContent);
            logError("Resumen agregado: $nombreResumen");
        } else {
            logError("Error: No se pudo generar resumen");
        }
    } catch (Exception $e) {
        logError("Error generando resumen: " . $e->getMessage());
    }
    
    // Agregar CSV
    try {
        logError("Generando archivo CSV");
        $csvContent = generarCSV($resumenFacturas);
        $zip->addFromString('resumen_facturas.csv', $csvContent);
        logError("CSV agregado exitosamente");
    } catch (Exception $e) {
        logError("Error generando CSV: " . $e->getMessage());
    }
    
    // Agregar archivo de información
    $mesNombres = [1=>'Enero',2=>'Febrero',3=>'Marzo',4=>'Abril',5=>'Mayo',6=>'Junio',
                   7=>'Julio',8=>'Agosto',9=>'Septiembre',10=>'Octubre',11=>'Noviembre',12=>'Diciembre'];
    
    $infoTxt = "FACTURAS GENERADAS - " . $mesNombres[$mes] . " $anio\n";
    $infoTxt .= str_repeat("=", 50) . "\n\n";
    $infoTxt .= "Mes: " . str_pad($mes, 2, '0', STR_PAD_LEFT) . "/$anio\n";
    $infoTxt .= "Total facturas: " . count($facturas) . "\n";
    $infoTxt .= "Facturas procesadas exitosamente: " . (count($facturas) - count($erroresGeneracion)) . "\n";
    $infoTxt .= "Errores en generación: " . count($erroresGeneracion) . "\n";
    $infoTxt .= "Total facturado: " . number_format($totalGeneral, 2, ',', '.') . " €\n";
    $infoTxt .= "Base imponible: " . number_format($totalGeneral/1.21, 2, ',', '.') . " €\n";
    $infoTxt .= "IVA (21%): " . number_format($totalGeneral - ($totalGeneral/1.21), 2, ',', '.') . " €\n";
    $infoTxt .= "Generado: " . date('d/m/Y H:i:s') . "\n\n";
    
    $infoTxt .= "CONTENIDO DEL ARCHIVO:\n";
    $infoTxt .= "- Facturas individuales en PDF/HTML\n";
    $infoTxt .= "- Resumen mensual en PDF/HTML\n";
    $infoTxt .= "- Datos en formato CSV\n";
    $infoTxt .= "- Este archivo informativo\n\n";
    
    $infoTxt .= "DATOS DE LA EMPRESA:\n";
    $infoTxt .= "Empresa: " . $configuracion['empresa_nombre'] . "\n";
    $infoTxt .= "NIF: " . $configuracion['empresa_nif'] . "\n";
    $infoTxt .= "Dirección: " . $configuracion['empresa_direccion'] . "\n";
    $infoTxt .= "Localidad: " . $configuracion['empresa_localidad'] . "\n";
    $infoTxt .= "Email: " . $configuracion['empresa_email'] . "\n\n";
    
    if (!empty($erroresGeneracion)) {
        $infoTxt .= "ERRORES ENCONTRADOS:\n";
        $infoTxt .= str_repeat("-", 30) . "\n";
        foreach ($erroresGeneracion as $error) {
            $infoTxt .= "• $error\n";
        }
        $infoTxt .= "\nNOTA: Los errores pueden deberse a falta de wkhtmltopdf u otras librerías PDF.\n";
        $infoTxt .= "Ejecute diagnostico_pdf.php para más información.\n\n";
    }
    
    $infoTxt .= "INSTRUCCIONES PARA PDFs:\n";
    $infoTxt .= str_repeat("-", 30) . "\n";
    $infoTxt .= "Si los archivos están en formato HTML:\n";
    $infoTxt .= "1. Abrir el archivo HTML en un navegador\n";
    $infoTxt .= "2. Presionar Ctrl+P (Imprimir)\n";
    $infoTxt .= "3. Seleccionar 'Guardar como PDF'\n";
    $infoTxt .= "4. Configurar márgenes mínimos\n";
    $infoTxt .= "5. Guardar el archivo\n\n";
    
    $infoTxt .= "Para instalar wkhtmltopdf:\n";
    $infoTxt .= "Ubuntu/Debian: sudo apt-get install wkhtmltopdf\n";
    $infoTxt .= "Windows: Descargar desde wkhtmltopdf.org\n";
    $infoTxt .= "macOS: brew install wkhtmltopdf\n";
    
    $zip->addFromString('LEEME.txt', $infoTxt);
    
    // Agregar log de errores si hay errores
    if (!empty($erroresGeneracion)) {
        $logErrores = "LOG DE ERRORES - " . date('d/m/Y H:i:s') . "\n";
        $logErrores .= str_repeat("=", 50) . "\n\n";
        foreach ($erroresGeneracion as $i => $error) {
            $logErrores .= ($i + 1) . ". $error\n";
        }
        $zip->addFromString('errores.log', $logErrores);
    }
    
    // Cerrar ZIP
    $zip->close();
    
    // Verificar que se creó correctamente
    if (!file_exists($zipPath)) {
        handleError('Error al crear el archivo ZIP - archivo no existe');
    }
    
    $zipSize = filesize($zipPath);
    if ($zipSize == 0) {
        handleError('Error al crear el archivo ZIP - archivo vacío');
    }
    
    logError("ZIP creado exitosamente: $zipFileName ($zipSize bytes)");
    
    // Configurar headers para descarga
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $zipFileName . '"');
    header('Content-Length: ' . $zipSize);
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Enviar archivo
    if (readfile($zipPath) === false) {
        logError("Error al enviar archivo ZIP");
        handleError('Error al enviar el archivo ZIP');
    }
    
    // Limpiar archivo temporal
    unlink($zipPath);
    
    logError("Descarga completada exitosamente");
    exit;
    
} catch (Exception $e) {
    logError("Error general: " . $e->getMessage());
    handleError('Error interno del servidor: ' . $e->getMessage());
} catch (Error $e) {
    logError("Error fatal: " . $e->getMessage());
    handleError('Error fatal del servidor: ' . $e->getMessage());
}

// Funciones auxiliares (si no están en pdf_functions.php)

if (!function_exists('generarCSV')) {
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
}

if (!function_exists('limpiarNombre')) {
    function limpiarNombre($nombre) {
        $nombre = trim($nombre);
        $nombre = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $nombre);
        $nombre = preg_replace('/[^a-zA-Z0-9\s\-_]/', '', $nombre);
        $nombre = preg_replace('/\s+/', '_', $nombre);
        return strtolower($nombre);
    }
}

// Fallback si pdf_functions.php no existe
if (!function_exists('generarFacturaPDFRobusto')) {
    function generarFacturaPDFRobusto($facturaData, $numeroFactura, $config) {
        logError("Usando generador PDF de respaldo para: $numeroFactura");
        
        // HTML básico como último recurso
        $html = '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Factura ' . htmlspecialchars($numeroFactura) . '</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .cliente { background: #f5f5f5; padding: 15px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #4a90e2; color: white; }
        .total { text-align: right; font-weight: bold; background: #e8f5e8; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FACTURA ' . htmlspecialchars($numeroFactura) . '</h1>
        <p><strong>' . htmlspecialchars($config['empresa_nombre']) . '</strong></p>
        <p>NIF: ' . htmlspecialchars($config['empresa_nif']) . '</p>
        <p>' . htmlspecialchars($config['empresa_direccion']) . '</p>
        <p>' . htmlspecialchars($config['empresa_localidad']) . '</p>
    </div>
    
    <div class="cliente">
        <h3>DATOS DEL CLIENTE</h3>
        <p><strong>' . htmlspecialchars($facturaData['nombre'] . ' ' . $facturaData['primer_apellido']) . '</strong></p>
        <p>DNI: ' . htmlspecialchars($facturaData['dni']) . '</p>
        <p>' . htmlspecialchars($facturaData['direccion'] ?? 'Granada, España') . '</p>
    </div>
    
    <table>
        <tr><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr>
        <tr>
            <td>' . htmlspecialchars($facturaData['descripcion']) . '</td>
            <td>1</td>
            <td>' . number_format(floatval($facturaData['precio']), 2) . ' €</td>
            <td class="total">' . number_format(floatval($facturaData['precio']), 2) . ' €</td>
        </tr>
    </table>
    
    <p><strong>Forma de pago:</strong> ' . htmlspecialchars($facturaData['forma_pago']) . '</p>
    <p><strong>Fecha:</strong> ' . date('d/m/Y', strtotime($facturaData['fecha_pago'])) . '</p>
    
    <div style="margin-top: 30px; font-size: 12px; color: #666;">
        <p>Para convertir este HTML a PDF:</p>
        <ol>
            <li>Abrir en navegador</li>
            <li>Ctrl+P (Imprimir)</li>
            <li>Seleccionar "Guardar como PDF"</li>
            <li>Configurar márgenes</li>
            <li>Guardar</li>
        </ol>
    </div>
</body>
</html>';
        
        return $html;
    }
}

if (!function_exists('generarResumenPDFRobusto')) {
    function generarResumenPDFRobusto($facturas, $mes, $anio, $config, $total) {
        logError("Generando resumen HTML de respaldo");
        
        $mesNombres = [1=>'Enero',2=>'Febrero',3=>'Marzo',4=>'Abril',5=>'Mayo',6=>'Junio',
                       7=>'Julio',8=>'Agosto',9=>'Septiembre',10=>'Octubre',11=>'Noviembre',12=>'Diciembre'];
        
        $filas = '';
        foreach ($facturas as $f) {
            $filas .= '<tr>
                <td>' . htmlspecialchars($f['numero']) . '</td>
                <td>' . htmlspecialchars($f['cliente']) . '</td>
                <td>' . htmlspecialchars($f['descripcion']) . '</td>
                <td style="text-align: right;">' . number_format($f['precio'], 2) . ' €</td>
                <td>' . htmlspecialchars($f['forma_pago']) . '</td>
                <td>' . date('d/m/Y', strtotime($f['fecha'])) . '</td>
            </tr>';
        }
        
        return '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Resumen ' . $mesNombres[$mes] . ' ' . $anio . '</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
        th { background: #4a90e2; color: white; }
        .total-row { background: #e8f5e8; font-weight: bold; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { background: #f0f8ff; padding: 15px; border: 1px solid #4a90e2; border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>RESUMEN MENSUAL - ' . $mesNombres[$mes] . ' ' . $anio . '</h1>
        <p>' . htmlspecialchars($config['empresa_nombre']) . '</p>
        <p>Generado: ' . date('d/m/Y H:i:s') . '</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <strong>' . count($facturas) . '</strong><br>
            <small>Facturas</small>
        </div>
        <div class="stat">
            <strong>' . number_format($total, 2) . ' €</strong><br>
            <small>Total Facturado</small>
        </div>
        <div class="stat">
            <strong>' . number_format($total/1.21, 2) . ' €</strong><br>
            <small>Base Imponible</small>
        </div>
        <div class="stat">
            <strong>' . number_format($total - ($total/1.21), 2) . ' €</strong><br>
            <small>IVA (21%)</small>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Concepto</th>
                <th>Importe</th>
                <th>Pago</th>
                <th>Fecha</th>
            </tr>
        </thead>
        <tbody>
            ' . $filas . '
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="3"><strong>TOTAL GENERAL</strong></td>
                <td style="text-align: right;"><strong>' . number_format($total, 2) . ' €</strong></td>
                <td colspan="2"></td>
            </tr>
        </tfoot>
    </table>
</body>
</html>';
    }
}
?>
            