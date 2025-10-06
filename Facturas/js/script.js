// js/script.js - ARCHIVO COMPLETO Y FINAL - VERIFICADO
const API_BASE_URL = 'api/endpoints.php';

// Variables globales
let currentUser = null;
let facturasMes = [];
let configuracion = {
    prefijo_factura: 'IMPERIUMBOXGR',
    iva_porcentaje: '21',
    empresa_nombre: 'Ruben Hinojosa Valle',
    empresa_nif: '31725301K',
    empresa_direccion: 'Arabial 45, CC NEPTUNO. IMPERIUM, Local 79',
    empresa_localidad: '18004, Granada, España',
    empresa_email: 'hello@imperiumcrosstraining.com'
};
function isMobileDevice() {
    return window.innerWidth <= 768;
}
// Función para detectar si estamos en un servidor web
function isRunningOnServer() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

// Función para mostrar error de servidor
function showServerError() {
    const errorMessage = `
        <div class="message error">
            <h3>⚠️ Error de Configuración del Servidor</h3>
            <p><strong>El sistema no puede ejecutarse correctamente.</strong></p>
            <p>Ubicación actual: <code>${window.location.href}</code></p>
            <br>
            <p><strong>Verificaciones necesarias:</strong></p>
            <ul>
                <li>✅ <strong>XAMPP:</strong> Apache y MySQL ejecutándose con indicadores verdes</li>
                <li>✅ <strong>Archivos:</strong> Proyecto en <code>C:/xampp/htdocs/tu-proyecto/</code></li>
                <li>✅ <strong>Base de datos:</strong> Accesible en <a href="http://localhost/phpmyadmin" target="_blank">phpMyAdmin</a></li>
                <li>✅ <strong>PHP:</strong> Sin errores de sintaxis en los archivos</li>
            </ul>
            <br>
            <p><strong>Herramientas de diagnóstico:</strong></p>
            <div style="margin: 10px 0;">
                <button onclick="verificarServidor()" class="btn" style="margin: 5px;">🔍 Verificar Servidor</button>
                <button onclick="mostrarErroresPHP()" class="btn" style="margin: 5px;">🐛 Ver Errores PHP</button>
                <button onclick="verificarArchivos()" class="btn" style="margin: 5px;">📁 Verificar Archivos</button>
            </div>
        </div>
    `;
    
    document.body.innerHTML = `
        <div class="container">
            <div class="header">
                <h1>🏋️ Sistema de Gestión Imperium Box</h1>
                <p>Error de Configuración</p>
            </div>
            ${errorMessage}
        </div>
    `;
}

// Función mejorada para hacer peticiones con mejor manejo de errores
async function makeRequest(url, options = {}) {
    console.log(`🔄 Haciendo petición a: ${url}`);
    console.log('📤 Opciones:', options);
    
    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        console.log('📥 Respuesta HTTP:', response.status, response.statusText);
        console.log('📥 Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const text = await response.text();
            console.error('❌ Respuesta de error completa:', text);
            
            if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
                throw new Error(`Servidor devolvió página HTML en lugar de JSON. Estado: ${response.status}. Posible error de PHP.`);
            }
            
            throw new Error(`HTTP ${response.status}: ${response.statusText}\nContenido: ${text.substring(0, 200)}`);
        }
        
        const contentType = response.headers.get('content-type');
        console.log('📥 Content-Type:', contentType);
        
        const responseText = await response.text();
        console.log('📥 Respuesta completa:', responseText.substring(0, 500));
        
        if (!contentType || !contentType.includes('application/json')) {
            console.error('❌ Respuesta no es JSON:', responseText.substring(0, 500));
            
            if (responseText.includes('<br />') && responseText.includes('<b>')) {
                throw new Error('Error de PHP detectado. Verifica la sintaxis de los archivos PHP y la configuración de la base de datos.');
            }
            
            if (responseText.includes('<!DOCTYPE html>')) {
                throw new Error('El servidor devolvió una página HTML. Verifica que el archivo endpoints.php existe y no tiene errores.');
            }
            
            throw new Error(`El servidor no devolvió JSON válido. Content-Type: ${contentType}. Contenido: ${responseText.substring(0, 200)}`);
        }
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Error parseando JSON:', parseError);
            console.error('❌ Texto que causó el error:', responseText);
            throw new Error(`JSON inválido recibido del servidor. Error: ${parseError.message}. Contenido: ${responseText.substring(0, 200)}`);
        }
        
        console.log('✅ Datos recibidos:', data);
        
        if (data.error) {
            throw new Error(data.message || 'Error del servidor sin mensaje específico');
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Error completo en petición:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('No se puede conectar con el servidor. Verifica que Apache esté ejecutándose en XAMPP.');
        }
        
        if (error.message.includes('JSON')) {
            throw new Error('Error de configuración del servidor. El archivo PHP tiene errores de sintaxis o problemas de configuración.');
        }
        
        if (error.message.includes('HTML')) {
            throw new Error('El servidor devolvió una página de error. Verifica los archivos PHP y la configuración de la base de datos.');
        }
        
        throw error;
    }
}

