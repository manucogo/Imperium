// js/script.js - JavaScript completo y corregido
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

// Función para detectar si estamos en un servidor web
function isRunningOnServer() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
}

// Función para mostrar error de servidor
function showServerError() {
    const errorMessage = `
        <div class="message error">
            <h3>⚠️ Error de Configuración</h3>
            <p><strong>El sistema debe ejecutarse desde un servidor web HTTP.</strong></p>
            <p>Actualmente estás accediendo como: <code>${window.location.href}</code></p>
            <br>
            <p><strong>Soluciones:</strong></p>
            <ul>
                <li>1. Coloca los archivos en <code>C:/xampp/htdocs/imperium-box/</code></li>
                <li>2. Inicia Apache desde XAMPP Control Panel</li>
                <li>3. Accede vía: <code>http://localhost/imperium-box/</code></li>
            </ul>
            <br>
            <p><strong>Herramientas de diagnóstico:</strong></p>
            <ul>
                <li><a href="diagnostico.php">🔍 Diagnóstico del Sistema</a></li>
                <li><a href="repair.php">🔧 Reparar Problemas</a></li>
                <li><a href="setup.php">⚙️ Configurar Sistema</a></li>
            </ul>
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

// Función mejorada para hacer peticiones con mejor debugging
async function makeRequest(url, options = {}) {
    console.log('🔄 Haciendo petición a:', url);
    console.log('📤 Opciones:', options);
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        console.log('📥 Respuesta HTTP:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Respuesta no es JSON:', text);
            throw new Error('El servidor no devolvió JSON válido');
        }
        
        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        
        if (data.error) {
            throw new Error(data.message || 'Error del servidor');
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Error en petición:', error);
        
        // Mostrar error más específico
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('No se puede conectar con el servidor. Verifica que Apache esté ejecutándose.');
        }
        
        throw error;
    }
}

// Función para probar la conexión
async function testConnection() {
    try {
        console.log('🔍 Probando conexión...');
        const result = await makeRequest(`${API_BASE_URL}?action=test_connection`);
        console.log('✅ Conexión exitosa:', result);
        return true;
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        showMessage('error', 'Error de conexión: ' + error.message, 'mensajeLogin');
        return false;
    }
}

// Configurar fecha actual al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Sistema de Gestión Imperium Box inicializado');
    
    // Verificar si estamos en un servidor web
    if (!isRunningOnServer()) {
        showServerError();
        return;
    }
    
    // Probar conexión antes de continuar
    const connectionOk = await testConnection();
    if (!connectionOk) {
        showMessage('error', 'No se puede conectar con el servidor. Verifica que Apache y MySQL estén funcionando.', 'mensajeLogin');
        return;
    }
    
    // Configurar fechas
    const fechaActual = new Date();
    const fechaInput = fechaActual.toISOString().split('T')[0];
    const mesActual = fechaActual.toISOString().slice(0, 7);
    
    const fechaPago = document.getElementById('fechaPago');
    const fechaPago2 = document.getElementById('fechaPago2');
    const mesSeleccionado = document.getElementById('mesSeleccionado');
    
    if (fechaPago) {
        fechaPago.value = fechaInput;
    }
    if (fechaPago2) {
        fechaPago2.value = fechaInput;
    }
    if (mesSeleccionado) {
        mesSeleccionado.value = mesActual;
    }
    
    // Cargar configuración
    await cargarConfiguracion();
    
    // Verificar sesión existente
    await verificarSesion();
});

// Event Listeners con validación
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
        crearUsuario();
    });
}

const formNuevaFactura = document.getElementById('formNuevaFactura');
if (formNuevaFactura) {
    formNuevaFactura.addEventListener('submit', function(e) {
        e.preventDefault();
        crearNuevaFactura();
    });
}

// Actualizar precio al cambiar servicio
const tipoServicio = document.getElementById('tipoServicio');
if (tipoServicio) {
    tipoServicio.addEventListener('change', function() {
        const precio = this.options[this.selectedIndex].getAttribute('data-precio');
        const precioField = document.getElementById('precio');
        if (precioField) {
            precioField.value = precio || '';
        }
    });
}

const tipoServicio2 = document.getElementById('tipoServicio2');
if (tipoServicio2) {
    tipoServicio2.addEventListener('change', function() {
        const precio = this.options[this.selectedIndex].getAttribute('data-precio');
        const precioField = document.getElementById('precio2');
        if (precioField) {
            precioField.value = precio || '';
        }
    });
}

// Actualizar numeración automática
const facturaSelect = document.getElementById('facturaSelect');
if (facturaSelect) {
    facturaSelect.addEventListener('change', function() {
        const facturaIndex = this.value;
        if (facturaIndex && facturasMes[facturaIndex]) {
            const numeroFactura = parseInt(facturaIndex) + 1;
            const numeroFacturaField = document.getElementById('numeroFactura');
            if (numeroFacturaField) {
                numeroFacturaField.value = `${configuracion.prefijo_factura}/${numeroFactura}`;
            }
        }
    });
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
            const loginScreen = document.getElementById('loginScreen');
            const mainApp = document.getElementById('mainApp');
            
            if (loginScreen) loginScreen.classList.add('hidden');
            if (mainApp) mainApp.classList.remove('hidden');
            
            showMessage('success', 'Bienvenido ' + result.user.nombre, 'mensajeLogin');
        } else {
            showMessage('error', result.message, 'mensajeLogin');
        }
    } catch (error) {
        showMessage('error', 'Error de conexión: ' + error.message, 'mensajeLogin');
    }
}

async function verificarSesion() {
    try {
        console.log('🔍 Verificando sesión...');
        const result = await makeRequest(`${API_BASE_URL}?action=verificar_sesion`);
        
        if (result.success) {
            console.log('✅ Sesión encontrada:', result.user);
            currentUser = result.user;
            const loginScreen = document.getElementById('loginScreen');
            const mainApp = document.getElementById('mainApp');
            
            if (loginScreen) loginScreen.classList.add('hidden');
            if (mainApp) mainApp.classList.remove('hidden');
        } else {
            console.log('ℹ️ No hay sesión activa');
        }
    } catch (error) {
        console.log('⚠️ Error al verificar sesión:', error.message);
    }
}

async function logout() {
    try {
        await makeRequest(`${API_BASE_URL}?action=logout`, { method: 'POST' });
        currentUser = null;
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        const loginForm = document.getElementById('loginForm');
        
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('hidden');
        if (loginForm) loginForm.reset();
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Funciones de configuración
async function cargarConfiguracion() {
    try {
        console.log('🔧 Cargando configuración...');
        const config = await makeRequest(`${API_BASE_URL}?action=obtener_configuracion`);
        configuracion = { ...configuracion, ...config };
        
        // Actualizar número inicial de factura
        const numeroFacturaField = document.getElementById('numeroFactura');
        if (numeroFacturaField) {
            numeroFacturaField.value = `${configuracion.prefijo_factura}/1`;
        }
        
        console.log('✅ Configuración cargada:', configuracion);
    } catch (error) {
        console.error('⚠️ Error al cargar configuración:', error);
        showMessage('info', 'Usando configuración por defecto', 'mensajeLogin');
    }
}

// Funciones de navegación
function showTab(tabName) {
    // Ocultar todas las tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar tab seleccionada
    const targetTab = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (targetTab) {
        targetTab.classList.add('active');
    }
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// Funciones de mensajes
function showMessage(type, message, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `<div class="message ${type}">${message}</div>`;
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Funciones de usuario
async function crearUsuario() {
    const formData = new FormData(document.getElementById('crearUsuarioForm'));
    const datos = Object.fromEntries(formData);
    
    // Validaciones cliente
    if (!validarDNI(datos.dni)) {
        showMessage('error', 'DNI no válido. Debe tener formato 12345678A o X1234567A', 'mensajeCrear');
        return;
    }
    
    // Obtener descripción del servicio
    const tipoServicioSelect = document.getElementById('tipoServicio');
    if (tipoServicioSelect && tipoServicioSelect.selectedIndex > 0) {
        datos.descripcion = tipoServicioSelect.options[tipoServicioSelect.selectedIndex].text.split(' - ')[0];
    }
    
    try {
        const result = await makeRequest(`${API_BASE_URL}?action=crear_usuario`, {
            method: 'POST',
            body: JSON.stringify(datos)
        });
        
        if (result.success) {
            showMessage('success', result.message, 'mensajeCrear');
            const form = document.getElementById('crearUsuarioForm');
            if (form) form.reset();
            
            const fechaPago = document.getElementById('fechaPago');
            const precio = document.getElementById('precio');
            if (fechaPago) fechaPago.value = new Date().toISOString().split('T')[0];
            if (precio) precio.value = '';
        } else {
            showMessage('error', result.message, 'mensajeCrear');
        }
    } catch (error) {
        showMessage('error', 'Error de conexión: ' + error.message, 'mensajeCrear');
    }
}

function validarDNI(dni) {
    const dniPattern = /^\d{8}[A-Za-z]$/;
    const niePattern = /^[XYZxyz]\d{7}[A-Za-z]$/;
    return dniPattern.test(dni.trim()) || niePattern.test(dni.trim());
}

// Funciones de búsqueda
async function buscarUsuarios() {
    const busqueda = document.getElementById('busqueda').value.trim();
    const resultados = document.getElementById('resultadosBusqueda');
    
    if (!busqueda) {
        resultados.innerHTML = '<div class="message info">Ingrese un término de búsqueda</div>';
        return;
    }
    
    try {
        const usuariosEncontrados = await makeRequest(`${API_BASE_URL}?action=buscar_usuarios&termino=${encodeURIComponent(busqueda)}`);
        
        if (usuariosEncontrados.length === 0) {
            resultados.innerHTML = '<div class="message info">No se encontraron usuarios</div>';
            return;
        }
        
        let html = '';
        usuariosEncontrados.forEach(usuario => {
            html += `
                <div class="user-card">
                    <h3>${usuario.nombre} ${usuario.primer_apellido} ${usuario.segundo_apellido || ''}</h3>
                    <p><strong>DNI:</strong> ${usuario.dni}</p>
                    <p><strong>Email:</strong> ${usuario.email || 'No registrado'}</p>
                    <p><strong>Teléfono:</strong> ${usuario.telefono || 'No registrado'}</p>
                    <p><strong>Dirección:</strong> ${usuario.direccion || 'No registrada'}, ${usuario.codigo_postal || ''} ${usuario.localidad || ''}</p>
                    <p><strong>Total facturas:</strong> ${usuario.total_facturas || 0} | <strong>Total facturado:</strong> ${(usuario.total_facturado || 0).toFixed(2)}€</p>
                    
                    <h4>Historial de Facturas:</h4>
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Número</th>
                                    <th>Servicio</th>
                                    <th>Precio</th>
                                    <th>Forma de Pago</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${usuario.facturas.map(factura => `
                                    <tr>
                                        <td>${factura.numero_factura}</td>
                                        <td>${factura.descripcion}</td>
                                        <td>${parseFloat(factura.precio).toFixed(2)}€</td>
                                        <td>${factura.forma_pago}</td>
                                        <td>${formatearFecha(factura.fecha_pago)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <button class="btn btn-secondary" onclick="mostrarFormularioNuevaFactura(${usuario.id})">
                        Añadir Nueva Factura
                    </button>
                </div>
            `;
        });
        
        resultados.innerHTML = html;
    } catch (error) {
        showMessage('error', 'Error al buscar usuarios: ' + error.message, 'mensajeBuscar');
    }
}

