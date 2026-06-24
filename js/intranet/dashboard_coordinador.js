document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. VERIFICAR SESIÓN SEGURA
    // ==========================================
    const rolUsuario = localStorage.getItem("usuarioRol");
    if (!localStorage.getItem("sesionActiva") || rolUsuario !== "coordinador") {
        window.location.href = "../../../login.html";
        return;
    }

    const token = localStorage.getItem("token");

    // Llenar datos del usuario
    const nombreUsuario = localStorage.getItem("usuarioNombre");
    if (nombreUsuario) {
        const primerNombre = nombreUsuario.split(' ')[0];
        document.getElementById("userNameHeader").textContent = primerNombre;
        const inicial = primerNombre.charAt(0).toUpperCase();
        document.getElementById("userInitial").textContent = inicial;
        document.getElementById("perfilFullName").textContent = nombreUsuario;
        document.getElementById("perfilInitialLarge").textContent = inicial;
    }

    // ==========================================
    // 2. NAVEGACIÓN Y MENÚS
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
            document.getElementById(targetId).classList.add("active");
            
            const menuPerfil = document.getElementById("menuPerfil");
            if (menuPerfil && menuPerfil.classList.contains("show")) menuPerfil.classList.remove("show");

            // 🚀 ESTO ES CLAVE: Le damos 100ms al DOM para que pinte el bloque antes de dibujar el canvas
            if(targetId === 'seccion-inicio') {
                setTimeout(() => {
                    renderizarGraficoAsistencia();
                }, 100);
            }
        });
    });

    const btnDropdownChevron = document.getElementById("btnDropdownChevron");
    const menuPerfil = document.getElementById("menuPerfil");
    if(btnDropdownChevron && menuPerfil) {
        btnDropdownChevron.addEventListener("click", (e) => { e.stopPropagation(); menuPerfil.classList.toggle("show"); });
        document.addEventListener("click", (e) => {
            if (!menuPerfil.contains(e.target) && e.target !== btnDropdownChevron) menuPerfil.classList.remove("show");
        });
    }

    const btnNotifCoord = document.getElementById("btnNotificacionesCoord");
    const dropdownNotifCoord = document.getElementById("notif-dropdown-coord");
    if(btnNotifCoord && dropdownNotifCoord) {
        btnNotifCoord.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdownNotifCoord.style.display = dropdownNotifCoord.style.display === "none" ? "block" : "none";
        });
        document.addEventListener("click", (e) => {
            if (!dropdownNotifCoord.contains(e.target) && e.target !== btnNotifCoord) {
                dropdownNotifCoord.style.display = "none";
            }
        });
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
    // 3. CARGA DE DATOS (Backend a Tablas)
    // ==========================================
    
    // A. Postulantes Web
   const tablaPostulantes = document.getElementById("tabla-postulantes-pendientes");
    
    async function cargarPostulantesPendientes() {
        if (!tablaPostulantes) return;
        try {
            const res = await fetch('http://localhost:8080/api/v1/postulantes/pendientes', { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            
            if (res.ok) {
                const postulantes = await res.json();
                tablaPostulantes.innerHTML = "";
                
                if (postulantes.length === 0) {
                    tablaPostulantes.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay solicitudes web pendientes.</td></tr>`;
                    return;
                }
                
                postulantes.forEach(p => {
                    tablaPostulantes.innerHTML += `
                        <tr>
                            <td><strong>${p.dni}</strong></td>
                            <td>${p.nombres} ${p.apellidos}<br><small class="text-muted">${p.correo}</small></td>
                            <td>${p.nombreCarrera}</td>
                            <td>${p.sede} - ${p.turno}</td>
                            <td style="text-align: right;">
                                <button class="btn-primary btn-aprobar-postulante" data-id="${p.idPostulante}" style="font-size: 13px; padding: 6px 12px; background-color: #28a745;">
                                    <i class="fa-solid fa-check"></i> Aprobar
                                </button>
                            </td>
                        </tr>`;
                });

                document.querySelectorAll('.btn-aprobar-postulante').forEach(btn => {
                    btn.addEventListener('click', async function() {
                        const id = this.getAttribute('data-id');
                        
                        // 1. Guardamos el botón original para restaurarlo si falla
                        const textoOriginal = this.innerHTML; 
                        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
                        this.disabled = true;
                        
                        try {
                            const resAprobar = await fetch(`http://localhost:8080/api/v1/postulantes/${id}/aprobar`, {
                                method: 'POST', 
                                headers: { 
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json' 
                                }
                            });
                            
                            if (resAprobar.ok) { 
                                alert(await resAprobar.text()); 
                                cargarPostulantesPendientes(); 
                            } else { 
                                // 2. SI FALLA, LEEMOS EL ERROR EXACTO DE JAVA
                                let errorMsg = "";
                                try {
                                    const errorJson = await resAprobar.json();
                                    errorMsg = errorJson.message || errorJson.error || JSON.stringify(errorJson);
                                } catch(e) {
                                    errorMsg = await resAprobar.text();
                                }
                                
                                alert("❌ No se pudo aprobar. Motivo del servidor:\n" + (errorMsg || "Error interno de base de datos"));
                                
                                // 3. Restauramos el botón para poder volver a intentarlo
                                this.innerHTML = textoOriginal;
                                this.disabled = false;
                            }
                        } catch (e) { 
                            alert("❌ Error crítico de red o el servidor está apagado."); 
                            this.innerHTML = textoOriginal;
                            this.disabled = false;
                        }
                    });
                });
            }
        } catch (e) { 
            console.error("Error al cargar postulantes:", e); 
        }
    }

    // B. Alertas Académicas (solo actualiza el panel principal del dashboard)
    const listaAlertas = document.getElementById("lista-alertas-coordinador");
    async function cargarAlertas() {
        if (!listaAlertas) return;
        try {
            const res = await fetch('http://localhost:8080/api/v1/alertas/pendientes', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const alertas = await res.json();
                listaAlertas.innerHTML = "";
                if (document.getElementById("count-alertas")) document.getElementById("count-alertas").textContent = alertas.length;

                if (alertas.length === 0) {
                    listaAlertas.innerHTML = `<p class="text-muted text-center" style="padding: 20px;">Todo en orden. No hay alertas.</p>`;
                    return;
                }

                alertas.forEach(a => {
                    const color = a.tipo === 'NOTAS_ATRASADAS' ? 'var(--accent-red)' : '#f39c12';
                    const tituloAmigable = a.tipo.replace('_', ' ');
                    listaAlertas.innerHTML += `
                        <div class="admin-list-item" style="border-left: 3px solid ${color}; padding-left: 15px; display:flex; justify-content:space-between;">
                            <div class="item-content">
                                <h4 style="color: ${color};">${tituloAmigable}</h4>
                                <p>Sección: ${a.nombreSeccion}</p>
                                <p class="text-muted" style="font-size: 11px;">Docente: ${a.nombreDocente}</p>
                            </div>
                            <button onclick="resolverAlerta(${a.idAlerta})" class="btn-outline-small" style="color:#555; border-color:#ccc;"><i class="fa-solid fa-check"></i> Resolver</button>
                        </div>`;
                });
            }
        } catch (e) { console.error(e); }
    }

    // Campana de notificaciones del coordinador (matrículas + alertas académicas)
    const badgeNotifCoord = document.getElementById("badge-notif-coord");
    const listaNotifCoord = document.getElementById("lista-notificaciones-coord");
    const COORD_LEIDAS_KEY = "notif_coord_leidas";

    function getCoordLeidas() {
        try { return JSON.parse(localStorage.getItem(COORD_LEIDAS_KEY) || "[]"); } catch { return []; }
    }
    function markCoordLeida(tipo, idOrigen) {
        const leidas = getCoordLeidas();
        const key = `${tipo}_${idOrigen}`;
        if (!leidas.includes(key)) leidas.push(key);
        localStorage.setItem(COORD_LEIDAS_KEY, JSON.stringify(leidas));
    }

    async function cargarNotificacionesCoord() {
        if (!listaNotifCoord) return;
        try {
            const res = await fetch('http://localhost:8080/api/v1/notificaciones/coordinador', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) return;
            const notifs = await res.json();
            const leidas = getCoordLeidas();
            const pendientes = notifs.filter(n => !leidas.includes(`${n.tipo}_${n.idOrigen}`));

            if (badgeNotifCoord) {
                if (pendientes.length > 0) {
                    badgeNotifCoord.style.display = "flex";
                    badgeNotifCoord.textContent = pendientes.length;
                } else {
                    badgeNotifCoord.style.display = "none";
                }
            }

            if (pendientes.length === 0) {
                listaNotifCoord.innerHTML = `<p class="text-muted text-center" style="font-size:12px; margin: 20px 0;">Sin notificaciones nuevas.</p>`;
                return;
            }

            listaNotifCoord.innerHTML = pendientes.map(n => {
                let iconColor = '#f59e0b'; let iconClass = 'fa-graduation-cap';
                if (n.tipo === 'ALERTA') { iconColor = '#ef4444'; iconClass = 'fa-triangle-exclamation'; }
                return `
                <div style="display:flex; align-items:flex-start; gap:10px; padding:12px; border-bottom:1px solid #f1f5f9; position:relative;">
                    <i class="fa-solid ${iconClass}" style="color:${iconColor}; margin-top:2px; font-size:14px;"></i>
                    <div style="flex:1; min-width:0;">
                        <p style="margin:0 0 3px; font-size:13px; font-weight:600; color:#1e293b;">${n.titulo}</p>
                        <p style="margin:0 0 4px; font-size:12px; color:#475569; word-break:break-word;">${n.desc}</p>
                        <span style="font-size:11px; color:#94a3b8;">${n.tiempo}</span>
                    </div>
                    <button title="Marcar como leída" onclick="window.marcarCoordLeida('${n.tipo}', ${n.idOrigen})"
                        style="background:none; border:none; color:#94a3b8; cursor:pointer; padding:2px; flex-shrink:0;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>`;
            }).join('');
        } catch (e) { console.error(e); }
    }

    window.marcarCoordLeida = function(tipo, idOrigen) {
        markCoordLeida(tipo, idOrigen);
        cargarNotificacionesCoord();
    };

    window.resolverAlerta = async function(idAlerta) {
        if(!confirm("¿Estás seguro de marcar esta alerta como resuelta?")) return;
        try {
            const res = await fetch(`http://localhost:8080/api/v1/alertas/${idAlerta}/resolver`, {
                method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) cargarAlertas();
        } catch(e) { console.error(e); }
    };

    // C. Programación y Buscador
    const tablaSecciones = document.getElementById("tabla-secciones-coordinador");
    async function cargarSecciones() {
        if (!tablaSecciones) return;
        try {
            const res = await fetch('http://localhost:8080/api/v1/secciones', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const secciones = await res.json();
                tablaSecciones.innerHTML = "";
                if(document.getElementById("count-cursos")) document.getElementById("count-cursos").textContent = secciones.length;

                if (secciones.length === 0) {
                    tablaSecciones.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No hay secciones programadas.</td></tr>`;
                    return;
                }

                secciones.forEach(s => {
                    tablaSecciones.innerHTML += `
                        <tr>
                            <td><strong>SEC-${s.idSeccion}</strong></td>
                            <td>${s.nombreCurso}</td>
                            <td><span class="badge" style="background:#e0f2f1; color:#00897b;">${s.nombreDocente}</span></td>
                            <td><span class="badge" style="background:#f0f4ff; color:#0056b3;">${s.cicloAcademico}</span></td>
                            <td>${s.modalidad}</td>
                            <td style="text-align: center">
                                <button class="btn-action edit" style= "margin-right: 2rem;" onclick='abrirEditarModal(${JSON.stringify(s)})' title="Editar Asignación">
                                    <i class="fa-solid fa-user-pen"></i>
                                </button>
                            </td>
                        </tr>`;
                });
            }
        } catch (e) { console.error(e); }
    }

    // Funciones del Modal de Secciones
    window.abrirEditarModal = function(s) {
        llenarSelectsSeccion(); // Aseguramos que los combos tengan opciones primero
        document.getElementById("modalSeccionTitulo").textContent = "Editar Asignación SEC-" + s.idSeccion;
        document.getElementById("secId").value = s.idSeccion;
        document.getElementById("secCurso").value = s.cursoId;
        document.getElementById("secDocente").value = s.docenteId;
        document.getElementById("secCiclo").value = s.cicloAcademico;
        document.getElementById("secModalidad").value = s.modalidad;
        document.getElementById("secDia").value = s.diaSemana;
        document.getElementById("secInicio").value = s.horaInicio.substring(0, 5);
        document.getElementById("secFin").value = s.horaFin.substring(0, 5);
        document.getElementById("modalSeccion").classList.add("show");
    };

    const searchProgInput = document.querySelector("#seccion-programacion .search-box input");
    if (searchProgInput) {
        searchProgInput.addEventListener("keyup", function(e) {
            const term = e.target.value.toLowerCase();
            const rows = tablaSecciones.querySelectorAll("tr");
            rows.forEach(row => {
                if(row.querySelector("td").colSpan > 1) return; 
                row.style.display = row.textContent.toLowerCase().includes(term) ? "" : "none";
            });
        });
    }

    // D. Docentes
    const gridDocentes = document.getElementById("grid-docentes-coordinador");
    async function cargarDocentes() {
        if (!gridDocentes) return;
        try {
            const res = await fetch('http://localhost:8080/api/v1/docentes', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const docentes = await res.json();
                gridDocentes.innerHTML = "";
                if(document.getElementById("count-docentes")) document.getElementById("count-docentes").textContent = docentes.length;

                docentes.forEach(d => {
                    gridDocentes.innerHTML += `
                        <div class="curso-modern-card shadow-card bg-card border-card" style="border-top: 4px solid #00897b;">
                            <div class="curso-modern-body" style="align-items: center; text-align: center;">
                                <div class="user-avatar-text bg-teal text-white" style="width: 60px; height: 60px; font-size: 24px; margin-bottom: 15px; border-radius: 50%; display: flex; justify-content: center; align-items: center;">
                                    ${d.usuario.nombreCompleto.charAt(0)}
                                </div>
                                <h4 style="margin-bottom: 5px; font-size: 18px; color: #333;">${d.usuario.nombreCompleto}</h4>
                                <p class="text-muted" style="font-size: 13px; margin-bottom: 15px;">Especialidad: ${d.especialidad}</p>
                                <button onclick="verDetalleDocente(${d.idDocente}, '${d.usuario.nombreCompleto}')" class="btn-outline-primary full-width mt-15">Ver Detalle Académico</button>
                            </div>
                        </div>`;
                });
            }
        } catch (e) { console.error(e); }
    }

   window.verDetalleDocente = async function(idDocente, nombre) {
        document.getElementById("detDocenteNombre").textContent = "Docente: " + nombre;
        const tb = document.getElementById("tabla-detalle-docente");
        tb.innerHTML = "<tr><td colspan='4' class='text-center'>Cargando...</td></tr>";
        document.getElementById("modalDocenteDetalle").classList.add("show");

        try {
            // Se asegura de tomar el token directamente para evitar "Unauthorized"
            const currentToken = localStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/v1/secciones/docente/${idDocente}`, { 
                headers: { 'Authorization': `Bearer ${currentToken}` } 
            });
            
            if (res.ok) {
                const secciones = await res.json();
                
                if(secciones.length === 0) {
                    tb.innerHTML = "<tr><td colspan='4' class='text-center text-muted'>Sin carga asignada.</td></tr>";
                    return;
                }

                // Damos un formato bonito convirtiendo números a nombres de días
                const diasSemanaNombres = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

                tb.innerHTML = secciones.map(s => {
                    const diaRender = diasSemanaNombres[s.diaSemana] || `Día ${s.diaSemana}`;
                    // Limpiamos los segundos del backend (ej: 08:00:00 -> 08:00)
                    const inicioRender = s.horaInicio ? s.horaInicio.substring(0, 5) : "--:--";
                    const finRender = s.horaFin ? s.horaFin.substring(0, 5) : "--:--";

                    return `<tr>
                                <td>${s.nombreCurso}</td>
                                <td>${s.cicloAcademico}</td>
                                <td>${diaRender}</td>
                                <td><span class="badge" style="background:#e8f5e9; color:#28a745;">${inicioRender} - ${finRender}</span></td>
                            </tr>`;
                }).join('');
            } else {
                // AQUÍ: si da error 500 o 404, ya no se quedará trabado
                tb.innerHTML = "<tr><td colspan='4' class='text-center text-danger'>Error al conectar con el servidor.</td></tr>";
            }
        } catch(e) { 
            console.error("Fallo renderizando detalles:", e); 
            tb.innerHTML = "<tr><td colspan='4' class='text-center text-danger'>Fallo al mostrar los detalles.</td></tr>";
        }
    };

    cargarPostulantesPendientes();
    cargarAlertas();
    cargarNotificacionesCoord();
    cargarSecciones();
    cargarDocentes();

    // ==========================================
    // 4. REGISTROS BASE (DOCENTES Y CURSOS)
    // ==========================================
    const formRegistrarDocente = document.getElementById("formRegistrarDocente");
    const formCrearCurso = document.getElementById("formCrearCurso");
    const regCurCarrera = document.getElementById("regCurCarrera");

if(regCurCarrera) {
        fetch('http://localhost:8080/api/v1/carreras', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                // AGREGAMOS && c.estado === true
                regCurCarrera.innerHTML = data.filter(c => c.tipo === 'CARRERA' && c.estado === true)
                    .map(c => `<option value="${c.idCarrera}">${c.nombre}</option>`).join('');
            });
    }
   if (formRegistrarDocente) {
    formRegistrarDocente.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = formRegistrarDocente.querySelector("button");
        btn.disabled = true; 
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        const payload = {
            dni: document.getElementById("regDocDni").value,
            nombres: document.getElementById("regDocNombres").value,
            apellidos: document.getElementById("regDocApellidos").value,
            correo: document.getElementById("regDocCorreo").value,
            especialidad: document.getElementById("regDocEspecialidad").value
        };

        try {
            const res = await fetch('http://localhost:8080/api/v1/docentes/registro', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Docente registrado exitosamente. La clave de acceso es su DNI.");
                formRegistrarDocente.reset();
                if (typeof cargarDocentes === 'function') cargarDocentes(); 
                if (typeof precargarListas === 'function') precargarListas(); 
            } else {
                const errorData = await res.json();
                alert("Error: " + (errorData.mensaje || "No se pudo registrar al docente."));
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión con el servidor.");
        } finally {
            btn.disabled = false; 
            btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar Docente`;
        }
    });
   }

   if (formCrearCurso) {
    formCrearCurso.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const idCarreraSelect = document.getElementById("regCurCarrera").value;
        const nombreCurso = document.getElementById("regCurNombre").value.trim();
        const creditosInput = document.getElementById("regCurCreditos").value;

        if (!idCarreraSelect || !nombreCurso) {
            alert("Debe seleccionar una carrera y asignar un nombre al curso.");
            return;
        }

        const btn = formCrearCurso.querySelector("button");
        btn.disabled = true; 
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        const payload = {
            nombre: nombreCurso,
            carreraId: parseInt(idCarreraSelect),
            creditos: parseInt(creditosInput) || 3,
            descripcionInformativa: document.getElementById("regCurDescripcion").value.trim()
        };

        try {
            const res = await fetch('http://localhost:8080/api/v1/cursos', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                cursosList.push(data); // disponible de inmediato para llenarSelectsSeccion
                formCrearCurso.reset();
                if (typeof precargarListas === 'function') precargarListas();

                const prev = document.getElementById('msg-curso-creado');
                if (prev) prev.remove();

                const successMsg = document.createElement('div');
                successMsg.id = 'msg-curso-creado';
                successMsg.style.cssText = 'background:#d4edda; border:1px solid #c3e6cb; border-radius:8px; padding:16px 20px; margin-top:15px; text-align:center;';
                successMsg.innerHTML = `
                    <i class="fa-solid fa-circle-check" style="color:#28a745; font-size:28px; margin-bottom:8px; display:block;"></i>
                    <h4 style="color:#155724; margin:8px 0;">¡Curso "${data.nombre}" creado!</h4>
                    <p style="color:#155724; font-size:13px; margin-bottom:14px;">¿Deseas programarlo para un ciclo académico?</p>
                    <button class="btn-primary" style="margin-right:10px;" onclick="window.programarNuevoCurso(${data.idCurso})">
                        <i class="fa-solid fa-calendar-plus"></i> Programar en Ciclo
                    </button>
                    <button class="btn-outline-small" style="color:#6c757d; border-color:#ced4da;" onclick="document.getElementById('msg-curso-creado').remove()">
                        <i class="fa-solid fa-xmark"></i> Omitir
                    </button>
                `;
                formCrearCurso.parentElement.appendChild(successMsg);
            } else {
                alert("Error: " + (data.message || "Revisa los datos ingresados."));
            }
        } catch (err) {
            console.error("Fallo de red:", err);
            alert("Error de conexión con el servidor.");
        } finally {
            btn.disabled = false; 
            btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar Curso`;
        }
    });
   }

    // ==========================================
    // 5. LÓGICA DE PROGRAMACIÓN (MODAL SECCIÓN)
    // ==========================================
    const formSeccion = document.getElementById("formSeccion");
    const btnAbrirCurso = document.getElementById("btnAbrirCurso");
    let cursosList = [];
    let docentesList = [];

    async function precargarListas() {
        try {
            const [resCursos, resDocentes] = await Promise.all([
                fetch('http://localhost:8080/api/v1/cursos', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:8080/api/v1/docentes', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            cursosList = await resCursos.json();
            docentesList = await resDocentes.json();
        } catch (e) { console.error("Error precargando", e); }
    }
    precargarListas();

    if (btnAbrirCurso) {
        btnAbrirCurso.addEventListener("click", () => {
            if(formSeccion) formSeccion.reset();
            document.getElementById("secId").value = "";
            document.getElementById("modalSeccionTitulo").textContent = "Abrir Nuevo Curso";
            llenarSelectsSeccion();
            document.getElementById("secCiclo").value = `${new Date().getFullYear()}-I`;
            document.getElementById("modalSeccion").classList.add("show");
        });
    }

    function llenarSelectsSeccion() {
        const selCurso = document.getElementById("secCurso");
        const selDoc = document.getElementById("secDocente");
        const selCiclo = document.getElementById("secCiclo");
        selCurso.innerHTML = cursosList.map(c => `<option value="${c.idCurso}">${c.nombre}</option>`).join('');
        selDoc.innerHTML = docentesList.map(d => `<option value="${d.idDocente}">${d.usuario.nombreCompleto}</option>`).join('');
        const anioActual = new Date().getFullYear();
        const ciclos = [];
        for (let i = -2; i <= 2; i++) {
            ciclos.push(`${anioActual + i}-I`);
            ciclos.push(`${anioActual + i}-II`);
        }
        selCiclo.innerHTML = ciclos.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    window.programarNuevoCurso = function(idCurso) {
        const msg = document.getElementById('msg-curso-creado');
        if (msg) msg.remove();

        // Navegar a Programación
        sections.forEach(s => s.classList.remove('active'));
        menuBtns.forEach(b => b.classList.remove('active'));
        document.getElementById('seccion-programacion').classList.add('active');
        const btnProg = document.querySelector('.menu-btn[data-target="seccion-programacion"]');
        if (btnProg) btnProg.classList.add('active');

        // Abrir modal con el nuevo curso pre-seleccionado
        if (formSeccion) formSeccion.reset();
        document.getElementById('secId').value = '';
        document.getElementById('modalSeccionTitulo').textContent = 'Programar Curso en Ciclo';
        llenarSelectsSeccion();
        document.getElementById('secCurso').value = idCurso;
        document.getElementById('secCiclo').value = `${new Date().getFullYear()}-I`;
        document.getElementById('modalSeccion').classList.add('show');
    };

    if (formSeccion) {
        formSeccion.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("secId").value;
            
            const cursoIdVal = document.getElementById("secCurso").value;
            const docenteIdVal = document.getElementById("secDocente").value;
            const hInicio = document.getElementById("secInicio").value; 
            const hFin = document.getElementById("secFin").value;       
            const diaVal = document.getElementById("secDia").value;

            if (!cursoIdVal || !docenteIdVal || !hInicio || !hFin || !diaVal) {
                alert("Por favor, complete todos los campos requeridos.");
                return;
            }

            const payload = {
                cursoId: parseInt(cursoIdVal),
                docenteId: parseInt(docenteIdVal),
                cicloAcademico: document.getElementById("secCiclo").value,
                modalidad: document.getElementById("secModalidad").value,
                diaSemana: parseInt(diaVal),
                horaInicio: hInicio,
                horaFin: hFin
            };

            const url = id ? `http://localhost:8080/api/v1/secciones/${id}` : `http://localhost:8080/api/v1/secciones`;
            const method = id ? 'PUT' : 'POST';

            try {
                const res = await fetch(url, {
                    method: method,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                let data;
                try { data = await res.json(); } catch(err) { data = {}; } // Respaldo por si el error 500 viene sin JSON

                if (res.ok) {
                    alert(id ? "Asignación actualizada con éxito." : "Nueva sección creada correctamente.");
                    cerrarModal('modalSeccion');
                    cargarSecciones();
                } else {
                    console.error("Detalle del error:", data);
                    alert("Error: " + (data.message || "Problema de validación. Verifica que Inicio sea anterior a Fin."));
                }
            } catch (err) {
                console.error("Fallo de red:", err);
                alert("No se pudo conectar con el servidor. Verifica que esté encendido.");
            }
        });
    }

    // ==========================================
    // 6. BUSCADOR DE ALUMNOS (SEGUIMIENTO)
    // ==========================================
    const searchAlumnoInput = document.getElementById("buscadorAlumnoDni");
    const previewAlumno = document.querySelector(".alumno-preview");

    if (searchAlumnoInput) {
        searchAlumnoInput.addEventListener("keyup", async (e) => {
            if (e.key === 'Enter') {
                const dni = e.target.value.trim();
                if(!dni) return;
                
                previewAlumno.innerHTML = "<p>Buscando...</p>";
                try {
                    const res = await fetch(`http://localhost:8080/api/v1/alumnos/dni/${dni}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const al = await res.json();
                        previewAlumno.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; text-align:left;">
                                <div>
                                    <h3 style="color: #00897b;">${al.usuario.apellidos}, ${al.usuario.nombres}</h3>
                                    <p class="text-muted">Correo: ${al.usuario.email} | Programa: ${al.nombreCarrera}</p>
                                </div>
                                <span class="badge" style="background:#e8f5e9; color:#28a745; font-size: 14px;">${al.estado}</span>
                            </div>
                            <table class="modern-table" style="text-align:left;">
                                <tr><th>Promedio Histórico</th><td><strong>${al.promedioHistorico}</strong></td></tr>
                                <tr><th>Fecha de Ingreso</th><td>${al.fechaIngreso}</td></tr>
                            </table>
                        `;
                    } else previewAlumno.innerHTML = "<p class='text-danger'>Alumno no encontrado.</p>";
                } catch(err) { console.error(err); }
            }
        });
    }

    // ==========================================
    // 7. REGISTRO MANUAL (WIZARD)
    // ==========================================
const selProgramaManual = document.getElementById("manCarrera");
    if(selProgramaManual) {
        fetch('http://localhost:8080/api/v1/carreras', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                // AGREGAMOS && c.estado === true
                selProgramaManual.innerHTML = data.filter(c => c.tipo === 'CARRERA' && c.estado === true)
                    .map(c => `<option value="${c.idCarrera}">${c.nombre}</option>`).join('');
            });
    }

window.registrarAlumnoManual = async function() {
        const payload = {
            dni: document.getElementById("manDni").value,
            nombres: document.getElementById("manNombres").value,
            apellidos: document.getElementById("manApellidos").value, 
            correo: document.getElementById("manCorreo").value,
            carreraId: document.getElementById("manCarrera").value
        };

        if(!payload.dni || !payload.nombres || !payload.apellidos || !payload.correo) {
            alert("Completa todos los campos"); return;
        }

        // Cambiamos el botón a estado "Cargando"
        const step3Div = document.getElementById("wiz-step-3");
        const btnRegistrar = step3Div.querySelector(".btn-primary");
        const originalText = btnRegistrar.innerHTML;
        btnRegistrar.disabled = true;
        btnRegistrar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';

        try {
            const res = await fetch('http://localhost:8080/api/v1/alumnos/registro-manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json(); // Leemos la respuesta del backend

            if (res.ok) {
                // MODIFICACIÓN: Inyectamos el HTML de éxito con las credenciales directamente en el Paso 3
                step3Div.innerHTML = `
                    <div style="text-align: center; padding: 10px;">
                        <div style="width: 60px; height: 60px; background: #28a745; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 30px; margin: 0 auto 15px auto;">
                            <i class="fa-solid fa-check"></i>
                        </div>
                        <h3 style="color: #28a745; margin-bottom: 15px;">¡Alumno Registrado Exitosamente!</h3>
                        
                        <div style="background: #f8f9fa; border: 1px dashed #ccc; padding: 20px; border-radius: 8px; text-align: left; margin-bottom: 20px;">
                            <p style="margin-bottom: 10px;"><strong>Datos de Acceso a la Intranet:</strong></p>
                            <p style="margin-bottom: 5px;"><strong>Usuario / Correo:</strong> <span style="color: #0056b3; font-weight: 500;">${data.usuario.email}</span></p>
                            <p style="margin-bottom: 0;"><strong>Contraseña:</strong> <span style="color: #0056b3; font-weight: 500;">${data.usuario.dni}</span></p>
                        </div>
                        <p class="text-muted" style="font-size: 13px;">La primera cuota de matrícula (S/ 150.00) se ha generado automáticamente en estado PENDIENTE.</p>
                        <button class="btn-primary mt-20" onclick="location.reload()" style="width: 100%;">Finalizar y Nuevo Registro</button>
                    </div>
                `;
            } else {
                alert("Error al registrar alumno: " + (data.message || data.error || "Datos duplicados"));
                btnRegistrar.disabled = false;
                btnRegistrar.innerHTML = originalText;
            }
        } catch(e) { 
            console.error(e); 
            alert("Error de conexión con el servidor.");
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = originalText;
        }
    };

    window.cerrarModal = function(idModal) {
        document.getElementById(idModal).classList.remove("show");
    };

    let chartInstance = null;
async function renderizarGraficoAsistencia() {
        const ctx = document.getElementById('asistenciaChart');
        if (!ctx) return;

        try {
            const res = await fetch('http://localhost:8080/api/v1/reportes/rendimiento', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
            });
            
            if (!res.ok) throw new Error("Error al obtener datos de rendimiento");
            const alumnos = await res.json();

            const asistenciaPorCarrera = {};

            alumnos.forEach(a => {
                const carrera = a.carrera || "General";
                const diasAsistidos = parseInt(a.dias_asistidos || 0);
                const diasTotales = parseInt(a.dias_totales || 0);

                if (!asistenciaPorCarrera[carrera]) {
                    asistenciaPorCarrera[carrera] = { asistidos: 0, totales: 0 };
                }
                
                asistenciaPorCarrera[carrera].asistidos += diasAsistidos;
                asistenciaPorCarrera[carrera].totales += diasTotales;
            });

            const etiquetasCarreras = [];
            const porcentajesReales = [];
            const porcentajesEsperados = []; 

            Object.keys(asistenciaPorCarrera).forEach(carrera => {
                etiquetasCarreras.push(carrera);
                const datos = asistenciaPorCarrera[carrera];
                
                let porcentaje = 0;
                if (datos.totales > 0) {
                    porcentaje = Math.round((datos.asistidos / datos.totales) * 100);
                }
                
                porcentajesReales.push(porcentaje);
                porcentajesEsperados.push(100);
            });

            if (etiquetasCarreras.length === 0) {
                etiquetasCarreras.push("Sin datos");
                porcentajesReales.push(0);
                porcentajesEsperados.push(100);
            }

            if (chartInstance) chartInstance.destroy(); 
            
            // 🚀 DIBUJO DIRECTO Y AGRESIVO
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: etiquetasCarreras,
                    datasets: [
                        { 
                            label: 'Asistencia Esperada (%)', 
                            data: porcentajesEsperados, 
                            backgroundColor: 'rgba(200, 200, 200, 0.3)' 
                        },
                        { 
                            label: 'Asistencia Real (%)', 
                            data: porcentajesReales, 
                            backgroundColor: '#00897b', 
                            borderRadius: 4 
                        }
                    ]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    // 🚀 ESTA PROPIEDAD FUERZA A CHART.JS A REDIBUJARSE AUNQUE ESTÉ OCULTO
                    animation: {
                        onComplete: () => {
                            chartInstance.resize();
                        }
                    },
                    scales: { 
                        y: { 
                            beginAtZero: true, 
                            max: 100,
                            ticks: { callback: function(value) { return value + "%" } }
                        } 
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.y + '%';
                                }
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error("Error al renderizar el gráfico de asistencia:", error);
        }
    }

const tablaProgramas = document.getElementById("tabla-programas-coordinador");
    const formPrograma = document.getElementById("formPrograma");

    // A. Inicializar Editores de Texto (Quill.js)
    let quillPerfil, quillMercado, quillRequisitos;
    
    // Opciones del menú (Negrita, Cursiva, Listas)
    const toolbarOptions = [
        ['bold', 'italic'],
        [{ 'list': 'bullet' }, { 'list': 'ordered' }],
        ['clean'] // Botón para quitar formato
    ];

    // Solo inicializamos si los contenedores existen en el HTML
    if (document.getElementById('editor-perfil')) {
        quillPerfil = new Quill('#editor-perfil', { theme: 'snow', modules: { toolbar: toolbarOptions }});
        quillMercado = new Quill('#editor-mercado', { theme: 'snow', modules: { toolbar: toolbarOptions }});
        quillRequisitos = new Quill('#editor-requisitos', { theme: 'snow', modules: { toolbar: toolbarOptions }});
    }

    async function cargarProgramas() {
        if (!tablaProgramas) return;
        try {
            const res = await fetch('http://localhost:8080/api/v1/carreras', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const programas = await res.json();
                tablaProgramas.innerHTML = "";
                programas.forEach(p => {
                    const badgeColor = p.tipo === 'CARRERA' ? '#0056b3' : '#f39c12';
                    const estadoFila = p.estado ? '<span class="badge badge-active">Activo</span>' : '<span class="badge badge-suspended">Inactivo</span>';
                    
                    tablaProgramas.innerHTML += `
                        <tr>
                            <td><strong>PRG-${p.idCarrera}</strong></td>
                            <td><span class="badge" style="background: rgba(0,0,0,0.05); color: ${badgeColor};">${p.tipo.replace('_', ' ')}</span></td>
                            <td>${p.nombre}</td>
                            <td>${estadoFila}</td>
                            <td style="text-align: center;">
                                <button class="btn-action edit" style= "margin-right: -4rem;" onclick='prepararEdicionPrograma(${JSON.stringify(p)})' title="Editar Programa">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                            </td>
                        </tr>`;
                });
            }
        } catch (e) { console.error("Error cargando programas:", e); }
    }

    // Funciones del Modal de Programas
    window.abrirModalPrograma = function() {
        if(formPrograma) formPrograma.reset();
        document.getElementById("progId").value = "";
        document.getElementById("progEstado").value = "true";
        
        // Limpiar los editores de texto
        if(quillPerfil) quillPerfil.root.innerHTML = "";
        if(quillMercado) quillMercado.root.innerHTML = "";
        if(quillRequisitos) quillRequisitos.root.innerHTML = "";

        document.getElementById("modalProgramaTitulo").textContent = "Crear Nuevo Programa";
        document.getElementById("modalPrograma").classList.add("show");
    };

    window.prepararEdicionPrograma = function(p) {
        document.getElementById("modalProgramaTitulo").textContent = "Editar Programa: " + p.nombre;
        document.getElementById("progId").value = p.idCarrera;
        document.getElementById("progTipo").value = p.tipo;
        document.getElementById("progEstado").value = p.estado ? "true" : "false"; 
        document.getElementById("progNombre").value = p.nombre;
        document.getElementById("progDesc").value = p.descripcion || "";
        
        // Cargar los datos HTML en los editores
        if(quillPerfil) quillPerfil.root.innerHTML = p.perfilAcademico || "";
        if(quillMercado) quillMercado.root.innerHTML = p.mercadoLaboral || "";
        if(quillRequisitos) quillRequisitos.root.innerHTML = p.requisitos || "";

        document.getElementById("modalPrograma").classList.add("show");
    };

    if (formPrograma) {
        formPrograma.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("progId").value;
            
            // Recoger datos, incluyendo el HTML generado por Quill
            const payload = {
                tipo: document.getElementById("progTipo").value,
                nombre: document.getElementById("progNombre").value.trim(),
                descripcion: document.getElementById("progDesc").value.trim(),
                // Extraemos el HTML interno de los editores
                perfilAcademico: quillPerfil ? quillPerfil.root.innerHTML : "",
                mercadoLaboral: quillMercado ? quillMercado.root.innerHTML : "",
                requisitos: quillRequisitos ? quillRequisitos.root.innerHTML : "",
                estado: document.getElementById("progEstado").value === "true" 
            };

            const url = id ? `http://localhost:8080/api/v1/carreras/${id}` : `http://localhost:8080/api/v1/carreras`;
            const method = id ? 'PUT' : 'POST';

            try {
                const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    alert(id ? "Programa actualizado con éxito." : "Nuevo programa creado.");
                    cerrarModal('modalPrograma');
                    cargarProgramas(); 
                } else {
                    const data = await res.json();
                    alert("Error al guardar: " + (data.message || "Verifique que el nombre no esté duplicado"));
                }
            } catch (err) {
                console.error("Fallo de red:", err);
                alert("Error de conexión con el servidor.");
            }
        });
    }

    // Ejecutamos la carga inicial
    cargarProgramas();
});