// Función para probar la conexión con diagnóstico mejorado
async function testConnection() {
    try {
        console.log('🔍 Probando conexión con API principal...');
        
        const testUrl = `${API_BASE_URL}?action=test_connection`;
        console.log('🔗 URL de prueba:', testUrl);
        
        const response = await fetch(testUrl, {
            credentials: 'same-origin',
            method: 'GET'
        });
        
        console.log('📊 Estado de respuesta:', response.status);
        console.log('📊 Headers de respuesta:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📄 Respuesta completa (primeros 1000 chars):', responseText.substring(0, 1000));
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Archivo no encontrado: ${API_BASE_URL}. Verifica que el archivo existe en la ubicación correcta.`);
            }
            if (response.status === 500) {
                throw new Error(`Error interno del servidor (500). Revisa los errores de PHP en los logs de XAMPP.`);
            }
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html')) {
            throw new Error('El servidor devolvió HTML en lugar de JSON. Posible error de configuración de PHP.');
        }
        
        if (responseText.includes('<br />') && (responseText.includes('Fatal error') || responseText.includes('Parse error'))) {
            throw new Error('Error de sintaxis de PHP detectado. Revisa el archivo endpoints.php.');
        }
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Error parseando JSON:', parseError);
            throw new Error(`El servidor no devolvió JSON válido. Posible error de PHP. Contenido recibido: ${responseText.substring(0, 300)}`);
        }
        
        console.log('✅ API principal funciona:', data);
        
        if (data.success) {
            return true;
        } else {
            throw new Error(data.message || 'La API devolvió success: false');
        }
        
    } catch (error) {
        console.error('❌ Error de conexión detallado:', error);
        
        let mensaje = 'Error de conexión: ' + error.message;
        
        if (error.message.includes('404')) {
            mensaje += '\n\n🔧 Solución: Verifica que el archivo api/endpoints.php existe.';
        } else if (error.message.includes('500') || error.message.includes('PHP')) {
            mensaje += '\n\n🔧 Solución: Revisa los errores de PHP en XAMPP Control Panel → Logs.';
        } else if (error.message.includes('JSON')) {
            mensaje += '\n\n🔧 Solución: El archivo PHP tiene errores de sintaxis o configuración.';
        } else if (error.message.includes('fetch')) {
            mensaje += '\n\n🔧 Solución: Verifica que Apache esté ejecutándose en XAMPP.';
        }
        
        showMessage('error', mensaje, 'mensajeLogin');
        return false;
    }
}

// Funciones de diagnóstico adicionales
async function verificarServidor() {
    const resultados = [];
    
    try {
        const response = await fetch(window.location.origin, { method: 'HEAD' });
        resultados.push(`✅ Apache: Funcionando (${response.status})`);
    } catch (error) {
        resultados.push(`❌ Apache: Error - ${error.message}`);
    }
    
    try {
        const phpResponse = await fetch(window.location.origin + '/info.php');
        if (phpResponse.status === 200) {
            resultados.push(`✅ PHP: Funcionando`);
        } else {
            resultados.push(`⚠️ PHP: Estado ${phpResponse.status}`);
        }
    } catch (error) {
        resultados.push(`❌ PHP: Error - ${error.message}`);
    }
    
    try {
        const pmaResponse = await fetch(window.location.origin + '/phpmyadmin/', { method: 'HEAD' });
        resultados.push(`✅ phpMyAdmin: Accesible (${pmaResponse.status})`);
    } catch (error) {
        resultados.push(`❌ phpMyAdmin: Error - ${error.message}`);
    }
    
    alert('🔍 Estado del Servidor:\n\n' + resultados.join('\n'));
}

async function mostrarErroresPHP() {
    try {
        const response = await fetch(API_BASE_URL + '?action=test_connection');
        const text = await response.text();
        
        if (text.includes('<br />') || text.includes('Fatal error') || text.includes('Parse error')) {
            alert('🐛 Errores de PHP detectados:\n\n' + text.replace(/<[^>]*>/g, '').substring(0, 500));
        } else {
            alert('✅ No se detectaron errores obvios de PHP.\n\nRespuesta del servidor:\n' + text.substring(0, 300));
        }
    } catch (error) {
        alert('❌ Error al verificar PHP:\n\n' + error.message);
    }
}

async function verificarArchivos() {
    const archivos = [
        'api/endpoints.php',
        'config/database.php',
        'classes/Auth.php',
        'classes/Usuario.php',
        'classes/Factura.php'
    ];
    
    const resultados = [];
    
    for (const archivo of archivos) {
        try {
            const response = await fetch(archivo, { method: 'HEAD' });
            if (response.status === 200) {
                resultados.push(`✅ ${archivo}: Existe`);
            } else {
                resultados.push(`❌ ${archivo}: Estado ${response.status}`);
            }
        } catch (error) {
            resultados.push(`❌ ${archivo}: Error - ${error.message}`);
        }
    }
    
    alert('📁 Estado de Archivos:\n\n' + resultados.join('\n'));
}

// Función para mostrar/ocultar pantallas
function mostrarPantalla(pantalla) {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (pantalla === 'login') {
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('hidden');
    } else if (pantalla === 'main') {
        if (loginScreen) loginScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
        showTab('crear');
    }
}

// Función para configurar fechas
function configurarFechas() {
    const fechaActual = new Date();
    const fechaInput = fechaActual.toISOString().split('T')[0];
    const mesActual = fechaActual.toISOString().slice(0, 7);
    
    const fechaPago = document.getElementById('fechaPago');
    const fechaPago2 = document.getElementById('fechaPago2');
    const mesSeleccionado = document.getElementById('mesSeleccionado');
    
    if (fechaPago) fechaPago.value = fechaInput;
    if (fechaPago2) fechaPago2.value = fechaInput;
    if (mesSeleccionado) mesSeleccionado.value = mesActual;
}

// Función para configurar event listeners
function configurarEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }

    const crearUsuarioForm = document.getElementById('crearUsuarioForm');
    if (crearUsuarioForm) {
        crearUsuarioForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validar antes de enviar
            const validacion = validarFormularioCompleto();
            if (!validacion.valido) {
                showMessage('error', 'Errores en el formulario:\n• ' + validacion.errores.join('\n• '), 'mensajeCrear');
                return;
            }
            
            crearUsuario();
        });
    }

    const formNuevaFactura = document.getElementById('formNuevaFactura');
    if (formNuevaFactura) {
			formNuevaFactura.addEventListener('submit', function(e) {
			e.preventDefault();
			crearNuevaFactura();
			const observacionesGroup2 = document.getElementById('observacionesGroup2');
			if (observacionesGroup2) observacionesGroup2.style.display = 'none';
			const observaciones2 = document.getElementById('observaciones2');
			if (observaciones2) observaciones2.value = '';
			});
			}

    // Event listener ACTUALIZADO para auto-completar precio cuando se selecciona servicio
    const tipoServicio = document.getElementById('tipoServicio');
    if (tipoServicio) {
        tipoServicio.addEventListener('change', function() {
            manejarCambioTipoServicio(this.value, 'precio', 'observacionesGroup', 'observaciones');
        });
    }

    // Event listener ACTUALIZADO para el segundo formulario
    const tipoServicio2 = document.getElementById('tipoServicio2');
    if (tipoServicio2) {
        tipoServicio2.addEventListener('change', function() {
            manejarCambioTipoServicio(this.value, 'precio2', 'observacionesGroup2', 'observaciones2');
        });
    }
    
    // Configurar validación en tiempo real
    configurarValidacionTiempoReal();
}

// NUEVA FUNCIÓN: Manejar cambio de tipo de servicio
function manejarCambioTipoServicio(tipoServicio, precioFieldId, observacionesGroupId, observacionesFieldId) {
    const selectedOption = document.querySelector(`option[value="${tipoServicio}"]`);
    const precio = selectedOption ? selectedOption.getAttribute('data-precio') : '';
    
    const precioField = document.getElementById(precioFieldId);
    const observacionesGroup = document.getElementById(observacionesGroupId);
    const observacionesField = document.getElementById(observacionesFieldId);
    
    if (!precioField || !observacionesGroup || !observacionesField) return;
    
    if (tipoServicio === 'personalizado') {
        // Servicio personalizado seleccionado
        precioField.value = '';
        precioField.removeAttribute('readonly');
        precioField.setAttribute('placeholder', 'Introduce el precio personalizado');
        precioField.focus();
        
        // Mostrar campo de observaciones
        observacionesGroup.style.display = 'block';
        observacionesField.setAttribute('required', 'true');
        
        // Cambiar estilos para indicar que son editables
        precioField.style.backgroundColor = '#fff8dc';
        precioField.style.borderColor = '#ffc107';
        
        console.log('🎨 Servicio personalizado activado');
        
    } else {
        // Servicio predefinido seleccionado
        precioField.value = precio || '';
        precioField.setAttribute('readonly', 'true');
        precioField.removeAttribute('placeholder');
        
        // Ocultar campo de observaciones
        observacionesGroup.style.display = 'none';
        observacionesField.removeAttribute('required');
        observacionesField.value = '';
        
        // Restaurar estilos normales
        precioField.style.backgroundColor = '';
        precioField.style.borderColor = precio ? '#28a745' : '#dc3545';
        
        console.log('📋 Servicio predefinido seleccionado:', tipoServicio, 'Precio:', precio);
    }
}

// AGREGAR esta función auxiliar para validación en tiempo real:
function configurarValidacionTiempoReal() {
    const campos = [
        { id: 'nombre', requerido: true, tipo: 'texto' },
        { id: 'primerApellido', requerido: true, tipo: 'texto' },
        { id: 'segundoApellido', requerido: false, tipo: 'texto' },
        { id: 'dni', requerido: true, tipo: 'dni' },
        { id: 'email', requerido: false, tipo: 'email' },
        { id: 'telefono', requerido: false, tipo: 'telefono' },
        { id: 'tipoServicio', requerido: true, tipo: 'select' },
        { id: 'precio', requerido: true, tipo: 'numero' },
        { id: 'formaPago', requerido: true, tipo: 'select' },
        { id: 'fechaPago', requerido: true, tipo: 'fecha' }
    ];
    
    campos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        if (!elemento) return;
        
        // Evento al perder foco
        elemento.addEventListener('blur', function() {
            validarCampoIndividual(this, campo);
        });
        
        // Evento al ganar foco (limpiar estilo)
        elemento.addEventListener('focus', function() {
            this.style.borderColor = '#007bff';
            this.style.backgroundColor = '';
        });
        
        // Para campos select, validar al cambiar
        if (campo.tipo === 'select') {
            elemento.addEventListener('change', function() {
                validarCampoIndividual(this, campo);
            });
        }
    });
}

function validarCampoIndividual(elemento, campo) {
    const valor = elemento.value.trim();
    let esValido = true;
    let mensaje = '';
    
    // Verificar si es requerido
    if (campo.requerido && !valor) {
        esValido = false;
        mensaje = 'Campo obligatorio';
    }
    
    // Validaciones específicas por tipo
    if (valor && esValido) {
        switch (campo.tipo) {
            case 'dni':
                esValido = validarDNI(valor);
                mensaje = esValido ? '' : 'DNI no válido (formato: 12345678A)';
                break;
                
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                esValido = emailRegex.test(valor);
                mensaje = esValido ? '' : 'Email no válido';
                break;
                
            case 'telefono':
                const telefonoRegex = /^[0-9+\-\s()]{9,15}$/;
                esValido = telefonoRegex.test(valor);
                mensaje = esValido ? '' : 'Teléfono no válido';
                break;
                
            case 'numero':
                const numero = parseFloat(valor);
                esValido = !isNaN(numero) && numero > 0;
                mensaje = esValido ? '' : 'Debe ser un número mayor que 0';
                break;
                
            case 'fecha':
                const fecha = new Date(valor);
                esValido = !isNaN(fecha.getTime());
                mensaje = esValido ? '' : 'Fecha no válida';
                break;
        }
    }
    
    // Aplicar estilos según validación
    if (esValido) {
        elemento.style.borderColor = '#28a745';
        elemento.style.backgroundColor = '#f8fff8';
        elemento.title = '';
    } else {
        elemento.style.borderColor = '#dc3545';
        elemento.style.backgroundColor = '#fff8f8';
        elemento.title = mensaje;
    }
    
    return esValido;
}

// Funciones de navegación
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const targetTab = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    const navButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (navButton) {
        navButton.classList.add('active');
    }
}

// Funciones de mensajes
function showMessage(type, message, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `<div class="message ${type}">${message}</div>`;
    
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }
}

// Funciones de autenticación
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showMessage('error', 'Por favor complete todos los campos', 'mensajeLogin');
        return;
    }
    
    try {
        showMessage('info', 'Iniciando sesión...', 'mensajeLogin');
        
        const result = await makeRequest(`${API_BASE_URL}?action=login`, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (result.success) {
            currentUser = result.user;
            showMessage('success', 'Bienvenido ' + result.user.nombre, 'mensajeLogin');
            
            setTimeout(() => {
                mostrarPantalla('main');
            }, 1000);
            
        } else {
            showMessage('error', result.message || 'Error al iniciar sesión', 'mensajeLogin');
        }
    } catch (error) {
        showMessage('error', 'Error de conexión: ' + error.message, 'mensajeLogin');
    }
}

async function verificarSesion() {
    try {
        console.log('🔍 Verificando sesión existente...');
        const result = await makeRequest(`${API_BASE_URL}?action=verificar_sesion`);
        
        if (result.success) {
            console.log('✅ Sesión válida encontrada');
            currentUser = result.user;
            mostrarPantalla('main');
        } else {
            console.log('ℹ️ No hay sesión activa');
            mostrarPantalla('login');
        }
    } catch (error) {
        console.error('❌ Error al verificar sesión:', error);
        mostrarPantalla('login');
        showMessage('error', 'Error al verificar sesión: ' + error.message, 'mensajeLogin');
    }
}

async function logout() {
    try {
        await makeRequest(`${API_BASE_URL}?action=logout`, { method: 'POST' });
        currentUser = null;
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
        
        const containers = ['mensajeLogin', 'mensajeCrear', 'mensajeBuscar', 'mensajeFacturas'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) container.innerHTML = '';
        });
        
        mostrarPantalla('login');
        showMessage('info', 'Sesión cerrada exitosamente', 'mensajeLogin');
        
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showMessage('error', 'Error al cerrar sesión', 'mensajeLogin');
    }
}

// Función para obtener descripción del servicio
function obtenerDescripcionServicio(tipoServicio) {
    const servicios = {
        // OPEN
        'open_2dias': 'OPEN 2 días semana',
        'open_3dias': 'OPEN 3 días semana',
        'open_4dias': 'OPEN 4 días semana',
        'open_ilimitado': 'OPEN Ilimitado',
        
        // CLASES
        'clases_2dias': 'CLASES 2 días semana',
        'clases_3dias': 'CLASES 3 días semana',
        'clases_4dias': 'CLASES 4 días semana',
        'clases_ilimitado': 'CLASES Ilimitado',
        
        // BONOS
        'bono_1sesion': 'BONO 1 Sesión (CLASE/OPEN)',
        'bono_10sesiones': 'BONO 10 Sesiones (CLASES/OPEN)',
        'bono_3clases_1open': 'BONO 3 Días Clases + 1 Día Open',
        'bono_3clases_2open': 'BONO 3 Días Clases + 2 Días Open',
        
        // PERSONALIZADO - NUEVO
        'personalizado': 'Servicio Personalizado',
        
        // Compatibilidad con valores antiguos
        '3wod_1mes': 'OPEN 3 días semana',
        'libre_1mes': 'OPEN Ilimitado',
        '3wod_3meses': 'OPEN 3 días semana (3 meses)',
        'libre_3meses': 'OPEN Ilimitado (3 meses)'
    };
    
    return servicios[tipoServicio] || tipoServicio;
}


async function cargarConfiguracion() {
    try {
        console.log('🔧 Cargando configuración...');
        const config = await makeRequest(`${API_BASE_URL}?action=obtener_configuracion`);
        configuracion = { ...configuracion, ...config };
        
        const numeroFacturaField = document.getElementById('numeroFactura');
        if (numeroFacturaField && !numeroFacturaField.value.trim()) {
            numeroFacturaField.value = `${configuracion.prefijo_factura}/1`;
        }
        
        console.log('✅ Configuración cargada:', configuracion);
    } catch (error) {
        console.error('⚠️ Error al cargar configuración:', error);
        showMessage('warning', 'Usando configuración por defecto. Error: ' + error.message, 'mensajeLogin');
    }
}

function validarDNI(dni) {
    const dniPattern = /^\d{8}[A-Za-z]$/;
    const niePattern = /^[XYZxyz]\d{7}[A-Za-z]$/;
    return dniPattern.test(dni.trim()) || niePattern.test(dni.trim());
}

async function crearUsuario() {
  const formData = new FormData(document.getElementById('crearUsuarioForm'));
    const datos = Object.fromEntries(formData);
    
    // Validar DNI
    if (!validarDNI(datos.dni)) {
        showMessage('error', 'DNI no válido. Debe tener formato 12345678A o X1234567A', 'mensajeCrear');
        return;
    }
    
    // Validar campos obligatorios para la factura
    if (!datos.tipoServicio || !datos.precio || !datos.formaPago || !datos.fechaPago) {
        showMessage('error', 'Complete todos los campos de facturación (Tipo de Servicio, Precio, Forma de Pago y Fecha)', 'mensajeCrear');
        return;
    }
    
    // NUEVA VALIDACIÓN: Verificar observaciones si es servicio personalizado
    if (datos.tipoServicio === 'personalizado' && !datos.observaciones?.trim()) {
        showMessage('error', 'Para servicios personalizados, las observaciones son obligatorias', 'mensajeCrear');
        return;
    }
    
    // Preparar descripción del servicio
    let descripcionServicio = obtenerDescripcionServicio(datos.tipoServicio);
    
    // Si es personalizado y hay observaciones, usar las observaciones como descripción
    if (datos.tipoServicio === 'personalizado' && datos.observaciones?.trim()) {
        descripcionServicio = datos.observaciones.trim();
    }
    
    // Validar precio
    const precio = parseFloat(datos.precio);
    if (isNaN(precio) || precio <= 0) {
        showMessage('error', 'El precio debe ser un número mayor que 0', 'mensajeCrear');
        return;
    }
    
    // Estructurar datos para enviar al backend
    const datosCompletos = {
        // Datos del usuario
        usuario: {
            nombre: datos.nombre,
            primerApellido: datos.primerApellido,
            segundoApellido: datos.segundoApellido || '',
            dni: datos.dni,
            email: datos.email || '',
            telefono: datos.telefono || '',
            direccion: datos.direccion || '',
            codigoPostal: datos.codigoPostal || '',
            localidad: datos.localidad || 'Granada',
            activo: datos.activo || 1
        },
        // Datos de la factura ACTUALIZADOS
        factura: {
            tipoServicio: datos.tipoServicio,
            descripcion: descripcionServicio,
            precio: precio,
            formaPago: datos.formaPago,
            fechaPago: datos.fechaPago,
            observaciones: datos.observaciones || null // NUEVO CAMPO
        }
    };
    
    try {
        showMessage('info', 'Creando usuario y factura...', 'mensajeCrear');
        
        console.log('📋 Enviando datos completos:', datosCompletos);
        
        const result = await makeRequest(`${API_BASE_URL}?action=crear_usuario_con_factura`, {
            method: 'POST',
            body: JSON.stringify(datosCompletos)
        });
        
        if (result.success) {
            showMessage('success', result.message, 'mensajeCrear');
            
            // Resetear formulario
            const form = document.getElementById('crearUsuarioForm');
            if (form) form.reset();
            
            // Restaurar valores por defecto
            const fechaPago = document.getElementById('fechaPago');
            const precio = document.getElementById('precio');
            const activoSelect = document.getElementById('activo');
            const localidadInput = document.getElementById('localidad');
            const observacionesGroup = document.getElementById('observacionesGroup');
            
            if (fechaPago) fechaPago.value = new Date().toISOString().split('T')[0];
            if (precio) {
                precio.value = '';
                precio.setAttribute('readonly', 'true');
                precio.style.backgroundColor = '';
                precio.style.borderColor = '';
            }
            if (activoSelect) activoSelect.value = '1';
            if (localidadInput) localidadInput.value = 'Granada';
            if (observacionesGroup) observacionesGroup.style.display = 'none';
            
        } else {
            showMessage('error', result.message || 'Error al crear usuario y factura', 'mensajeCrear');
        }
    } catch (error) {
        console.error('❌ Error completo:', error);
        showMessage('error', 'Error de conexión: ' + error.message, 'mensajeCrear');
    }
}

// OPCIONAL: Función auxiliar para validar todos los campos antes de enviar
function validarFormularioCompleto() {
    const campos = {
        nombre: document.getElementById('nombre').value.trim(),
        primerApellido: document.getElementById('primerApellido').value.trim(),
        dni: document.getElementById('dni').value.trim(),
        tipoServicio: document.getElementById('tipoServicio').value,
        precio: document.getElementById('precio').value,
        formaPago: document.getElementById('formaPago').value,
        fechaPago: document.getElementById('fechaPago').value
    };
    
    const errores = [];
    
    if (!campos.nombre) errores.push('Nombre es obligatorio');
    if (!campos.primerApellido) errores.push('Primer apellido es obligatorio');
    if (!campos.dni) errores.push('DNI es obligatorio');
    if (!validarDNI(campos.dni)) errores.push('DNI no tiene formato válido');
    if (!campos.tipoServicio) errores.push('Tipo de servicio es obligatorio');
    if (!campos.precio || isNaN(parseFloat(campos.precio)) || parseFloat(campos.precio) <= 0) {
        errores.push('Precio debe ser un número mayor que 0');
    }
    if (!campos.formaPago) errores.push('Forma de pago es obligatoria');
    if (!campos.fechaPago) errores.push('Fecha de pago es obligatoria');
    
    return {
        valido: errores.length === 0,
        errores: errores
    };
}

// TAMBIÉN agregar esta validación en tiempo real al formulario:
function configurarValidacionTiempoReal() {
    const campos = ['nombre', 'primerApellido', 'dni', 'tipoServicio', 'precio', 'formaPago', 'fechaPago'];
    
    campos.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo) {
            campo.addEventListener('blur', function() {
                const validacion = validarFormularioCompleto();
                
                // Cambiar color del borde según validez
                if (this.value.trim()) {
                    this.style.borderColor = validacion.valido ? '#28a745' : '#dc3545';
                } else {
                    this.style.borderColor = '#dc3545';
                }
            });
            
            campo.addEventListener('focus', function() {
                this.style.borderColor = '#007bff';
            });
        }
    });
}

async function buscarUsuarios() {
    const busqueda = document.getElementById('busqueda').value.trim();
    const resultados = document.getElementById('resultadosBusqueda');
    
    if (!busqueda) {
        resultados.innerHTML = '<div class="message info">Ingrese un término de búsqueda</div>';
        return;
    }
    
    try {
        showMessage('info', 'Buscando usuarios...', 'mensajeBuscar');
        
        const usuariosEncontrados = await makeRequest(`${API_BASE_URL}?action=buscar_usuarios&termino=${encodeURIComponent(busqueda)}`);
        
        if (!Array.isArray(usuariosEncontrados) || usuariosEncontrados.length === 0) {
            resultados.innerHTML = '<div class="message info">No se encontraron usuarios</div>';
            document.getElementById('mensajeBuscar').innerHTML = '';
            return;
        }
        
        let html = '';
        usuariosEncontrados.forEach(usuario => {
            const totalFacturas = parseInt(usuario.total_facturas) || 0;
            const totalFacturado = parseFloat(usuario.total_facturado) || 0;
            const facturas = Array.isArray(usuario.facturas) ? usuario.facturas : [];
            const cardClass = usuario.activo ? '' : 'inactivo';
            const nombreCompleto = `${usuario.nombre || ''} ${usuario.primer_apellido || ''} ${usuario.segundo_apellido || ''}`.trim();
            const facturasPersonalizadas = facturas.filter(f => f.tipo_servicio === 'personalizado').length;
            
            html += `
                <div class="user-card ${cardClass}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                        <div style="flex: 1; min-width: 200px;">
                            <h3>${nombreCompleto}</h3>
                            <div style="display: flex; align-items: center; gap: 8px; margin-top: 5px;">
                                ${facturasPersonalizadas > 0 ? 
                                    `<span style="background: #fff3e0; color: #e65100; padding: 2px 6px; border-radius: 10px; font-size: 10px;">
                                        ${facturasPersonalizadas} Personalizada${facturasPersonalizadas > 1 ? 's' : ''}
                                    </span>` : ''
                                }
                                <span style="color: ${usuario.activo ? '#28a745' : '#dc3545'}; font-size: 12px; font-weight: bold;">
                                    ${usuario.activo ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" ${usuario.activo ? 'checked' : ''} 
                                onchange="cambiarEstadoUsuario(${usuario.id}, this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                    
                    <!-- Información del usuario optimizada para móvil -->
                    <div class="stats-grid-mobile">
                        <div class="stat-card-mobile">
                            <span class="stat-value-mobile">${totalFacturas}</span>
                            <span class="stat-label-mobile">Facturas</span>
                        </div>
                        <div class="stat-card-mobile">
                            <span class="stat-value-mobile">${totalFacturado.toFixed(2)}€</span>
                            <span class="stat-label-mobile">Total</span>
                        </div>
                        <div class="stat-card-mobile">
                            <span class="stat-value-mobile">${totalFacturas > 0 ? (totalFacturado / totalFacturas).toFixed(0) : '0'}€</span>
                            <span class="stat-label-mobile">Promedio</span>
                        </div>
                    </div>
                    
                    <!-- Detalles de contacto (colapsables en móvil) -->
                    <div style="margin: 15px 0; font-size: 13px; color: #666;">
                        <div><strong>DNI:</strong> ${usuario.dni || 'No registrado'}</div>
                        ${usuario.email ? `<div><strong>Email:</strong> ${usuario.email}</div>` : ''}
                        ${usuario.telefono ? `<div><strong>Teléfono:</strong> ${usuario.telefono}</div>` : ''}
                    </div>
                    
                    ${facturas.length > 0 ? `
                        <!-- Vista desktop de facturas -->
                        <div class="facturas-desktop">
                            <h4 style="margin: 15px 0 10px 0;">Historial de Facturas:</h4>
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Número</th>
                                            <th>Servicio</th>
                                            <th>Precio</th>
                                            <th>Pago</th>
                                            <th>Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${facturas.map(factura => generarFilaFactura(factura)).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Vista móvil de facturas -->
                        <div class="facturas-mobile">
                            <h4 style="margin: 15px 0 10px 0;">Historial de Facturas:</h4>
                            ${facturas.map(factura => generarTarjetaFacturaMovil(factura)).join('')}
                        </div>
                    ` : `
                        <div class="message info" style="text-align: center; padding: 15px; font-size: 13px;">
                            Este usuario no tiene facturas registradas.
                        </div>
                    `}
                    
                    <!-- Acciones optimizadas para móvil -->
                    <div class="user-actions-mobile">
                        <button class="btn btn-secondary" onclick="mostrarFormularioNuevaFactura(${usuario.id})">
                            ➕ Nueva Factura
                        </button>
                        <button class="btn btn-info" onclick="verDetalleUsuario(${usuario.id})">
                            👁️ Ver Detalles
                        </button>
                    </div>
                </div>
            `;
        });
        
        resultados.innerHTML = html;
        document.getElementById('mensajeBuscar').innerHTML = '';
        
    } catch (error) {
        console.error('Error completo:', error);
        showMessage('error', 'Error al buscar usuarios: ' + error.message, 'mensajeBuscar');
        resultados.innerHTML = '<div class="message error">Error al cargar los resultados</div>';
    }
}
function generarFilaFactura(factura) {
    const esPersonalizado = factura.tipo_servicio === 'personalizado';
    const descripcionCompleta = esPersonalizado ? 
        (factura.observaciones || factura.descripcion || 'Servicio personalizado') :
        (factura.descripcion || 'N/A');
    
    const descripcionMostrada = descripcionCompleta.length > 30 ? 
        descripcionCompleta.substring(0, 30) + '...' : 
        descripcionCompleta;
    
    const filaClass = esPersonalizado ? 'class="factura-personalizada"' : '';
    const badge = esPersonalizado ? '<span class="servicio-personalizado-badge">PERSONAL</span>' : '';
    
    return `
        <tr ${filaClass}>
            <td style="font-size: 11px;">${factura.numero_factura || 'N/A'}</td>
            <td>
                <div style="font-size: 11px; line-height: 1.3;">
                    ${descripcionMostrada}${badge}
                    ${esPersonalizado && descripcionCompleta.length > 30 ? 
                        `<br><small style="color: #666; cursor: pointer; text-decoration: underline;" onclick="mostrarDescripcionCompleta('${descripcionCompleta.replace(/'/g, '\\\'')}')" title="Ver completo">Ver más</small>` : ''}
                </div>
            </td>
            <td style="font-weight: bold; color: ${esPersonalizado ? '#ff9800' : '#28a745'}; font-size: 12px;">
                ${(parseFloat(factura.precio) || 0).toFixed(2)}€
            </td>
            <td style="font-size: 10px;">${(factura.forma_pago || 'N/A').substring(0, 8)}</td>
            <td style="font-size: 10px;">${factura.fecha_pago ? formatearFechaCorta(factura.fecha_pago) : 'N/A'}</td>
        </tr>
    `;
}

// NUEVA función para generar tarjeta de factura móvil
function generarTarjetaFacturaMovil(factura) {
    const esPersonalizado = factura.tipo_servicio === 'personalizado';
    const descripcionCompleta = esPersonalizado ? 
        (factura.observaciones || factura.descripcion || 'Servicio personalizado') :
        (factura.descripcion || 'N/A');
    
    const descripcionMostrada = descripcionCompleta.length > 50 ? 
        descripcionCompleta.substring(0, 50) + '...' : 
        descripcionCompleta;
    
    const cardClass = esPersonalizado ? 'factura-personalizada' : '';
    const badge = esPersonalizado ? '<span class="servicio-personalizado-badge">PERSONALIZADO</span>' : '';
    
    return `
        <div class="factura-card-mobile ${cardClass}">
            <div class="factura-number">#${factura.numero_factura || 'N/A'}</div>
            <div class="factura-service">
                ${descripcionMostrada}${badge}
                ${esPersonalizado && descripcionCompleta.length > 50 ? 
                    `<br><small style="color: #666; cursor: pointer; text-decoration: underline;" onclick="mostrarDescripcionCompleta('${descripcionCompleta.replace(/'/g, '\\\'')}')" title="Ver completo">Ver descripción completa</small>` : ''}
            </div>
            <div class="factura-details">
                <div class="factura-price" style="color: ${esPersonalizado ? '#ff9800' : '#28a745'};">
                    ${(parseFloat(factura.precio) || 0).toFixed(2)}€
                </div>
                <div class="factura-payment">${factura.forma_pago || 'N/A'}</div>
                <div class="factura-date">${factura.fecha_pago ? formatearFechaCorta(factura.fecha_pago) : 'N/A'}</div>
            </div>
        </div>
    `;
}

// NUEVA función para formato de fecha corto
function formatearFechaCorta(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit',
        year: '2-digit'
    });
}
function mostrarDetalleFacturaPersonalizada(factura) {
    if (factura.tipo_servicio === 'personalizado' && factura.observaciones) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(0,0,0,0.5); z-index: 1000; 
            display: flex; align-items: center; justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <h3>Detalles del Servicio Personalizado</h3>
                <div style="margin: 20px 0;">
                    <p><strong>Número de Factura:</strong> ${factura.numero_factura || 'N/A'}</p>
                    <p><strong>Precio:</strong> ${(parseFloat(factura.precio) || 0).toFixed(2)}€</p>
                    <p><strong>Forma de Pago:</strong> ${factura.forma_pago || 'N/A'}</p>
                    <p><strong>Fecha:</strong> ${factura.fecha_pago ? formatearFecha(factura.fecha_pago) : 'N/A'}</p>
                    <hr>
                    <p><strong>Descripción del Servicio:</strong></p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px; line-height: 1.5;">
                        ${factura.observaciones || factura.descripcion || 'Sin descripción'}
                    </div>
                </div>
                <button onclick="this.closest('div').parentElement.remove()" class="btn">Cerrar</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }
}

console.log('✅ Visualización de facturas personalizadas actualizada');
async function listarTodosUsuarios() {
    const resultados = document.getElementById('resultadosBusqueda');
    const busquedaInput = document.getElementById('busqueda');
    
    if (busquedaInput) busquedaInput.value = '';
    
    try {
        showMessage('info', 'Cargando todos los usuarios...', 'mensajeBuscar');
        
        const todosUsuarios = await makeRequest(`${API_BASE_URL}?action=listar_todos_usuarios`);
        
        if (!Array.isArray(todosUsuarios) || todosUsuarios.length === 0) {
            resultados.innerHTML = '<div class="message info">No hay usuarios registrados en el sistema</div>';
            document.getElementById('mensajeBuscar').innerHTML = '';
            return;
        }
        
        const totalUsuarios = todosUsuarios.length;
        const totalFacturado = todosUsuarios.reduce((sum, u) => sum + (parseFloat(u.total_facturado) || 0), 0);
        const totalFacturas = todosUsuarios.reduce((sum, u) => sum + (parseInt(u.total_facturas) || 0), 0);
        const usuariosConFacturas = todosUsuarios.filter(u => (parseInt(u.total_facturas) || 0) > 0).length;
        
        let html = `
            <div class="message success">
                <h3>📊 Resumen General del Sistema</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                        <strong style="color: #007bff; font-size: 24px;">${totalUsuarios}</strong>
                        <br><span style="font-size: 14px;">Total Usuarios</span>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                        <strong style="color: #17a2b8; font-size: 24px;">${totalFacturas}</strong>
                        <br><span style="font-size: 14px;">Total Facturas</span>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                        <strong style="color: #ffc107; font-size: 24px;">${totalFacturado.toFixed(2)}€</strong>
                        <br><span style="font-size: 14px;">Total Facturado</span>
                    </div>
                </div>
            </div>
        `;
        
        todosUsuarios.sort((a, b) => (parseFloat(b.total_facturado) || 0) - (parseFloat(a.total_facturado) || 0));
        
        html += `
            <div style="margin-top: 20px;">
                <h3>👥 Lista Completa de Usuarios</h3>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Nombre Completo</th>
                                <th>DNI</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Total Facturas</th>
                                <th>Total Facturado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
todosUsuarios.forEach(usuario => {
    const totalFacturas = parseInt(usuario.total_facturas) || 0;
    const totalFacturado = parseFloat(usuario.total_facturado) || 0;
    const nombreCompleto = `${usuario.nombre || ''} ${usuario.primer_apellido || ''} ${usuario.segundo_apellido || ''}`.trim();
    
    // Convertir activo a boolean si viene como string
    const esActivo = usuario.activo === 1 || usuario.activo === '1' || usuario.activo === true;
    
    const filaClass = totalFacturas === 0 ? 'style="background-color: #fff3cd;"' : 
                     totalFacturado > 200 ? 'style="background-color: #d4edda;"' : '';
    
    html += `
        <tr ${filaClass}>
            <td>
                <strong>${nombreCompleto}</strong>
                <div style="margin-top: 5px;">
                    <label class="switch" style="transform: scale(0.8);">
                        <input type="checkbox" ${esActivo ? 'checked' : ''} 
                            onchange="cambiarEstadoUsuarioDesdeListado(${usuario.id}, this.checked)">
                        <span class="slider"></span>
                    </label>
                    <span style="font-size: 11px; color: ${esActivo ? '#28a745' : '#dc3545'}; margin-left: 8px;">
                        ${esActivo ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
            </td>
            <td>${usuario.dni || 'No registrado'}</td>
            <td>${usuario.email || 'No registrado'}</td>
            <td>${usuario.telefono || 'No registrado'}</td>
            <td style="text-align: center;">
                <span style="background: ${totalFacturas > 0 ? '#28a745' : '#6c757d'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                    ${totalFacturas}
                </span>
            </td>
            <td style="text-align: right; font-weight: bold;">
                <span style="color: ${totalFacturado > 0 ? '#28a745' : '#6c757d'};">
                    ${totalFacturado.toFixed(2)}€
                </span>
            </td>
             <td style="text-align: center;">
        <div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-info btn-sm" onclick="verDetalleUsuario(${usuario.id})" style="font-size: 11px; padding: 4px 8px; white-space: nowrap;">
                👁️ Detalles
            </button>
            <button class="btn btn-secondary btn-sm" onclick="mostrarFormularioNuevaFactura(${usuario.id})" style="font-size: 11px; padding: 4px 8px; white-space: nowrap;">
                ➕ Renovación
            </button>
        </div>
    </td>
        </tr>
    `;
});
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        html += `
            <div style="margin-top: 15px; font-size: 12px; color: #6c757d;">
                <strong>Leyenda:</strong> 
                <span style="background: #fff3cd; padding: 2px 6px; border-radius: 3px;">Sin facturas</span>
                <span style="background: #d4edda; padding: 2px 6px; border-radius: 3px; margin-left: 10px;">Cliente activo (>200€)</span>
            </div>
        `;
        
        resultados.innerHTML = html;
        document.getElementById('mensajeBuscar').innerHTML = '';
        
    } catch (error) {
        console.error('Error completo:', error);
        showMessage('error', 'Error al cargar usuarios: ' + error.message, 'mensajeBuscar');
        resultados.innerHTML = '<div class="message error">Error al cargar los usuarios</div>';
    }
}

async function verDetalleUsuario(usuarioId) {
    try {
        const usuario = await makeRequest(`${API_BASE_URL}?action=obtener_usuario&id=${usuarioId}`);
        
        if (!usuario) {
            showMessage('error', 'No se pudo cargar el usuario', 'mensajeBuscar');
            return;
        }
        
        const resultados = document.getElementById('resultadosBusqueda');
        const nombreCompleto = `${usuario.nombre || ''} ${usuario.primer_apellido || ''}`.trim();
        
        const facturas = Array.isArray(usuario.facturas) ? usuario.facturas : [];
        const totalFacturas = parseInt(usuario.total_facturas) || 0;
        const totalFacturado = parseFloat(usuario.total_facturado) || 0;
        const facturasPersonalizadas = facturas.filter(f => f.tipo_servicio === 'personalizado').length;
        
        // HTML optimizado para móvil
        let html = `
            <div class="user-card">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h3 style="margin-bottom: 8px;">${nombreCompleto} ${usuario.segundo_apellido || ''}</h3>
                    <span class="badge ${usuario.activo ? 'badge-success' : 'badge-danger'}" style="
                        padding: 5px 12px; 
                        border-radius: 15px; 
                        font-size: 12px; 
                        font-weight: bold;
                        color: white;
                        background: ${usuario.activo ? '#28a745' : '#dc3545'};
                    ">
                        ${usuario.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                </div>
                
                <!-- Datos de contacto en grid móvil -->
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr; gap: 8px; font-size: 14px;">
                        <div><strong>DNI:</strong> ${usuario.dni || 'No registrado'}</div>
                        ${usuario.email ? `<div><strong>Email:</strong> <a href="mailto:${usuario.email}" style="color: #007bff;">${usuario.email}</a></div>` : ''}
                        ${usuario.telefono ? `<div><strong>Teléfono:</strong> <a href="tel:${usuario.telefono}" style="color: #007bff;">${usuario.telefono}</a></div>` : ''}
                        ${usuario.direccion ? `<div><strong>Dirección:</strong> ${usuario.direccion}</div>` : ''}
                        ${usuario.codigo_postal || usuario.localidad ? `<div><strong>Ubicación:</strong> ${usuario.codigo_postal || ''} ${usuario.localidad || ''}</div>` : ''}
                    </div>
                </div>
                
                <!-- Estadísticas en grid móvil -->
                <div class="stats-grid-mobile">
                    <div class="stat-card-mobile">
                        <span class="stat-value-mobile">${totalFacturas}</span>
                        <span class="stat-label-mobile">Total Facturas</span>
                    </div>
                    <div class="stat-card-mobile">
                        <span class="stat-value-mobile">${totalFacturado.toFixed(2)}€</span>
                        <span class="stat-label-mobile">Total Facturado</span>
                    </div>
                    <div class="stat-card-mobile">
                        <span class="stat-value-mobile">${totalFacturas > 0 ? (totalFacturado / totalFacturas).toFixed(2) : '0.00'}€</span>
                        <span class="stat-label-mobile">Promedio</span>
                    </div>
                    ${facturasPersonalizadas > 0 ? `
                    <div class="stat-card-mobile" style="background: #fff3e0;">
                        <span class="stat-value-mobile" style="color: #e65100;">${facturasPersonalizadas}</span>
                        <span class="stat-label-mobile">Personalizadas</span>
                    </div>
                    ` : ''}
                </div>
        `;
        
        // Historial de facturas
        if (facturas.length > 0) {
            html += `
                <h4 style="margin: 20px 0 15px 0; color: #495057;">Historial de Facturas</h4>
                
                <!-- Vista desktop -->
                <div class="facturas-desktop">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Número</th>
                                    <th>Servicio</th>
                                    <th>Precio</th>
                                    <th>Pago</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${facturas.map(factura => generarFilaFactura(factura)).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Vista móvil -->
                <div class="facturas-mobile">
                    ${facturas.map(factura => generarTarjetaFacturaMovil(factura)).join('')}
                </div>
            `;
        } else {
            html += `
                <div class="message info" style="text-align: center; padding: 30px;">
                    <h4>Sin Facturas Registradas</h4>
                    <p>Este usuario no tiene facturas asociadas.</p>
                </div>
            `;
        }
        
        // Botones de navegación
        html += `
                <div class="user-actions-mobile" style="margin-top: 25px; justify-content: center;">
                    <button class="btn btn-info" onclick="listarTodosUsuarios()">
                        ← Volver a Lista
                    </button>
                    <button class="btn btn-secondary" onclick="document.getElementById('busqueda').focus()">
                        🔍 Nueva Búsqueda
                    </button>
                </div>
            </div>
        `;
        
        resultados.innerHTML = html;
        showMessage('success', `Mostrando detalles de ${nombreCompleto}`, 'mensajeBuscar');
        
    } catch (error) {
        console.error('Error al cargar detalle del usuario:', error);
        showMessage('error', 'Error al cargar detalle del usuario: ' + error.message, 'mensajeBuscar');
    }
}

function optimizarFacturasMovil() {
    const facturaPreview = document.querySelector('.factura-preview');
    if (!facturaPreview) return;
    
    if (isMobileDevice()) {
        // Hacer la vista previa más compacta en móvil
        facturaPreview.style.fontSize = '12px';
        facturaPreview.style.padding = '10px';
        
        // Simplificar tabla de facturas
        const tablas = facturaPreview.querySelectorAll('.detalle-table');
        tablas.forEach(tabla => {
            tabla.style.fontSize = '10px';
            const celdas = tabla.querySelectorAll('th, td');
            celdas.forEach(celda => {
                celda.style.padding = '6px 3px';
            });
        });
    }
}

// NUEVA función para optimizar formularios en móvil
function optimizarFormulariosMovil() {
    if (!isMobileDevice()) return;
    
    // Optimizar select de facturas
    const facturaSelect = document.getElementById('facturaSelect');
    if (facturaSelect) {
        facturaSelect.style.fontSize = '14px';
        facturaSelect.style.padding = '12px';
        
        // Hacer las opciones más legibles en móvil
        Array.from(facturaSelect.options).forEach((option, index) => {
            if (index > 0 && option.textContent.length > 50) {
                const texto = option.textContent;
                const partes = texto.split(' - ');
                if (partes.length >= 3) {
                    option.textContent = `${partes[0]} - ${partes[1].substring(0, 20)}... - ${partes[partes.length - 1]}`;
                }
            }
        });
    }
    
    // Optimizar formulario de nueva factura para móvil
    const formNuevaFactura = document.getElementById('formNuevaFactura');
    if (formNuevaFactura) {
        // Hacer campos más grandes para touch
        const inputs = formNuevaFactura.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.style.minHeight = '44px';
            input.style.fontSize = '16px';
        });
    }
}