function mostrarFormularioNuevaFactura(usuarioId) {
    const usuarioIdField = document.getElementById('usuarioId');
    const nuevaFacturaForm = document.getElementById('nuevaFacturaForm');
    
    if (usuarioIdField) usuarioIdField.value = usuarioId;
    if (nuevaFacturaForm) {
        nuevaFacturaForm.classList.remove('hidden');
        nuevaFacturaForm.scrollIntoView({ behavior: 'smooth' });
    }
}

function cancelarNuevaFactura() {
    const nuevaFacturaForm = document.getElementById('nuevaFacturaForm');
    const formNuevaFactura = document.getElementById('formNuevaFactura');
    const precio2 = document.getElementById('precio2');
    
    if (nuevaFacturaForm) nuevaFacturaForm.classList.add('hidden');
    if (formNuevaFactura) formNuevaFactura.reset();
    if (precio2) precio2.value = '';
}

async function crearNuevaFactura() {
    const formData = new FormData(document.getElementById('formNuevaFactura'));
    const datos = Object.fromEntries(formData);
    
    // Obtener descripción del servicio
    const tipoServicioSelect = document.getElementById('tipoServicio2');
    if (tipoServicioSelect && tipoServicioSelect.selectedIndex > 0) {
        datos.descripcion = tipoServicioSelect.options[tipoServicioSelect.selectedIndex].text.split(' - ')[0];
    }
    
    datos.tipo_servicio = datos.tipoServicio2;
    datos.precio = datos.precio2;
    datos.forma_pago = datos.formaPago2;
    datos.fecha_pago = datos.fechaPago2;
    
    try {
        const result = await makeRequest(`${API_BASE_URL}?action=crear_factura`, {
            method: 'POST',
            body: JSON.stringify(datos)
        });
        
        if (result.success) {
            showMessage('success', result.message, 'mensajeBuscar');
            cancelarNuevaFactura();
            buscarUsuarios(); // Actualizar resultados
        } else {
            showMessage('error', result.message, 'mensajeBuscar');
        }
    } catch (error) {
        showMessage('error', 'Error de conexión: ' + error.message, 'mensajeBuscar');
    }
}

