// js/pdf_web_generator.js - CORREGIDO para usar numeración manual

class GeneradorPDFWeb {
    constructor() {
        this.libreriasCargadas = false;
        this.intentosCarga = 0;
        this.maxIntentos = 3;
        this.logoBase64 = null;
        
        // Configuración de la empresa
        this.configuracion = {
            prefijo_factura: 'IMPERIUMBOXGR',
            iva_porcentaje: '21',
            empresa_nombre: 'Ruben Hinojosa Valle',
            empresa_nif: '31725301K',
            empresa_direccion: 'Arabial 45, CC NEPTUNO. IMPERIUM, Local 79',
            empresa_localidad: '18004, Granada, España',
            empresa_email: 'hello@imperiumcrosstraining.com'
        };
        
        this.cargarLogoAutomatico();
        console.log('🔧 GeneradorPDFWeb inicializado');
    }

    // [Mantener todas las funciones de carga de logo y librerías igual...]
    async cargarLogoAutomatico() {
        try {
            if (window.IMPERIUM_LOGO_BASE64) {
                this.logoBase64 = window.IMPERIUM_LOGO_BASE64;
                console.log('✅ Logo cargado desde variable global');
                return;
            }

            try {
                const response = await fetch('./config/logo.json');
                if (response.ok) {
                    const logoData = await response.json();
                    this.logoBase64 = logoData.base64;
                    console.log('✅ Logo cargado desde logo.json');
                    return;
                }
            } catch (error) {
                console.log('📋 No se pudo cargar logo.json, intentando siguiente opción...');
            }

            try {
                await this.cargarImagenComoBase64('./images/logo.png');
                console.log('✅ Logo cargado desde imagen PNG');
                return;
            } catch (error) {
                console.log('📋 No se pudo cargar logo.png, usando logo fallback');
            }

        } catch (error) {
            console.log('📋 Usando logo fallback, no se pudo cargar logo externo:', error.message);
        }
    }