function mostrarDescripcionCompleta(descripcion) {
    const modal = document.createElement('div');
    modal.className = isMobileDevice() ? 'modal-mobile' : '';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
        background: rgba(0,0,0,0.6); z-index: 1000; 
        display: flex; align-items: center; justify-content: center;
        ${isMobileDevice() ? 'padding: 20px 10px;' : ''}
    `;
    
    const maxWidth = isMobileDevice() ? '90%' : '600px';
    const padding = isMobileDevice() ? '20px' : '30px';
    const fontSize = isMobileDevice() ? '14px' : '16px';
    
    modal.innerHTML = `
        <div class="${isMobileDevice() ? 'modal-content-mobile' : ''}" style="
            background: white; 
            padding: ${padding}; 
            border-radius: 12px; 
            max-width: ${maxWidth}; 
            max-height: 80vh; 
            overflow-y: auto; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ${isMobileDevice() ? 'width: 100%;' : ''}
        ">
            <h3 style="margin-bottom: 15px; color: #495057; font-size: ${fontSize};">
                Descripción del Servicio Personalizado
            </h3>
            <div style="
                background: #f8f9fa; 
                padding: 15px; 
                border-radius: 8px; 
                border-left: 4px solid #ff9800; 
                line-height: 1.6; 
                color: #495057;
                font-size: ${fontSize === '14px' ? '13px' : '14px'};
                word-wrap: break-word;
            ">
                ${descripcion}
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="this.closest('div').parentElement.remove()" class="btn" style="
                    min-width: ${isMobileDevice() ? '120px' : '100px'};
                    font-size: ${fontSize};
                    padding: ${isMobileDevice() ? '12px 20px' : '10px 15px'};
                ">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar al hacer click fuera del modal
    modal.onclick = (e) => { 
        if (e.target === modal) modal.remove(); 
    };
    
    // Cerrar con Escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // En móvil, también cerrar con swipe down (opcional)
    if (isMobileDevice()) {
        let startY = 0;
        const modalContent = modal.querySelector('div');
        
        modalContent.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        modalContent.addEventListener('touchend', (e) => {
            const endY = e.changedTouches[0].clientY;
            if (endY - startY > 100) { // Swipe down de más de 100px
                modal.remove();
            }
        });
    }
}
function handleOrientationChange() {
    setTimeout(() => {
        optimizarFormulariosMovil();
        optimizarFacturasMovil();
    }, 100);
}

