// /js/intranet/dashboard_admin.js

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Verificar Sesión (Auth Guard - Solo Administradores)
    const rolUsuario = localStorage.getItem("usuarioRol");
    if (!localStorage.getItem("sesionActiva") || rolUsuario !== "admin") {
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
            }

            // Mostrar la sección correspondiente
            const targetId = this.getAttribute("data-target");
            const targetSection = document.getElementById(targetId);
            if(targetSection) targetSection.classList.add("active");

            // Cerrar menú perfil si venimos del dropdown
            const menuPerfil = document.getElementById("menuPerfil");
            if (menuPerfil && menuPerfil.classList.contains("show")) {
                menuPerfil.classList.remove("show");
            }

            // Cerrar menú móvil
            if(window.innerWidth <= 900 && portalLayout) {
                portalLayout.classList.remove("sidebar-collapsed");
            }
            
            // Re-renderizar gráfico si entra a inicio (soluciona bugs visuales de Chart.js)
            if(targetId === 'seccion-inicio') {
                renderizarGrafico();
            }
        });
    });

    // 5. Menú Desplegable del Perfil
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

    // 6. RENDERIZAR GRÁFICO DE MATRÍCULAS (Chart.js)
    let chartInstance = null;
    function renderizarGrafico() {
        const ctx = document.getElementById('matriculasChart');
        if (ctx) {
            // Destruir gráfico anterior si existe para evitar superposiciones al navegar
            if (chartInstance) chartInstance.destroy();

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['2023-I', '2023-II', '2024-I', '2024-II', '2025-I', '2025-II', '2026-I'],
                    datasets: [{
                        label: 'Alumnos Matriculados',
                        data: [850, 920, 900, 1050, 1100, 1180, 1245],
                        borderColor: '#0056b3', // Azul primario
                        backgroundColor: 'rgba(0, 86, 179, 0.1)',
                        borderWidth: 3,
                        tension: 0.4, // Curva suave
                        fill: true,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#0056b3',
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }, // Oculta leyenda por limpieza
                    scales: {
                        y: { beginAtZero: false, grid: { color: '#eee' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    }
    // Renderizar al cargar la página
    renderizarGrafico();

    // 7. BUSCADOR EN TIEMPO REAL (Tabla de Usuarios)
    const buscador = document.getElementById("buscadorUsuarios");
    const filasTabla = document.querySelectorAll("#tablaUsuarios tbody tr");

    if (buscador) {
        buscador.addEventListener("keyup", function(e) {
            const terminoBusqueda = e.target.value.toLowerCase();

            filasTabla.forEach(fila => {
                const contenidoFila = fila.textContent.toLowerCase();
                if (contenidoFila.includes(terminoBusqueda)) {
                    fila.style.display = "";
                } else {
                    fila.style.display = "none";
                }
            });
        });
    }

    // 8. LOGICA DEL MODAL (Crear/Editar Usuarios)
    const modalUsuario = document.getElementById("modalUsuario");
    const btnNuevoUsuario = document.getElementById("btnNuevoUsuario");
    const btnCerrarModal = document.getElementById("btnCerrarModal");
    const btnCancelarModal = document.getElementById("btnCancelarModal");
    const formUsuario = document.getElementById("formUsuario");
    
    // Botones Editar (lápiz) en la tabla
    const btnEditarList = document.querySelectorAll(".btn-action.edit");

    function abrirModal() {
        modalUsuario.classList.add("show");
    }

    function cerrarModal() {
        modalUsuario.classList.remove("show");
        formUsuario.reset(); // Limpia el formulario al cerrar
    }

    if(btnNuevoUsuario) btnNuevoUsuario.addEventListener("click", abrirModal);
    if(btnCerrarModal) btnCerrarModal.addEventListener("click", cerrarModal);
    if(btnCancelarModal) btnCancelarModal.addEventListener("click", cerrarModal);

    btnEditarList.forEach(btn => {
        btn.addEventListener("click", abrirModal);
    });

    if(formUsuario) {
        formUsuario.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Usuario guardado en la base de datos exitosamente.");
            cerrarModal();
        });
    }

    const btnEliminarList = document.querySelectorAll(".btn-action.delete");
    btnEliminarList.forEach(btn => {
        btn.addEventListener("click", function(e) {
            if(confirm("¿Estás seguro de suspender el acceso a este usuario?")) {
                const fila = e.target.closest("tr");
                const badge = fila.querySelector(".badge");
                badge.className = "badge badge-suspended";
                badge.textContent = "Suspendido";
            }
        });
    });

    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "/html/index.html";
        });
    }
});