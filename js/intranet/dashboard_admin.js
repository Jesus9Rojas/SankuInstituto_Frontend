document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. SEGURIDAD Y CONFIGURACIÓN BASE
    // ==========================================
    const rolUsuario = localStorage.getItem("usuarioRol");
    if (!localStorage.getItem("sesionActiva") || !rolUsuario || 
       (rolUsuario.toLowerCase() !== "administrador" && rolUsuario.toLowerCase() !== "coordinador")) {
        window.location.href = "/html/login.html";
        return;
    }

    const token = localStorage.getItem("token");
    const usuarioId = localStorage.getItem("usuarioId");
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // ==========================================
    // 2. NAVEGACIÓN Y MENÚS
    // ==========================================
    const btnMenuToggle = document.getElementById("btnMenuToggle");
    const portalLayout = document.getElementById("portalLayout");
    if (btnMenuToggle && portalLayout) {
        btnMenuToggle.addEventListener("click", () => portalLayout.classList.toggle("sidebar-collapsed"));
    }

    const navTriggers = document.querySelectorAll(".menu-btn[data-target], .nav-trigger");
    const sections = document.querySelectorAll(".content-section");
    const menuBtns = document.querySelectorAll(".menu-btn[data-target]");

    navTriggers.forEach(trigger => {
        trigger.addEventListener("click", function(e) {
            e.preventDefault();
            sections.forEach(s => s.classList.remove("active"));
            menuBtns.forEach(b => b.classList.remove("active"));
            if (this.classList.contains("menu-btn")) this.classList.add("active");
            
            const targetId = this.getAttribute("data-target");
            const targetSection = document.getElementById(targetId);
            if(targetSection) targetSection.classList.add("active");

            const menuPerfil = document.getElementById("menuPerfil");
            if (menuPerfil && menuPerfil.classList.contains("show")) menuPerfil.classList.remove("show");

            // Disparador para el Panel General (Inicio)
            if(targetId === 'seccion-inicio') {
                renderizarGraficoMatriculas('matriculasChart'); 
            }
            
            // Disparador para Finanzas
            if(targetId === 'seccion-finanzas') {
                cargarFinanzas(); 
            }

            // Disparador para Reportes BI
            if(targetId === 'seccion-reportes') {
                renderizarGraficoFinanciero();
                renderizarGraficoMatriculas('matriculasReportesChart'); 
                renderizarSemaforoDocente();
                cargarAlertasAcademicas();
            }
        });
    });

    const btnDropdownChevron = document.getElementById("btnDropdownChevron");
    const menuPerfil = document.getElementById("menuPerfil");
    if(btnDropdownChevron && menuPerfil) {
        btnDropdownChevron.addEventListener("click", (e) => { e.stopPropagation(); menuPerfil.classList.toggle("show"); });
        document.addEventListener("click", (e) => { if (!menuPerfil.contains(e.target) && e.target !== btnDropdownChevron) menuPerfil.classList.remove("show"); });
    }

    const logoutBtns = [document.getElementById("btnCerrarSesion"), document.getElementById("btnCerrarSesionLateral")];
    logoutBtns.forEach(btn => {
        if(btn) btn.addEventListener("click", (e) => {
            e.preventDefault(); 
            
            // 🚀 BORRADO SELECTIVO
            localStorage.removeItem("token");
            localStorage.removeItem("usuarioId");
            localStorage.removeItem("usuarioRol");
            localStorage.removeItem("usuarioNombre");
            localStorage.removeItem("sesionActiva");
            
            window.location.href = "/html/index.html";
        });
    });
    
    // ==========================================
    // 3. CARGA DE DATOS (DASHBOARD Y SAE)
    // ==========================================
    function inicializarAdmin() {
        // --- A. CARGAR PERFIL COMPLETO ---
        fetch('http://localhost:8080/api/v1/usuarios', { headers })
            .then(res => res.json())
            .then(usuarios => {
                const admin = usuarios.find(u => u.idUsuario == usuarioId);
                
                if (admin) {
                    const nombreSolo = admin.nombres || admin.nombreCompleto || "Administrador";
                    const apellidoSolo = admin.apellidos || "";
                    const nombreFull = admin.nombreCompleto || `${nombreSolo} ${apellidoSolo}`.trim();
                    const inicial = nombreSolo.charAt(0).toUpperCase();
                    
                    if(document.getElementById("userNameHeader")) document.getElementById("userNameHeader").textContent = nombreSolo.split(' ')[0]; 
                    if(document.getElementById("userInitial")) document.getElementById("userInitial").textContent = inicial;

                    const lblFull = document.getElementById("perfilFullName");
                    if(lblFull) {
                        lblFull.textContent = nombreFull;
                        document.getElementById("perfilInitial").textContent = inicial;
                        document.getElementById("perfilDni").textContent = admin.dni || "No registrado";
                        document.getElementById("perfilEmail").textContent = admin.email || "No registrado";
                    }
                }
            })
            .catch(e => console.error("Error al cargar perfil:", e));

        // --- B. Cargar Tarjetas de Métricas ---
        fetch('http://localhost:8080/api/v1/reportes/dashboard-admin', { headers })
            .then(res => res.json())
            .then(data => {
                if(document.getElementById("metric-alumnos")) document.getElementById("metric-alumnos").innerHTML = `${data.totalAlumnos || 0} <span class="trend up">Activos</span>`;
                if(document.getElementById("metric-docentes")) document.getElementById("metric-docentes").innerHTML = `${data.totalDocentes || 0} <span class="trend up">Plantilla</span>`;
                if(document.getElementById("metric-ingresos")) document.getElementById("metric-ingresos").innerHTML = `S/ ${(data.ingresosMes || 0).toFixed(2)}`;
                if(document.getElementById("metric-tramites")) document.getElementById("metric-tramites").innerHTML = `${data.solicitudesPendientes || 0} <span class="trend neutral">Pendientes</span>`;
            })
            .catch(e => console.error("Error al cargar métricas:", e));

        // --- C. Cargar Buzón SAE ---
        cargarBuzonSae();

        // Cargar tabla de gestión de usuarios
        cargarUsuarios();
    }

    // ==========================================
    // 🚀 LÓGICA DE TRÁMITES SAE Y FILTROS
    // ==========================================
    let listaSolicitudesGlobal = []; // Base de datos local para los filtros

    function cargarBuzonSae() {
        const tablaSae = document.getElementById("tabla-solicitudes-body");
        
        // 🚀 CORRECCIÓN: Tu backend Java solo tiene el endpoint "/pendientes"
        const endpoint = 'http://localhost:8080/api/v1/solicitudes/pendientes';

        fetch(endpoint, { headers })
            .then(res => {
                if (!res.ok) throw new Error("Error en la petición al servidor");
                return res.json();
            })
            .then(solicitudes => {
                listaSolicitudesGlobal = Array.isArray(solicitudes) ? solicitudes : [];
                
                // 1. Cuadro de resumen (Solo en Dashboard)
                const preview = document.getElementById("lista-tramites-preview");
                if (preview) {
                    const soloPendientes = listaSolicitudesGlobal.filter(s => s.estado === 'PENDIENTE');
                    preview.innerHTML = soloPendientes.length === 0 ? '<p class="text-center text-muted" style="padding: 20px;">Bandeja limpia.</p>' :
                        soloPendientes.slice(0,3).map(s => `
                            <div class="admin-list-item">
                                <div class="item-icon bg-primary-light"><i class="fa-solid fa-file-signature text-primary"></i></div>
                                <div class="item-content">
                                    <h4>${s.tipo}</h4>
                                    <p>Estudiante: ${s.nombreEmisor}</p>
                                </div>
                                <button class="btn-outline-small" onclick="window.location.href='sae_tramites.html'">Atender</button>
                            </div>
                        `).join('');
                }
                
                // 2. Llenar la tabla principal si estamos en la vista de SAE
                if (tablaSae) {
                    renderizarTablaSae(listaSolicitudesGlobal);
                }
            })
            .catch(e => console.error("Error SAE:", e));
    }

    function renderizarTablaSae(solicitudesParaMostrar) {
        const tablaSae = document.getElementById("tabla-solicitudes-body");
        if (!tablaSae) return;

        if (solicitudesParaMostrar.length === 0) {
            tablaSae.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 30px;">No se encontraron trámites.</td></tr>';
            return;
        }

        const copiaSolicitudes = [...solicitudesParaMostrar];

        copiaSolicitudes.sort((a, b) => {
            if (a.estado === 'PENDIENTE' && b.estado !== 'PENDIENTE') return -1;
            if (a.estado !== 'PENDIENTE' && b.estado === 'PENDIENTE') return 1;
            return new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud);
        });

        tablaSae.innerHTML = copiaSolicitudes.map(s => {
            let statusClass = "badge-pending";
            if (s.estado === "APROBADO") statusClass = "badge-success";
            if (s.estado === "RECHAZADO") statusClass = "badge-danger";

            return `
                <tr>
                    <td><strong>#TRM-${s.idSolicitud}</strong></td>
                    <td>${new Date(s.fechaSolicitud).toLocaleDateString('es-ES')}</td>
                    <td>${s.nombreEmisor}</td>
                    <td>${s.tipo}</td>
                    <td><span class="badge ${statusClass}">${s.estado}</span></td>
                    <td style="text-align: right;"><button class="btn-primary" style="padding: 5px 15px; font-size: 12px; border-radius: 6px;" onclick='abrirRevision(${JSON.stringify(s)})'>${s.estado === 'PENDIENTE' ? 'Revisar' : 'Ver Detalle'}</button></td>
                </tr>
            `;
        }).join('');
    }

    // Filtros del SAE
    const buscadorSae = document.getElementById("buscadorSae");
    const filtroSaeEstado = document.getElementById("filtroSaeEstado");
    const filtroSaeTipo = document.getElementById("filtroSaeTipo");

    function aplicarFiltrosSae() {
        const texto = (buscadorSae?.value || "").toLowerCase();
        const estado = filtroSaeEstado?.value || "todos";
        const tipo = filtroSaeTipo?.value || "todos";

        const filtrados = listaSolicitudesGlobal.filter(s => {
            const nombre = (s.nombreEmisor || "").toLowerCase();
            const idTexto = (s.idSolicitud || "").toString();
            
            const matchTxt = nombre.includes(texto) || idTexto.includes(texto);
            const matchEstado = (estado === "todos" || s.estado.toUpperCase() === estado.toUpperCase());
            const matchTipo = (tipo === "todos" || s.tipo.toUpperCase() === tipo.toUpperCase());
            
            return matchTxt && matchEstado && matchTipo;
        });

        renderizarTablaSae(filtrados);
    }

    if(buscadorSae) buscadorSae.addEventListener("keyup", aplicarFiltrosSae);
    if(filtroSaeEstado) filtroSaeEstado.addEventListener("change", aplicarFiltrosSae);
    if(filtroSaeTipo) filtroSaeTipo.addEventListener("change", aplicarFiltrosSae);

    // ==========================================
    // 4. MÓDULO DE USUARIOS (CRUD Y FILTROS)
    // ==========================================
    let listaUsuariosGlobal = [];

    async function cargarUsuarios() {
        try {
            const res = await fetch('http://localhost:8080/api/v1/usuarios', { headers });
            if (res.ok) {
                listaUsuariosGlobal = await res.json();
                renderizarTablaUsuarios(listaUsuariosGlobal);
            }
        } catch(e) { console.error("Error Usuarios:", e); }
    }

    function renderizarTablaUsuarios(lista) {
        const tbody = document.getElementById("tabla-usuarios-body");
        if (!tbody) return;

        if (lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding: 30px;">No hay usuarios.</td></tr>';
            return;
        }

        tbody.innerHTML = lista.map(u => {
            let badgeClass = u.rol === "ALUMNO" ? "badge-student" : u.rol === "DOCENTE" ? "badge-teacher" : u.rol === "COORDINADOR" ? "badge-admin" : "badge-active";
            return `
            <tr>
                <td><strong>${u.dni}</strong></td>
                <td>${u.nombres} ${u.apellidos}</td>
                <td>${u.email}</td>
                <td><span class="badge ${badgeClass}">${u.rol}</span></td>
                <td style="text-align: right;">
                    <button class="btn-action edit" onclick='abrirModalUsuario(${JSON.stringify(u)})'><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action delete" onclick="eliminarUsuario(${u.idUsuario})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
    }

    const buscadorUsuarios = document.getElementById("buscadorUsuarios");
    const filtroRolUsuarios = document.getElementById("filtroRolUsuarios");

    function aplicarFiltrosUsuarios() {
        const texto = (buscadorUsuarios?.value || "").toLowerCase();
        const rol = filtroRolUsuarios?.value || "TODOS";
        const filtrados = listaUsuariosGlobal.filter(u => {
            const matchTxt = u.nombres.toLowerCase().includes(texto) || u.apellidos.toLowerCase().includes(texto) || u.dni.includes(texto);
            const matchRol = (rol === "TODOS" || u.rol === rol);
            return matchTxt && matchRol;
        });
        renderizarTablaUsuarios(filtrados);
    }

    if(buscadorUsuarios) buscadorUsuarios.addEventListener("keyup", aplicarFiltrosUsuarios);
    if(filtroRolUsuarios) filtroRolUsuarios.addEventListener("change", aplicarFiltrosUsuarios);

    // --- MODAL: RESTRICCIONES SEGÚN REQUERIMIENTO ---
    window.abrirModalUsuario = function(usuarioObj = null) {
        const modal = document.getElementById("modalUsuario");
        const selectRol = document.getElementById("usuarioRol");
        const titulo = document.getElementById("tituloModalUsuario");
        const inputDni = document.getElementById("usuarioDni");
        
        document.getElementById("formUsuario").reset();

        // Opciones de rol según quién esté logueado (Para creación)
        let opcionesCreacion = "";
        if (rolUsuario.toLowerCase() === "administrador") {
            opcionesCreacion = `<option value="COORDINADOR">Coordinador Académico</option><option value="ADMINISTRADOR">Administrador Global</option>`;
        } else {
            opcionesCreacion = `<option value="DOCENTE">Docente</option><option value="ALUMNO">Alumno</option>`;
        }

        if (usuarioObj && usuarioObj.idUsuario) {
            titulo.textContent = "Editar Usuario";
            document.getElementById("usuarioIdInput").value = usuarioObj.idUsuario;
            inputDni.value = usuarioObj.dni;
            inputDni.setAttribute("readonly", "true");
            inputDni.style.backgroundColor = "#f1f5f9";
            
            document.getElementById("usuarioNombres").value = usuarioObj.nombres;
            document.getElementById("usuarioApellidos").value = usuarioObj.apellidos;
            document.getElementById("usuarioEmail").value = usuarioObj.email;
            
            selectRol.innerHTML = `<option value="${usuarioObj.rol}">${usuarioObj.rol}</option>`;
            selectRol.disabled = true;
        } else {
            titulo.textContent = "Crear Nuevo Usuario";
            document.getElementById("usuarioIdInput").value = "";
            inputDni.removeAttribute("readonly");
            inputDni.style.backgroundColor = "#fff";
            
            selectRol.innerHTML = opcionesCreacion;
            selectRol.disabled = false;
        }
        modal.classList.add("show");
    };

    window.cerrarModalUsuario = function() { document.getElementById("modalUsuario").classList.remove("show"); };

    const formUsuario = document.getElementById("formUsuario");
    if (formUsuario) {
        formUsuario.addEventListener("submit", async (e) => {
            e.preventDefault();
            const idUsuario = document.getElementById("usuarioIdInput").value;
            const dto = {
                dni: document.getElementById("usuarioDni").value.trim(),
                nombres: document.getElementById("usuarioNombres").value.trim(),
                apellidos: document.getElementById("usuarioApellidos").value.trim(),
                email: document.getElementById("usuarioEmail").value.trim(),
                rol: document.getElementById("usuarioRol").value
            };

            const url = idUsuario ? `http://localhost:8080/api/v1/usuarios/${idUsuario}` : `http://localhost:8080/api/v1/usuarios`;

            try {
                const btn = document.getElementById("btnGuardarUsuario");
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...'; btn.disabled = true;

                const res = await fetch(url, { method: idUsuario ? "PUT" : "POST", headers, body: JSON.stringify(dto) });

                if (res.ok) {
                    alert("¡Operación exitosa!");
                    cerrarModalUsuario();
                    cargarUsuarios();
                    if (idUsuario == usuarioId) inicializarAdmin();
                } else {
                    const errorJson = await res.json();
                    alert("❌ Error: " + (errorJson.message || "No se pudo procesar la solicitud."));
                }
            } catch(error) { alert("Error de red. Verifica la conexión."); } 
            finally {
                const btn = document.getElementById("btnGuardarUsuario");
                btn.innerHTML = 'Guardar Usuario'; btn.disabled = false;
            }
        });
    }

    window.eliminarUsuario = async function(id) {
        if(!confirm("¿Deseas eliminar permanentemente a este usuario?")) return;
        try {
            const res = await fetch(`http://localhost:8080/api/v1/usuarios/${id}`, { method: 'DELETE', headers });
            if(res.ok) { cargarUsuarios(); inicializarAdmin(); } 
            else { const err = await res.json(); alert("❌ " + err.message); }
        } catch(e) { console.error(e); }
    };

    // ==========================================
    // 5. LÓGICA DE TRÁMITES SAE (MODAL)
    // ==========================================
    let tramiteSeleccionado = null;
    window.abrirRevision = function(solicitudObj) {
        tramiteSeleccionado = solicitudObj.idSolicitud;
        document.getElementById("modal-sae-id").textContent = `#TRM-${solicitudObj.idSolicitud}`;
        document.getElementById("modal-sae-alumno").textContent = solicitudObj.nombreEmisor;
        document.getElementById("modal-sae-tipo").textContent = solicitudObj.tipo;
        document.getElementById("modal-sae-desc").textContent = solicitudObj.descripcion;
        if(document.getElementById("txtObservacionSae")) document.getElementById("txtObservacionSae").value = "";
        document.getElementById('modalRevision').classList.add('show');
    };

    window.cerrarRevision = function() { document.getElementById('modalRevision').classList.remove('show'); };

    window.responderTramite = async function(nuevoEstado) {
        const obs = document.getElementById("txtObservacionSae").value.trim();
        if (nuevoEstado === "RECHAZADO" && obs === "") return alert("Debes indicar el motivo del rechazo.");

        try {
            const res = await fetch(`http://localhost:8080/api/v1/solicitudes/${tramiteSeleccionado}/responder`, {
                method: 'PUT', headers,
                body: JSON.stringify({ estado: nuevoEstado, observacion: obs || "Aprobado." })
            });

            if (res.ok) {
                alert(`Trámite ${nuevoEstado} con éxito.`);
                cerrarRevision();
                cargarBuzonSae(); 
            }
        } catch (e) { console.error(e); }
    };

    // ==========================================
    // 6. GRÁFICO CHART.JS
    // ==========================================
    let chartInstance = null;
    async function renderizarGrafico() {
        const ctx = document.getElementById('matriculasChart');
        if (!ctx) return;
        try {
            const res = await fetch('http://localhost:8080/api/v1/reportes/matriculas-chart', { headers });
            if (res.ok) {
                const data = await res.json();
                const lbls = data.length > 0 ? data.map(m => m.mes) : ['Sin Datos'];
                const dt = data.length > 0 ? data.map(m => m.total) : [0];

                if (chartInstance) chartInstance.destroy();
                chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: lbls,
                        datasets: [{
                            label: 'Matrículas', data: dt,
                            borderColor: '#0056b3', backgroundColor: 'rgba(0, 86, 179, 0.1)',
                            borderWidth: 3, tension: 0.4, fill: true,
                            pointRadius: 4
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });
            }
        } catch (error) { console.error("Error Gráfico:", error); }
    }
    let graficoFinancieroInstancia = null;

    async function renderizarGraficoFinanciero() {
        const ctx = document.getElementById('ingresosChart');
        if (!ctx) return;

        try {
            const res = await fetch('http://localhost:8080/api/v1/reportes/financiero', { headers });
            if (!res.ok) return;

            const data = await res.json();
            
            // 🔍 ESTO NOS AYUDARÁ A VER EL JSON EXACTO EN LA CONSOLA (F12)
            console.log("Datos crudos del Backend:", data); 

            const totalesPorMes = {};

            data.forEach(item => {
                // Buscamos dinámicamente la llave que contenga 'mes' y la que contenga 'ingreso' o 'total'
                const keyMes = Object.keys(item).find(k => k.toLowerCase().includes('mes'));
                const keyTotal = Object.keys(item).find(k => k.toLowerCase().includes('ingreso') || k.toLowerCase().includes('total'));

                const valorMes = item[keyMes];
                const valorTotal = item[keyTotal];

                // Parseamos la fecha soportando múltiples formatos de Spring Boot
                let fecha;
                if (Array.isArray(valorMes)) {
                    // Si Spring Boot lo manda como [2026, 5, 1]
                    fecha = new Date(valorMes[0], valorMes[1] - 1, valorMes[2]);
                } else {
                    // Si lo manda como String ("2026-05-01T00:00:00") o Timestamp (milisegundos)
                    fecha = new Date(valorMes);
                }

                let mesTexto = (fecha && !isNaN(fecha.getTime())) 
                    ? fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                    : 'Mes Desconocido';
                    
                mesTexto = mesTexto.charAt(0).toUpperCase() + mesTexto.slice(1);

                const monto = parseFloat(valorTotal || 0);

                if (totalesPorMes[mesTexto]) {
                    totalesPorMes[mesTexto] += monto;
                } else {
                    totalesPorMes[mesTexto] = monto;
                }
            });

            const etiquetasMeses = Object.keys(totalesPorMes);
            const montosDinero = Object.values(totalesPorMes);

            if (graficoFinancieroInstancia) graficoFinancieroInstancia.destroy();

            graficoFinancieroInstancia = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: etiquetasMeses,
                    datasets: [{
                        label: 'Ingresos Totales',
                        data: montosDinero,
                        backgroundColor: 'rgba(46, 204, 113, 0.8)',
                        borderColor: '#27ae60',
                        borderWidth: 1,
                        borderRadius: 6 
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { display: false },
                        tooltip: { callbacks: { label: function(c) { return ' S/ ' + c.parsed.y.toLocaleString('es-PE', { minimumFractionDigits: 2 }); } } }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: function(v) { return 'S/ ' + v; } } },
                        x: { grid: { display: false } }
                    }
                }
            });

        } catch (error) { 
            console.error("Error Crítico Gráfico Financiero:", error); 
        }
    }
    // ==========================================
    // 7. SEMÁFORO DOCENTE Y ALERTAS (BI)
    // ==========================================
    let semaforoChartInstancia = null;

    async function renderizarSemaforoDocente() {
        const ctx = document.getElementById('semaforoChart');
        if (!ctx) return;

        try {
            const res = await fetch('http://localhost:8080/api/v1/reportes/semaforo-global', { headers });
            if (!res.ok) return;
            const data = await res.json();
            
            console.log("Datos Semáforo:", data); // Para depurar

            let aTiempo = 0, porVencer = 0, retrasado = 0;

            // Agrupamos contando los estados (adaptado a los posibles nombres de columnas)
            data.forEach(item => {
                const estado = Object.values(item).join(' ').toLowerCase(); // Busca en toda la fila
                
                if (estado.includes('retrasado') || estado.includes('vencido')) {
                    retrasado++;
                } else if (estado.includes('vencer') || estado.includes('peligro') || estado.includes('alerta')) {
                    porVencer++;
                } else {
                    aTiempo++; // Si no hay problemas, está al día
                }
            });

            // Evitamos gráficos vacíos (si no hay data, ponemos 1 al día de relleno visual)
            if(aTiempo === 0 && porVencer === 0 && retrasado === 0) aTiempo = 1;

            if (semaforoChartInstancia) semaforoChartInstancia.destroy();

            semaforoChartInstancia = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Al Día', 'Por Vencer', 'Retrasados'],
                    datasets: [{
                        data: [aTiempo, porVencer, retrasado],
                        backgroundColor: ['#2ecc71', '#f1c40f', '#e74c3c'],
                        borderWidth: 0,
                        hoverOffset: 5
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '75%',
                    plugins: { legend: { position: 'bottom' } }
                }
            });

        } catch (error) { console.error("Error Semáforo:", error); }
    }

    async function cargarAlertasAcademicas() {
        const tbody = document.getElementById('cuerpo-tabla-riesgo');
        if (!tbody) return;

        try {
            // USAMOS TU ENDPOINT EXACTO: /rendimiento
            const res = await fetch('http://localhost:8080/api/v1/reportes/rendimiento', { headers });
            if (!res.ok) return;
            const data = await res.json();
            
            console.log("Datos Alertas:", data); // Para depurar

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Todo en orden. No hay alumnos en riesgo.</td></tr>';
                return;
            }

            // Inyectamos las filas dinámicamente
            tbody.innerHTML = data.slice(0, 8).map(item => {
                // Busca dinámicamente las llaves sin importar si Spring Boot las pone en mayúscula
                const keyNombre = Object.keys(item).find(k => k.toLowerCase().includes('alumno') || k.toLowerCase().includes('nombre'));
                const keyPromedio = Object.keys(item).find(k => k.toLowerCase().includes('promedio') || k.toLowerCase().includes('nota'));
                
                const nombre = item[keyNombre] || 'Alumno Desconocido';
                const promedio = parseFloat(item[keyPromedio] || 0);
                
                let motivo = "Bajo Rendimiento";
                let nivel = "ALTO RIESGO";
                let badgeColor = "badge-rejected"; // Rojo

                // Lógica de semaforización (Promedio aprobatorio en Perú suele ser 13)
                if (promedio >= 11 && promedio < 13) {
                    nivel = "RIESGO MEDIO";
                    badgeColor = "badge-admin"; // Naranja
                    motivo = "Promedio al límite";
                } else if (promedio >= 13) {
                    nivel = "REGULAR";
                    badgeColor = "badge-student"; // Azul
                    motivo = "Observación estándar";
                }

                return `
                    <tr>
                        <td><strong>${nombre}</strong></td>
                        <td>${motivo} (Prom: ${promedio.toFixed(1)})</td>
                        <td><span class="badge ${badgeColor}" style="font-size: 10px;">${nivel}</span></td>
                    </tr>
                `;
            }).join('');

        } catch (error) { console.error("Error Alertas:", error); }
    }
   // ==========================================
    // 8. EVOLUCIÓN DE MATRÍCULAS (Reutilizable y Blindado)
    // ==========================================
    async function renderizarGraficoMatriculas(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        try {
            const res = await fetch('http://localhost:8080/api/v1/reportes/matriculas-chart', { headers });
            if (!res.ok) return;
            const data = await res.json();

            const etiquetasMeses = data.map(item => {
                const keyMes = Object.keys(item).find(k => k.toLowerCase() === 'mes');
                const mesVal = item[keyMes] || '';
                
                const partes = mesVal.split('-'); 
                if (partes.length === 2) {
                    const fecha = new Date(partes[0], partes[1] - 1);
                    let mesTexto = fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
                    return mesTexto.charAt(0).toUpperCase() + mesTexto.slice(1);
                }
                return mesVal || 'Desconocido';
            });
            
            const totalesMatriculas = data.map(item => {
                const keyTotal = Object.keys(item).find(k => k.toLowerCase() === 'total');
                return parseInt(item[keyTotal] || 0);
            });

            // LA SOLUCIÓN MÁGICA: Destruir cualquier gráfico existente en este canvas
            // usando la librería Chart.js en lugar de variables globales.
            const chartExistente = Chart.getChart(canvasId);
            if (chartExistente) {
                chartExistente.destroy();
            }

            // Dibujamos
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: etiquetasMeses,
                    datasets: [{
                        label: 'Nuevas Matrículas',
                        data: totalesMatriculas,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        borderWidth: 3,
                        pointBackgroundColor: '#1d4ed8',
                        pointRadius: 5,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
                        x: { grid: { display: false } }
                    }
                }
            });

        } catch (error) { console.error("Error Gráfico Matrículas:", error); }
    }
    // ==========================================
    // 9. EXPORTACIÓN A CSV (Excel)
    // ==========================================
    window.exportarCSV = async function() {
        try {
            // Descargamos la data de rendimiento para el reporte
            const res = await fetch('http://localhost:8080/api/v1/reportes/rendimiento', { headers });
            if (!res.ok) throw new Error("No se pudo obtener la data");
            const data = await res.json();

            if (data.length === 0) return alert("No hay datos para exportar.");

            // 1. Crear las cabeceras del CSV
            let csvContent = "DNI,Alumno,Carrera,Promedio Historico,Asistencia (%)\n";

            // 2. Llenar las filas
            data.forEach(item => {
                const dni = item.dni || item.DNI || 'N/A';
                const alumno = item.alumno || item.nombre || 'Desconocido';
                const carrera = item.carrera || 'No registrada';
                const promedio = parseFloat(item.promedio_historico || item.promedio || 0).toFixed(2);
                
                const diasAsistidos = parseInt(item.dias_asistidos || 0);
                const diasTotales = parseInt(item.dias_totales || 1); // Evitar división por cero
                const porcentaje = ((diasAsistidos / diasTotales) * 100).toFixed(0);

                // Añadimos la fila escapando comas en los nombres
                csvContent += `"${dni}","${alumno}","${carrera}","${promedio}","${porcentaje}%"\n`;
            });

            // 3. Crear el archivo descargable
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Reporte_Academico_${new Date().toLocaleDateString('es-ES')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error(error);
            alert("Hubo un error al generar el archivo CSV.");
        }
    };
    // ==========================================
    // 10. EXPORTACIÓN A PDF (Pantalla Completa BI)
    // ==========================================
    window.exportarPDF = function() {
        // Seleccionamos todo el contenedor de los reportes
        const elemento = document.getElementById('seccion-reportes');
        
        // Ocultamos temporalmente los botones de descarga para que no salgan impresos en el PDF
        const botonesHeader = elemento.querySelector('.welcome-header div:nth-child(2)');
        if (botonesHeader) botonesHeader.style.display = 'none';

        // Configuración profesional del PDF
        const opciones = {
            margin:       10,
            filename:     `Reporte_BI_Jhalebet_${new Date().toLocaleDateString('es-ES')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true }, // scale 2 mejora la nitidez de los gráficos
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Generamos el PDF
        html2pdf().set(opciones).from(elemento).save().then(() => {
            // Cuando termina la descarga, volvemos a mostrar los botones
            if (botonesHeader) botonesHeader.style.display = 'flex';
        });
    };

    // ==========================================
    // LÓGICA DE FINANZAS - ADMIN
    // ==========================================

    async function cargarFinanzas() {
        const cuerpoTabla = document.getElementById('cuerpo-tabla-finanzas');
        if (!cuerpoTabla) return;

        try {
            // Consultamos las cuotas PENDIENTES o VENCIDAS
            const res = await fetch('http://localhost:8080/api/v1/cuotas/todas', { headers });
            
            // ==========================================
            // 🛡️ ESCUDO ANTI-CRASH (NUEVO)
            // ==========================================
            if (!res.ok) {
                // Si el servidor falla (Error 500), atrapamos el mensaje
                const errorData = await res.json().catch(() => ({})); 
                console.error("Detalle del error del Servidor:", errorData);
                
                // Mostramos el error en la tabla en lugar de dejarla en blanco
                cuerpoTabla.innerHTML = `
                    <tr>
                        <td colspan="6" style="color: #b71c1c; background-color: #fee2e2; text-align: center; font-weight: bold; padding: 20px; border-radius: 8px;">
                            ⚠️ No se pudieron cargar las finanzas (Error ${res.status}).<br>
                            <span style="font-size: 12px; font-weight: normal;">Revisa la consola de VSCode. Es probable que PostgreSQL esté bloqueando la consulta.</span>
                        </td>
                    </tr>`;
                return; // ⛔ ESTO ES VITAL: Detiene la función para que no llegue al .map() y explote
            }

            // Si la respuesta es exitosa (200 OK), procesamos la lista
            const cuotas = await res.json();

            if (cuotas.length === 0) {
                cuerpoTabla.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">No hay pagos pendientes.</td></tr>`;
                return;
            }

            // Dibujamos los datos en la tabla
            cuerpoTabla.innerHTML = cuotas.map(c => `
            <tr>
                <td><strong>Estudiante ID: ${c.idAlumno}</strong></td>
                <td>${c.cicloAcademico}</td>
                <td>${c.mesCorrespondiente}</td>
                <td class="font-bold" style="color: #2e7d32;">S/ ${c.montoTotal.toFixed(2)}</td>
                <td><span class="badge ${c.estado.toLowerCase()}">${c.estado}</span></td>
                <td>
                    ${c.estado === 'PAGADO' 
                        ? `<span style="color: #64748b; font-size: 12px; font-weight: 600;"><i class="fa-solid fa-check-double"></i> Cancelado</span>`
                        : `<button class="btn-primary" style="padding: 4px 12px; font-size: 11px;" 
                                onclick="ejecutarCobroManual(${c.idCuota}, ${c.montoTotal})">
                            <i class="fa-solid fa-money-bill-check"></i> Cobrar
                           </button>`
                    }
                </td>
            </tr>
        `).join('');

        } catch (error) {
            console.error("Error crítico de red al cargar finanzas:", error);
            cuerpoTabla.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Error de conexión con el servidor backend.</td></tr>`;
        }
    }

    // Función global para procesar el pago desde el botón
    window.ejecutarCobroManual = async (idCuota, monto) => {
        if (!confirm(`¿Confirmar cobro de S/ ${monto} en EFECTIVO para la cuota #${idCuota}?`)) return;

        try {
            const res = await fetch('http://localhost:8080/api/v1/pagos/pagar', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    idCuota: idCuota,
                    monto: monto,
                    metodoPago: 'EFECTIVO'
                })
            });

            if (res.ok) {
                alert("¡Pago registrado y deuda saldada!");
                cargarFinanzas(); // Recargamos para que desaparezca de la lista
            } else {
                alert("Hubo un problema al registrar el pago.");
            }
        } catch (error) {
            alert("Error de conexión con el servidor.");
        }
    };

    // Inicializar arranque
    inicializarAdmin();
    renderizarGrafico();
});