async function cargarPerfilCoordinador() {
        // Obtenemos el ID guardado durante el login
        const idUsuarioLogeado = localStorage.getItem("usuarioId");
        
        if (!idUsuarioLogeado) {
            document.getElementById("coordDni").textContent = "ID no encontrado en sesión";
            return;
        }

        try {
            const currentToken = localStorage.getItem("token");
            // Llamamos a la API de usuarios
            const res = await fetch('http://localhost:8080/api/v1/usuarios', { 
                headers: { 'Authorization': `Bearer ${currentToken}` } 
            });

            if (res.ok) {
                const usuarios = await res.json();
                
                // CORRECCIÓN CRÍTICA: Buscamos el usuario en el array. 
                // Spring Boot serializa idUsuario, así que comparamos contra eso.
                const miPerfil = usuarios.find(u => Number(u.idUsuario) === Number(idUsuarioLogeado));

                if (miPerfil) {
                    document.getElementById("coordDni").textContent = miPerfil.dni || "No registrado";
                    document.getElementById("coordNombres").textContent = miPerfil.nombres || "No registrado";
                    document.getElementById("coordApellidos").textContent = miPerfil.apellidos || "No registrado";
                    document.getElementById("coordEmail").textContent = miPerfil.email || "No registrado";
                    
                    // Formatear el rol para que se vea más bonito (Ej: ADMINISTRADOR -> Administrador)
                    const rolFormateado = miPerfil.rol.charAt(0) + miPerfil.rol.slice(1).toLowerCase();
                    document.getElementById("coordRol").textContent = rolFormateado;
                } else {
                    document.getElementById("coordDni").textContent = "Perfil no encontrado en BD";
                    document.getElementById("coordNombres").textContent = "---";
                    document.getElementById("coordApellidos").textContent = "---";
                    document.getElementById("coordEmail").textContent = "---";
                    document.getElementById("coordRol").textContent = "---";
                }
            } else {
                console.error("Fallo del servidor:", await res.text());
                document.getElementById("coordDni").textContent = "Error al conectar con la BD";
            }
        } catch (e) { 
            console.error("Error de red cargando perfil:", e); 
            document.getElementById("coordDni").textContent = "Error de conexión";
        }
    }

    async function cargarRendimientoAlumnos() {
        // Asegúrate de que este ID coincida con el <tbody> de tu tabla de rendimiento en el HTML
        const tbody = document.getElementById("tabla-rendimiento"); 
        if (!tbody) return;

        try {
            const res = await fetch('http://localhost:8080/api/v1/reportes/rendimiento', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
            });
            
            if (res.ok) {
                const alumnos = await res.json();
                
                if (alumnos.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 20px;">No hay alumnos registrados en el sistema.</td></tr>`;
                    return;
                }

                tbody.innerHTML = alumnos.map(a => {
                    // Cálculo de porcentaje de asistencia
                    let asisPorcentaje = 0;
                    if (a.dias_totales > 0) {
                        asisPorcentaje = Math.round((a.dias_asistidos / a.dias_totales) * 100);
                    }
                    
                    // Colores de alerta
                    const colorNota = a.promedio_historico >= 13 ? 'text-success' : 'text-danger';
                    const colorAsis = asisPorcentaje >= 70 ? 'text-success' : 'text-danger';

                    return `
                    <tr>
                        <td><strong>${a.dni}</strong></td>
                        <td>${a.alumno}</td>
                        <td>${a.carrera}</td>
                        <td><strong class="${colorNota}">${parseFloat(a.promedio_historico).toFixed(2)}</strong></td>
                        <td>
                            <strong class="${colorAsis}">${asisPorcentaje}%</strong> 
                            <span style="font-size:11px; color:#888; display:block;">(${a.dias_asistidos} de ${a.dias_totales} clases)</span>
                        </td>
                        <td style="text-align:center;">
                            <button class="btn-outline-small" onclick="alert('Historial detallado en desarrollo...')">Ver Kárdex</button>
                        </td>
                    </tr>`;
                }).join('');
            }
        } catch (e) {
            console.error("Error cargando rendimiento:", e);
        }
    }

    // Ejecutamos la carga inicial del perfil
    cargarPerfilCoordinador();
    cargarRendimientoAlumnos();
    setTimeout(() => {
        const btnInicio = document.querySelector('.menu-btn[data-target="seccion-inicio"]');
        if (btnInicio) {
            btnInicio.click(); 
        } else {
            renderizarGraficoAsistencia();
        }
    }, 100);

    const inputBuscador = document.getElementById("buscadorRendimiento");
    
    if (inputBuscador) {
        inputBuscador.addEventListener("input", function(e) {
            const textoFiltro = e.target.value.toLowerCase();
            // Obtenemos todas las filas de la tabla de rendimiento
            const filas = document.querySelectorAll("#tabla-rendimiento tr");

            filas.forEach(fila => {

                if (fila.querySelector("td").colSpan > 1) return;
                
                const dniAlumno = fila.querySelector("td:nth-child(1)").textContent.toLowerCase();
                const nombreAlumno = fila.querySelector("td:nth-child(2)").textContent.toLowerCase();

                if (dniAlumno.includes(textoFiltro) || nombreAlumno.includes(textoFiltro)) {
                    fila.style.display = "";
                } else {

                    fila.style.display = "none";
                }
            });
        });
    }

// Helper de navegación para Wizard
function actualizarIndicador(pasoActual) {
    for(let i=1; i<=3; i++) {
        const ind = document.getElementById(`ind-step-${i}`);
        if(ind) { ind.classList.remove('active'); ind.classList.remove('completed'); }
    }
    for(let i=1; i<pasoActual; i++) {
        const ind = document.getElementById(`ind-step-${i}`);
        if(ind) ind.classList.add('completed');
    }
    const currentInd = document.getElementById(`ind-step-${pasoActual}`);
    if(currentInd) currentInd.classList.add('active');
}

window.siguientePaso = function(pasoActual) {
    const pasoSiguiente = pasoActual + 1;
    document.getElementById(`wiz-step-${pasoActual}`).style.display = "none";
    document.getElementById(`wiz-step-${pasoSiguiente}`).style.display = "block";
    actualizarIndicador(pasoSiguiente);
};

window.volverPaso = function(pasoActual) {
    const pasoAnterior = pasoActual - 1;
    document.getElementById(`wiz-step-${pasoActual}`).style.display = "none";
    document.getElementById(`wiz-step-${pasoAnterior}`).style.display = "block";
    actualizarIndicador(pasoAnterior);
};