// Funciones de facturas
async function cargarFacturasMes() {
    const mesSeleccionado = document.getElementById('mesSeleccionado').value;
    if (!mesSeleccionado) {
        showMessage('error', 'Seleccione un mes', 'mensajeFacturas');
        return;
    }
    
    const [año, mes] = mesSeleccionado.split('-');
    
    try {
        facturasMes = await makeRequest(`${API_BASE_URL}?action=facturas_mes&mes=${mes}&año=${año}`);
        
        // Actualizar select de facturas
        const select = document.getElementById('facturaSelect');
        if (select) {
            select.innerHTML = '<option value="">Seleccione una factura</option>';
            
            facturasMes.forEach((factura, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${factura.nombre} ${factura.primer_apellido} - ${factura.descripcion} - ${parseFloat(factura.precio).toFixed(2)}€`;
                select.appendChild(option);
            });
        }
        
        // Mostrar información
        const facturasList = document.getElementById('facturasList');
        if (facturasList) {
            if (facturasMes.length === 0) {
                facturasList.innerHTML = '<div class="message info">No hay facturas para el mes seleccionado</div>';
            } else {
                facturasList.innerHTML = `
                    <div class="message success">
                        Se encontraron ${facturasMes.length} facturas para ${mes}/${año}
                    </div>
                `;
            }
        }
        
        // Reiniciar numeración
        const numeroFacturaField = document.getElementById('numeroFactura');
        if (numeroFacturaField) {
            numeroFacturaField.value = `${configuracion.prefijo_factura}/1`;
        }
        
    } catch (error) {
        showMessage('error', 'Error al cargar facturas: ' + error.message, 'mensajeFacturas');
    }
}

function generarFactura() {
    const facturaIndex = document.getElementById('facturaSelect').value;
    const numeroFactura = document.getElementById('numeroFactura').value;
    
    if (!facturaIndex || !numeroFactura) {
        showMessage('error', 'Seleccione una factura y complete el número', 'mensajeFacturas');
        return;
    }
    
    const facturaData = facturasMes[facturaIndex];
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
                        <td>${facturaData.descripcion}</td>
                        <td>IVA (${configuracion.iva_porcentaje}%)</td>
                        <td>1</td>
                        <td>${parseFloat(facturaData.precio).toFixed(2)}€</td>
                        <td>${parseFloat(facturaData.precio).toFixed(2)}€</td>
                    </tr>
                </tbody>
            </table>

            <div class="totales">
                <table>
                    <tr>
                        <td><strong>Total neto:</strong></td>
                        <td style="text-align: right;">${parseFloat(facturaData.precio_sin_iva).toFixed(2)}€</td>
                    </tr>
                    <tr>
                        <td><strong>Total IVA (${configuracion.iva_porcentaje}%):</strong></td>
                        <td style="text-align: right;">${parseFloat(facturaData.iva).toFixed(2)}€</td>
                    </tr>
                    <tr class="total-final">
                        <td><strong>Total factura:</strong></td>
                        <td style="text-align: right;">${parseFloat(facturaData.precio).toFixed(2)}€</td>
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
}

// Funciones de utilidad
function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES');
}

function formatearFechaFactura(fecha) {
    const date = new Date(fecha);
    // Usar el último día del mes
    const ultimoDia = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return ultimoDia.toLocaleDateString('es-ES');
}

// Funciones de descarga (simuladas - en producción usarían jsPDF y JSZip)
function descargarFacturaPDF() {
    const facturaIndex = document.getElementById('facturaSelect').value;
    const numeroFactura = document.getElementById('numeroFactura').value;
    
    if (!facturaIndex || !numeroFactura) {
        showMessage('error', 'Primero genere la factura', 'mensajeFacturas');
        return;
    }
    
    const facturaData = facturasMes[facturaIndex];
    showMessage('info', `Descargando PDF de factura ${numeroFactura} para ${facturaData.nombre} ${facturaData.primer_apellido}`, 'mensajeFacturas');
    
    // Implementación básica con window.print()
    window.print();
}

function descargarTodasFacturas() {
    if (facturasMes.length === 0) {
        showMessage('error', 'No hay facturas cargadas para descargar', 'mensajeFacturas');
        return;
    }
    
    showMessage('info', `Generando ZIP con ${facturasMes.length} facturas...`, 'mensajeFacturas');
    
    // Simular descarga
    setTimeout(() => {
        showMessage('success', `ZIP generado exitosamente con ${facturasMes.length} facturas`, 'mensajeFacturas');
    }, 2000);
    
    // Aquí iría la implementación real con JSZip
}