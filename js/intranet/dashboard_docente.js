// /js/intranet/dashboard_docente.js

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Verificar Sesión (Auth Guard)
    const rolUsuario = localStorage.getItem("usuarioRol");
    if (!localStorage.getItem("sesionActiva") || rolUsuario !== "docente") {
        window.location.href = "../../../login.html";
        return;
    }

    // 2. Personalizar nombre e inicial del usuario
    const nombreUsuario = localStorage.getItem("usuarioNombre");
    if (nombreUsuario) {
        const primerNombre = nombreUsuario.split(' ')[0];
        const spanNombre = document.getElementById("userNameHeader");
        if(spanNombre) spanNombre.textContent = primerNombre;
        
        const inicial = primerNombre.charAt(0).toUpperCase();
        
        // Inicial en la cabecera
        const spanInitial = document.getElementById("userInitial");
        if(spanInitial) spanInitial.textContent = inicial;

        // Nombre e inicial en la sección "Mi Perfil"
        const perfilFull = document.getElementById("perfilFullName");
        if(perfilFull) perfilFull.textContent = nombreUsuario;
        
        const perfilInit = document.getElementById("perfilInitial");
        if(perfilInit) perfilInit.textContent = inicial;
    }

    // 3. Colapsar/Expandir el Menú Lateral
    const btnMenuToggle = document.getElementById("btnMenuToggle");
    const portalLayout = document.getElementById("portalLayout");
    
    if (btnMenuToggle && portalLayout) {
        btnMenuToggle.addEventListener("click", () => {
            portalLayout.classList.toggle("sidebar-collapsed");
        });
    }

    // 4. Navegación SPA (Botones Laterales y Links)
    const navTriggers = document.querySelectorAll(".menu-btn, .nav-trigger");
    const sections = document.querySelectorAll(".content-section");
    const menuBtns = document.querySelectorAll(".menu-btn");

    navTriggers.forEach(trigger => {
        trigger.addEventListener("click", function(e) {
            e.preventDefault();

            sections.forEach(s => s.classList.remove("active"));
            menuBtns.forEach(b => b.classList.remove("active"));

            // Si es un botón del sidebar, marcarlo activo
            if (this.classList.contains("menu-btn")) {
                this.classList.add("active");
            } else {
                // Si es un botón interno (ej: "Tomar asistencia"), buscar y activar el botón del sidebar correspondiente
                const targetId = this.getAttribute("data-target");
                const correspondingBtn = document.querySelector(`.menu-btn[data-target="${targetId}"]`);
                if(correspondingBtn) correspondingBtn.classList.add("active");
            }

            // Mostrar la sección correspondiente
            const targetId = this.getAttribute("data-target");
            const targetSection = document.getElementById(targetId);
            if(targetSection) targetSection.classList.add("active");

            // Cerrar menú móvil si se clickea
            if(window.innerWidth <= 900 && portalLayout) {
                portalLayout.classList.remove("sidebar-collapsed");
            }
            
        });
    });

    // 5. Lógica de Asistencia (Toggle Botones Presente/Falta)
    const presentBtns = document.querySelectorAll(".btn-toggle.present");
    const absentBtns = document.querySelectorAll(".btn-toggle.absent");

    const toggleAsistencia = (btnClickeado, hermano) => {
        btnClickeado.addEventListener("click", () => {
            btnClickeado.classList.add("active");
            hermano.classList.remove("active");
        });
    };

    for(let i = 0; i < presentBtns.length; i++) {
        toggleAsistencia(presentBtns[i], absentBtns[i]);
        toggleAsistencia(absentBtns[i], presentBtns[i]);
    }

    // 6. Lógica de Registro de Notas (Simulación Autoguardado)
    const inputsNotas = document.querySelectorAll(".nota-input:not([disabled])");
    const saveIndicator = document.getElementById("saveIndicator");
    let timeoutGuardado;

    inputsNotas.forEach(input => {
        // Guardar al quitar el foco (blur)
        input.addEventListener("blur", (e) => {
            validarYGuardarNota(e.target);
        });

        // Guardar al presionar Enter
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.target.blur(); // Dispara el blur
            }
        });
    });

    function validarYGuardarNota(inputElement) {
        let valor = inputElement.value;
        
        // Validación básica 0 - 20
        if(valor !== "" && (valor < 0 || valor > 20)) {
            inputElement.value = "";
            inputElement.style.borderColor = "var(--accent-red)";
            alert("Estimado docente, la nota debe estar en el rango de 0 a 20.");
            return;
        } else {
            inputElement.style.borderColor = "#ccc";
        }

        // Si se ingresó una nota válida, simular guardado
        if(valor !== "") {
            saveIndicator.style.opacity = "1"; // Mostrar "Guardado"
            
            clearTimeout(timeoutGuardado);
            timeoutGuardado = setTimeout(() => {
                saveIndicator.style.opacity = "0"; // Ocultar después de 2 seg
            }, 2000);
        }
    }

    // 7. Menú Desplegable del Perfil
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

    // 8. Cerrar Sesión
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "/html/index.html";
        });
    }
});