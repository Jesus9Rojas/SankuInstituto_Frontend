document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Verificar Sesión
    const sesionActiva = localStorage.getItem("sesionActiva");
    if (!sesionActiva) {
        window.location.href = "../../../login.html";
        return;
    }

    // 2. Nombre del usuario
    const nombreUsuario = localStorage.getItem("usuarioNombre");
    if (nombreUsuario) {
        const primerNombre = nombreUsuario.split(' ')[0];
        const spanNombre = document.getElementById("userNameHeader");
        if(spanNombre) spanNombre.textContent = primerNombre;

        const perfilFull = document.getElementById("perfilFullName");
        if(perfilFull) perfilFull.textContent = nombreUsuario;
    }

    // 3. Colapsar Menú Lateral
    const btnMenuToggle = document.getElementById("btnMenuToggle");
    const portalLayout = document.getElementById("portalLayout");
    if (btnMenuToggle && portalLayout) {
        btnMenuToggle.addEventListener("click", () => {
            portalLayout.classList.toggle("sidebar-collapsed");
        });
    }

    // 4. Navegación SPA
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
        });
    });

    // 5. Menú Desplegable Perfil
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

    // 6. MATRÍCULA WIZARD (Pasos)
    const btnMatPaso2 = document.getElementById("btnMatPaso2");
    const btnMatVolver1 = document.getElementById("btnMatVolver1");
    const btnConfirmarMatricula = document.getElementById("btnConfirmarMatricula");
    const step1 = document.getElementById("mat-step-1");
    const step2 = document.getElementById("mat-step-2");
    const step3 = document.getElementById("mat-step-3");

    if (btnMatPaso2) btnMatPaso2.addEventListener("click", () => { step1.style.display = "none"; step2.style.display = "block"; });
    if (btnMatVolver1) btnMatVolver1.addEventListener("click", () => { step2.style.display = "none"; step1.style.display = "block"; });
    if (btnConfirmarMatricula) {
        btnConfirmarMatricula.addEventListener("click", () => {
            btnConfirmarMatricula.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
            btnConfirmarMatricula.disabled = true;
            setTimeout(() => {
                step2.style.display = "none";
                step3.style.display = "block";
            }, 1500);
        });
    }

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