   async cargarImagenComoBase64(rutaImagen) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxWidth = 150; // límite de tamaño (ajustable)
            const scale = Math.min(maxWidth / img.width, 1);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // ⚠️ Convertir a JPEG en lugar de PNG (reduce ~80% peso)
            this.logoBase64 = canvas.toDataURL('image/jpeg', 0.6); 
            resolve(this.logoBase64);
        };
        img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
        img.src = rutaImagen;
    });
}

    establecerLogo(logoBase64) {
        this.logoBase64 = logoBase64;
        console.log('✅ Logo establecido manualmente');
    }

    // [Mantener funciones de carga de librerías igual...]
    async cargarLibrerias() {
        if (this.libreriasCargadas) return true;

        this.intentosCarga++;
        
        try {
            console.log(`🔄 Cargando librerías PDF (intento ${this.intentosCarga})...`);
            
            await this.cargarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            await this.esperarJSPDF();
            await this.cargarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
            await this.esperarAutoTable();

            this.libreriasCargadas = true;
            console.log('✅ Librerías PDF cargadas exitosamente');
            this.mostrarNotificacion('✅ PDF Generator Ready', 'success');
            
            return true;
            
        } catch (error) {
            console.error(`❌ Error cargando librerías (intento ${this.intentosCarga}):`, error);
            
            if (this.intentosCarga < this.maxIntentos) {
                console.log('🔄 Reintentando carga de librerías...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.cargarLibrerias();
            }
            
            this.mostrarNotificacion('❌ Error cargando PDF libraries', 'error');
            return false;
        }
    }

    async esperarJSPDF() {
        const maxTiempo = 10000;
        const intervalo = 100;
        let tiempoTranscurrido = 0;

        return new Promise((resolve, reject) => {
            const verificar = () => {
                if (window.jspdf?.jsPDF || window.jsPDF || (window.jspdf && typeof window.jspdf.jsPDF === 'function')) {
                    console.log('✅ jsPDF detectado correctamente');
                    resolve();
                    return;
                }

                tiempoTranscurrido += intervalo;
                if (tiempoTranscurrido >= maxTiempo) {
                    reject(new Error('Timeout esperando jsPDF'));
                    return;
                }

                setTimeout(verificar, intervalo);
            };
            verificar();
        });
    }

    async esperarAutoTable() {
        const maxTiempo = 10000;
        const intervalo = 100;
        let tiempoTranscurrido = 0;

        return new Promise((resolve, reject) => {
            const verificar = () => {
                try {
                    const jsPDF = this.obtenerJSPDF();
                    if (!jsPDF) {
                        throw new Error('jsPDF no disponible');
                    }

                    const tempDoc = new jsPDF();
                    
                    if (tempDoc.autoTable || 
                        (window.jspdf?.jsPDF?.API?.autoTable) ||
                        (typeof window.autoTable === 'function')) {
                        console.log('✅ autoTable detectado correctamente');
                        resolve();
                        return;
                    }

                } catch (error) {
                    console.log('⏳ Esperando autoTable...', error.message);
                }

                tiempoTranscurrido += intervalo;
                if (tiempoTranscurrido >= maxTiempo) {
                    reject(new Error('Timeout esperando autoTable'));
                    return;
                }

                setTimeout(verificar, intervalo);
            };
            verificar();
        });
    }

    obtenerJSPDF() {
        if (window.jspdf?.jsPDF) {
            return window.jspdf.jsPDF;
        }
        if (window.jsPDF) {
            return window.jsPDF;
        }
        if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
            return window.jspdf.jsPDF;
        }
        return null;
    }

    cargarScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                console.log(`📋 Script ya cargado: ${src}`);
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.type = 'text/javascript';
            
            const timeout = setTimeout(() => {
                reject(new Error(`Timeout cargando ${src}`));
            }, 15000);
            
            script.onload = () => {
                clearTimeout(timeout);
                console.log(`✅ Script cargado: ${src}`);
                setTimeout(resolve, 500);
            };
            
            script.onerror = () => {
                clearTimeout(timeout);
                reject(new Error(`Error cargando ${src}`));
            };
            
            document.head.appendChild(script);
        });
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 5px;
            color: white;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
        `;
        
        switch (tipo) {
            case 'success':
                notification.style.background = '#28a745';
                break;
            case 'error':
                notification.style.background = '#dc3545';
                break;
            case 'warning':
                notification.style.background = '#ffc107';
                notification.style.color = '#000';
                break;
            default:
                notification.style.background = '#17a2b8';
        }
        
        notification.textContent = mensaje;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // ✅ FUNCIÓN CLAVE CORREGIDA: generarFacturaPDF
async generarFacturaPDF(facturaData, numeroFactura) {
    try {
        console.log('🔍 GeneradorPDF recibió:');
        console.log('  - numeroFactura:', numeroFactura);
        console.log('  - facturaData:', facturaData);
        
        if (!await this.cargarLibrerias()) {
            throw new Error('No se pudieron cargar las librerías PDF después de varios intentos');
        }

        this.validarDatosFactura(facturaData, numeroFactura);

        const jsPDF = this.obtenerJSPDF();
        if (!jsPDF) {
            throw new Error('jsPDF no está disponible');
        }

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        if (!doc.autoTable && window.jspdf?.jsPDF?.API?.autoTable) {
            doc.autoTable = window.jspdf.jsPDF.API.autoTable.bind(doc);
        }

        if (!doc.autoTable) {
            throw new Error('autoTable no está disponible en la instancia de jsPDF');
        }

        doc.setFont('helvetica');
        
        let yPos = 20;

        // ✅ PASAR facturaData AL HEADER PARA LA FECHA CORRECTA
        yPos = this.agregarHeaderEmpresa(doc, yPos, numeroFactura, facturaData);
        yPos = this.agregarDatosCliente(doc, yPos, facturaData);
        yPos = this.agregarTablaServicios(doc, yPos, facturaData);
        yPos = this.agregarTotales(doc, yPos, facturaData);
        this.agregarFooter(doc, facturaData);

        const nombreArchivo = this.generarNombreArchivo(numeroFactura);
        doc.save(nombreArchivo);
        
        console.log('✅ PDF generado exitosamente:', nombreArchivo);
        this.mostrarNotificacion(`✅ PDF: ${nombreArchivo}`, 'success');
        
        return true;

    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        this.mostrarNotificacion(`❌ Error: ${error.message}`, 'error');
        throw error;
    }
}

    validarDatosFactura(facturaData, numeroFactura) {
        if (!facturaData) {
            throw new Error('Datos de factura no proporcionados');
        }
        
        if (!numeroFactura || numeroFactura.trim() === '') {
            throw new Error('Número de factura no válido');
        }
        
        if (!facturaData.nombre || facturaData.nombre.trim() === '') {
            throw new Error('Nombre del cliente es obligatorio');
        }
        
        if (!facturaData.precio || isNaN(parseFloat(facturaData.precio))) {
            throw new Error('Precio no válido');
        }
        
        if (parseFloat(facturaData.precio) <= 0) {
            throw new Error('El precio debe ser mayor que cero');
        }
    }

    // ✅ FUNCIÓN CORREGIDA: generarNombreArchivo usando número manual
    generarNombreArchivo(numeroFactura) {
        const timestamp = new Date().toISOString().slice(0, 10);
        const numeroLimpio = numeroFactura
            .replace(/[/\\:*?"<>|]/g, '_')
            .replace(/\s+/g, '_')
            .toLowerCase();
        
        return `factura_${numeroLimpio}_${timestamp}.pdf`;
    }

    // ✅ FUNCIÓN CORREGIDA: agregarHeaderEmpresa CON DEBUG MÁXIMO
agregarHeaderEmpresa(doc, yPos, numeroFactura, facturaData) {
    try {
        console.log('🎯 === agregarHeaderEmpresa EJECUTÁNDOSE ===');
        console.log('📥 numeroFactura RECIBIDO en header:', numeroFactura);
        console.log('📅 fecha_pago de la factura:', facturaData.fecha_pago);
        
        // Logo
        if (this.logoBase64) {
            try {
                doc.addImage(this.logoBase64, 'PNG', 20, yPos, 20, 20);
            } catch (error) {
                console.warn('Error cargando logo real, usando fallback:', error);
                this.dibujarLogoFallback(doc, yPos);
            }
        } else {
            this.dibujarLogoFallback(doc, yPos);
        }
        
        // Información de la empresa
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(this.configuracion.empresa_nombre, 45, yPos + 5);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`NIF: ${this.configuracion.empresa_nif}`, 45, yPos + 10);
        doc.text(this.configuracion.empresa_direccion, 45, yPos + 15);
        doc.text(this.configuracion.empresa_localidad, 45, yPos + 20);
        doc.text(`Email: ${this.configuracion.empresa_email}`, 45, yPos + 25);

        // ✅ INFORMACIÓN DE LA FACTURA
        doc.setFillColor(240, 248, 255);
        doc.rect(130, yPos, 60, 30, 'F');
        doc.setDrawColor(74, 144, 226);
        doc.rect(130, yPos, 60, 30);
        
        doc.setTextColor(74, 144, 226);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('FACTURA', 160, yPos + 8, { align: 'center' });
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // ✅ NÚMERO DE FACTURA
        const numeroParaEscribir = numeroFactura || 'ERROR-NO-NUMERO';
        doc.text(`Número: ${numeroParaEscribir}`, 135, yPos + 15);
        
        // ✅ FECHA CORRECTA BASADA EN LA FACTURA - CLAVE AQUÍ
        let fechaFactura;
        if (facturaData.fecha_pago) {
            // Usar la fecha de pago de la factura para calcular el último día de ese mes
            const fechaPago = new Date(facturaData.fecha_pago);
            fechaFactura = this.obtenerUltimoDiaMes(fechaPago);
            console.log('📅 Usando fecha de la factura:', facturaData.fecha_pago, '->', fechaFactura);
        } else {
            // Fallback: usar fecha actual
            fechaFactura = this.obtenerUltimoDiaMes(new Date());
            console.log('⚠️ Usando fecha actual como fallback');
        }
        
        doc.text(`Fecha: ${fechaFactura}`, 135, yPos + 22);

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(20, yPos + 35, 190, yPos + 35);

        console.log('✅ Header completado con número:', numeroParaEscribir, 'y fecha:', fechaFactura);
        return yPos + 45;
        
    } catch (error) {
        console.error('❌ Error en header empresa:', error);
        throw new Error('Error generando header de empresa');
    }
}

    dibujarLogoFallback(doc, yPos) {
        doc.setFillColor(74, 144, 226);
        doc.roundedRect(20, yPos, 20, 20, 3, 3, 'F');
        
        doc.setDrawColor(52, 102, 204);
        doc.setLineWidth(1);
        doc.roundedRect(20, yPos, 20, 20, 3, 3, 'S');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('IB', 30, yPos + 13, { align: 'center' });
        
        doc.setFontSize(6);
        doc.setTextColor(74, 144, 226);
        doc.text('IMPERIUM', 30, yPos + 25, { align: 'center' });
    }

    // [Mantener el resto de funciones igual: agregarDatosCliente, agregarTablaServicios, etc.]
    agregarDatosCliente(doc, yPos, facturaData) {
        try {
            doc.setFillColor(248, 249, 250);
            doc.rect(20, yPos, 170, 25, 'F');
            doc.setDrawColor(74, 144, 226);
            doc.setLineWidth(2);
            doc.line(20, yPos, 20, yPos + 25);

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('DATOS DEL CLIENTE', 25, yPos + 8);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            
            const partes = [
                facturaData.nombre || '',
                facturaData.primer_apellido || '',
                facturaData.segundo_apellido || ''
            ].filter(parte => parte.trim() !== '');
            
            const nombreCompleto = partes.join(' ') || 'Cliente no especificado';
            doc.text(nombreCompleto, 25, yPos + 15);

            doc.setFont('helvetica', 'normal');
            doc.text(`DNI/NIF: ${facturaData.dni || 'No especificado'}`, 25, yPos + 20);
            
            const direccion = facturaData.direccion || 'Granada, España';
            doc.text(direccion, 120, yPos + 15);

            if (facturaData.email && facturaData.email.trim() !== '') {
                doc.text(`Email: ${facturaData.email}`, 120, yPos + 20);
            }

            return yPos + 35;
            
        } catch (error) {
            console.error('Error en datos cliente:', error);
            throw new Error('Error generando datos del cliente');
        }
    }

    agregarTablaServicios(doc, yPos, facturaData) {
        try {
            const precio = this.validarPrecio(facturaData.precio);
            const precioSinIva = precio / 1.21;
            const iva = precio - precioSinIva;

            if (!facturaData.descripcion) {
                facturaData.descripcion = this.obtenerDescripcionServicio(facturaData.tipo_servicio || 'servicio_general');
            }

            if (!doc.autoTable) {
                throw new Error('autoTable no está disponible en el documento');
            }

            doc.autoTable({
                startY: yPos,
                head: [['DESCRIPCIÓN DEL SERVICIO', 'CANT.', 'PRECIO UNIT.', 'IVA', 'IMPORTE TOTAL']],
                body: [[
                    facturaData.descripcion || 'Servicio de entrenamiento',
                    '1',
                    `${precioSinIva.toFixed(2)} €`,
                    `${this.configuracion.iva_porcentaje}%`,
                    `${precio.toFixed(2)} €`
                ]],
                theme: 'grid',
                headStyles: {
                    fillColor: [74, 144, 226],
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    fontSize: 10
                },
                columnStyles: {
                    0: { cellWidth: 70 },
                    1: { cellWidth: 20, halign: 'center' },
                    2: { cellWidth: 30, halign: 'right' },
                    3: { cellWidth: 20, halign: 'center' },
                    4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
                },
                margin: { left: 20, right: 20 }
            });

            return doc.lastAutoTable.finalY + 10;
            
        } catch (error) {
            console.error('Error en tabla servicios:', error);
            throw new Error('Error generando tabla de servicios: ' + error.message);
        }
    }

    validarPrecio(precio) {
        const precioNumerico = parseFloat(precio);
        if (isNaN(precioNumerico) || precioNumerico <= 0) {
            throw new Error('Precio no válido: ' + precio);
        }
        return precioNumerico;
    }

    agregarTotales(doc, yPos, facturaData) {
        try {
            const precio = this.validarPrecio(facturaData.precio);
            const precioSinIva = Number((precio / 1.21).toFixed(2));
            const iva = Number((precio - precioSinIva).toFixed(2));

            if (!doc.autoTable) {
                throw new Error('autoTable no está disponible para totales');
            }

            doc.autoTable({
                startY: yPos,
                body: [
                    ['Base Imponible:', `${precioSinIva.toFixed(2)} €`],
                    [`IVA (${this.configuracion.iva_porcentaje}%):`, `${iva.toFixed(2)} €`],
                    ['TOTAL FACTURA:', `${precio.toFixed(2)} €`]
                ],
                theme: 'grid',
                bodyStyles: {
                    fontSize: 11
                },
                columnStyles: {
                    0: { cellWidth: 40, fontStyle: 'bold' },
                    1: { cellWidth: 30, halign: 'right' }
                },
                didParseCell: function(data) {
                    if (data.row.index === 2) {
                        data.cell.styles.fillColor = [232, 245, 232];
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fontSize = 12;
                    }
                },
                margin: { left: 120, right: 20 }
            });

            return doc.lastAutoTable.finalY + 15;
            
        } catch (error) {
            console.error('Error en totales:', error);
            throw new Error('Error generando totales: ' + error.message);
        }
    }

    obtenerDescripcionServicio(tipoServicio) {
        const servicios = {
            'open_2dias': 'OPEN 2 días semana',
            'open_3dias': 'OPEN 3 días semana', 
            'open_4dias': 'OPEN 4 días semana',
            'open_ilimitado': 'OPEN Ilimitado',
            'clases_2dias': 'CLASES 2 días semana',
            'clases_3dias': 'CLASES 3 días semana',
            'clases_4dias': 'CLASES 4 días semana', 
            'clases_ilimitado': 'CLASES Ilimitado',
            'bono_1sesion': 'BONO 1 Sesión (CLASE/OPEN)',
            'bono_10sesiones': 'BONO 10 Sesiones (CLASES/OPEN)',
            'bono_3clases_1open': 'BONO 3 Días Clases + 1 Día Open',
            'bono_3clases_2open': 'BONO 3 Días Clases + 2 Días Open'
        };
        return servicios[tipoServicio] || 'Servicio de entrenamiento';
    }

    agregarFooter(doc, facturaData) {
        try {
            const pageHeight = doc.internal.pageSize.height;
            let yPos = pageHeight - 40;

            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.3);
            doc.line(20, yPos, 190, yPos);

            yPos += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            const formaPago = facturaData.forma_pago || 'No especificado';
            doc.text(`Forma de pago: ${formaPago}`, 20, yPos);

            yPos += 6;
            doc.setFont('helvetica', 'normal');
            doc.text('Observaciones: Gracias por confiar en nuestros servicios de entrenamiento.', 20, yPos);

            yPos += 10;
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            
            const textoLegal = 'Según el Reglamento General de Protección de Datos Personales, los datos serán tratados de forma confidencial con el fin de gestionar la contabilidad, podrán ser cedidos a Bancos y administraciones públicas para cumplir con las obligaciones legales exigibles. Los datos serán conservados por los plazos legales establecidos. Puede ejercitar sus derechos a través de ' + this.configuracion.empresa_email;
            
            const lineas = doc.splitTextToSize(textoLegal, 170);
            doc.text(lineas, 20, yPos);
            
        } catch (error) {
            console.error('Error en footer:', error);
        }
    }

    obtenerUltimoDiaMes(fecha) {
        const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
        return ultimoDia.toLocaleDateString('es-ES');
    }

    // ✅ FUNCIÓN CORREGIDA: generarFacturaPDFBlob CON DEBUG FORZADO
async generarFacturaPDFBlob(facturaData, numeroFactura) {
    try {
        console.log('🎯 === generarFacturaPDFBlob RECIBIÓ ===');
        console.log('📥 numeroFactura recibido:', numeroFactura);
        console.log('📋 facturaData recibida:', facturaData);
        
        const facturaPreparada = this.prepararDatosFactura(facturaData);
        
        const jsPDF = this.obtenerJSPDF();
        if (!jsPDF) {
            throw new Error('jsPDF no está disponible');
        }

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        if (!doc.autoTable && window.jspdf?.jsPDF?.API?.autoTable) {
            doc.autoTable = window.jspdf.jsPDF.API.autoTable.bind(doc);
        }

        if (!doc.autoTable) {
            throw new Error('autoTable no está disponible para generar blob');
        }

        doc.setFont('helvetica');
        
        let yPos = 20;
        
        // ✅ PASAR facturaData AL HEADER PARA LA FECHA CORRECTA
        console.log('📤 Pasando a agregarHeaderEmpresa numeroFactura:', numeroFactura);
        yPos = this.agregarHeaderEmpresa(doc, yPos, numeroFactura, facturaPreparada);
        yPos = this.agregarDatosCliente(doc, yPos, facturaPreparada);
        yPos = this.agregarTablaServicios(doc, yPos, facturaPreparada);
        yPos = this.agregarTotales(doc, yPos, facturaPreparada);
        this.agregarFooter(doc, facturaPreparada);

        const blob = doc.output('blob');
        console.log('✅ Blob generado con número:', numeroFactura);
        
        return blob;
        
    } catch (error) {
        console.error('❌ Error en generarFacturaPDFBlob:', error);
        throw new Error(`Error generando PDF: ${error.message}`);
    }
}

    prepararDatosFactura(facturaData) {
        const factura = { ...facturaData };
        
        factura.nombre = factura.nombre || 'Cliente';
        factura.primer_apellido = factura.primer_apellido || '';
        factura.segundo_apellido = factura.segundo_apellido || '';
        factura.dni = factura.dni || 'No especificado';
        factura.direccion = factura.direccion || 'Granada, España';
        factura.email = factura.email || '';
        
        const precio = parseFloat(factura.precio) || 0;
        if (precio <= 0) {
            throw new Error(`Precio no válido: ${factura.precio}`);
        }
        
        factura.precio = precio;
        factura.precio_sin_iva = precio / 1.21;
        factura.iva = precio - factura.precio_sin_iva;
        
        if (!factura.descripcion) {
            if (factura.tipo_servicio) {
                factura.descripcion = this.obtenerDescripcionServicio(factura.tipo_servicio);
            } else {
                factura.descripcion = 'Servicio de entrenamiento';
            }
        }
        
        factura.forma_pago = factura.forma_pago || 'No especificado';
        
        if (!factura.fecha_pago) {
            factura.fecha_pago = new Date().toISOString().split('T')[0];
        }
        
        return factura;
    }

// ✅ FUNCIÓN CORREGIDA: generarZipFacturas CON PROGRESO EN TIEMPO REAL
async generarZipFacturas(facturas, mes, anio, callbackProgreso = null) {
    try {
        console.log('📦 Generando ZIP con facturas...');
        
        // Callback helper mejorado
        const reportarProgreso = (porcentaje, mensaje) => {
    if (typeof callbackProgreso === 'function') {
        // Forzar actualización de la UI
        setTimeout(() => {
            callbackProgreso(porcentaje, mensaje);
        }, 0);
    }
};
        
        reportarProgreso(5, 'Inicializando generación de ZIP...');
        
        // ✅ OBTENER EL NÚMERO BASE DEL INPUT
        const numeroFacturaField = document.getElementById('numeroFactura');
        
        if (!numeroFacturaField) {
            throw new Error('No se encuentra el campo número de factura');
        }
        
        const numeroFacturaBase = numeroFacturaField.value.trim();
        console.log('🔢 Número base obtenido del input:', numeroFacturaBase);
        
        if (!numeroFacturaBase) {
            throw new Error('Complete el número de factura base antes de generar el ZIP');
        }
        
        reportarProgreso(10, 'Cargando librerías PDF...');
        
        // Cargar JSZip
        await this.cargarScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        
        if (!window.JSZip) {
            throw new Error('JSZip no se cargó correctamente');
        }
        
        if (!await this.cargarLibrerias()) {
            throw new Error('No se pudieron cargar las librerías PDF');
        }

        if (!Array.isArray(facturas) || facturas.length === 0) {
            throw new Error('No hay facturas para generar ZIP');
        }

        reportarProgreso(15, `Preparando ${facturas.length} facturas...`);

        const zip = new window.JSZip();
        let contador = 0;
        let errores = 0;
        const total = facturas.reduce((sum, f) => sum + parseFloat(f.precio || 0), 0);

        this.mostrarNotificacion(`📦 Generando ZIP con ${facturas.length} facturas...`, 'info');

        // ✅ EXTRAER EL PREFIJO Y NÚMERO DEL INPUT BASE
        let prefijoFactura, numeroInicialBase;
        
        if (numeroFacturaBase.includes('/')) {
            const partes = numeroFacturaBase.split('/');
            prefijoFactura = partes[0];
            numeroInicialBase = parseInt(partes[1]) || 1;
        } else {
            prefijoFactura = numeroFacturaBase;
            numeroInicialBase = 1;
        }
        
        console.log(`📤 Prefijo extraído: ${prefijoFactura}`);
        console.log(`🔢 Número inicial: ${numeroInicialBase}`);

        // ✅ GENERAR PDFs INDIVIDUALES CON PROGRESO EN TIEMPO REAL
        const progresoBase = 15;
        const progresoRango = 70; // Del 15% al 85%
        const progresoPorFactura = progresoRango / facturas.length;

        for (let i = 0; i < facturas.length; i++) {
            const facturaData = facturas[i];
            contador++;
            
            // ✅ CALCULAR PROGRESO ACTUAL
            const progresoActual = Math.min(
                progresoBase + (progresoPorFactura * contador),
                85 // No superar el 85% hasta completar todos los PDFs
            );
            
            reportarProgreso(
                Math.round(progresoActual), 
                `Generando factura ${contador} de ${facturas.length}...`
            );
            
            // ✅ PERMITIR QUE LA INTERFAZ SE ACTUALICE
            await new Promise(resolve => setTimeout(resolve, 50));
            
            try {
                console.log(`📄 === GENERANDO PDF ${contador}/${facturas.length} ===`);
                
                // ✅ GENERAR NÚMERO CONSECUTIVO
                const numeroFacturaConsecutivo = `${prefijoFactura}/${numeroInicialBase + contador - 1}`;
                
                console.log(`🔢 Número consecutivo generado: ${numeroFacturaConsecutivo}`);
                
                const facturaPreparada = this.prepararDatosFactura(facturaData);
                
                // ✅ LLAMAR A generarFacturaPDFBlob CON AWAIT
                console.log(`📤 Llamando generarFacturaPDFBlob con número: ${numeroFacturaConsecutivo}`);
                const pdfBlob = await this.generarFacturaPDFBlob(facturaPreparada, numeroFacturaConsecutivo);
                
                const nombreCliente = this.limpiarNombre(`${facturaPreparada.nombre}_${facturaPreparada.primer_apellido}`);
                const nombreArchivo = `factura_${numeroFacturaConsecutivo.replace(/\//g, '_')}_${nombreCliente.substring(0, 20)}.pdf`;
                
                zip.file(nombreArchivo, pdfBlob);
                console.log(`✅ PDF ${contador} agregado: ${nombreArchivo}`);
                
            } catch (error) {
                console.error(`❌ Error generando PDF ${contador}:`, error);
                errores++;
                
                if (errores > facturas.length * 0.8) {
                    throw new Error('Demasiados errores generando PDFs individuales');
                }
            }
            
            // ✅ ACTUALIZAR PROGRESO DESPUÉS DE CADA PDF
            reportarProgreso(
                Math.round(progresoActual), 
                `Completado: ${contador}/${facturas.length} facturas...`
            );
        }

        // Generar resumen
        reportarProgreso(85, 'Generando resumen mensual...');
        
        try {
            const resumenBlob = await this.generarResumenMensualPDFBlobConsecutivo(
                facturas, mes, anio, prefijoFactura, numeroInicialBase
            );
            zip.file('00_RESUMEN_MENSUAL.pdf', resumenBlob);
            console.log('✅ Resumen agregado al ZIP');
        } catch (error) {
            console.error('Error generando resumen:', error);
        }

        // Generar archivos adicionales
        reportarProgreso(90, 'Generando archivos adicionales...');
        
        try {
            const csvContent = this.generarCSVConsecutivo(facturas, prefijoFactura, numeroInicialBase);
            zip.file('resumen_facturas.csv', csvContent);

            const infoContent = this.generarArchivoInfoConsecutivo(
                facturas, mes, anio, total, prefijoFactura, numeroInicialBase
            );
            zip.file('LEEME.txt', infoContent);
        } catch (error) {
            console.error('Error generando archivos adicionales:', error);
        }

        // Generar y descargar ZIP
        reportarProgreso(95, 'Comprimiendo archivo ZIP...');
        
        this.mostrarNotificacion('⏳ Generando archivo ZIP...', 'info');
        
        const zipBlob = await zip.generateAsync({ 
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
        
        reportarProgreso(98, 'Descargando archivo...');
        
        const nombreZip = `facturas_${String(mes).padStart(2, '0')}_${anio}_${new Date().toISOString().slice(0, 10)}.zip`;
        
        this.descargarBlob(zipBlob, nombreZip);
        
        reportarProgreso(100, '¡Descarga completada!');
        
        const numeroFinal = numeroInicialBase + facturas.length - 1;
        const mensaje = errores > 0 
            ? `✅ ZIP generado con ${contador - errores}/${contador} facturas (${prefijoFactura}/${numeroInicialBase} a ${prefijoFactura}/${numeroFinal})`
            : `✅ ZIP generado: ${nombreZip} (${prefijoFactura}/${numeroInicialBase} a ${prefijoFactura}/${numeroFinal})`;
            
        console.log(mensaje);
        this.mostrarNotificacion(mensaje, errores > 0 ? 'warning' : 'success');
        
        return true;

    } catch (error) {
        console.error('❌ Error generando ZIP:', error);
        this.mostrarNotificacion(`❌ Error ZIP: ${error.message}`, 'error');
        throw error;
    }
}
generarCSVConsecutivo(facturas, prefijo, numeroInicial) {
    let csv = 'Numero,Cliente,Concepto,Importe,Forma_Pago,Fecha\n';
    
    facturas.forEach((f, index) => {
        const numero = `${prefijo}/${numeroInicial + index}`;
        const cliente = `${f.nombre || ''} ${f.primer_apellido || ''}`.trim().replace(/"/g, '""');
        const concepto = (f.descripcion || '').replace(/"/g, '""');
        const precio = parseFloat(f.precio || 0).toFixed(2);
        const pago = (f.forma_pago || '').replace(/"/g, '""');
        const fecha = f.fecha ? new Date(f.fecha).toLocaleDateString('es-ES') : '';
        
        csv += `"${numero}","${cliente}","${concepto}","${precio}","${pago}","${fecha}"\n`;
    });
    
    return csv;
}

generarArchivoInfoConsecutivo(facturas, mes, anio, total, prefijo, numeroInicial) {
    const mesNombres = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const numeroFinal = numeroInicial + facturas.length - 1;
    
    return `FACTURAS GENERADAS - ${mesNombres[mes]} ${anio}
${'='.repeat(50)}

Mes: ${String(mes).padStart(2, '0')}/${anio}
Numeración: ${prefijo}/${numeroInicial} a ${prefijo}/${numeroFinal}
Total facturas: ${facturas.length}
Total facturado: ${total.toFixed(2)} €
Base imponible: ${(total/1.21).toFixed(2)} €
IVA (21%): ${(total - total/1.21).toFixed(2)} €
Generado: ${new Date().toLocaleString('es-ES')}

CONTENIDO DEL ARCHIVO:
- Facturas individuales en PDF (${prefijo}/${numeroInicial} a ${prefijo}/${numeroFinal})
- Resumen mensual en PDF
- Datos en formato CSV
- Este archivo informativo

DATOS DE LA EMPRESA:
Empresa: ${this.configuracion.empresa_nombre}
NIF: ${this.configuracion.empresa_nif}
Dirección: ${this.configuracion.empresa_direccion}
Localidad: ${this.configuracion.empresa_localidad}
Email: ${this.configuracion.empresa_email}

GENERADO CON:
Sistema de Gestión Imperium Box
Numeración consecutiva desde: ${prefijo}/${numeroInicial}
Generación PDF desde navegador web
Sin dependencias del servidor`;
}

async generarResumenMensualPDFBlobConsecutivo(facturas, mes, anio, prefijo, numeroInicial) {
    const jsPDF = this.obtenerJSPDF();
    if (!jsPDF) {
        throw new Error('jsPDF no está disponible para resumen blob');
    }

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    if (!doc.autoTable && window.jspdf?.jsPDF?.API?.autoTable) {
        doc.autoTable = window.jspdf.jsPDF.API.autoTable.bind(doc);
    }

    if (!doc.autoTable) {
        throw new Error('autoTable no está disponible para resumen blob');
    }

    const mesNombres = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const total = facturas.reduce((sum, f) => sum + parseFloat(f.precio || 0), 0);
    const numeroFinal = numeroInicial + facturas.length - 1;

    let yPos = 20;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 144, 226);
    doc.text('📊 RESUMEN MENSUAL DE FACTURACIÓN', 105, yPos, { align: 'center' });

    yPos += 15;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`${mesNombres[mes]} ${anio}`, 105, yPos, { align: 'center' });

    yPos += 8;
    doc.setFontSize(12);
    doc.text(`Numeración: ${prefijo}/${numeroInicial} a ${prefijo}/${numeroFinal}`, 105, yPos, { align: 'center' });

    yPos += 5;
    doc.setFontSize(10);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 105, yPos, { align: 'center' });

    yPos += 20;

    this.agregarEstadisticas(doc, yPos, facturas, total);
    yPos += 40;
    this.agregarTablaResumenConsecutiva(doc, yPos, facturas, total, prefijo, numeroInicial);
    this.agregarInfoEmpresa(doc);

    return doc.output('blob');
}