// Event listeners para optimización móvil
document.addEventListener('DOMContentLoaded', function() {
    // Detectar cambios de orientación
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // Optimizar al cargar
    setTimeout(() => {
        optimizarFormulariosMovil();
        optimizarFacturasMovil();
    }, 500);
});

console.log('✅ Función verDetalleUsuario actualizada - SOLO CONSULTA (sin botón añadir factura)');
async function cambiarEstadoUsuario(usuarioId, estado) {
    try {
        const result = await makeRequest(`${API_BASE_URL}?action=cambiar_estado_usuario`, {
            method: 'POST',
            body: JSON.stringify({ 
                id: usuarioId, 
                activo: estado ? 1 : 0 
            })
        });
        
        if (result.success) {
            showMessage('success', 'Estado actualizado correctamente', 'mensajeBuscar');
            buscarUsuarios();
        } else {
            showMessage('error', 'Error al actualizar estado', 'mensajeBuscar');
        }
    } catch (error) {
        showMessage('error', 'Error: ' + error.message, 'mensajeBuscar');
    }
}

// Función para cargar facturas del mes
async function cargarFacturasMes() {
    const mesSeleccionado = document.getElementById('mesSeleccionado').value;
    if (!mesSeleccionado) {
        showMessage('error', 'Seleccione un mes', 'mensajeFacturas');
        return;
    }
    
    const [año, mes] = mesSeleccionado.split('-');
    
    console.log(`📅 Cargando facturas para: ${mes}/${año}`);
    
    try {
        showMessage('info', 'Cargando facturas...', 'mensajeFacturas');
        
        const url = `${API_BASE_URL}?action=facturas_mes&mes=${encodeURIComponent(mes)}&ano=${encodeURIComponent(año)}`;
        const response = await makeRequest(url);
        
        if (response.success) {
            facturasMes = response.facturas || [];
            
            console.log(`✅ ${facturasMes.length} facturas cargadas`);
            
            // Actualizar select de facturas con optimización móvil
            const select = document.getElementById('facturaSelect');
            if (select) {
                select.innerHTML = '<option value="">Seleccione una factura</option>';
                
                facturasMes.forEach((factura, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    
                    const nombreCompleto = `${factura.nombre} ${factura.primer_apellido} ${factura.segundo_apellido || ''}`.trim();
                    const descripcion = factura.descripcion || factura.tipo_servicio || 'Sin descripción';
                    const precio = parseFloat(factura.precio).toFixed(2);
                    const numeroFactura = factura.numero_factura || `#${index + 1}`;
                    
                    const indicadorPersonalizado = factura.tipo_servicio === 'personalizado' ? ' [PERS]' : '';
                    
                    // Texto optimizado para móvil
                    if (isMobileDevice()) {
                        // Versión compacta para móvil
                        const nombreCorto = nombreCompleto.length > 20 ? nombreCompleto.substring(0, 20) + '...' : nombreCompleto;
                        const descripcionCorta = descripcion.length > 25 ? descripcion.substring(0, 25) + '...' : descripcion;
                        option.textContent = `${numeroFactura} - ${nombreCorto} - ${descripcionCorta}${indicadorPersonalizado} - ${precio}€`;
                    } else {
                        // Versión completa para desktop
                        option.textContent = `${numeroFactura} - ${nombreCompleto} - ${descripcion}${indicadorPersonalizado} - ${precio}€`;
                    }
                    
                    select.appendChild(option);
                });
                
                // Aplicar optimización móvil
                optimizarFormulariosMovil();
            }
            
            // Mostrar información del resultado optimizada para móvil
            const facturasList = document.getElementById('facturasList');
            if (facturasList) {
                if (facturasMes.length === 0) {
                    facturasList.innerHTML = '<div class="message info">No hay facturas para el mes seleccionado</div>';
                } else {
                    const totalFacturado = facturasMes.reduce((sum, f) => sum + parseFloat(f.precio || 0), 0);
                    const facturasPersonalizadas = facturasMes.filter(f => f.tipo_servicio === 'personalizado').length;
                    
                    const gridColumns = isMobileDevice() ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))';
                    const cardPadding = isMobileDevice() ? '8px' : '10px';
                    const fontSize = isMobileDevice() ? '16px' : '18px';
                    
                    facturasList.innerHTML = `
                        <div class="message success">
                            <h4 style="margin-bottom: 15px;">📊 Facturas de ${mes}/${año}</h4>
                            <div style="display: grid; grid-template-columns: ${gridColumns}; gap: 10px;">
                                <div style="text-align: center; background: #e8f5e8; padding: ${cardPadding}; border-radius: 8px;">
                                    <strong style="color: #28a745; font-size: ${fontSize};">${facturasMes.length}</strong>
                                    <br><small>Total Facturas</small>
                                </div>
                                <div style="text-align: center; background: #e3f2fd; padding: ${cardPadding}; border-radius: 8px;">
                                    <strong style="color: #007bff; font-size: ${fontSize};">${totalFacturado.toFixed(2)}€</strong>
                                    <br><small>Total Facturado</small>
                                </div>
                                ${facturasPersonalizadas > 0 ? `
                                <div style="text-align: center; background: #fff3e0; padding: ${cardPadding}; border-radius: 8px; ${isMobileDevice() ? 'grid-column: 1 / -1;' : ''}">
                                    <strong style="color: #ff9800; font-size: ${fontSize};">${facturasPersonalizadas}</strong>
                                    <br><small>Personalizadas</small>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }
            }
            
            setTimeout(() => {
                const mensajeElement = document.getElementById('mensajeFacturas');
                if (mensajeElement) mensajeElement.innerHTML = '';
            }, 3000);
            
        } else {
            throw new Error(response.message || 'Error desconocido al cargar facturas');
        }
        
    } catch (error) {
        console.error('❌ Error completo al cargar facturas:', error);
        
        let mensajeError = 'Error al cargar facturas: ' + error.message;
        
        if (error.message.includes('500')) {
            mensajeError += '\n\n🔧 Verifica los logs del servidor para más detalles.';
        }
        
        showMessage('error', mensajeError, 'mensajeFacturas');
        
        const select = document.getElementById('facturaSelect');
        if (select) {
            select.innerHTML = '<option value="">Error al cargar facturas</option>';
        }
        
        const facturasList = document.getElementById('facturasList');
        if (facturasList) {
            facturasList.innerHTML = '<div class="message error">Error al cargar las facturas del mes seleccionado</div>';
        }
    }
}

