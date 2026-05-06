// /js/intranet/dashboard_docente.js
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. SEGURIDAD Y DATOS BASE
    const rolUsuario = localStorage.getItem("usuarioRol");
    if (!localStorage.getItem("sesionActiva") || rolUsuario !== "docente") {
        window.location.href = "/html/login.html";
        return;
    }
    const token = localStorage.getItem("token");
    const usuarioId = localStorage.getItem("usuarioId");
    let idDocenteGlobal = null;
    let misSeccionesGlobal = [];

    // Nombres en Cabecera
    const nombreUsuario = localStorage.getItem("usuarioNombre");
    if (nombreUsuario) {
        document.getElementById("userNameHeader").textContent = nombreUsuario.split(' ')[0];
        document.getElementById("userInitial").textContent = nombreUsuario.charAt(0).toUpperCase();
    }

    // 2. NAVEGACIÓN SPA
    const navTriggers = document.querySelectorAll(".menu-btn, .nav-trigger");
    const sections = document.querySelectorAll(".content-section");
    const menuBtns = document.querySelectorAll(".menu-btn");
    
    navTriggers.forEach(trigger => {
        trigger.addEventListener("click", function(e) {
            e.preventDefault();
            sections.forEach(s => s.classList.remove("active"));
            menuBtns.forEach(b => b.classList.remove("active"));
            
            if (this.classList.contains("menu-btn")) this.classList.add("active");
            else document.querySelector(`.menu-btn[data-target="${this.getAttribute("data-target")}"]`)?.classList.add("active");
            
            document.getElementById(this.getAttribute("data-target")).classList.add("active");
        });
    });

    document.getElementById("btnCerrarSesion").addEventListener("click", (e) => {
        e.preventDefault(); localStorage.clear(); window.location.href = "/html/index.html";
    });

    window.cerrarModal = function(idModal) {
        document.getElementById(idModal).classList.remove("show");
    };

    // ==========================================
    // 3. CARGA DE DATOS DINÁMICOS
    // ==========================================
    async function inicializarPortalDocente() {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const resPerfil = await fetch(`http://localhost:8080/api/v1/docentes/perfil/${usuarioId}`, { headers });
            const perfil = await resPerfil.json();
            idDocenteGlobal = perfil.idDocente;

            document.getElementById("perfilFullName").textContent = perfil.usuario.nombreCompleto;
            document.getElementById("perfilInitialLarge").textContent = perfil.usuario.nombreCompleto.charAt(0).toUpperCase();
            document.getElementById("perfilDni").textContent = perfil.usuario.dni;
            document.getElementById("perfilEmail").textContent = perfil.usuario.email;
            document.getElementById("perfilEspecialidad").textContent = perfil.especialidad;
            document.getElementById("perfilEstado").textContent = perfil.estado;

            const resSecciones = await fetch(`http://localhost:8080/api/v1/secciones/docente/${idDocenteGlobal}`, { headers });
            misSeccionesGlobal = await resSecciones.json();

            document.getElementById("metric-secciones").textContent = misSeccionesGlobal.length;
            renderizarAgendaDocente(misSeccionesGlobal);
            renderizarCardsCursos(misSeccionesGlobal);
            generarPillsCursos(misSeccionesGlobal);
            renderizarCalendarioGrid(misSeccionesGlobal);

            // 🚀 LLAMADO A LA CAMPANITA (AL INSTANTE)
            cargarNotificacionesDocente(headers);

            // 🚀 MAGIA EN SEGUNDO PLANO: Revisar nuevas notificaciones cada 60 segundos (60000 ms)
            setInterval(() => {
                cargarNotificacionesDocente(headers);
            }, 60000);

        } catch (error) { console.error(error); }
    }

    // --- LÓGICA DE NOTIFICACIONES ---
    async function cargarNotificacionesDocente(headers) {
        try {
            const res = await fetch(`http://localhost:8080/api/v1/alertas/docente/${idDocenteGlobal}`, { headers });
            if (res.ok) {
                const alertas = await res.json();
                const badge = document.getElementById("badge-notif");
                const lista = document.getElementById("lista-notificaciones");

                if (alertas.length > 0) {
                    badge.style.display = "block";
                    badge.textContent = alertas.length;
                    
                    lista.innerHTML = alertas.map(a => {
                        const titulo = a.tipo === 'NOTAS_ATRASADAS' ? 'Faltan Calificaciones' : 'Registro de Asistencia';
                        const color = a.tipo === 'NOTAS_ATRASADAS' ? '#dc3545' : '#f39c12';
                        const icono = a.tipo === 'NOTAS_ATRASADAS' ? 'fa-file-signature' : 'fa-clipboard-user';
                        
                        return `
                        <div class="notif-item" style="border-left: 4px solid ${color}; margin-bottom: 10px; padding: 10px; background-color: #fcfcfc; border-radius: 4px; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                            
                            <button onclick="marcarComoLeida(${a.idAlerta}, event)" style="position: absolute; top: 5px; right: 5px; background: none; border: none; color: #aaa; cursor: pointer; font-size: 14px; transition: color 0.2s;">
                                <i class="fa-solid fa-xmark" onmouseover="this.style.color='#dc3545'" onmouseout="this.style.color='#aaa'"></i>
                            </button>

                            <p style="margin:0; font-weight:600; color:${color}; font-size: 13px; padding-right: 15px;"><i class="fa-solid ${icono}"></i> ${titulo}</p>
                            <p style="margin:5px 0; font-size:12px; color:#555;">${a.mensaje}</p>
                            <span style="font-size:10px; color:#888;"><i class="fa-solid fa-graduation-cap"></i> Curso: ${a.nombreSeccion}</span>
                        </div>`;
                    }).join('');
                } else {
                    badge.style.display = "none";
                    lista.innerHTML = `
                        <div style="text-align: center; padding: 20px;">
                            <i class="fa-solid fa-face-smile text-success" style="font-size: 30px; margin-bottom: 10px;"></i>
                            <p class="text-muted" style="font-size:12px; margin: 0;">¡Todo al día! No tienes tareas pendientes.</p>
                        </div>`;
                }
            }
        } catch (e) { 
            console.error("Error cargando notificaciones:", e); 
        }
    }

    const btnNotif = document.getElementById("btnNotificaciones");
    const dropNotif = document.getElementById("notif-dropdown");
    const btnDropdownChevron = document.getElementById("btnDropdownChevron");
    const menuPerfil = document.getElementById("menuPerfil");

    if (btnNotif && dropNotif) {
        btnNotif.addEventListener("click", (e) => {
            e.stopPropagation();
            dropNotif.style.display = dropNotif.style.display === "none" ? "block" : "none";
            if (menuPerfil) menuPerfil.classList.remove("show"); 
        });
    }

    if (btnDropdownChevron && menuPerfil) {
        btnDropdownChevron.addEventListener("click", (e) => {
            e.stopPropagation();
            menuPerfil.classList.toggle("show");
            if (dropNotif) dropNotif.style.display = "none"; 
        });
    }

    document.addEventListener("click", (e) => {
        if (dropNotif && !dropNotif.contains(e.target) && e.target !== btnNotif) {
            dropNotif.style.display = "none";
        }
        if (menuPerfil && !menuPerfil.contains(e.target) && e.target !== btnDropdownChevron) {
            menuPerfil.classList.remove("show");
        }
    });

    const diasSemana = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    function renderizarAgendaDocente(secciones) {
        const agenda = document.getElementById("lista-clases-docente");
        if (secciones.length === 0) { agenda.innerHTML = `<p class="text-center text-muted">Sin carga asignada.</p>`; return; }
        agenda.innerHTML = secciones.map(s => `
            <div class="agenda-item">
                <div class="agenda-time">
                    <span class="time-start">${s.horaInicio.substring(0,5)}</span>
                    <span class="time-end">${s.horaFin.substring(0,5)}</span>
                </div>
                <div class="agenda-details">
                    <h4>${s.nombreCurso}</h4>
                    <p><i class="fa-solid fa-users"></i> SEC-${s.idSeccion} | ${diasSemana[s.diaSemana]} (${s.modalidad})</p>
                </div>
            </div>
        `).join('');
    }

    function renderizarCardsCursos(secciones) {
        const grid = document.getElementById("grid-mis-cursos-docente");
        grid.innerHTML = secciones.map(s => `
            <div class="curso-modern-card shadow-card bg-card" style="border-top: 4px solid var(--color-primary);">
                <div class="curso-modern-body">
                    <h4 style="font-size: 18px; margin-bottom: 5px;">${s.nombreCurso}</h4>
                    <p class="text-muted" style="font-size: 13px; margin-bottom: 20px;">SEC-${s.idSeccion} | ${s.modalidad}</p>
                    <button class="btn-outline-primary" style="width:100%; margin-top: auto;" onclick="abrirAulaVirtual(${s.idSeccion}, '${s.nombreCurso}')">
                        <i class="fa-solid fa-door-open"></i> Entrar a Curso
                    </button>
                </div>
            </div>
        `).join('');
    }

    window.abrirAulaVirtual = async function(idSeccion, nombreCurso) {
        document.getElementById("lblAulaCurso").textContent = nombreCurso;
        const divTemas = document.getElementById("lista-temas-curso");
        divTemas.innerHTML = `<p class="text-center text-muted">Conectando con el aula...</p>`;
        document.getElementById("modalAulaVirtual").classList.add("show");

        try {
            const res = await fetch(`http://localhost:8080/api/v1/materiales/seccion/${idSeccion}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const materiales = await res.json();

            if(materiales.length === 0) {
                divTemas.innerHTML = `<p class="text-center text-muted" style="background:white; padding: 20px; border-radius:8px;">Aún no has compartido temas en este curso.</p>`;
                return;
            }

            divTemas.innerHTML = materiales.map(m => `
                <div class="tema-card">
                    <div class="tema-icon"><i class="fa-solid fa-file-pdf"></i></div>
                    <div class="tema-info">
                        <h4>${m.titulo}</h4>
                        <span class="text-muted">Subido: ${new Date(m.fechaSubida).toLocaleDateString('es-ES')}</span>
                    </div>
                    <a href="${m.archivoUrl}" target="_blank" class="btn-download"><i class="fa-solid fa-cloud-arrow-down"></i></a>
                </div>
            `).join('');
        } catch(e) { console.error(e); }
    };

    function generarPillsCursos(secciones) {
        const contAsis = document.getElementById("pills-secciones-asistencia");
        const contNotas = document.getElementById("pills-secciones-notas");
        
        const htmlPills = secciones.map(s => `
            <button class="pill-btn" onclick="seleccionarCursoPill(this, ${s.idSeccion})">
                ${s.nombreCurso} (SEC-${s.idSeccion})
            </button>
        `).join('');
        
        contAsis.innerHTML = htmlPills;
        contNotas.innerHTML = htmlPills;
    }

    window.seleccionarCursoPill = function(btnElement, idSeccion) {
        const container = btnElement.parentElement;
        container.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');

        if(container.id === 'pills-secciones-asistencia') {
            cargarNominaAsistencia(idSeccion);
        } else if (container.id === 'pills-secciones-notas') {
            cargarPillsEvaluaciones(idSeccion);
        }
    };

    // ==========================================
    // LÓGICA DE ASISTENCIA
    // ==========================================
    document.getElementById("fecha-hoy-asistencia").textContent = new Date().toLocaleDateString('es-ES');
    let seccionAsistenciaActual = null;

    async function cargarNominaAsistencia(idSeccion) {
        seccionAsistenciaActual = idSeccion;
        const tbody = document.getElementById("tabla-asistencia-alumnos");
        tbody.innerHTML = `<tr><td colspan="3" class="text-center">Cargando alumnos y asistencia previa...</td></tr>`;
        document.getElementById("contenedor-asistencia").style.display = "block";

        try {
            const resAlumnos = await fetch(`http://localhost:8080/api/v1/matriculas/seccion/${idSeccion}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const alumnos = await resAlumnos.json();
            
            if(alumnos.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No hay alumnos matriculados.</td></tr>`; 
                return;
            }

            const d = new Date();
            const fechaHoyStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            
            const resAsis = await fetch(`http://localhost:8080/api/v1/asistencias/seccion/${idSeccion}/fecha/${fechaHoyStr}`, { headers: { 'Authorization': `Bearer ${token}` } });
            
            let asistenciaGuardada = [];
            if(resAsis.ok) asistenciaGuardada = await resAsis.json();

            tbody.innerHTML = alumnos.map((a, i) => {
                const registroPrevio = asistenciaGuardada.find(asis => asis.alumnoId === a.alumnoId);
                const estaPresente = registroPrevio ? registroPrevio.presente : true;
                
                const clasePresente = estaPresente ? 'active' : '';
                const claseFalta = !estaPresente ? 'active' : '';

                return `
                <tr class="fila-asistencia" data-alumno="${a.alumnoId}">
                    <td>${i+1}</td>
                    <td><strong>${a.nombreAlumno}</strong></td>
                    <td style="text-align: right;">
                        <div class="toggle-group">
                            <button class="btn-toggle present ${clasePresente}" onclick="marcarAsistencia(this, true)"><i class="fa-solid fa-check"></i> Presente</button>
                            <button class="btn-toggle absent ${claseFalta}" onclick="marcarAsistencia(this, false)"><i class="fa-solid fa-xmark"></i> Falta</button>
                        </div>
                    </td>
                </tr>
                `;
            }).join('');
        } catch(err) { console.error(err); }
    }

    window.marcarAsistencia = function(btnClickeado, esPresente) {
        const grupo = btnClickeado.parentElement;
        grupo.querySelector('.present').classList.remove('active');
        grupo.querySelector('.absent').classList.remove('active');
        btnClickeado.classList.add('active');
    };

    document.getElementById("btnGuardarAsistencia").addEventListener("click", async () => {
        const filas = document.querySelectorAll(".fila-asistencia");
        const btn = document.getElementById("btnGuardarAsistencia");
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
        btn.disabled = true;

        for(let fila of filas) {
            const idAlum = fila.getAttribute("data-alumno");
            const presente = fila.querySelector('.present').classList.contains('active');
            try {
                await fetch('http://localhost:8080/api/v1/asistencias/registrar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ seccionId: seccionAsistenciaActual, alumnoId: parseInt(idAlum), presente: presente })
                });
            } catch(e) {}
        }
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Asistencia';
        btn.disabled = false;
        alert(`¡Asistencia guardada exitosamente en la Base de Datos!`);
    });

    // ==========================================
    // LÓGICA DE NOTAS
    // ==========================================
    let seccionNotasActual = null;

    async function cargarPillsEvaluaciones(idSeccion) {
        seccionNotasActual = idSeccion;
        const contEvals = document.getElementById("pills-evaluaciones-notas");
        document.getElementById("contenedor-notas").style.display = "none";
        contEvals.innerHTML = `<span class="text-muted">Cargando...</span>`;

        try {
            const res = await fetch(`http://localhost:8080/api/v1/evaluaciones/seccion/${idSeccion}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const evals = await res.json();
            
            if(evals.length === 0) {
                contEvals.innerHTML = `<span class="text-danger">Aún no has creado evaluaciones para este curso.</span>`; return;
            }

            contEvals.innerHTML = evals.map(ev => `
                <button class="pill-btn eval-btn" onclick="seleccionarEvalPill(this, ${ev.idEvaluacion}, '${ev.nombreExamen}')">
                    ${ev.nombreExamen} (${ev.pesoPorcentaje}%)
                </button>
            `).join('');
        } catch(err) { console.error(err); }
    }

    window.seleccionarEvalPill = function(btnElement, idEvaluacion, nombreEval) {
        btnElement.parentElement.querySelectorAll('.eval-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
        
        document.getElementById("lbl-evaluacion-actual").textContent = nombreEval;
        cargarNominaNotas(idEvaluacion);
    };

    async function cargarNominaNotas(idEvaluacion) {
        const tbodyNotas = document.getElementById("tabla-notas-alumnos");
        document.getElementById("contenedor-notas").style.display = "block";
        tbodyNotas.innerHTML = `<tr><td colspan="2" class="text-center">Cargando nómina y notas previas...</td></tr>`;

        try {
            const resAlum = await fetch(`http://localhost:8080/api/v1/matriculas/seccion/${seccionNotasActual}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const alumnos = await resAlum.json();

            const resNotas = await fetch(`http://localhost:8080/api/v1/notas/evaluacion/${idEvaluacion}`, { headers: { 'Authorization': `Bearer ${token}` } });
            let notasGuardadas = [];
            if(resNotas.ok) notasGuardadas = await resNotas.json();

            tbodyNotas.innerHTML = alumnos.map(a => {
                let idRealAlumno = a.alumnoId;
                if (!idRealAlumno || idRealAlumno === undefined || idRealAlumno === "undefined") {
                    const filaAsistencia = Array.from(document.querySelectorAll(".fila-asistencia")).find(tr => tr.innerHTML.includes(a.nombreAlumno));
                    if (filaAsistencia) idRealAlumno = filaAsistencia.getAttribute("data-alumno");
                }

                const notaPrevia = notasGuardadas.find(n => n.alumnoId == idRealAlumno);
                const valorNota = notaPrevia ? notaPrevia.nota : "";

                return `
                <tr>
                    <td><strong>${a.nombreAlumno}</strong></td>
                    <td style="text-align: center; background-color: #f8f9fa;">
                        <input type="number" class="nota-input" 
                               data-alumno="${idRealAlumno}" data-eval="${idEvaluacion}" placeholder="-" 
                               value="${valorNota}"
                               oninput="limitarDigitos(this)">
                    </td>
                </tr>
                `;
            }).join('');
        } catch(err) { console.error(err); }
    }

    window.limitarDigitos = function(input) {
        if (input.value.length > 2) input.value = input.value.slice(0, 2);
        let val = parseInt(input.value);
        if (val > 20) input.value = 20;
        if (val < 0) input.value = 0;
    };

    window.guardarNotaCelda = async function(inputElem) {
        let nota = inputElem.value;
        if(nota === "") return;
        
        const saveIndicator = document.getElementById("saveIndicator");
        saveIndicator.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
        saveIndicator.style.opacity = "1";
        saveIndicator.style.color = "#f39c12";

        try {
            await fetch('http://localhost:8080/api/v1/notas/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    evaluacionId: parseInt(inputElem.getAttribute("data-eval")), 
                    alumnoId: parseInt(inputElem.getAttribute("data-alumno")), 
                    nota: parseFloat(nota) 
                })
            });
            saveIndicator.innerHTML = '<i class="fa-solid fa-check-circle"></i> Sincronizado';
            saveIndicator.style.color = "#28a745";
            setTimeout(() => saveIndicator.style.opacity = "0", 2000);
        } catch(e) {
            saveIndicator.innerHTML = '<i class="fa-solid fa-xmark"></i> Error';
            saveIndicator.style.color = "#dc3545";
        }
    };

    // --- EL BOTÓN DE GUARDAR ESTÁ DENTRO AHORA ---
    const btnGuardarNotas = document.getElementById("btnGuardarNotas");
    if (btnGuardarNotas) {
        btnGuardarNotas.addEventListener("click", async (e) => {
            e.preventDefault(); 
            const inputs = document.querySelectorAll(".nota-input");
            const saveIndicator = document.getElementById("saveIndicator");
            
            btnGuardarNotas.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
            btnGuardarNotas.disabled = true;
            
            let enviadas = 0;
            let errores = 0;
            let mensajeBackend = "";

            for(let input of inputs) {
                let nota = input.value.trim();
                
                if(nota !== "") {
                    const idAlum = input.getAttribute("data-alumno");
                    const idEval = input.getAttribute("data-eval");
                    
                    if(!idAlum || idAlum === "undefined" || idAlum === "null") {
                        errores++;
                        mensajeBackend = "Falta el ID del Alumno. Ve a la pestaña 'Tomar Asistencia' primero.";
                        continue;
                    }

                    try {
                        const res = await fetch('http://localhost:8080/api/v1/notas/registrar', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ 
                                evaluacionId: parseInt(idEval), 
                                alumnoId: parseInt(idAlum), 
                                nota: parseFloat(nota) 
                            })
                        });
                        
                        if(res.ok) {
                            enviadas++;
                        } else {
                            errores++;
                            const errorText = await res.text();
                            try {
                                const errorObj = JSON.parse(errorText);
                                mensajeBackend = errorObj.mensaje || errorObj.message || errorObj.error || errorText;
                            } catch(parseError) {
                                mensajeBackend = errorText;
                            }
                        }
                    } catch(err) { 
                        errores++;
                        console.error("🔥 ERROR CRÍTICO EN FETCH:", err);
                        mensajeBackend = `Fallo en la red o JS: ${err.name} - ${err.message}`;
                    }
                }
            }
            
            btnGuardarNotas.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Calificaciones';
            btnGuardarNotas.disabled = false;
            
            if (enviadas > 0) {
                saveIndicator.innerHTML = '<i class="fa-solid fa-check-circle"></i> Sincronizado';
                saveIndicator.style.color = "#28a745";
                saveIndicator.style.opacity = "1";
                setTimeout(() => saveIndicator.style.opacity = "0", 3000);
                alert(`¡Se guardaron ${enviadas} calificaciones exitosamente!`);
            }
            
            if (errores > 0) {
                alert(`No se pudo guardar la calificación.\n\n🛑 DETALLE DEL ERROR REAL:\n${mensajeBackend}`);
            }
        });
    }

    // ARRANQUE FINAL
    inicializarPortalDocente();

    const coloresCursos = ['#0056b3', '#f39c12', '#00897b', '#9b59b6', '#e74c3c'];
    
    function formatearHora(horaStr) { 
        return horaStr ? horaStr.substring(0, 5) : "--:--"; 
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
        
        // Calcular la hora más temprana y más tardía del docente
        secciones.forEach(s => {
            const hInicio = parseInt(s.horaInicio.split(":")[0]);
            const hFin = parseInt(s.horaFin.split(":")[0]) + (s.horaFin.split(":")[1] > "00" ? 1 : 0);
            if (hInicio < minHora) minHora = hInicio;
            if (hFin > maxHora) maxHora = hFin;
        });
        
        if (minHora > 8) minHora = 8;
        if (maxHora < 15) maxHora = 15;
        
        let htmlGrid = '';
        
        // Dibujar celdas de fondo
        for (let horaActual = minHora; horaActual < maxHora; horaActual++) {
            const fila = horaActual - minHora + 2; 
            const horaTexto = `${horaActual.toString().padStart(2, '0')}:00`;
            htmlGrid += `<div class="cal-celda-hora" style="grid-column: 1; grid-row: ${fila};">${horaTexto}</div>`;
            for (let dia = 1; dia <= 7; dia++) {
                htmlGrid += `<div class="cal-celda-vacia" style="grid-column: ${dia + 1}; grid-row: ${fila};"></div>`;
            }
        }
        
        // Dibujar clases encima del fondo
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
                    const colorFondo = coloresCursos[c.idSeccion % coloresCursos.length];
                    
                    htmlGrid += `
                    <div class="cal-curso-bloque" onclick="abrirAulaVirtual(${c.idSeccion}, '${c.nombreCurso}')"
                        style="grid-column: ${dia + 1}; grid-row: ${inicioFila} / span ${spanFilas}; background-color: ${colorFondo};">
                        <div class="cal-curso-titulo">${c.nombreCurso}</div>
                        <div class="cal-curso-info">
                            <i class="fa-regular fa-clock"></i> ${formatearHora(c.horaInicio)} - ${formatearHora(c.horaFin)}<br>
                            <i class="fa-solid fa-users"></i> SEC-${c.idSeccion}
                        </div>
                    </div>`;
                } else {
                    // Si el administrador cruzó los horarios del profesor (Alerta Visual Roja)
                    let htmlNombresCursos = cluster.map(c => `<b>${c.nombreCurso}</b><br><span style="font-size:10px;">(${formatearHora(c.horaInicio)} a ${formatearHora(c.horaFin)})</span>`).join('<hr style="border-color: rgba(255,255,255,0.3); margin: 6px 0;">');
                    htmlGrid += `
                    <div class="cal-curso-bloque"
                        style="grid-column: ${dia + 1}; grid-row: ${inicioFila} / span ${spanFilas}; background-color: #dc3545; border: 2px solid darkred;">
                        <div class="cal-curso-titulo" style="text-align:center; font-size:14px; margin-bottom:8px;">
                            <i class="fa-solid fa-triangle-exclamation"></i> CRUCE DE HORARIO
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

    window.marcarComoLeida = async function(idAlerta, event) {
        // Evita que la campanita se cierre accidentalmente al hacer clic en la "X"
        if (event) event.stopPropagation(); 

        try {
            const res = await fetch(`http://localhost:8080/api/v1/alertas/${idAlerta}/resolver`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                // Volvemos a cargar las notificaciones para que desaparezca al instante
                cargarNotificacionesDocente({ 'Authorization': `Bearer ${token}` });
            }
        } catch (error) {
            console.error("No se pudo resolver la alerta:", error);
        }
    };
}); 