agregarTablaResumenConsecutiva(doc, yPos, facturas, total, prefijo, numeroInicial) {
    try {
        const datos = facturas.map((f, index) => {
            const precio = parseFloat(f.precio);
            return [
                `${prefijo}/${numeroInicial + index}`,
                f.cliente || `${f.nombre || ''} ${f.primer_apellido || ''}`.trim() || 'N/A',
                f.descripcion || 'N/A',
                `${(isNaN(precio) ? 0 : precio).toFixed(2)} €`,
                f.forma_pago || 'N/A',
                f.fecha ? new Date(f.fecha).toLocaleDateString('es-ES') : 'N/A'
            ];
        });

        datos.push([
            { content: 'TOTAL GENERAL', colSpan: 3, styles: { fontStyle: 'bold', halign: 'center' } },
            '',
            '',
            { content: `${total.toFixed(2)} €`, styles: { fontStyle: 'bold', halign: 'right' } },
            '',
            ''
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['NÚMERO', 'CLIENTE', 'CONCEPTO', 'IMPORTE', 'PAGO', 'FECHA']],
            body: datos,
            theme: 'grid',
            headStyles: {
                fillColor: [74, 144, 226],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 8
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 40 },
                2: { cellWidth: 50 },
                3: { cellWidth: 25, halign: 'right' },
                4: { cellWidth: 25 },
                5: { cellWidth: 25 }
            },
            didParseCell: function(data) {
                if (data.row.index === datos.length - 1) {
                    data.cell.styles.fillColor = [232, 245, 232];
                    data.cell.styles.fontStyle = 'bold';
                }
            },
            margin: { left: 20, right: 20 }
        });
        
    } catch (error) {
        console.error('Error en tabla resumen:', error);
        throw new Error('Error generando tabla de resumen');
    }
}