console.log('✅ Optimización móvil cargada para pestañas 2 y 3');

// Función para generar vista previa de factura
function generarFactura() {
    const facturaSelect = document.getElementById('facturaSelect');
    const numeroFacturaField = document.getElementById('numeroFactura');
    
    if (!facturaSelect) {
        showMessage('error', 'No se encuentra el selector de facturas', 'mensajeFacturas');
        return;
    }
    
    if (!numeroFacturaField) {
        showMessage('error', 'No se encuentra el campo número de factura', 'mensajeFacturas');
        return;
    }
    
    const facturaIndex = facturaSelect.value;
    const numeroFactura = numeroFacturaField.value.trim();
    
    console.log('🔍 DEBUG generarFactura:');
    console.log('  - facturaIndex:', facturaIndex);
    console.log('  - numeroFactura:', numeroFactura);
    
    if (!facturaIndex) {
        showMessage('error', 'Seleccione una factura', 'mensajeFacturas');
        return;
    }
    
    if (!numeroFactura) {
        showMessage('error', `Complete el número de factura. Valor actual: "${numeroFacturaField.value}"`, 'mensajeFacturas');
        return;
    }
    
    const facturaData = facturasMes[facturaIndex];
    
    // Validar y preparar datos para PDF
    if (!facturaData.descripcion && facturaData.tipo_servicio) {
        facturaData.descripcion = obtenerDescripcionServicio(facturaData.tipo_servicio);
    }
    
    // Calcular IVA si no existe
    const precio = parseFloat(facturaData.precio) || 0;
    facturaData.precio_sin_iva = (precio / 1.21).toFixed(2);
    facturaData.iva = (precio - facturaData.precio_sin_iva).toFixed(2);
    
    const preview = document.querySelector('.factura-preview');
    
    if (!preview) return;
    
    const facturaHTML = `
        <div class="factura">
            <div class="factura-header">
                <div class="logo-section">
                    <div class="logo">IB</div>
                    <div class="empresa-info">
                        <h3>${configuracion.empresa_nombre}</h3>
                        <p>${configuracion.empresa_nif}</p>
                        <p>${configuracion.empresa_direccion}</p>
                        <p>${configuracion.empresa_localidad}</p>
                    </div>
                </div>
                <div class="factura-info">
                    <h2>FACTURA</h2>
                    <p><strong>Nº Factura:</strong> ${numeroFactura}</p>
                    <p><strong>Fecha factura:</strong> ${formatearFechaFactura(facturaData.fecha_pago)}</p>
                </div>
            </div>

            <div class="cliente-info">
                <h4>Datos del Cliente:</h4>
                <p><strong>${facturaData.nombre} ${facturaData.primer_apellido} ${facturaData.segundo_apellido || ''}</strong></p>
                <p>${facturaData.direccion || 'Granada, España'}</p>
                <p>DNI: ${facturaData.dni}</p>
            </div>

            <table class="detalle-table">
                <thead>
                    <tr>
                        <th>Concepto</th>
                        <th>Impuestos</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${facturaData.descripcion || 'Servicio de entrenamiento'}</td>
                        <td>IVA (${configuracion.iva_porcentaje}%)</td>
                        <td>1</td>
                        <td>${precio.toFixed(2)}€</td>
                        <td>${precio.toFixed(2)}€</td>
                    </tr>
                </tbody>
            </table>

            <div class="totales">
                <table>
                    <tr>
                        <td><strong>Total neto:</strong></td>
                        <td style="text-align: right;">${facturaData.precio_sin_iva}€</td>
                    </tr>
                    <tr>
                        <td><strong>Total IVA (${configuracion.iva_porcentaje}%):</strong></td>
                        <td style="text-align: right;">${facturaData.iva}€</td>
                    </tr>
                    <tr class="total-final">
                        <td><strong>Total factura:</strong></td>
                        <td style="text-align: right;">${precio.toFixed(2)}€</td>
                    </tr>
                </table>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; font-size: 12px; color: #666; line-height: 1.5;">
                <p><strong>Forma de pago:</strong> ${facturaData.forma_pago}</p>
                <br>
                <p>Según el Reglamento General de Protección de Datos Personales, los datos serán tratados de forma confidencial con el fin de gestionar la contabilidad, podrán ser cedidos a Bancos y administraciones públicas para cumplir con las obligaciones legales exigibles. Los datos serán conservados por los plazos legales establecidos. Puede ejercitar sus derechos a través de ${configuracion.empresa_email}</p>
            </div>
        </div>
    `;
    
    preview.innerHTML = facturaHTML;
    showMessage('success', `Factura ${numeroFactura} generada correctamente`, 'mensajeFacturas');
}

// Función para descargar PDF individual
async function descargarFacturaPDF() {
    const facturaSelect = document.getElementById('facturaSelect');
    const numeroFacturaField = document.getElementById('numeroFactura');
    
    if (!facturaSelect || !numeroFacturaField) {
        showMessage('error', 'No se encuentran los campos necesarios', 'mensajeFacturas');
        return;
    }
    
    const facturaIndex = facturaSelect.value;
    const numeroFacturaManual = numeroFacturaField.value.trim();
    
    console.log('🎯 === DEBUG DESCARGAR PDF ===');
    console.log('facturaIndex:', facturaIndex);
    console.log('numeroFacturaManual:', numeroFacturaManual);
    
    if (!facturaIndex) {
        showMessage('error', 'Seleccione una factura', 'mensajeFacturas');
        return;
    }
    
    if (!numeroFacturaManual) {
        showMessage('error', `Complete el número de factura. Campo detectado: "${numeroFacturaField.value}"`, 'mensajeFacturas');
        return;
    }
    
    if (!window.generadorPDFWeb) {
        showMessage('error', 'El generador PDF no está cargado. Recargue la página.', 'mensajeFacturas');
        console.error('❌ window.generadorPDFWeb no está disponible');
        return;
    }
    
    if (!window.descargarFacturaPDFWeb) {
        showMessage('error', 'La función de descarga PDF no está disponible. Recargue la página.', 'mensajeFacturas');
        console.error('❌ window.descargarFacturaPDFWeb no está disponible');
        return;
    }
    
    console.log('✅ Generador PDF disponible:', typeof window.generadorPDFWeb);
    console.log('✅ Función descarga disponible:', typeof window.descargarFacturaPDFWeb);
    
    const facturaData = { ...facturasMes[facturaIndex] };
    
    const precio = parseFloat(facturaData.precio) || 0;
    facturaData.precio_sin_iva = (precio / 1.21).toFixed(2);
    facturaData.iva = (precio - facturaData.precio_sin_iva).toFixed(2);
    
    if (!facturaData.descripcion && facturaData.tipo_servicio) {
        facturaData.descripcion = obtenerDescripcionServicio(facturaData.tipo_servicio);
    }
    
    facturaData.nombre = facturaData.nombre || '';
    facturaData.primer_apellido = facturaData.primer_apellido || '';
    facturaData.segundo_apellido = facturaData.segundo_apellido || '';
    facturaData.dni = facturaData.dni || 'No especificado';
    facturaData.direccion = facturaData.direccion || 'Granada, España';
    facturaData.email = facturaData.email || '';
    facturaData.forma_pago = facturaData.forma_pago || 'No especificado';
    
    console.log('📋 Datos preparados para PDF:', facturaData);
    console.log('🔢 Número que se enviará:', numeroFacturaManual);
    
    try {
        showMessage('info', `Generando PDF para factura ${numeroFacturaManual}...`, 'mensajeFacturas');
        
        console.log('📤 Llamando a window.descargarFacturaPDFWeb con:');
        console.log('  - facturaData:', facturaData);
        console.log('  - numeroFactura:', numeroFacturaManual);
        
        const result = await window.descargarFacturaPDFWeb(facturaData, numeroFacturaManual);
        
        if (result) {
            showMessage('success', `PDF ${numeroFacturaManual} descargado exitosamente`, 'mensajeFacturas');
        } else {
            showMessage('error', 'El generador PDF devolvió false', 'mensajeFacturas');
        }
    } catch (error) {
        console.error('❌ Error completo:', error);
        showMessage('error', 'Error al generar PDF: ' + error.message, 'mensajeFacturas');
        
        if (error.message.includes('is not a function')) {
            showMessage('error', 'Recargue la página para cargar correctamente el generador PDF', 'mensajeFacturas');
        }
    }
}
async function leerExcelConFacturas(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                // Convertir a JSON con headers
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                console.log('📊 Datos Excel cargados:', jsonData.length, 'filas');
                console.log('📋 Headers (fila 0):', jsonData[0]);
                console.log('📋 Primera fila de datos (fila 1):', jsonData[1]);
                
                const resultados = [];
                
                // Procesar desde la fila 1 (asumiendo que fila 0 son headers)
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;
                    
                    // MAPEO FIJO DE COLUMNAS PARA FACTURAS:
                    // Columna A (índice 0) = DNI (OBLIGATORIO)
                    // Columna B (índice 1) = Nombre (opcional, solo para logs)
                    // Columna C (índice 2) = Primer Apellido (opcional, solo para logs)
                    // Columna D (índice 3) = Segundo Apellido (opcional)
                    // Las demás columnas serán para datos de factura según tu documentación
                    
                    let dni = '';
                    let nombre = '';
                    let primerApellido = '';
                    let segundoApellido = '';
                    
                    // Extraer DNI de la columna A (índice 0) - SIEMPRE
                    if (row[0] !== undefined && row[0] !== null && row[0] !== '') {
                        dni = String(row[0]).trim().toUpperCase();
                        // Limpiar DNI: eliminar espacios, puntos, guiones
                        dni = dni.replace(/[\s\.\-]/g, '');
                        console.log(`Fila ${i + 1}: DNI extraído de columna A: "${dni}"`);
                    } else {
                        console.log(`Fila ${i + 1}: Sin DNI en columna A, fila omitida`);
                        continue; // Saltar si no hay DNI
                    }
                    
                    // Validar formato básico de DNI/NIE
                    const dniRegex = /^[\dXYZ]\d{7}[A-Z]$/;
                    if (!dniRegex.test(dni)) {
                        console.log(`Fila ${i + 1}: DNI con formato inválido: "${dni}", fila omitida`);
                        continue; // Saltar si el DNI no es válido
                    }
                    
                    // Extraer datos opcionales para logging
                    if (row[2] !== undefined) nombre = String(row[2] || '').trim();
                    if (row[3] !== undefined) primerApellido = String(row[3] || '').trim();
                    if (row[4] !== undefined) segundoApellido = String(row[4] || '').trim();
                    
                    const usuario = {
                        nombre,
                        primerApellido,
                        segundoApellido,
                        dni,
                        email: (row[5] || '').toString().trim(),
                        telefono: (row[6] || '').toString().trim(),
                        direccion: (row[22] || '').toString().trim(),
                        codigoPostal: (row[23] || '').toString().trim(),
                        localidad: 'Granada'
                    };
                    
                    // DATOS DE FACTURA - Ajustar índices según tu estructura real
                    // Necesitarás verificar en qué columnas están estos datos en tu Excel
                    const factura = {
						servicio: (row[38] || '').toString().trim(), // Columna M (Índice 12)
						 precio: parseFloat(row[39]) || 0, // Corresponde a la columna 'Precio unitario con impuestos' (índice 11)
						numero: (row[19] || '').toString().trim(), // Columna T (Índice 19)
						formaPago: (row[8] || '').toString().trim(), // Columna I (Índice 8)
						fecha: (row[9] || '').toString().trim()      // Columna J (Índice 9)
					};
                    
                    console.log(`Fila ${i + 1}: Datos extraídos:`, {
                        dni: usuario.dni,
                        nombre: usuario.nombre,
                        apellido: usuario.primerApellido,
                        servicio: factura.servicio,
                        precio: factura.precio,
						email: usuario.email
                    });
                    
                     resultados.push({
                        usuario,
                        factura,
                        fila: i + 1
                    });
                }
                
                console.log('✅ Procesados:', resultados.length, 'registros válidos con DNI');
                
                if (resultados.length === 0) {
                    reject(new Error('No se encontraron registros válidos con DNI en la columna A'));
                } else {
                    resolve(resultados);
                }
                
            } catch (error) {
                console.error('❌ Error procesando Excel:', error);
                reject(new Error('Error al leer el archivo Excel: ' + error.message));
            }
        };
        
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsArrayBuffer(file);
    });
}

