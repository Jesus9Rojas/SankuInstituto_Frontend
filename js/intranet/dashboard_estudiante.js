document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. VERIFICAR SESIÓN SEGURA
    // ==========================================
    const sesionActiva = localStorage.getItem("sesionActiva");
    const rolUsuario = localStorage.getItem("usuarioRol");
    
    if (!sesionActiva || rolUsuario !== "alumno") {
        window.location.href = "/html/login.html"; 
        return;
    }

    const token = localStorage.getItem("token");
    const usuarioId = localStorage.getItem("usuarioId");
    let idAlumnoGlobal = null;
    let infoCursosGlobal = [];
    let misSeccionesGlobal = [];
    let idsCursosValidosGlobal = [];
    let añoIngreso = null;

    // 2. Nombre del usuario
    const nombreUsuario = localStorage.getItem("usuarioNombre");
    if (nombreUsuario) {
        const primerNombre = nombreUsuario.split(' ')[0];
        const spanNombre = document.getElementById("userNameHeader");
        if(spanNombre) spanNombre.textContent = primerNombre;

        const perfilFull = document.getElementById("perfilFullName");
        if(perfilFull) perfilFull.textContent = nombreUsuario;
        
        const spanInitial = document.getElementById("userInitial");
        if(spanInitial) spanInitial.textContent = primerNombre.charAt(0).toUpperCase();
    }

    // ==========================================
    // 3. UI Y NAVEGACIÓN
    // ==========================================
    const btnMenuToggle = document.getElementById("btnMenuToggle");
    const portalLayout = document.getElementById("portalLayout");
    if (btnMenuToggle && portalLayout) {
        btnMenuToggle.addEventListener("click", () => portalLayout.classList.toggle("sidebar-collapsed"));
    }

    const navTriggers = document.querySelectorAll(".menu-btn, .nav-trigger");
    const sections = document.querySelectorAll(".content-section");
    const menuBtns = document.querySelectorAll(".menu-btn");

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
        });
    });

    const btnDropdownChevron = document.getElementById("btnDropdownChevron");
    const menuPerfil = document.getElementById("menuPerfil");
    if(btnDropdownChevron && menuPerfil) {
        btnDropdownChevron.addEventListener("click", (e) => {
            e.stopPropagation();
            menuPerfil.classList.toggle("show");
        });
        document.addEventListener("click", (e) => {
            if (!menuPerfil.contains(e.target) && e.target !== btnDropdownChevron) menuPerfil.classList.remove("show");
        });
    }
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", (e) => {
            e.preventDefault();

            localStorage.removeItem("token");
            localStorage.removeItem("usuarioId");
            localStorage.removeItem("usuarioRol");
            localStorage.removeItem("usuarioNombre");
            localStorage.removeItem("sesionActiva");
            
            window.location.href = "/html/index.html";
        });
    }

    // ==========================================
    // 4. LÓGICA CORE: CARGA DINÁMICA
    // ==========================================
    const agendaHoyList = document.getElementById("agenda-hoy-list");
    const gridMisCursos = document.getElementById("grid-mis-cursos");
    const diasSemana = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const coloresCursos = ['#0056b3', '#f39c12', '#00897b', '#9b59b6', '#e74c3c'];

    async function cargarDatosGlobales() {
        if (!usuarioId) return;

        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            // Perfil del Alumno
            const resPerfil = await fetch(`http://localhost:8080/api/v1/alumnos/perfil/${usuarioId}`, { headers });
            if (!resPerfil.ok) throw new Error("No se pudo cargar el perfil");
            const perfil = await resPerfil.json();
            
            document.getElementById("profileFullname").textContent = perfil.usuario.nombreCompleto;
            document.getElementById("profileDni").textContent = perfil.usuario.dni;
            document.getElementById("profileEmail").textContent = perfil.usuario.email;
            document.getElementById("profileCarrera").textContent = perfil.nombreCarrera;
            document.getElementById("profileEstado").textContent = perfil.estado;
            document.getElementById("profileIngreso").textContent = new Date(perfil.fechaIngreso + "T00:00:00").toLocaleDateString('es-ES');
            document.getElementById("metric-promedio").textContent = perfil.promedioHistorico;

            idAlumnoGlobal = perfil.idAlumno;
            añoIngreso = new Date(perfil.fechaIngreso + "T00:00:00").getFullYear();

            // Cursos y Secciones
            const resCarreras = await fetch(`http://localhost:8080/api/v1/carreras`, { headers });
            const carreras = await resCarreras.json();
            const miCarrera = carreras.find(c => c.nombre === perfil.nombreCarrera);
            
            const resCursos = await fetch(`http://localhost:8080/api/v1/cursos`, { headers });
            infoCursosGlobal = await resCursos.json();
            
            const misCursosValidos = infoCursosGlobal.filter(c => c.carreraId === miCarrera.idCarrera);
            const idsCursosValidos = misCursosValidos.map(c => c.idCurso);
            idsCursosValidosGlobal = idsCursosValidos;

            const resSeccionesI = await fetch(`http://localhost:8080/api/v1/secciones/ciclo/2026-I`, { headers });
            const todasSeccionesI = await resSeccionesI.json();
            const miHorarioActual = todasSeccionesI.filter(s => idsCursosValidos.includes(s.cursoId));

            const resSeccionesII = await fetch(`http://localhost:8080/api/v1/secciones/ciclo/2026-II`, { headers });
            let miMatriculaFutura = [];
            if(resSeccionesII.ok) {
                const todasSeccionesII = await resSeccionesII.json();
                miMatriculaFutura = todasSeccionesII.filter(s => idsCursosValidos.includes(s.cursoId));
            }

            // Renderizados
            misSeccionesGlobal = miHorarioActual;
            renderizarAgendaHoy(miHorarioActual);
            renderizarMisCursos(miHorarioActual);
            renderizarCalendarioGrid(miHorarioActual);
            renderizarMatricula(miMatriculaFutura, misCursosValidos);
            renderizarPillsCiclos(generarCiclos(añoIngreso), '2026-I');

            cargarProximoPago(idAlumnoGlobal, headers);
            cargarMisTramites();

        } catch (e) {
            console.error("Error cargando los datos:", e);
        }
    }


    // ==========================================
    // 5. TRÁMITES Y NOTIFICACIONES
    // ==========================================
    async function cargarMisTramites() {
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        try {
            const res = await fetch(`http://localhost:8080/api/v1/solicitudes/mis-solicitudes/${usuarioId}`, { headers });
            if (res.ok) {
                const solicitudes = await res.json();
                const tablaBody = document.getElementById("tabla-mis-tramites-body");
                const bellBadge = document.getElementById("badge-notif"); 
                const listaNotif = document.getElementById("lista-notificaciones");
                const btnLimpiar = document.getElementById("btnLimpiarNotif");

                if (!tablaBody) return;

                if (solicitudes.length === 0) {
                    tablaBody.innerHTML = '<tr><td colspan="6" class="text-center">No has realizado trámites aún.</td></tr>';
                    return;
                }

                // 🚀 LÓGICA DE NOTIFICACIONES CON "LEÍDO"
                // Obtenemos los IDs de las notificaciones que el alumno ya cerró
                let notificacionesLeidas = JSON.parse(localStorage.getItem(`notif_leidas_${usuarioId}`)) || [];
                
                // Filtramos: Que no estén PENDIENTES y que NO estén en la lista de leídas
                const respondidosNuevos = solicitudes.filter(s => s.estado !== "PENDIENTE" && !notificacionesLeidas.includes(s.idSolicitud));
                
                if (respondidosNuevos.length > 0 && bellBadge) {
                    bellBadge.style.display = "flex";
                    bellBadge.style.position = "absolute";
                    bellBadge.style.top = "-5px";
                    bellBadge.style.right = "-5px";
                    bellBadge.style.backgroundColor = "#ff4d4d";
                    bellBadge.style.color = "white";
                    bellBadge.style.borderRadius = "50%";
                    bellBadge.style.width = "18px";
                    bellBadge.style.height = "18px";
                    bellBadge.style.fontSize = "11px";
                    bellBadge.style.fontWeight = "bold";
                    bellBadge.style.alignItems = "center";
                    bellBadge.style.justifyContent = "center";
                    bellBadge.textContent = respondidosNuevos.length;
                    
                    if (btnLimpiar) btnLimpiar.style.display = "block";

                    if(listaNotif) {
                        listaNotif.innerHTML = respondidosNuevos.map(r => `
                            <div id="notif-item-${r.idSolicitud}" style="padding: 12px; border-bottom: 1px solid #f1f5f9; cursor:pointer; background-color: #f8fafc; border-radius: 6px; margin-bottom: 5px; position: relative;">
                                <div onclick="document.querySelector('[data-target=\\'seccion-tramites\\']').click(); document.getElementById('notif-dropdown').style.display='none';">
                                    <small style="color:var(--color-primary); font-weight:700;">ACTUALIZACIÓN SAE</small>
                                    <p style="margin:5px 0 0 0; font-size:12px; color:#334155;">Tu solicitud <strong>#TRM-${r.idSolicitud}</strong> fue <strong>${r.estado}</strong></p>
                                </div>
                                <button onclick="marcarNotificacionLeida(event, ${r.idSolicitud})" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px;">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        `).join('');
                    }
                } else {
                    if (bellBadge) bellBadge.style.display = "none";
                    if (btnLimpiar) btnLimpiar.style.display = "none";
                    if (listaNotif) listaNotif.innerHTML = '<p class="text-muted text-center" style="font-size:12px; margin: 20px 0;">No tienes notificaciones nuevas.</p>';
                }

                // Llenar tabla del Buzón
                tablaBody.innerHTML = solicitudes.map(s => {
                    let statusClass = "badge-pending";
                    if (s.estado === "APROBADO") statusClass = "badge-success";
                    if (s.estado === "RECHAZADO") statusClass = "badge-danger";

                    return `
                    <tr>
                        <td><strong>#TRM-${s.idSolicitud}</strong></td>
                        <td>${new Date(s.fechaSolicitud).toLocaleDateString()}</td>
                        <td>${s.tipo}</td>
                        <td>${s.cursoYSeccion || 'N/A'}</td>
                        <td><span class="badge ${statusClass}">${s.estado}</span></td>
                        <td style="text-align: right;">
                            <button class="btn-info-small" style="padding: 6px 12px; border-radius: 6px; font-weight: 500;" onclick='verDetalleTramite(${JSON.stringify(s)})'>
                                <i class="fa-solid fa-eye"></i> Detalle
                            </button>
                        </td>
                    </tr>
                    `;
                }).join('');
            }
        } catch (error) { console.error("Error al cargar trámites:", error); }
    }

    // 🚀 NUEVA FUNCIÓN: Ocultar una notificación específica
    window.marcarNotificacionLeida = function(event, idSolicitud) {
        event.stopPropagation(); // Evita que se abra la sección de trámites al darle a la X
        
        // Guardar el ID en el localStorage para no volver a mostrarlo
        let leidas = JSON.parse(localStorage.getItem(`notif_leidas_${usuarioId}`)) || [];
        if (!leidas.includes(idSolicitud)) {
            leidas.push(idSolicitud);
            localStorage.setItem(`notif_leidas_${usuarioId}`, JSON.stringify(leidas));
        }
        
        // Efecto visual de desvanecimiento
        const item = document.getElementById(`notif-item-${idSolicitud}`);
        if(item) {
            item.style.opacity = '0';
            setTimeout(() => {
                item.remove();
                cargarMisTramites(); // Recalcular el número en la campana
            }, 200);
        }
    };

    // Botón para limpiar todas las notificaciones de golpe
    document.getElementById("btnLimpiarNotif")?.addEventListener("click", () => {
        // En lugar de borrar una a una, forzamos a que todas las visibles se marquen
        const headers = { 'Authorization': `Bearer ${token}` };
        fetch(`http://localhost:8080/api/v1/solicitudes/mis-solicitudes/${usuarioId}`, { headers })
            .then(res => res.json())
            .then(solicitudes => {
                let leidas = solicitudes.filter(s => s.estado !== "PENDIENTE").map(s => s.idSolicitud);
                localStorage.setItem(`notif_leidas_${usuarioId}`, JSON.stringify(leidas));
                cargarMisTramites();
            });
    });

    // 🚀 NUEVA FUNCIÓN: ABRIR MODAL DE DETALLES DEL TRÁMITE
    window.verDetalleTramite = function(s) {
        document.getElementById("detalleTramiteId").textContent = `#TRM-${s.idSolicitud}`;
        
        const badgeEstado = document.getElementById("detalleTramiteEstado");
        badgeEstado.textContent = s.estado;
        
        // Pinta el badge del modal del color correcto
        badgeEstado.className = "badge"; // Reset clases
        if (s.estado === "APROBADO") badgeEstado.classList.add("badge-success");
        else if (s.estado === "RECHAZADO") badgeEstado.classList.add("badge-danger");
        else badgeEstado.classList.add("badge-pending");

        const fechaRes = s.fechaRespuesta ? new Date(s.fechaRespuesta).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : "Aún sin respuesta";
        document.getElementById("detalleTramiteFecha").textContent = fechaRes;

        const obsContainer = document.getElementById("detalleTramiteObs");
        if (s.observacionCoordinador) {
            obsContainer.innerHTML = s.observacionCoordinador;
            obsContainer.style.fontStyle = "normal";
            obsContainer.style.color = "#334155";
        } else {
            obsContainer.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i> Tu solicitud está en bandeja de entrada esperando ser revisada por la coordinación académica.';
            obsContainer.style.fontStyle = "italic";
            obsContainer.style.color = "#94a3b8";
        }

        document.getElementById("modalDetalleTramite").classList.add("show");
    };

    window.abrirModalTramite = function() {
        const form = document.getElementById("formNuevoTramite");
        if(form) form.reset();
        const selSeccion = document.getElementById("tramiteSeccion");
        if(selSeccion) {
            selSeccion.innerHTML = '<option value="">Ninguno / Consulta General</option>' + 
                misSeccionesGlobal.map(s => `<option value="${s.idSeccion}">${s.nombreCurso}</option>`).join('');
        }
        document.getElementById("modalNuevoTramite").classList.add("show");
    }

    const formTramite = document.getElementById("formNuevoTramite");
    if(formTramite) {
        formTramite.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = document.getElementById("btnEnviarTramite");
            btn.disabled = true;

            const idSec = document.getElementById("tramiteSeccion").value;
            const payload = {
                emisorId: parseInt(usuarioId),
                tipo: document.getElementById("tramiteTipo").value,
                seccionId: (idSec && idSec !== "") ? parseInt(idSec) : null,
                descripcion: document.getElementById("tramiteDesc").value
            };

            try {
                const res = await fetch('http://localhost:8080/api/v1/solicitudes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if(res.ok) {
                    alert("¡Solicitud enviada!");
                    document.getElementById("modalNuevoTramite").classList.remove("show");
                    cargarMisTramites(); 
                } else { alert("Ocurrió un problema al enviar el trámite."); }
            } catch(err) { alert("Error de conexión."); } 
            finally { btn.disabled = false; }
        });
    }

    // ==========================================
    // 6. FINANZAS Y PAGOS
    // ==========================================
    async function cargarProximoPago(idAlum, headers) {
        const resPagos = await fetch(`http://localhost:8080/api/v1/cuotas/alumno/${idAlum}`, { headers });
        if(resPagos.ok) {
            const cuotas = await resPagos.json();
            const cuotasPendientes = cuotas.filter(c => c.estado === 'PENDIENTE' || c.estado === 'VENCIDO');
            const cuotasPagadas = cuotas.filter(c => c.estado === 'PAGADO');

            const deudasBloqueantes = cuotasPendientes.filter(c => c.estado === 'VENCIDO' || (c.estado === 'PENDIENTE' && c.mesCorrespondiente.includes("Matrícula")));
            renderizarEstadoMatricula(deudasBloqueantes);

            const listaHistorial = document.getElementById("lista-historial-pagos");
            if (listaHistorial) {
                if (cuotasPagadas.length === 0) {
                    listaHistorial.innerHTML = `<p class="text-muted text-center" style="padding: 20px;">Aún no tienes pagos registrados.</p>`;
                } else {
                    listaHistorial.innerHTML = cuotasPagadas.map(c => `
                        <div class="pago-row" style="display: flex; justify-content: space-between; padding: 15px 20px; border-bottom: 1px solid #eee;">
                            <div>
                                <h4 style="margin: 0 0 5px 0; color: #333;">${c.mesCorrespondiente}</h4>
                                <span style="font-size: 12px; color: #888;">Ciclo: ${c.cicloAcademico}</span>
                            </div>
                            <div style="text-align: right;">
                                <strong style="display: block; font-size: 16px;">S/ ${c.montoTotal.toFixed(2)}</strong>
                                <span style="font-size: 11px; background: #e6f4ea; color: #1e8e3e; padding: 2px 8px; border-radius: 10px; font-weight: 600;">Pagado</span>
                            </div>
                        </div>
                    `).join('');
                }
            }

            const listaPendientes = document.getElementById("lista-deudas-pendientes");
            const btnPasarela = document.getElementById("btnIrPasarela");
            const lblTotal = document.getElementById("total-pago-seleccionado");

            if(cuotasPendientes.length > 0) {
                cuotasPendientes.sort((a,b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));
                
                listaPendientes.innerHTML = cuotasPendientes.map((c, i) => {
                    const isVencido = c.estado === 'VENCIDO';
                    const bgBadge = isVencido ? 'background: #ffebee; color: #dc3545;' : 'background: #e8f4fd; color: #0056b3;';
                    return `
                    <label style="display: flex; align-items: center; justify-content: space-between; padding: 15px; border: 1px solid #ddd; border-radius: 8px; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <input type="checkbox" class="chk-cuota" data-id="${c.idCuota}" data-concepto="${c.mesCorrespondiente}" data-monto="${c.montoTotal}" style="width: 18px; height: 18px; accent-color: var(--color-primary);">
                            <div>
                                <h4 style="margin: 0 0 5px 0; font-size: 15px;">${c.mesCorrespondiente}</h4>
                                <span style="font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 600; ${bgBadge}">Vence: ${c.fechaVencimiento} ${isVencido ? '(VENCIDO)' : ''}</span>
                            </div>
                        </div>
                        <strong style="font-size: 16px; color: #222;">S/ ${c.montoTotal.toFixed(2)}</strong>
                    </label>`;
                }).join('');

                function calcularTotal() {
                    let total = 0;
                    let cuotasSeleccionadas = [];
                    document.querySelectorAll('.chk-cuota:checked').forEach(chk => {
                        total += parseFloat(chk.getAttribute('data-monto'));
                        cuotasSeleccionadas.push({
                            id: chk.getAttribute('data-id'), concepto: chk.getAttribute('data-concepto'), monto: chk.getAttribute('data-monto')
                        });
                    });
                    lblTotal.textContent = `S/ ${total.toFixed(2)}`;
                    btnPasarela.disabled = cuotasSeleccionadas.length === 0;
                    
                    localStorage.setItem("pasarela_cuotas_array", JSON.stringify(cuotasSeleccionadas));
                    localStorage.setItem("pasarela_total_suma", total.toFixed(2));
                }

                document.querySelectorAll('.chk-cuota').forEach(chk => chk.addEventListener('change', calcularTotal));
                btnPasarela.onclick = () => { window.location.href = "pasarela.html"; };

            } else {
                listaPendientes.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px;">
                        <i class="fa-solid fa-face-smile text-success" style="font-size: 40px; margin-bottom: 15px;"></i>
                        <h4 style="color: #28a745;">¡Estás al día!</h4>
                        <p class="text-muted">No registras cuotas pendientes.</p>
                    </div>`;
                lblTotal.textContent = "S/ 0.00";
                btnPasarela.disabled = true;
            }
        }
    }

    // ... (El resto de funciones de renderizarMatricula, renderizarAgendaHoy y renderizarCalendarioGrid se mantienen igual) ...
    function renderizarEstadoMatricula(deudas) {
        const step1 = document.getElementById("mat-step-1");
        if (!step1) return;

        if (deudas.length > 0) {
            step1.innerHTML = `
                <div style="display: flex; align-items: center; gap: 20px; background: #fff3f3; border: 1px solid #ffcaca; padding: 25px; border-radius: 8px;">
                    <i class="fa-solid fa-circle-xmark text-danger" style="font-size: 40px;"></i>
                    <div>
                        <h3 style="color: #dc3545; margin-bottom: 5px;">No habilitado para matrícula</h3>
                        <p style="color: #555;">Registras <strong>${deudas.length} cuota(s) pendiente(s)</strong>. Por reglamento, debes regularizar tus pagos en la sección de Finanzas para poder habilitar tu selección de cursos.</p>
                    </div>
                </div>
                <div style="margin-top: 30px; text-align: right;">
                    <button class="btn-entrar-curso" onclick="document.querySelector('.menu-btn[data-target=\\'seccion-pagos\\']').click();" >
                        <i class="fa-solid fa-wallet"></i> Pagar mi deuda
                    </button>
                </div>
            `;
        } else {
            step1.innerHTML = `
                <div style="display: flex; align-items: center; gap: 20px; background: #f0fdf4; border: 1px solid #c3e6cb; padding: 25px; border-radius: 8px;">
                    <i class="fa-solid fa-circle-check text-success" style="font-size: 40px;"></i>
                    <div>
                        <h3 style="color: #28a745; margin-bottom: 5px;">Habilitado para matrícula</h3>
                        <p style="color: #555;">No registras deudas pendientes ni bloqueos académicos. Puedes proceder a seleccionar tus cursos del ciclo 2026-II.</p>
                    </div>
                </div>
                <div style="margin-top: 30px; text-align: right;">
                    <button class="btn-entrar-curso" id="btnMatPaso2" style="font-size: 16px; padding: 12px 30px;">Siguiente Paso <i class="fa-solid fa-arrow-right"></i></button>
                </div>
            `;
            
            document.getElementById("btnMatPaso2").addEventListener("click", () => {
                document.getElementById("mat-step-1").style.display = "none";
                document.getElementById("mat-step-2").style.display = "block";
            });
        }
    }

    window.irAPasarela = function(idCuota, concepto, monto) {
        localStorage.setItem("pasarela_idCuota", idCuota);
        localStorage.setItem("pasarela_concepto", concepto);
        localStorage.setItem("pasarela_monto", monto);
        window.location.href = "pasarela.html";
    };

    function formatearHora(horaStr) { return horaStr ? horaStr.substring(0, 5) : "--:--"; }

    function renderizarAgendaHoy(secciones) {
        if (!agendaHoyList) return;
        let diaActual = new Date().getDay();
        diaActual = diaActual === 0 ? 7 : diaActual; 

        const cursosDeHoy = secciones.filter(s => s.diaSemana === diaActual);
        document.getElementById("metric-clases-hoy").textContent = `${cursosDeHoy.length} Sesiones`;

        if (cursosDeHoy.length === 0) {
            agendaHoyList.innerHTML = `<p class="text-center text-muted" style="padding: 20px;">¡Día libre! No tienes clases hoy.</p>`;
            return;
        }

        agendaHoyList.innerHTML = cursosDeHoy.map((s, idx) => `
            <div class="agenda-item">
                <div class="agenda-time">
                    <span class="time-start">${formatearHora(s.horaInicio)}</span>
                    <span class="time-end">${formatearHora(s.horaFin)}</span>
                </div>
                <div class="agenda-details">
                    <h4>${s.nombreCurso}</h4>
                    <p><i class="fa-solid ${s.modalidad === 'VIRTUAL' ? 'fa-laptop' : 'fa-location-dot'}"></i> ${s.modalidad} — Prof. ${s.nombreDocente.split(" ")[0]}</p>
                </div>
                <button class="btn-outline-small" onclick="abrirDetalleCursoPorNombre('${s.nombreCurso}', '${s.modalidad}')">Ver Info</button>
            </div>
        `).join('');
    }

    function renderizarMisCursos(secciones) {
        if (!gridMisCursos) return;
        if (secciones.length === 0) {
            gridMisCursos.innerHTML = `<p class="text-muted" style="grid-column: 1/-1;">No hay cursos programados para ti en 2026-I.</p>`;
            return;
        }

        gridMisCursos.innerHTML = secciones.map((s, idx) => {
            const colorFondo = coloresCursos[s.cursoId % coloresCursos.length];
            return `
            <div class="curso-modern-card shadow-card bg-card">
                <div class="curso-color-top" style="background-color:${colorFondo};"></div>
                <div class="curso-modern-body">
                    <h4 style="font-size: 16px; margin-bottom: 5px;">${s.nombreCurso}</h4>
                    <p class="prof-name">Prof. ${s.nombreDocente}</p>
                    <div class="curso-stats">
                        <div class="stat"><span>Día</span><strong>${diasSemana[s.diaSemana]}</strong></div>
                        <div class="stat"><span>Modalidad</span><strong>${s.modalidad}</strong></div>
                    </div>
                    <button class="btn-entrar-curso full-width mt-15" onclick="abrirDetalleCursoPorNombre('${s.nombreCurso}', '${s.modalidad}')">Entrar al Curso</button>
                </div>
            </div>`;
        }).join('');
    }

   function renderizarCalendarioGrid(secciones) {
        const calBody = document.getElementById("calendario-body");
        if (!calBody) return;

        if (secciones.length === 0) {
            calBody.innerHTML = `<div style="grid-column: 1 / -1; grid-row: 2; padding: 40px; text-align: center; background: white; color: #888;">No tienes horarios programados.</div>`;
            return;
        }

        let minHora = 24;
        let maxHora = 0;

        secciones.forEach(s => {
            const hInicio = parseInt(s.horaInicio.split(":")[0]);
            const hFin = parseInt(s.horaFin.split(":")[0]) + (s.horaFin.split(":")[1] > "00" ? 1 : 0); 
            if (hInicio < minHora) minHora = hInicio;
            if (hFin > maxHora) maxHora = hFin;
        });

        if (minHora > 8) minHora = 8;
        if (maxHora < 15) maxHora = 15;

        let htmlGrid = '';

        for (let horaActual = minHora; horaActual < maxHora; horaActual++) {
            const fila = horaActual - minHora + 2; 
            const horaTexto = `${horaActual.toString().padStart(2, '0')}:00`;
            
            htmlGrid += `<div class="cal-celda-hora" style="grid-column: 1; grid-row: ${fila};">${horaTexto}</div>`;
            
            for (let dia = 1; dia <= 7; dia++) {
                htmlGrid += `<div class="cal-celda-vacia" style="grid-column: ${dia + 1}; grid-row: ${fila};"></div>`;
            }
        }

        for (let dia = 1; dia <= 7; dia++) {
            let cursosDia = secciones.filter(s => s.diaSemana === dia);
            if (cursosDia.length === 0) continue;

            let cursosMapeados = cursosDia.map(c => {
                return {
                    ...c,
                    startDecimal: parseInt(c.horaInicio.split(":")[0]) + (parseInt(c.horaInicio.split(":")[1]) / 60),
                    endDecimal: parseInt(c.horaFin.split(":")[0]) + (parseInt(c.horaFin.split(":")[1]) / 60)
                };
            }).sort((a, b) => a.startDecimal - b.startDecimal);

            let clusters = [];
            let clusterActual = [cursosMapeados[0]];

            for (let i = 1; i < cursosMapeados.length; i++) {
                let curso = cursosMapeados[i];
                let finMaximoDelCluster = Math.max(...clusterActual.map(c => c.endDecimal));
                
                if (curso.startDecimal < finMaximoDelCluster) {
                    clusterActual.push(curso);
                } else {
                    clusters.push(clusterActual);
                    clusterActual = [curso];
                }
            }
            clusters.push(clusterActual);

            clusters.forEach(cluster => {
                let inicioFila = Math.floor(Math.min(...cluster.map(c => c.startDecimal))) - minHora + 2;
                let finFila = Math.ceil(Math.max(...cluster.map(c => c.endDecimal))) - minHora + 2;
                let spanFilas = finFila - inicioFila;

                if (cluster.length === 1) {
                    let c = cluster[0];
                    const colorFondo = coloresCursos[c.cursoId % coloresCursos.length];
                    
                    htmlGrid += `
                    <div class="cal-curso-bloque" onclick="abrirDetalleCursoPorNombre('${c.nombreCurso}', '${c.modalidad}')" 
                         style="grid-column: ${dia + 1}; grid-row: ${inicioFila} / span ${spanFilas}; background-color: ${colorFondo};">
                        <div class="cal-curso-titulo">${c.nombreCurso}</div>
                        <div class="cal-curso-info">
                            <i class="fa-regular fa-clock"></i> ${formatearHora(c.horaInicio)} - ${formatearHora(c.horaFin)}<br>
                            <i class="fa-solid ${c.modalidad === 'VIRTUAL' ? 'fa-laptop' : 'fa-location-dot'}"></i> ${c.modalidad}
                        </div>
                    </div>`;
                } else {
                    let htmlNombresCursos = cluster.map(c => `<b>${c.nombreCurso}</b><br><span style="font-size:10px;">(${formatearHora(c.horaInicio)} a ${formatearHora(c.horaFin)})</span>`).join('<hr style="border-color: rgba(255,255,255,0.3); margin: 6px 0;">');

                    htmlGrid += `
                    <div class="cal-curso-bloque" 
                         style="grid-column: ${dia + 1}; grid-row: ${inicioFila} / span ${spanFilas}; background-color: #dc3545; border: 2px solid darkred;">
                        <div class="cal-curso-titulo" style="text-align:center; font-size:14px; margin-bottom:8px;">
                            <i class="fa-solid fa-triangle-exclamation"></i> CRUCE
                        </div>
                        <div class="cal-curso-info" style="text-align:center;">
                            ${htmlNombresCursos}
                        </div>
                    </div>`;
                }
            });
        }

        calBody.innerHTML = htmlGrid;
    }

    window.abrirDetalleCursoPorNombre = function(nombreCurso, modalidad) {
        const curso = infoCursosGlobal.find(c => c.nombre === nombreCurso);
        if(!curso) return;

        document.getElementById("modalCursoTitulo").textContent = curso.nombre;
        document.getElementById("modalCursoCreditos").textContent = "Créditos: " + curso.creditos;
        document.getElementById("modalCursoModalidad").textContent = "Modalidad: " + modalidad;
        
        document.getElementById("modalCursoDesc").innerHTML = curso.descripcionInformativa || "Este curso aún no tiene una descripción informativa cargada.";
        document.getElementById("modalCursoTemario").innerHTML = curso.temarioUrl || "El sílabo aún no se ha adjuntado.";

        document.getElementById("modalDetalleCurso").classList.add("show");
    };

    window.cerrarModal = function(idModal) {
        document.getElementById(idModal).classList.remove("show");
    };

    // ==========================================
    // 7. MATRÍCULA WIZARD DINÁMICO
    // ==========================================
    const btnMatPaso2 = document.getElementById("btnMatPaso2");
    const btnMatVolver1 = document.getElementById("btnMatVolver1");
    const btnConfirmarMatricula = document.getElementById("btnConfirmarMatricula");
    const step1 = document.getElementById("mat-step-1");
    const step2 = document.getElementById("mat-step-2");
    const step3 = document.getElementById("mat-step-3");

   
    if (btnMatVolver1) btnMatVolver1.addEventListener("click", () => { step2.style.display = "none"; step1.style.display = "block"; });

    function renderizarMatricula(secciones2026II, infoCursos) {
        const step1 = document.getElementById("mat-step-1");
        const listContainer = document.getElementById("lista-matricula-proximo");
        if(!listContainer) return;

        if (misSeccionesGlobal.length === 0) {
            if(step1) {
                step1.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 20px; background: #e8f4fd; border: 1px solid #b8daff; padding: 25px; border-radius: 8px;">
                        <i class="fa-solid fa-graduation-cap text-primary" style="font-size: 40px;"></i>
                        <div>
                            <h3 style="color: #0056b3; margin-bottom: 5px;">¡Bienvenido a tu Primer Ciclo!</h3>
                            <p style="color: #555;">Como alumno de nuevo ingreso, tu selección de cursos y horarios es asignada <strong>automáticamente</strong> por la Coordinación Académica. Solo asegúrate de estar al día en la pestaña de Finanzas para que te asignen tu sección.</p>
                        </div>
                    </div>
                `;
            }
            return; 
        }

        listContainer.innerHTML = secciones2026II.map(sec => {
            const cursoBase = infoCursos.find(c => c.idCurso === sec.cursoId);
            const creditos = cursoBase ? cursoBase.creditos : 3;

            return `
            <label style="display: flex; gap: 15px; padding: 20px; background: #f8f9fa; border: 1px solid #eaeaea; border-radius: 8px; cursor:pointer;">
                <input type="checkbox" class="chk-curso-mat" data-creditos="${creditos}" data-id="${sec.idSeccion}" style="width: 20px; height: 20px; accent-color: var(--color-primary);">
                <div>
                    <h4 style="margin:0 0 5px 0;">${sec.nombreCurso} (SEC-${sec.idSeccion})</h4>
                    <p class="text-muted" style="margin:0; font-size:13px;">Créditos: ${creditos} | Modalidad: ${sec.modalidad} | Prof: ${sec.nombreDocente}</p>
                </div>
            </label>
            `;
        }).join('');

        document.querySelectorAll('.chk-curso-mat').forEach(chk => chk.addEventListener('change', calcularCreditos));
    }

    function calcularCreditos() {
        let total = 0;
        document.querySelectorAll('.chk-curso-mat:checked').forEach(chk => total += parseInt(chk.getAttribute('data-creditos')));
        document.getElementById('total-creditos-mat').textContent = total;
    }

    if (btnConfirmarMatricula) {
        btnConfirmarMatricula.addEventListener("click", async () => {
            const seleccionados = document.querySelectorAll('.chk-curso-mat:checked');
            if(seleccionados.length === 0) {
                alert("Selecciona al menos un curso para matricularte.");
                return;
            }

            btnConfirmarMatricula.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Inscribiendo...';
            btnConfirmarMatricula.disabled = true;

            for(let chk of seleccionados) {
                const idSec = chk.getAttribute('data-id');
                try {
                    await fetch('http://localhost:8080/api/v1/matriculas/automatricula', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                            idAlumno: idAlumnoGlobal,
                            idSeccion: parseInt(idSec),
                            montoPago: 350.00 
                        })
                    });
                } catch(e) { console.error("Error al matricular", e); }
            }

            setTimeout(() => {
                step2.style.display = "none";
                step3.style.display = "block";
            }, 1000);
        });
    }

    // ==========================================
    // FILTRO DE CICLOS ACADÉMICOS
    // ==========================================
    function generarCiclos(añoInicio) {
        const ciclos = [];
        for (let i = 0; i < 3; i++) {
            ciclos.push(`${añoInicio + i}-I`);
            ciclos.push(`${añoInicio + i}-II`);
        }
        return ciclos;
    }

    function renderizarPillsCiclos(ciclos, cicloActivo) {
        const container = document.getElementById("ciclos-pills-cursos");
        if (!container) return;
        container.innerHTML = ciclos.map(c => `
            <button class="pill-ciclo ${c === cicloActivo ? 'active' : ''}"
                    onclick="seleccionarCiclo('${c}')"
                    id="pill-${c.replace('-', '_')}">
                ${c}
            </button>
        `).join('');
        const lbl = document.getElementById("lbl-ciclo-activo");
        if (lbl) lbl.textContent = cicloActivo;
    }

    window.seleccionarCiclo = async function(ciclo) {
        document.querySelectorAll('.pill-ciclo').forEach(p => p.classList.remove('active'));
        const pillActivo = document.getElementById(`pill-${ciclo.replace('-', '_')}`);
        if (pillActivo) pillActivo.classList.add('active');

        const lbl = document.getElementById("lbl-ciclo-activo");
        if (lbl) lbl.textContent = ciclo;

        const grid = document.getElementById("grid-mis-cursos");
        if (grid) grid.innerHTML = `<p class="text-muted" style="grid-column: 1/-1;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando cursos del ciclo ${ciclo}...</p>`;

        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch(`http://localhost:8080/api/v1/secciones/ciclo/${ciclo}`, { headers });
            const todasSecciones = await res.json();
            const seccionesFiltradas = todasSecciones.filter(s => idsCursosValidosGlobal.includes(s.cursoId));
            renderizarMisCursos(seccionesFiltradas);
        } catch(e) {
            console.error("Error al cargar ciclo:", e);
            if (grid) grid.innerHTML = `<p class="text-muted" style="grid-column: 1/-1;">No se pudieron cargar los cursos del ciclo ${ciclo}.</p>`;
        }
    };

    // DISPARAR EJECUCIÓN INICIAL
    cargarDatosGlobales();

    const btnNotif = document.getElementById("btnNotificaciones");
    const dropNotif = document.getElementById("notif-dropdown");
    
    if (btnNotif && dropNotif) {
        btnNotif.addEventListener("click", (e) => {
            e.stopPropagation();
            dropNotif.style.display = dropNotif.style.display === "none" ? "block" : "none";
            const menuPerfil = document.getElementById("menuPerfil");
            if (menuPerfil) menuPerfil.classList.remove("show"); 
        });
        
        document.addEventListener("click", (e) => {
            if (!dropNotif.contains(e.target) && e.target !== btnNotif) {
                dropNotif.style.display = "none";
            }
        });
    }

    window.irATramites = function() {
        if(dropNotif) dropNotif.style.display = "none";
        document.querySelector('.menu-btn[data-target="seccion-tramites"]').click();
    };

});