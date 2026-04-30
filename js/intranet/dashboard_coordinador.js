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

            if(targetId === 'seccion-inicio') renderizarGraficoAsistencia();
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

    document.getElementById("btnCerrarSesion")?.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "/html/index.html";
    });

    // ==========================================
    // 3. CARGA DE DATOS (Backend a Tablas)
    // ==========================================
    
    // A. Postulantes Web
    const tablaPostulantes = document.getElementById("tabla-postulantes-pendientes");
    async function cargarPostulantesPendientes() {
        if (!tablaPostulantes) return;
        try {
            const res = await fetch('http://localhost:8080/api/v1/postulantes/pendientes', { headers: { 'Authorization': `Bearer ${token}` } });
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
                        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                        this.disabled = true;
                        try {
                            const resAprobar = await fetch(`http://localhost:8080/api/v1/postulantes/${id}/aprobar`, {
                                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (resAprobar.ok) { alert(await resAprobar.text()); cargarPostulantesPendientes(); } 
                            else alert("Error al aprobar.");
                        } catch (e) { alert("Error de conexión."); }
                    });
                });
            }
        } catch (e) { console.error(e); }
    }

    // B. Alertas Académicas
    const listaAlertas = document.getElementById("lista-alertas-coordinador");
    async function cargarAlertas() {
        if (!listaAlertas) return;
        try {
            const res = await fetch('http://localhost:8080/api/v1/alertas/pendientes', { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const alertas = await res.json();
                listaAlertas.innerHTML = "";
                if(document.getElementById("count-alertas")) document.getElementById("count-alertas").textContent = alertas.length;

                if (alertas.length === 0) {
                    listaAlertas.innerHTML = `<p class="text-muted text-center" style="padding: 20px;">Todo en orden. No hay alertas.</p>`;
                    return;
                }

                alertas.forEach(a => {
                    let color = a.tipo === 'NOTAS_ATRASADAS' ? 'var(--accent-red)' : '#f39c12';
                    listaAlertas.innerHTML += `
                        <div class="admin-list-item" style="border-left: 3px solid ${color}; padding-left: 15px; display:flex; justify-content:space-between;">
                            <div class="item-content">
                                <h4 style="color: ${color};">${a.tipo.replace('_', ' ')}</h4>
                                <p>Sección: ${a.nombreSeccion}</p>
                                <p class="text-muted" style="font-size: 11px;">Docente: ${a.nombreDocente}</p>
                            </div>
                            <button onclick="resolverAlerta(${a.idAlerta})" class="btn-outline-small" style="color:#555; border-color:#ccc;"><i class="fa-solid fa-check"></i> Resolver</button>
                        </div>`;
                });
            }
        } catch (e) { console.error(e); }
    }

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
                    tablaSecciones.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay secciones programadas.</td></tr>`;
                    return;
                }

                secciones.forEach(s => {
                    tablaSecciones.innerHTML += `
                        <tr>
                            <td><strong>SEC-${s.idSeccion}</strong></td>
                            <td>${s.nombreCurso}</td>
                            <td><span class="badge" style="background:#e0f2f1; color:#00897b;">${s.nombreDocente}</span></td>
                            <td>${s.modalidad}</td>
                            <td style="text-align: right;">
                                <button class="btn-action edit" onclick='abrirEditarModal(${JSON.stringify(s)})' title="Editar Asignación">
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
                regCurCarrera.innerHTML = data.filter(c => c.tipo === 'CARRERA')
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
                alert("¡Curso '" + payload.nombre + "' creado exitosamente!");
                formCrearCurso.reset();
                if (typeof precargarListas === 'function') precargarListas();
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
            document.getElementById("modalSeccion").classList.add("show");
        });
    }

    function llenarSelectsSeccion() {
        const selCurso = document.getElementById("secCurso");
        const selDoc = document.getElementById("secDocente");
        selCurso.innerHTML = cursosList.map(c => `<option value="${c.idCurso}">${c.nombre}</option>`).join('');
        selDoc.innerHTML = docentesList.map(d => `<option value="${d.idDocente}">${d.usuario.nombreCompleto}</option>`).join('');
    }

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
                selProgramaManual.innerHTML = data.filter(c => c.tipo === 'CARRERA')
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
    function renderizarGraficoAsistencia() {
        const ctx = document.getElementById('asistenciaChart');
        if (ctx) {
            if (chartInstance) chartInstance.destroy(); 
            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                    datasets: [
                        { label: 'Asistencia Esperada (%)', data: [100, 100, 100, 100], backgroundColor: 'rgba(200, 200, 200, 0.3)' },
                        { label: 'Asistencia Real (%)', data: [95, 92, 88, 85], backgroundColor: '#00897b', borderRadius: 4 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
            });
        }
    }
});

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