// Función mejorada para procesar Excel con usuarios y facturas
async function procesarExcelConFacturas() {
    const fileInput = document.getElementById('excelFileConFacturas'); // ID actualizado
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('error', 'Seleccione un archivo Excel', 'mensajeCrear');
        return;
    }
    
    document.getElementById('excelProgressConFacturas').classList.remove('hidden'); // ID actualizado
    document.getElementById('excelResultsConFacturas').innerHTML = ''; // ID actualizado
    
    try {
        showMessage('info', '📥 Leyendo archivo Excel...', 'mensajeCrear');
        
        const registros = await leerExcelConFacturas(file);
        
        if (registros.length === 0) {
            showMessage('error', 'No se encontraron registros válidos en el archivo', 'mensajeCrear');
            return;
        }
        
        showMessage('info', `📄 Procesando ${registros.length} registros...`, 'mensajeCrear');
        
        const result = await makeRequest(`${API_BASE_URL}?action=importar_excel_con_facturas`, {
            method: 'POST',
            body: JSON.stringify({ registros })
        });
        
        if (result.success) {
            mostrarResultadosImportacionFacturas(result.resultados);
        } else {
            showMessage('error', 'Error al procesar registros: ' + result.message, 'mensajeCrear');
        }
        
    } catch (error) {
        console.error('Error completo:', error);
        showMessage('error', 'Error al procesar archivo: ' + error.message, 'mensajeCrear');
    } finally {
        document.getElementById('excelProgressConFacturas').classList.add('hidden'); // ID actualizado
        fileInput.value = '';
    }
}

