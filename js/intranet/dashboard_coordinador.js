// /js/intranet/dashboard_coordinador.js

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Verificar Sesión Segura
    const rolUsuario = localStorage.getItem("usuarioRol");
    if (!localStorage.getItem("sesionActiva") || rolUsuario !== "coordinador") {
        window.location.href = "../../../login.html";
        return;
    }

    // 2. Insertar el nombre en Cabecera y Perfil
    const nombreUsuario = localStorage.getItem("usuarioNombre");
    if (nombreUsuario) {
        const primerNombre = nombreUsuario.split(' ')[0];
        
        const spanNombre = document.getElementById("userNameHeader");
        if(spanNombre) spanNombre.textContent = primerNombre;
        
        const inicial = primerNombre.charAt(0).toUpperCase();
        const spanInitial = document.getElementById("userInitial");
        if(spanInitial) spanInitial.textContent = inicial;

        const perfilFull = document.getElementById("perfilFullName");
        if(perfilFull) perfilFull.textContent = nombreUsuario;
        
        const perfilInit = document.getElementById("perfilInitial");
        if(perfilInit) perfilInit.textContent = inicial;
    }

    // 3. Ocultar/Mostrar Barra Lateral
    const btnMenuToggle = document.getElementById("btnMenuToggle");
    const portalLayout = document.getElementById("portalLayout");
    if (btnMenuToggle && portalLayout) {
        btnMenuToggle.addEventListener("click", () => {
            portalLayout.classList.toggle("sidebar-collapsed");
        });
    }

    // 4. Lógica Principal de Pestañas (SPA)
    const navTriggers = document.querySelectorAll(".menu-btn, .nav-trigger");
    const sections = document.querySelectorAll(".content-section");
    const menuBtns = document.querySelectorAll(".menu-btn");

    navTriggers.forEach(trigger => {
        trigger.addEventListener("click", function(e) {
            e.preventDefault();

            sections.forEach(s => s.classList.remove("active"));
            menuBtns.forEach(b => b.classList.remove("active"));

            if (this.classList.contains("menu-btn")) {
                this.classList.add("active");
            }

            const targetId = this.getAttribute("data-target");
            const targetSection = document.getElementById(targetId);
            if(targetSection) targetSection.classList.add("active");

            const menuPerfil = document.getElementById("menuPerfil");
            if (menuPerfil && menuPerfil.classList.contains("show")) {
                menuPerfil.classList.remove("show");
            }

            if(window.innerWidth <= 768 && portalLayout) {
                portalLayout.classList.remove("sidebar-collapsed");
            }
            
            if(targetId === 'seccion-inicio') renderizarGraficoAsistencia();
        });
    });

    // 5. Menú Desplegable
    const btnDropdownChevron = document.getElementById("btnDropdownChevron");
    const menuPerfil = document.getElementById("menuPerfil");
    if(btnDropdownChevron && menuPerfil) {
        btnDropdownChevron.addEventListener("click", (e) => {
            e.stopPropagation();
            menuPerfil.classList.toggle("show");
        });
        document.addEventListener("click", (e) => {
            if (!menuPerfil.contains(e.target) && e.target !== btnDropdownChevron) {
                menuPerfil.classList.remove("show");
            }
        });
    }

    // 6. Gráfico de Asistencia
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
    renderizarGraficoAsistencia();

    // 7. Cerrar Sesión
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "/html/index.html";
        });
    }
});

// ==========================================
// FUNCIONES GLOBALES DEL WIZARD DE MATRÍCULA
// ==========================================

function actualizarIndicador(pasoActual) {
    // Limpiamos todo primero
    for(let i=1; i<=4; i++) {
        const ind = document.getElementById(`ind-step-${i}`);
        if(ind) {
            ind.classList.remove('active');
            ind.classList.remove('completed');
        }
    }
    // Asignamos 'completed' a los anteriores y 'active' al actual
    for(let i=1; i<pasoActual; i++) {
        const ind = document.getElementById(`ind-step-${i}`);
        if(ind) ind.classList.add('completed');
    }
    const currentInd = document.getElementById(`ind-step-${pasoActual}`);
    if(currentInd) currentInd.classList.add('active');
}

window.siguientePaso = function(pasoActual) {
    // Validar (Simulada: Verifica si llenaron DNI y Nombres en paso 1)
    if (pasoActual === 1) {
        const dni = document.getElementById('matDni').value;
        const nombres = document.getElementById('matNombres').value;
        if(dni === "" || nombres === "") {
            alert("Por favor, llena los datos requeridos (DNI y Nombres) para continuar.");
            return;
        }
    }

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

window.finalizarMatricula = function() {
    // Extraer DNI para armar usuario
    const dni = document.getElementById('matDni').value;
    const usuarioFinal = "U" + dni;

    // Generar Clave Aleatoria Segura (Ej: TeCh-8X9p)
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let claveFinal = "TeCh-";
    for (let i = 0; i < 4; i++) {
        claveFinal += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Inyectar en el Paso 4 (Confirmación)
    document.getElementById("resUsuario").textContent = usuarioFinal;
    document.getElementById("resClave").textContent = claveFinal;

    // Mostrar Paso 4
    document.getElementById(`wiz-step-3`).style.display = "none";
    document.getElementById(`wiz-step-4`).style.display = "block";
    actualizarIndicador(4);
};

window.copiarCredenciales = function() {
    const u = document.getElementById("resUsuario").textContent;
    const p = document.getElementById("resClave").textContent;
    const texto = `¡Bienvenido al Instituto Tech!\nTu código de Usuario es: ${u}\nTu contraseña temporal es: ${p}\n\n*Por seguridad, el sistema te pedirá cambiarla al iniciar sesión por primera vez.`;
    
    navigator.clipboard.writeText(texto).then(() => {
        alert("Credenciales copiadas al portapapeles. ¡Listo para enviar por correo o WhatsApp!");
    });
};

window.reiniciarWizard = function() {
    // Limpiar inputs
    document.getElementById('matDni').value = "";
    document.getElementById('matNombres').value = "";
    document.getElementById('matApellidos').value = "";
    document.getElementById('matEmail').value = "";
    // Volver al Paso 1
    document.getElementById(`wiz-step-4`).style.display = "none";
    document.getElementById(`wiz-step-1`).style.display = "block";
    actualizarIndicador(1);
};