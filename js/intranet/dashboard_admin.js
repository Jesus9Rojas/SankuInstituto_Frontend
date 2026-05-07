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

            // --- LO QUE FALTA ---
            if(targetId === 'seccion-inicio') renderizarGrafico();
            
            // Disparador para cargar las deudas desde PostgreSQL
            if(targetId === 'seccion-finanzas') {
                console.log("Cargando módulo de finanzas...");
                cargarFinanzas(); 
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
            e.preventDefault(); localStorage.clear(); window.location.href = "/html/index.html";
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

        // --- C. Cargar Buzón SAE (Peticiones) ---
        fetch('http://localhost:8080/api/v1/solicitudes/pendientes', { headers })
            .then(res => res.json())
            .then(solicitudes => {
                // 1. Llenar el cuadro de resumen pequeño
                const preview = document.getElementById("lista-tramites-preview");
                if(preview) {
                    preview.innerHTML = solicitudes.length === 0 ? '<p class="text-center text-muted" style="padding: 20px;">Bandeja limpia.</p>' :
                        solicitudes.slice(0,3).map(s => `
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
                
                // 2. LLENAR LA TABLA PRINCIPAL DEL BUZÓN (Esto es lo que faltaba)
                const tablaSae = document.getElementById("tabla-solicitudes-body");
                if (tablaSae) {
                    tablaSae.innerHTML = solicitudes.length === 0 ? '<tr><td colspan="6" class="text-center text-muted" style="padding: 30px;">No hay trámites pendientes.</td></tr>' :
                        solicitudes.map(s => `
                            <tr>
                                <td><strong>#TRM-${s.idSolicitud}</strong></td>
                                <td>${new Date(s.fechaSolicitud).toLocaleDateString('es-ES')}</td>
                                <td>${s.nombreEmisor}</td>
                                <td>${s.tipo}</td>
                                <td><span class="badge badge-admin">${s.estado}</span></td>
                                <td style="text-align: right;"><button class="btn-primary" style="padding: 5px 15px; font-size: 12px; border-radius: 6px;" onclick='abrirRevision(${JSON.stringify(s)})'>Revisar</button></td>
                            </tr>
                        `).join('');
                }
            })
            .catch(e => console.error("Error SAE:", e));

        // Cargar tabla de gestión de usuarios
        cargarUsuarios();
    }

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
                inicializarAdmin(); 
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