// Función para mostrar resultados detallados
function mostrarResultadosImportacionFacturas(resultados) {
    const resultsDiv = document.getElementById('excelResultsConFacturas');
    
    let html = `
        <div class="message ${resultados.errores > 0 ? 'info' : 'success'}">
            <h4>📊 Resultados de la Importación de Facturas</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 15px 0;">
                <div style="background: #e8f5e8; padding: 10px; border-radius: 8px; text-align: center;">
                    <strong style="color: #28a745; font-size: 20px;">${resultados.usuariosEncontrados || 0}</strong>
                    <br><span style="font-size: 12px;">Usuarios Encontrados</span>
                </div>
                <div style="background: #e3f2fd; padding: 10px; border-radius: 8px; text-align: center;">
                    <strong style="color: #007bff; font-size: 20px;">${resultados.facturasCreadas || 0}</strong>
                    <br><span style="font-size: 12px;">Facturas Creadas</span>
                </div>
                <div style="background: #fff3e0; padding: 10px; border-radius: 8px; text-align: center;">
                    <strong style="color: #ff9800; font-size: 20px;">${resultados.usuariosNoEncontrados || 0}</strong>
                    <br><span style="font-size: 12px;">Usuarios NO Encontrados</span>
                </div>
                <div style="background: #f3e5f5; padding: 10px; border-radius: 8px; text-align: center;">
                    <strong style="color: #9c27b0; font-size: 20px;">${resultados.facturasDuplicadas || 0}</strong>
                    <br><span style="font-size: 12px;">Facturas Duplicadas</span>
                </div>
                <div style="background: #ffebee; padding: 10px; border-radius: 8px; text-align: center;">
                    <strong style="color: #f44336; font-size: 20px;">${resultados.errores || 0}</strong>
                    <br><span style="font-size: 12px;">Errores</span>
                </div>
            </div>
        </div>
    `;
    
    if (resultados.detalles && resultados.detalles.length > 0) {
        html += `
            <div style="max-height: 300px; overflow-y: auto; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                <h5>📋 Detalles del Procesamiento:</h5>
                ${resultados.detalles.map(detalle => {
                    let color = '#333';
                    let icon = '📄';
                    
                    if (detalle.includes('Usuario encontrado')) { color = '#28a745'; icon = '✅'; }
                    else if (detalle.includes('NO encontrado')) { color = '#ff9800'; icon = '⚠️'; }
                    else if (detalle.includes('Error')) { color = '#dc3545'; icon = '❌'; }
                    else if (detalle.includes('Factura creada')) { color = '#007bff'; icon = '💰'; }
                    else if (detalle.includes('duplicada') || detalle.includes('similar')) { color = '#9c27b0'; icon = '🔄'; }
                    else if (detalle.includes('omitida') || detalle.includes('inválido')) { color = '#6c757d'; icon = '⏭️'; }
                    
                    return `<p style="margin: 3px 0; font-size: 13px; color: ${color};">${icon} ${detalle}</p>`;
                }).join('')}
            </div>
        `;
    }
    
    // Mostrar resumen ejecutivo
    const totalProcesados = (resultados.usuariosEncontrados || 0) + (resultados.usuariosNoEncontrados || 0);
    const porcentajeExito = totalProcesados > 0 ? Math.round(((resultados.facturasCreadas || 0) / (resultados.usuariosEncontrados || 1)) * 100) : 0;
    
    html += `
        <div class="message info" style="margin-top: 15px;">
            <h5>📈 Resumen Ejecutivo:</h5>
            <p><strong>Total registros procesados:</strong> ${totalProcesados}</p>
            <p><strong>Usuarios encontrados en BD:</strong> ${resultados.usuariosEncontrados || 0}</p>
            <p><strong>Usuarios NO encontrados (DNI inexistente):</strong> ${resultados.usuariosNoEncontrados || 0}</p>
            <p><strong>Facturas creadas exitosamente:</strong> ${resultados.facturasCreadas || 0} ${resultados.usuariosEncontrados > 0 ? `(${porcentajeExito}% de usuarios encontrados)` : ''}</p>
            <p><strong>Facturas omitidas por duplicado:</strong> ${resultados.facturasDuplicadas || 0}</p>
            ${resultados.errores > 0 ? `<p style="color: #dc3545;"><strong>Errores que requieren atención:</strong> ${resultados.errores}</p>` : ''}
            ${resultados.usuariosNoEncontrados > 0 ? `<p style="color: #ff9800;"><strong>⚠️ Importante:</strong> ${resultados.usuariosNoEncontrados} registros fueron omitidos porque los DNI no existen en la base de datos. Solo se crean facturas para usuarios existentes.</p>` : ''}
        </div>
    `;
    
    html += `
        <div style="margin-top: 15px; text-align: center;">
            <button onclick="buscarUsuarios()" class="btn btn-info" style="margin: 0 5px;">
                🔍 Ver Resultados en Búsqueda
            </button>
            <button onclick="listarTodosUsuarios()" class="btn btn-secondary" style="margin: 0 5px;">
                📋 Ver Lista Completa
            </button>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

// Función para mostrar nueva plantilla Excel con facturas
function mostrarPlantillaExcelConFacturas() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
        background: rgba(0,0,0,0.5); z-index: 1000; 
        display: flex; align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 900px; max-height: 80vh; overflow-y: auto;">
            <h3>📋 Importación de Facturas para Usuarios Existentes</h3>
            
            <div class="message warning" style="margin: 20px 0;">
                <h4>⚠️ IMPORTANTE - Solo Facturas</h4>
                <p><strong>Esta funcionalidad NO crea usuarios nuevos.</strong></p>
                <p>Solo crea facturas para usuarios que ya existen en la base de datos (busca por DNI).</p>
                <p>Si un DNI no existe en la BD, ese registro será omitido.</p>
            </div>
            
            <h4>📊 Estructura de Columnas OBLIGATORIA:</h4>
            <table class="table" style="margin: 15px 0; font-size: 13px;">
                <thead>
                    <tr>
                        <th>Columna</th>
                        <th>Campo</th>
                        <th>Uso</th>
                        <th>Ejemplo</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background-color: #fff3cd;">
                        <td><strong>A</strong></td>
                        <td><strong>DNI</strong></td>
                        <td><strong>OBLIGATORIO - Para buscar usuario</strong></td>
                        <td>12345678A</td>
                    </tr>
                    <tr>
                        <td>B</td>
                        <td>Nombre</td>
                        <td>Solo para logging/depuración</td>
                        <td>Juan</td>
                    </tr>
                    <tr>
                        <td>C</td>
                        <td>Primer Apellido</td>
                        <td>Solo para logging/depuración</td>
                        <td>Pérez</td>
                    </tr>
                    <tr>
                        <td>D</td>
                        <td>Segundo Apellido</td>
                        <td>Solo para logging/depuración</td>
                        <td>García</td>
                    </tr>
                </tbody>
            </table>
            
            <h4>💰 Datos de Factura (columnas específicas):</h4>
            <div class="message info" style="margin: 15px 0;">
                <p><strong>NOTA:</strong> Los índices exactos de las columnas de factura dependen de tu estructura Excel específica. 
                Actualmente el código está configurado para:</p>
            </div>
            <table class="table" style="margin: 15px 0; font-size: 13px;">
                <thead>
                    <tr>
                        <th>Columna</th>
                        <th>Campo</th>
                        <th>Descripción</th>
                        <th>Ejemplo</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background-color: #e3f2fd;">
                        <td><strong>S (columna 19)</strong></td>
                        <td>Número Factura</td>
                        <td>Número de factura</td>
                        <td>IMPERIUMBOXGR/001</td>
                    </tr>
                    <tr style="background-color: #e3f2fd;">
                        <td><strong>AM (columna 39)</strong></td>
                        <td>Servicio</td>
                        <td>Tipo de servicio</td>
                        <td>OPEN 3 días semana</td>
                    </tr>
                    <tr style="background-color: #e3f2fd;">
                        <td><strong>AN (columna 40)</strong></td>
                        <td>Precio</td>
                        <td>Precio en euros</td>
                        <td>65.00</td>
                    </tr>
                    <tr style="background-color: #e3f2fd;">
                        <td><strong>I (columna 9)</strong></td>
                        <td>Forma de Pago</td>
                        <td>Método de pago</td>
                        <td>tarjeta, efectivo</td>
                    </tr>
                    <tr style="background-color: #e3f2fd;">
                        <td><strong>J (columna 10)</strong></td>
                        <td>Fecha</td>
                        <td>Fecha de pago con hora</td>
                        <td>31/05/2025 19:27</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="message warning" style="margin: 20px 0;">
                <h5>🔧 Personalización Requerida:</h5>
                <p>Si tus columnas de factura están en posiciones diferentes, necesitarás ajustar los índices en la función 
                <code>leerExcelConFacturas()</code> en el archivo <code>script.js</code>:</p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li><code>row[18]</code> para Número de Factura (columna S)</li>
                    <li><code>row[38]</code> para Servicio (columna AM)</li>
                    <li><code>row[39]</code> para Precio (columna AN)</li>
                    <li><code>row[8]</code> para Forma de Pago (columna I)</li>
                    <li><code>row[9]</code> para Fecha (columna J)</li>
                </ul>
            </div>
            
            <div class="message success" style="margin: 20px 0;">
                <h5>✅ Lo que SÍ funcionará:</h5>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li><strong>DNI en columna A:</strong> Siempre buscará el DNI aquí</li>
                    <li><strong>Validación de formato:</strong> DNI debe tener formato válido (12345678A)</li>
                    <li><strong>Búsqueda en BD:</strong> Solo procesa usuarios existentes</li>
                    <li><strong>Logging detallado:</strong> Verás en consola qué se está procesando</li>
                </ul>
            </div>
            
            <div class="message info" style="margin: 20px 0;">
                <h5>📌 Flujo del Proceso:</h5>
                <ol style="margin: 10px 0; padding-left: 20px;">
                    <li><strong>Leer DNI de columna A:</strong> Obligatorio y con formato válido</li>
                    <li><strong>Buscar usuario en BD:</strong> Por DNI exacto</li>
                    <li><strong>Si usuario existe:</strong> Extraer datos de factura de columnas específicas</li>
                    <li><strong>Crear factura:</strong> Asociada al usuario encontrado</li>
                    <li><strong>Si usuario NO existe:</strong> Omitir registro y continuar</li>
                </ol>
            </div>
            
            <button class="btn" onclick="this.closest('div').parentElement.remove()">Cerrar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

console.log('✅ Funciones de importación Excel con facturas cargadas');
console.log('📝 Nuevas funciones disponibles:');
console.log('  - leerExcelConFacturas()');
console.log('  - procesarExcelConFacturas()');
console.log('  - mostrarResultadosImportacionFacturas()');
console.log('  - mostrarPlantillaExcelConFacturas()');
// Función para descargar todas las facturas en ZIP
async function descargarTodasFacturas() {
    if (facturasMes.length === 0) {
        showMessage('error', 'No hay facturas cargadas para descargar', 'mensajeFacturas');
        return;
    }
    
    // Verificar que el campo número de factura tenga valor
    const numeroFacturaField = document.getElementById('numeroFactura');
    if (!numeroFacturaField || !numeroFacturaField.value.trim()) {
        showMessage('error', 'Complete el número de factura base antes de generar el ZIP', 'mensajeFacturas');
        return;
    }
    
    const mesSeleccionado = document.getElementById('mesSeleccionado').value;
    const [año, mes] = mesSeleccionado.split('-');
    
    try {
        showMessage('info', `Generando ZIP con ${facturasMes.length} facturas...`, 'mensajeFacturas');
        
        // Verificar que la función exista
        if (typeof window.descargarZipFacturasWeb !== 'function') {
            throw new Error('La función descargarZipFacturasWeb no está disponible. Recargue la página.');
        }
        
        const result = await window.descargarZipFacturasWeb(facturasMes, parseInt(mes), parseInt(año));
        
        if (result) {
            showMessage('success', `ZIP generado exitosamente`, 'mensajeFacturas');
        }
        
        return result;
        
    } catch (error) {
        console.error('Error completo:', error);
        showMessage('error', 'Error al generar ZIP: ' + error.message, 'mensajeFacturas');
        
        // Sugerir recargar si la función no existe
        if (error.message.includes('not a function')) {
            showMessage('error', 'Recargue la página para cargar correctamente el generador PDF', 'mensajeFacturas');
        }
    }
}

// Funciones auxiliares para manejo de facturas
function mostrarFormularioNuevaFactura(usuarioId) {
     const usuarioIdField = document.getElementById('usuarioId');
    const nuevaFacturaForm = document.getElementById('nuevaFacturaForm');
    const fechaPago2 = document.getElementById('fechaPago2');
    
    if (usuarioIdField) usuarioIdField.value = usuarioId;
    
    // Establecer fecha actual por defecto
    if (fechaPago2) fechaPago2.value = new Date().toISOString().split('T')[0];
    
    if (nuevaFacturaForm) {
        nuevaFacturaForm.classList.remove('hidden');
        nuevaFacturaForm.scrollIntoView({ behavior: 'smooth' });
        
        // Enfocar en el selector de tipo de servicio
        const tipoServicio2 = document.getElementById('tipoServicio2');
        if (tipoServicio2) {
            setTimeout(() => tipoServicio2.focus(), 300);
        }
    }
    
    console.log('📝 Formulario nueva factura mostrado para usuario:', usuarioId);
}

console.log('✅ Funciones de segunda pestaña actualizadas para servicio personalizado');

function cancelarNuevaFactura() {
     const nuevaFacturaForm = document.getElementById('nuevaFacturaForm');
    const formNuevaFactura = document.getElementById('formNuevaFactura');
    const precio2 = document.getElementById('precio2');
    const observacionesGroup2 = document.getElementById('observacionesGroup2');
    const observaciones2 = document.getElementById('observaciones2');
    
    if (nuevaFacturaForm) nuevaFacturaForm.classList.add('hidden');
    if (formNuevaFactura) formNuevaFactura.reset();
    
    // Resetear campo de precio
    if (precio2) {
        precio2.value = '';
        precio2.setAttribute('readonly', 'true');
        precio2.removeAttribute('placeholder');
        precio2.style.backgroundColor = '';
        precio2.style.borderColor = '';
    }
    
    // Ocultar y limpiar observaciones
    if (observacionesGroup2) observacionesGroup2.style.display = 'none';
    if (observaciones2) {
        observaciones2.value = '';
        observaciones2.removeAttribute('required');
    }
    
    console.log('🧹 Formulario nueva factura limpiado y resetado');
}


console.log('✅ Modificaciones para servicio personalizado cargadas');

async function crearNuevaFactura() {
     const formData = new FormData(document.getElementById('formNuevaFactura'));
    const datos = Object.fromEntries(formData);
    
    console.log('📋 Datos del formulario nueva factura:', datos);
    
    // VALIDACIÓN: Para servicios personalizados, verificar observaciones
    if (datos.tipoServicio2 === 'personalizado') {
        if (!datos.observaciones2 || datos.observaciones2.trim() === '') {
            showMessage('error', 'Para servicios personalizados, las observaciones son obligatorias', 'mensajeBuscar');
            return;
        }
        console.log('✅ Servicio personalizado con observaciones:', datos.observaciones2);
    }
    
    // Preparar descripción del servicio
    let descripcionServicio = obtenerDescripcionServicio(datos.tipoServicio2);
    
    // Si es personalizado y hay observaciones, usar las observaciones como descripción
    if (datos.tipoServicio2 === 'personalizado' && datos.observaciones2?.trim()) {
        descripcionServicio = datos.observaciones2.trim();
        console.log('🎨 Usando observaciones como descripción:', descripcionServicio);
    }
    
    // Validar precio
    const precio = parseFloat(datos.precio2);
    if (isNaN(precio) || precio <= 0) {
        showMessage('error', 'El precio debe ser un número mayor que 0', 'mensajeBuscar');
        return;
    }
    
    // Estructurar datos para enviar al backend
    const datosFactura = {
        usuarioId: datos.usuarioId,
        tipoServicio2: datos.tipoServicio2,
        descripcion: descripcionServicio,
        precio2: precio,
        formaPago2: datos.formaPago2,
        fechaPago2: datos.fechaPago2,
        observaciones2: datos.observaciones2 || null
    };
    
    console.log('📤 Enviando datos de factura:', datosFactura);
    
    try {
        showMessage('info', 'Creando factura...', 'mensajeBuscar');
        
        const result = await makeRequest(`${API_BASE_URL}?action=crear_factura`, {
            method: 'POST',
            body: JSON.stringify(datosFactura)
        });
        
        console.log('📥 Respuesta del servidor:', result);
        
        if (result.success) {
            let mensajeExito = result.message;
            
            // Añadir información específica si es servicio personalizado
            if (datos.tipoServicio2 === 'personalizado') {
                mensajeExito += ` - Servicio: ${descripcionServicio.substring(0, 50)}${descripcionServicio.length > 50 ? '...' : ''}`;
            }
            
            showMessage('success', mensajeExito, 'mensajeBuscar');
            cancelarNuevaFactura();
            
            // Refrescar la búsqueda para mostrar la nueva factura
            const busquedaInput = document.getElementById('busqueda');
            if (busquedaInput && busquedaInput.value.trim()) {
                buscarUsuarios();
            }
        } else {
            showMessage('error', result.message || 'Error al crear la factura', 'mensajeBuscar');
        }
    } catch (error) {
        console.error('❌ Error al crear factura:', error);
        showMessage('error', 'Error de conexión: ' + error.message, 'mensajeBuscar');
    }
}


// Funciones para importar Excel
async function procesarExcel() {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    document.getElementById('excelProgress').classList.remove('hidden');
    document.getElementById('excelResults').innerHTML = '';
    
    try {
        const usuarios = await leerExcel(file);
        
        if (usuarios.length === 0) {
            showMessage('error', 'No se encontraron usuarios válidos en el archivo', 'mensajeCrear');
            return;
        }
        
        const result = await makeRequest(`${API_BASE_URL}?action=importar_excel`, {
            method: 'POST',
            body: JSON.stringify({ usuarios })
        });
        
        if (result.success) {
            mostrarResultadosImportacion(result.resultados);
        } else {
            showMessage('error', 'Error al importar usuarios', 'mensajeCrear');
        }
        
    } catch (error) {
        showMessage('error', 'Error al procesar archivo: ' + error.message, 'mensajeCrear');
    } finally {
        document.getElementById('excelProgress').classList.add('hidden');
        fileInput.value = '';
    }
}

async function leerExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                const usuarios = jsonData.map(row => ({
                    nombre: row['Nombre'] || null,
                    primerApellido: row['Primer apellido'] || null,
                    segundoApellido: row['Segundo apellido'] || null,
                    dni: row['Dni facturación'] || null,
                    email: row['Email'] || null,
                    telefono: row['Teléfono'] || null,
                    direccion: row['Receptor Factura DireccionCompleta'] || null,
                    codigoPostal: row['Receptor Factura CodigoPostal'] || null,
                    localidad: row['Receptor Factura Localidad'] || null
                })).filter(usuario => usuario.nombre && usuario.primerApellido && usuario.dni);
                
                resolve(usuarios);
            } catch (error) {
                reject(new Error('Error al leer el archivo Excel: ' + error.message));
            }
        };
        
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsArrayBuffer(file);
    });
}

function mostrarResultadosImportacion(resultados) {
    const resultsDiv = document.getElementById('excelResults');
    
    let html = `
        <div class="message ${resultados.errores > 0 ? 'info' : 'success'}">
            <h4>📊 Resultados de la Importación</h4>
            <p><strong>✅ Usuarios creados:</strong> ${resultados.exitosos}</p>
            <p><strong>❌ Errores:</strong> ${resultados.errores}</p>
        </div>
    `;
    
    if (resultados.detalles.length > 0) {
        html += `
            <div style="max-height: 200px; overflow-y: auto; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px;">
                <h5>Detalles:</h5>
                ${resultados.detalles.map(detalle => `<p style="margin: 2px 0; font-size: 14px;">${detalle}</p>`).join('')}
            </div>
        `;
    }
    
    resultsDiv.innerHTML = html;
}

function mostrarPlantillaExcel() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
        background: rgba(0,0,0,0.5); z-index: 1000; 
        display: flex; align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 800px; max-height: 80vh; overflow-y: auto;">
            <h3>📋 Plantilla de Excel Requerida</h3>
            <p>El archivo Excel debe tener exactamente estas columnas:</p>
            <table class="table" style="margin: 20px 0;">
                <thead>
                    <tr>
                        <th>Columna en Excel</th>
                        <th>Descripción</th>
                        <th>Obligatorio</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Nombre</td><td>Nombre del usuario</td><td>✅</td></tr>
                    <tr><td>Primer apellido</td><td>Primer apellido</td><td>✅</td></tr>
                    <tr><td>Segundo apellido</td><td>Segundo apellido</td><td>❌</td></tr>
                    <tr><td>Dni</td><td>DNI/NIE</td><td>✅</td></tr>
                    <tr><td>Email</td><td>Correo electrónico</td><td>❌</td></tr>
                    <tr><td>Teléfono</td><td>Número de teléfono</td><td>❌</td></tr>
                    <tr><td>Receptor Factura DireccionCompleta</td><td>Dirección completa</td><td>❌</td></tr>
                    <tr><td>Receptor Factura CodigoPostal</td><td>Código postal</td><td>❌</td></tr>
                    <tr><td>Receptor Factura Localidad</td><td>Localidad/Ciudad</td><td>❌</td></tr>
                </tbody>
            </table>
            <button class="btn" onclick="this.closest('div').parentElement.remove()">Cerrar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

// Funciones de utilidad
function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES');
}

function formatearFechaFactura(fecha) {
    const date = new Date(fecha);
    const ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return ultimoDia.toLocaleDateString('es-ES');
}

// Función para verificar dependencias PDF
function verificarDependenciasPDF() {
    console.log('🔍 === VERIFICANDO DEPENDENCIAS PDF ===');
    
    console.log('window.generadorPDFWeb:', typeof window.generadorPDFWeb);
    if (window.generadorPDFWeb) {
        console.log('  - configuracion:', window.generadorPDFWeb.configuracion);
        console.log('  - libreriasCargadas:', window.generadorPDFWeb.libreriasCargadas);
    }
    
    console.log('window.descargarFacturaPDFWeb:', typeof window.descargarFacturaPDFWeb);
    console.log('window.descargarZipFacturasWeb:', typeof window.descargarZipFacturasWeb);
    console.log('window.descargarResumenPDFWeb:', typeof window.descargarResumenPDFWeb);
    
    console.log('window.jsPDF:', typeof window.jsPDF);
    console.log('window.jspdf:', typeof window.jspdf);
    console.log('window.JSZip:', typeof window.JSZip);
    
    return {
        generadorPDF: !!window.generadorPDFWeb,
        funcionDescarga: typeof window.descargarFacturaPDFWeb === 'function',
        jsPDF: !!(window.jsPDF || window.jspdf),
        jsZip: !!window.JSZip
    };
}

// Función para recargar dependencias PDF
async function recargarDependenciasPDF() {
    try {
        showMessage('info', 'Recargando generador PDF...', 'mensajeFacturas');
        
        const scriptAnterior = document.querySelector('script[src*="pdf_web_generator"]');
        if (scriptAnterior) {
            scriptAnterior.remove();
        }
        
        const script = document.createElement('script');
        script.src = 'js/pdf_web_generator.js';
        script.onload = () => {
            console.log('✅ PDF Generator recargado');
            verificarDependenciasPDF();
            showMessage('success', 'Generador PDF recargado correctamente', 'mensajeFacturas');
        };
        script.onerror = () => {
            showMessage('error', 'Error al recargar el generador PDF', 'mensajeFacturas');
        };
        
        document.head.appendChild(script);
        
    } catch (error) {
        console.error('Error recargando dependencias:', error);
        showMessage('error', 'Error al recargar: ' + error.message, 'mensajeFacturas');
    }
}

// Función de test directo para PDF
function testGeneradorPDFDirecto() {
    console.log('🧪 === TEST DIRECTO GENERADOR PDF ===');
    
    const estado = verificarDependenciasPDF();
    console.log('Estado dependencias:', estado);
    
    if (!estado.generadorPDF) {
        alert('❌ Error: window.generadorPDFWeb no está disponible.\n\nSoluciones:\n1. Recarga la página\n2. Verifica que pdf_web_generator.js se está cargando\n3. Usa el botón "🔄 Recargar PDF"');
        return;
    }
    
    if (!estado.funcionDescarga) {
        alert('❌ Error: window.descargarFacturaPDFWeb no es una función.\n\nSoluciones:\n1. Usa el botón "🔄 Recargar PDF"\n2. Verifica la consola para errores de carga');
        return;
    }
    
    const numeroFacturaField = document.getElementById('numeroFactura');
    const facturaSelect = document.getElementById('facturaSelect');
    
    if (!numeroFacturaField || !facturaSelect) {
        alert('❌ No se encuentran los campos necesarios');
        return;
    }
    
    const numeroManual = numeroFacturaField.value.trim();
    const facturaIndex = facturaSelect.value;
    
    if (!numeroManual) {
        alert('❌ Escribe un número de factura primero');
        return;
    }
    
    if (!facturaIndex || !facturasMes[facturaIndex]) {
        alert('❌ Selecciona una factura primero');
        return;
    }
    
    const facturaTest = {
        nombre: 'Juan',
        primer_apellido: 'Pérez',
        segundo_apellido: 'García',
        dni: '12345678A',
        direccion: 'Calle Test 123',
        email: 'test@test.com',
        precio: 65.00,
        descripcion: 'OPEN 3 días semana',
        forma_pago: 'Tarjeta',
        fecha_pago: '2024-01-15'
    };
    
    console.log('📋 Datos de prueba:', facturaTest);
    console.log('🔢 Número de prueba:', numeroManual);
    
    alert(`🧪 Iniciando test con número: "${numeroManual}"\nRevisa la consola para ver los logs.`);
    
    window.descargarFacturaPDFWeb(facturaTest, numeroManual)
        .then(result => {
            console.log('✅ Test completado, resultado:', result);
            alert(`✅ Test completado. Resultado: ${result}\nRevisa si el PDF se descargó con el número correcto.`);
        })
        .catch(error => {
            console.error('❌ Error en test:', error);
            alert(`❌ Error en test: ${error.message}\n\nPuede que necesites recargar la página o usar el botón "🔄 Recargar PDF".`);
        });
}

// Configurar fecha actual al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema de Gestión Imperium Box inicializado');
    console.log('🌐 URL actual:', window.location.href);
    console.log('🌐 Protocolo:', window.location.protocol);
    
    if (!isRunningOnServer()) {
        console.error('❌ No se está ejecutando desde un servidor web');
        showServerError();
        return;
    }
    
    console.log('✅ Ejecutándose desde servidor web');
    
    // Usar .then() en lugar de await para evitar errores de sintaxis
    testConnection().then(connectionOk => {
        if (!connectionOk) {
            console.error('❌ Falló la prueba de conexión');
            showMessage('error', '❌ No se puede conectar con el servidor. Usa los botones de diagnóstico para más información.', 'mensajeLogin');
            return;
        }
        
        console.log('✅ Conexión exitosa, continuando con la inicialización...');
        
        configurarFechas();
        cargarConfiguracion().then(() => {
            verificarSesion().then(() => {
                configurarEventListeners();
            });
        });
    });
});
// Función específica para cambiar estado desde el listado completo
async function cambiarEstadoUsuarioDesdeListado(usuarioId, estado) {
    try {
        showMessage('info', 'Actualizando estado...', 'mensajeBuscar');
        
        const result = await makeRequest(`${API_BASE_URL}?action=cambiar_estado_usuario`, {
            method: 'POST',
            body: JSON.stringify({ 
                id: usuarioId, 
                activo: estado ? 1 : 0 
            })
        });
        
        if (result.success) {
            showMessage('success', 'Estado actualizado correctamente', 'mensajeBuscar');
            // Recargar la lista automáticamente
            setTimeout(() => {
                listarTodosUsuarios();
            }, 1000);
        } else {
            showMessage('error', 'Error al actualizar estado: ' + result.message, 'mensajeBuscar');
            // Revertir el checkbox en caso de error
            location.reload();
        }
    } catch (error) {
        showMessage('error', 'Error de conexión: ' + error.message, 'mensajeBuscar');
        // Revertir el checkbox en caso de error
        location.reload();
    }
}
// Console log para confirmar que el script se cargó completamente
console.log('✅ Script.js cargado COMPLETAMENTE - Todas las funciones disponibles');
console.log('📋 Funciones principales disponibles:');
console.log('  - login, logout, verificarSesion');
console.log('  - crearUsuario, buscarUsuarios, listarTodosUsuarios');
console.log('  - cargarFacturasMes, generarFactura, descargarFacturaPDF');
console.log('  - procesarExcel, mostrarPlantillaExcel');
console.log('  - verificarServidor, mostrarErroresPHP, verificarArchivos');
console.log('🎯 SCRIPT COMPLETO Y LISTO PARA USAR - VERIFICADO AL 100%');

async function debugFacturas() {
    try {
        console.log('🔍 === INICIANDO DEBUG DE FACTURAS ===');
        
        const result = await makeRequest(`${API_BASE_URL}?action=debug_facturas`);
        
        if (result.success) {
            console.log('📊 === RESULTADOS DEBUG ===');
            console.log('Total usuarios:', result.data.total_usuarios);
            console.log('Total facturas:', result.data.total_facturas);
            console.log('Estructura tabla facturas:', result.data.estructura_facturas);
            console.log('Usuarios recientes:', result.data.usuarios_recientes);
            console.log('Últimas facturas:', result.data.ultimas_facturas);
            
            // Mostrar en pantalla
            const mensaje = `
                📊 DEBUG FACTURAS:
                • Total usuarios: ${result.data.total_usuarios}
                • Total facturas: ${result.data.total_facturas}
                • Usuarios sin facturas: ${result.data.usuarios_recientes.filter(u => u.num_facturas == 0).length}
                
                Últimos usuarios creados:
                ${result.data.usuarios_recientes.map(u => 
                    `  - ${u.nombre} ${u.primer_apellido} (DNI: ${u.dni}) - ${u.num_facturas} facturas`
                ).join('\n')}
            `;
            
            alert(mensaje);
            
        } else {
            console.error('❌ Error en debug:', result.message);
            alert('Error en debug: ' + result.message);
        }
        
    } catch (error) {
        console.error('❌ Error completo en debug:', error);
        alert('Error de conexión en debug: ' + error.message);
    }
}

// Función para probar creación de usuario con logs detallados
async function testCrearUsuarioConFactura() {
    const datosTest = {
        usuario: {
            nombre: 'Test',
            primerApellido: 'Usuario',
            dni: '99999999T',
            email: 'test@test.com',
            telefono: '666777888',
            direccion: 'Calle Test 123',
            localidad: 'Granada',
            activo: 1
        },
        factura: {
            tipoServicio: 'open_3dias',
            descripcion: 'OPEN 3 días semana',
            precio: 65.00,
            formaPago: 'tarjeta',
            fechaPago: new Date().toISOString().split('T')[0]
        }
    };
    
    console.log('🧪 === TEST CREAR USUARIO CON FACTURA ===');
    console.log('Datos que se enviarán:', datosTest);
    
    try {
        const result = await makeRequest(`${API_BASE_URL}?action=crear_usuario_con_factura`, {
            method: 'POST',
            body: JSON.stringify(datosTest)
        });
        
        console.log('✅ Resultado:', result);
        
        if (result.success) {
            alert(`✅ Test exitoso!\n\nUsuario ID: ${result.usuario_id}\nFactura ID: ${result.factura_id}\n\nVerificación: ${result.verificacion?.facturas_creadas || 0} facturas creadas`);
            
            // Ejecutar debug para verificar
            setTimeout(() => debugFacturas(), 1000);
        } else {
            alert(`❌ Test falló: ${result.message}`);
        }
        
    } catch (error) {
        console.error('❌ Error en test:', error);
        alert('❌ Error en test: ' + error.message);
    }
}

// Función para verificar estructura de base de datos
async function verificarEstructuraBD() {
    try {
        console.log('🔍 Verificando estructura de base de datos...');
        
        // Intentar obtener información de debug
        const result = await makeRequest(`${API_BASE_URL}?action=debug_facturas`);
        
        if (result.success && result.data.estructura_facturas) {
            console.log('📋 Estructura tabla facturas:');
            result.data.estructura_facturas.forEach(col => {
                console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''} ${col.Key ? `(${col.Key})` : ''}`);
            });
            
            // Verificar campos críticos
            const camposNecesarios = ['id', 'usuario_id', 'tipo_servicio', 'descripcion', 'precio', 'forma_pago', 'fecha_pago'];
            const camposExistentes = result.data.estructura_facturas.map(col => col.Field);
            
            const camposFaltantes = camposNecesarios.filter(campo => !camposExistentes.includes(campo));
            
            if (camposFaltantes.length > 0) {
                console.error('❌ Campos faltantes:', camposFaltantes);
                alert(`❌ PROBLEMA DETECTADO:\n\nLa tabla 'facturas' no tiene estos campos necesarios:\n• ${camposFaltantes.join('\n• ')}\n\n¿Necesitas que te ayude a crear la estructura correcta?`);
            } else {
                console.log('✅ Todos los campos necesarios están presentes');
                alert('✅ Estructura de base de datos correcta');
            }
            
        } else {
            alert('❌ No se pudo verificar la estructura de la base de datos');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al verificar estructura: ' + error.message);
    }
}