// ✅ FUNCIONES AUXILIARES ACTUALIZADAS PARA NUMERACIÓN CONSECUTIVA
generarCSVConsecutivo(facturas, prefijo, numeroInicial) {
    let csv = 'Numero,Cliente,Concepto,Importe,Forma_Pago,Fecha\n';
    
    facturas.forEach((f, index) => {
        const numero = `${prefijo}/${numeroInicial + index}`;
        const cliente = `${f.nombre || ''} ${f.primer_apellido || ''}`.trim().replace(/"/g, '""');
        const concepto = (f.descripcion || '').replace(/"/g, '""');
        const precio = parseFloat(f.precio || 0).toFixed(2);
        const pago = (f.forma_pago || '').replace(/"/g, '""');
        const fecha = f.fecha ? new Date(f.fecha).toLocaleDateString('es-ES') : '';
        
        csv += `"${numero}","${cliente}","${concepto}","${precio}","${pago}","${fecha}"\n`;
    });
    
    return csv;
}

generarArchivoInfoConsecutivo(facturas, mes, anio, total, prefijo, numeroInicial) {
    const mesNombres = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const numeroFinal = numeroInicial + facturas.length - 1;
    
    return `FACTURAS GENERADAS - ${mesNombres[mes]} ${anio}
${'='.repeat(50)}

Mes: ${String(mes).padStart(2, '0')}/${anio}
Numeración: ${prefijo}/${numeroInicial} a ${prefijo}/${numeroFinal}
Total facturas: ${facturas.length}
Total facturado: ${total.toFixed(2)} €
Base imponible: ${(total/1.21).toFixed(2)} €
IVA (21%): ${(total - total/1.21).toFixed(2)} €
Generado: ${new Date().toLocaleString('es-ES')}

CONTENIDO DEL ARCHIVO:
- Facturas individuales en PDF (${prefijo}/${numeroInicial} a ${prefijo}/${numeroFinal})
- Resumen mensual en PDF
- Datos en formato CSV
- Este archivo informativo

DATOS DE LA EMPRESA:
Empresa: ${this.configuracion.empresa_nombre}
NIF: ${this.configuracion.empresa_nif}
Dirección: ${this.configuracion.empresa_direccion}
Localidad: ${this.configuracion.empresa_localidad}
Email: ${this.configuracion.empresa_email}

GENERADO CON:
Sistema de Gestión Imperium Box
Numeración consecutiva desde: ${prefijo}/${numeroInicial}
Generación PDF desde navegador web
Sin dependencias del servidor`;
}


    // ✅ FUNCIÓN CORREGIDA: generarResumenMensualPDF con numeración personalizada
    async generarResumenMensualPDF(facturas, mes, anio) {
        try {
            console.log('📊 Generando resumen mensual PDF...');
            
            if (!await this.cargarLibrerias()) {
                throw new Error('No se pudieron cargar las librerías PDF');
            }

            if (!Array.isArray(facturas) || facturas.length === 0) {
                throw new Error('No hay facturas para generar resumen');
            }

            const jsPDF = this.obtenerJSPDF();
            if (!jsPDF) {
                throw new Error('jsPDF no está disponible para resumen');
            }

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            if (!doc.autoTable && window.jspdf?.jsPDF?.API?.autoTable) {
                doc.autoTable = window.jspdf.jsPDF.API.autoTable.bind(doc);
            }

            if (!doc.autoTable) {
                throw new Error('autoTable no está disponible para resumen');
            }

            const mesNombres = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
            const total = facturas.reduce((sum, f) => {
                const precio = parseFloat(f.precio);
                return sum + (isNaN(precio) ? 0 : precio);
            }, 0);

            // ✅ USAR EL PREFIJO DE CONFIGURACIÓN
            const prefijoFactura = this.configuracion.prefijo_factura;

            let yPos = 20;

            // Título
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(74, 144, 226);
            doc.text('📊 RESUMEN MENSUAL DE FACTURACIÓN', 105, yPos, { align: 'center' });

            yPos += 15;
            doc.setFontSize(16);
            doc.setTextColor(0, 0, 0);
            const mesNombre = mesNombres[mes] || `Mes ${mes}`;
            doc.text(`${mesNombre} ${anio}`, 105, yPos, { align: 'center' });

            yPos += 8;
            doc.setFontSize(12);
            doc.text(`Numeración: ${prefijoFactura}/1 a ${prefijoFactura}/${facturas.length}`, 105, yPos, { align: 'center' });

            yPos += 5;
            doc.setFontSize(10);
            doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 105, yPos, { align: 'center' });

            yPos += 20;

            // Estadísticas
            this.agregarEstadisticas(doc, yPos, facturas, total);

            yPos += 40;

            // ✅ Tabla de facturas con numeración personalizada
            this.agregarTablaResumen(doc, yPos, facturas, total, prefijoFactura);

            // Información de la empresa
            this.agregarInfoEmpresa(doc);

            const nombreArchivo = `resumen_${String(mes).padStart(2, '0')}_${anio}_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(nombreArchivo);

            console.log('✅ Resumen PDF generado:', nombreArchivo);
            this.mostrarNotificacion(`✅ Resumen: ${nombreArchivo}`, 'success');
            
            return true;

        } catch (error) {
            console.error('❌ Error generando resumen PDF:', error);
            this.mostrarNotificacion(`❌ Error resumen: ${error.message}`, 'error');
            throw error;
        }
    }

    agregarEstadisticas(doc, yPos, facturas, total) {
        try {
            const stats = [
                { label: 'Facturas Emitidas', value: facturas.length },
                { label: 'Total Facturado', value: `${total.toFixed(2)} €` },
                { label: 'Base Imponible', value: `${(total/1.21).toFixed(2)} €` },
                { label: 'IVA Total (21%)', value: `${(total - total/1.21).toFixed(2)} €` }
            ];

            const anchoStat = 40;
            const espacioStat = 10;
            const inicioX = 20;

            stats.forEach((stat, index) => {
                const x = inicioX + (anchoStat + espacioStat) * index;
                
                doc.setFillColor(240, 248, 255);
                doc.rect(x, yPos, anchoStat, 25, 'F');
                doc.setDrawColor(74, 144, 226);
                doc.rect(x, yPos, anchoStat, 25);

                doc.setTextColor(74, 144, 226);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(String(stat.value), x + anchoStat/2, yPos + 10, { align: 'center' });

                doc.setTextColor(100, 100, 100);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                
                const lineas = doc.splitTextToSize(stat.label, anchoStat - 4);
                const altoLinea = 3;
                const inicioTexto = yPos + 15;
                
                lineas.forEach((linea, i) => {
                    doc.text(linea, x + anchoStat/2, inicioTexto + (i * altoLinea), { align: 'center' });
                });
            });
            
        } catch (error) {
            console.error('Error en estadísticas:', error);
        }
    }

    // ✅ FUNCIÓN CORREGIDA: agregarTablaResumen con numeración personalizada
    agregarTablaResumen(doc, yPos, facturas, total, prefijoFactura) {
        try {
            const datos = facturas.map((f, index) => {
                const precio = parseFloat(f.precio);
                return [
                    `${prefijoFactura}/${index + 1}`, // ✅ Usar prefijo personalizado
                    f.cliente || `${f.nombre || ''} ${f.primer_apellido || ''}`.trim() || 'N/A',
                    f.descripcion || 'N/A',
                    `${(isNaN(precio) ? 0 : precio).toFixed(2)} €`,
                    f.forma_pago || 'N/A',
                    f.fecha ? new Date(f.fecha).toLocaleDateString('es-ES') : 'N/A'
                ];
            });

            // Agregar fila de total
            datos.push([
                { content: 'TOTAL GENERAL', colSpan: 3, styles: { fontStyle: 'bold', halign: 'center' } },
                '',
                '',
                { content: `${total.toFixed(2)} €`, styles: { fontStyle: 'bold', halign: 'right' } },
                '',
                ''
            ]);

            doc.autoTable({
                startY: yPos,
                head: [['NÚMERO', 'CLIENTE', 'CONCEPTO', 'IMPORTE', 'PAGO', 'FECHA']],
                body: datos,
                theme: 'grid',
                headStyles: {
                    fillColor: [74, 144, 226],
                    textColor: [255, 255, 255],
                    fontSize: 9,
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    fontSize: 8
                },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 50 },
                    3: { cellWidth: 25, halign: 'right' },
                    4: { cellWidth: 25 },
                    5: { cellWidth: 25 }
                },
                didParseCell: function(data) {
                    if (data.row.index === datos.length - 1) {
                        data.cell.styles.fillColor = [232, 245, 232];
                        data.cell.styles.fontStyle = 'bold';
                    }
                },
                margin: { left: 20, right: 20 }
            });
            
        } catch (error) {
            console.error('Error en tabla resumen:', error);
            throw new Error('Error generando tabla de resumen');
        }
    }

    agregarInfoEmpresa(doc) {
        try {
            const pageHeight = doc.internal.pageSize.height;
            let yPos = pageHeight - 50;

            doc.setFillColor(248, 249, 250);
            doc.rect(20, yPos, 170, 35, 'F');

            yPos += 8;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('DATOS DE LA EMPRESA', 25, yPos);

            yPos += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(this.configuracion.empresa_nombre, 25, yPos);

            doc.setFont('helvetica', 'normal');
            yPos += 5;
            doc.text(`NIF: ${this.configuracion.empresa_nif}`, 25, yPos);

            yPos += 5;
            doc.text(`Dirección: ${this.configuracion.empresa_direccion}`, 25, yPos);

            yPos += 5;
            doc.text(`Localidad: ${this.configuracion.empresa_localidad}`, 25, yPos);

            yPos += 5;
            doc.text(`Email: ${this.configuracion.empresa_email}`, 25, yPos);
            
        } catch (error) {
            console.error('Error en info empresa:', error);
        }
    }

    // ✅ FUNCIÓN CORREGIDA: generarResumenMensualPDFBlob con numeración personalizada
async generarResumenMensualPDFBlob(facturas, mes, anio, prefijo, numeroInicial) {
    const jsPDF = this.obtenerJSPDF();
    if (!jsPDF) {
        throw new Error('jsPDF no está disponible para resumen blob');
    }

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    if (!doc.autoTable && window.jspdf?.jsPDF?.API?.autoTable) {
        doc.autoTable = window.jspdf.jsPDF.API.autoTable.bind(doc);
    }

    if (!doc.autoTable) {
        throw new Error('autoTable no está disponible para resumen blob');
    }

    const mesNombres = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const total = facturas.reduce((sum, f) => sum + parseFloat(f.precio || 0), 0);
    const numeroFinal = numeroInicial + facturas.length - 1;

    let yPos = 20;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(74, 144, 226);
    doc.text('📊 RESUMEN MENSUAL DE FACTURACIÓN', 105, yPos, { align: 'center' });

    yPos += 15;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`${mesNombres[mes]} ${anio}`, 105, yPos, { align: 'center' });

    yPos += 8;
    doc.setFontSize(12);
    doc.text(`Numeración: ${prefijo}/${numeroInicial} a ${prefijo}/${numeroFinal}`, 105, yPos, { align: 'center' });

    yPos += 5;
    doc.setFontSize(10);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 105, yPos, { align: 'center' });

    yPos += 20;

    this.agregarEstadisticas(doc, yPos, facturas, total);
    yPos += 40;
    this.agregarTablaResumenConsecutiva(doc, yPos, facturas, total, prefijo, numeroInicial);
    this.agregarInfoEmpresa(doc);

    return doc.output('blob');
}

agregarTablaResumenConsecutiva(doc, yPos, facturas, total, prefijo, numeroInicial) {
    try {
        const datos = facturas.map((f, index) => {
            const precio = parseFloat(f.precio);
            return [
                `${prefijo}/${numeroInicial + index}`, // ✅ Numeración consecutiva
                f.cliente || `${f.nombre || ''} ${f.primer_apellido || ''}`.trim() || 'N/A',
                f.descripcion || 'N/A',
                `${(isNaN(precio) ? 0 : precio).toFixed(2)} €`,
                f.forma_pago || 'N/A',
                f.fecha ? new Date(f.fecha).toLocaleDateString('es-ES') : 'N/A'
            ];
        });

        // Agregar fila de total
        datos.push([
            { content: 'TOTAL GENERAL', colSpan: 3, styles: { fontStyle: 'bold', halign: 'center' } },
            '',
            '',
            { content: `${total.toFixed(2)} €`, styles: { fontStyle: 'bold', halign: 'right' } },
            '',
            ''
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['NÚMERO', 'CLIENTE', 'CONCEPTO', 'IMPORTE', 'PAGO', 'FECHA']],
            body: datos,
            theme: 'grid',
            headStyles: {
                fillColor: [74, 144, 226],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 8
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 40 },
                2: { cellWidth: 50 },
                3: { cellWidth: 25, halign: 'right' },
                4: { cellWidth: 25 },
                5: { cellWidth: 25 }
            },
            didParseCell: function(data) {
                if (data.row.index === datos.length - 1) {
                    data.cell.styles.fillColor = [232, 245, 232];
                    data.cell.styles.fontStyle = 'bold';
                }
            },
            margin: { left: 20, right: 20 }
        });
        
    } catch (error) {
        console.error('Error en tabla resumen:', error);
        throw new Error('Error generando tabla de resumen');
    }
}


    // Utilidades
    limpiarNombre(nombre) {
        return (nombre || 'cliente').trim()
            .replace(/[áàäâ]/gi, 'a')
            .replace(/[éèëê]/gi, 'e')
            .replace(/[íìïî]/gi, 'i')
            .replace(/[óòöô]/gi, 'o')
            .replace(/[úùüû]/gi, 'u')
            .replace(/[ñ]/gi, 'n')
            .replace(/[ç]/gi, 'c')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_+/g, '_')
            .toLowerCase();
    }

    // ✅ FUNCIÓN CORREGIDA: generarCSV con numeración personalizada
    generarCSV(facturas) {
        let csv = 'Numero,Cliente,Concepto,Importe,Forma_Pago,Fecha\n';
        const prefijoFactura = this.configuracion.prefijo_factura;
        
        facturas.forEach((f, index) => {
            const numero = `${prefijoFactura}/${index + 1}`; // ✅ Usar prefijo personalizado
            const cliente = `${f.nombre || ''} ${f.primer_apellido || ''}`.trim().replace(/"/g, '""');
            const concepto = (f.descripcion || '').replace(/"/g, '""');
            const precio = parseFloat(f.precio || 0).toFixed(2);
            const pago = (f.forma_pago || '').replace(/"/g, '""');
            const fecha = f.fecha ? new Date(f.fecha).toLocaleDateString('es-ES') : '';
            
            csv += `"${numero}","${cliente}","${concepto}","${precio}","${pago}","${fecha}"\n`;
        });
        
        return csv;
    }

    // ✅ FUNCIÓN CORREGIDA: generarArchivoInfo con numeración personalizada
    generarArchivoInfo(facturas, mes, anio, total) {
        const mesNombres = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const prefijoFactura = this.configuracion.prefijo_factura;
        
        return `FACTURAS GENERADAS - ${mesNombres[mes]} ${anio}
${'='.repeat(50)}

Mes: ${String(mes).padStart(2, '0')}/${anio}
Numeración: ${prefijoFactura}/1 a ${prefijoFactura}/${facturas.length}
Total facturas: ${facturas.length}
Total facturado: ${total.toFixed(2)} €
Base imponible: ${(total/1.21).toFixed(2)} €
IVA (21%): ${(total - total/1.21).toFixed(2)} €
Generado: ${new Date().toLocaleString('es-ES')}

CONTENIDO DEL ARCHIVO:
- Facturas individuales en PDF (${prefijoFactura}/1 a ${prefijoFactura}/${facturas.length})
- Resumen mensual en PDF
- Datos en formato CSV
- Este archivo informativo

DATOS DE LA EMPRESA:
Empresa: ${this.configuracion.empresa_nombre}
NIF: ${this.configuracion.empresa_nif}
Dirección: ${this.configuracion.empresa_direccion}
Localidad: ${this.configuracion.empresa_localidad}
Email: ${this.configuracion.empresa_email}

GENERADO CON:
Sistema de Gestión Imperium Box
Numeración personalizada: ${prefijoFactura}
Generación PDF desde navegador web
Sin dependencias del servidor`;
    }

    descargarBlob(blob, nombreArchivo) {
        try {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = nombreArchivo;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error descargando archivo:', error);
            throw new Error('Error al descargar el archivo');
        }
    }
}

// Crear instancia global
window.generadorPDFWeb = new GeneradorPDFWeb();

// ✅ FUNCIONES GLOBALES CORREGIDAS para usar numeración manual
window.descargarFacturaPDFWeb = async function(facturaData, numeroFactura) {
    try {
        // ✅ DEBUG: Verificar qué recibe la función global
        console.log('🌍 Función global recibió numeroFactura:', numeroFactura);
        
        await window.generadorPDFWeb.generarFacturaPDF(facturaData, numeroFactura);
        return true;
    } catch (error) {
        console.error('Error descargando factura PDF:', error);
        return false;
    }
};

window.descargarResumenPDFWeb = async function(facturas, mes, anio) {
    try {
        await window.generadorPDFWeb.generarResumenMensualPDF(facturas, mes, anio);
        return true;
    } catch (error) {
        console.error('Error descargando resumen PDF:', error);
        return false;
    }
};


window.descargarZipFacturasWeb = async function(facturas, mes, anio, callbackProgreso = null) {
    try {
        await window.generadorPDFWeb.generarZipFacturas(facturas, mes, anio, callbackProgreso);
        return true;
    } catch (error) {
        console.error('Error descargando ZIP:', error);
        return false;
    }
};
console.log('✅ Generador PDF Web CORREGIDO cargado y listo para usar');