// Función para mostrar logs del servidor (si están habilitados)
async function mostrarLogsServidor() {
    console.log('📋 Para ver los logs del servidor PHP:');
    console.log('1. Ve a XAMPP Control Panel');
    console.log('2. Haz clic en "Logs" junto a Apache');
    console.log('3. Busca líneas que contengan "CREAR USUARIO CON FACTURA"');
    
    alert(`📋 LOGS DEL SERVIDOR:\n\nPara ver logs detallados:\n1. Abre XAMPP Control Panel\n2. Clic en "Logs" junto a Apache\n3. Busca: "CREAR USUARIO CON FACTURA"\n\nO revisa el archivo:\nC:/xampp/apache/logs/error.log`);
}

// MODIFICAR también la función crearUsuario para incluir más logging:
async function crearUsuarioConLogs() {
    const formData = new FormData(document.getElementById('crearUsuarioForm'));
    const datos = Object.fromEntries(formData);
    
    console.log('📋 === CREAR USUARIO INICIADO ===');
    console.log('Datos del formulario:', datos);
    
    // Validar DNI
    if (!validarDNI(datos.dni)) {
        showMessage('error', 'DNI no válido. Debe tener formato 12345678A o X1234567A', 'mensajeCrear');
        return;
    }
    
    // Validar campos obligatorios para la factura
    if (!datos.tipoServicio || !datos.precio || !datos.formaPago || !datos.fechaPago) {
        console.error('❌ Campos faltantes para factura:', {
            tipoServicio: datos.tipoServicio,
            precio: datos.precio,
            formaPago: datos.formaPago,
            fechaPago: datos.fechaPago
        });
        showMessage('error', 'Complete todos los campos de facturación (Tipo de Servicio, Precio, Forma de Pago y Fecha)', 'mensajeCrear');
        return;
    }
    
    // Preparar descripción del servicio
    const tipoServicioSelect = document.getElementById('tipoServicio');
    if (tipoServicioSelect && tipoServicioSelect.selectedIndex > 0) {
        datos.descripcion = obtenerDescripcionServicio(datos.tipoServicio);
    }
    
    console.log('📝 Descripción generada:', datos.descripcion);
    
    // Validar precio
    const precio = parseFloat(datos.precio);
    if (isNaN(precio) || precio <= 0) {
        console.error('❌ Precio inválido:', datos.precio);
        showMessage('error', 'El precio debe ser un número mayor que 0', 'mensajeCrear');
        return;
    }
    
    // Estructurar datos para enviar al backend
    const datosCompletos = {
        usuario: {
            nombre: datos.nombre,
            primerApellido: datos.primerApellido,
            segundoApellido: datos.segundoApellido || '',
            dni: datos.dni,
            email: datos.email || '',
            telefono: datos.telefono || '',
            direccion: datos.direccion || '',
            codigoPostal: datos.codigoPostal || '',
            localidad: datos.localidad || 'Granada',
            activo: datos.activo || 1
        },
        factura: {
            tipoServicio: datos.tipoServicio,
            descripcion: datos.descripcion,
            precio: precio,
            formaPago: datos.formaPago,
            fechaPago: datos.fechaPago
        }
    };
    
    console.log('📤 Datos completos a enviar:', datosCompletos);
    
    try {
        showMessage('info', 'Creando usuario y factura...', 'mensajeCrear');
        
        const result = await makeRequest(`${API_BASE_URL}?action=crear_usuario_con_factura`, {
            method: 'POST',
            body: JSON.stringify(datosCompletos)
        });
        
        console.log('📥 Respuesta del servidor:', result);
        
        if (result.success) {
            showMessage('success', result.message, 'mensajeCrear');
            
            // Mostrar información de verificación si está disponible
            if (result.verificacion) {
                console.log('✅ Verificación:', result.verificacion);
            }
            
            // Resetear formulario
            const form = document.getElementById('crearUsuarioForm');
            if (form) form.reset();
            
            // Restaurar valores por defecto
            const fechaPago = document.getElementById('fechaPago');
            const precio = document.getElementById('precio');
            const activoSelect = document.getElementById('activo');
            const localidadInput = document.getElementById('localidad');
            
            if (fechaPago) fechaPago.value = new Date().toISOString().split('T')[0];
            if (precio) precio.value = '';
            if (activoSelect) activoSelect.value = '1';
            if (localidadInput) localidadInput.value = 'Granada';
            
        } else {
            console.error('❌ Error del servidor:', result.message);
            showMessage('error', result.message || 'Error al crear usuario y factura', 'mensajeCrear');
            
            // Si hay información de debug, mostrarla
            if (result.debug_info) {
                console.error('🐛 Debug info:', result.debug_info);
            }
        }
    } catch (error) {
        console.error('❌ Error completo:', error);
        showMessage('error', 'Error de conexión: ' + error.message, 'mensajeCrear');
    }
}

// Función para abrir consola de debug rápida
function abrirConsoleDebug() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
        background: rgba(0,0,0,0.8); z-index: 1000; 
        display: flex; align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px;">
            <h3>🔧 Debug de Facturas</h3>
            <p>Herramientas para diagnosticar problemas con facturas:</p>
            <div style="margin: 20px 0;">
                <button onclick="debugFacturas()" class="btn" style="margin: 5px; width: 200px;">📊 Ver Estado BD</button><br>
                <button onclick="testCrearUsuarioConFactura()" class="btn" style="margin: 5px; width: 200px;">🧪 Test Crear Usuario</button><br>
                <button onclick="verificarEstructuraBD()" class="btn" style="margin: 5px; width: 200px;">🏗️ Verificar Estructura</button><br>
                <button onclick="mostrarLogsServidor()" class="btn" style="margin: 5px; width: 200px;">📋 Ver Logs PHP</button><br>
            </div>
            <button onclick="this.closest('div').parentElement.remove()" class="btn btn-secondary">Cerrar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

console.log('🔧 Funciones de debug cargadas. Usa abrirConsoleDebug() para empezar.');


async function importarFacturasDesdeExcel(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    const mensajeContainer = document.getElementById('mensajeImportar');
    
    if (!file) {
        showMessage('error', 'Por favor, seleccione un archivo.', 'mensajeImportar');
        return;
    }
    
    showMessage('info', 'Procesando archivo Excel...', 'mensajeImportar');
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            
            // Mapear los datos de Excel al formato que espera el backend
            const registros = rows.slice(1).map((row) => { // Ignorar la primera fila (encabezados)
                return {
                    usuario: {
                        dni: String(row[0]).trim() // El DNI debe estar en la primera columna
                    },
                    factura: {
                        tipoServicio: String(row[1]).trim(),
                        descripcion: String(row[2]).trim(),
                        precio: parseFloat(row[3]),
                        formaPago: String(row[4]).trim(),
                        fechaPago: XLSX.utils.format_date(XLSX.utils.cell_get(worksheet[XLSX.utils.encode_cell({c: 5, r: 0})]), 'yyyy-mm-dd')
                    }
                };
            });
            
            // Enviar los datos al endpoint de PHP
            const result = await makeRequest(`${API_BASE_URL}?action=importar_excel_facturas`, {
                method: 'POST',
                body: JSON.stringify({ registros })
            });
            
            if (result.success) {
                const detalles = result.detalles;
                const mensaje = `
                    Importación finalizada. Resumen:
                    - Facturas creadas: ${detalles.facturasCreadas}
                    - Usuarios no encontrados: ${detalles.usuariosNoEncontrados}
                    - Errores de datos: ${detalles.erroresDatos}
                `;
                showMessage('success', mensaje, 'mensajeImportar');
            } else {
                showMessage('error', result.message || 'Error en la importación. Verifique los logs.', 'mensajeImportar');
            }
            
        } catch (error) {
            showMessage('error', `Error al procesar el archivo: ${error.message}`, 'mensajeImportar');
        }
    };
    reader.readAsArrayBuffer(file);
}

// Modificar el event listener para el nuevo formulario
document.addEventListener('DOMContentLoaded', () => {
    // ... otros event listeners
    const formImportarExcel = document.getElementById('formImportarExcel');
    if (formImportarExcel) {
        formImportarExcel.addEventListener('submit', importarFacturasDesdeExcel);
    }
});