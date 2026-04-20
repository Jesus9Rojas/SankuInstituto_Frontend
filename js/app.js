// /js/app.js

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. RENDERIZADO DINÁMICO DE PROGRAMAS (Solo si estamos en programas.html)
    const contenedorProgramas = document.getElementById("contenedor-programas");

    if (contenedorProgramas && window.db_programas) {
        // Limpiamos el contenedor
        contenedorProgramas.innerHTML = "";

        // Recorremos la base de datos simulada
        window.db_programas.forEach(programa => {
            
            // Creamos el HTML de la tarjeta
            const cardHTML = `
                <div class="card-programa">
                    <span class="etiqueta">${programa.etiqueta}</span>
                    <div class="icono-programa">${programa.icono}</div>
                    <h3 style="margin-bottom: 10px; font-size: 20px;">${programa.titulo}</h3>
                    <p style="color: var(--accent-red); margin-bottom: 15px; font-weight: bold; font-size: 14px;">
                        ⏱️ ${programa.duracion}
                    </p>
                    <p style="color: var(--text-muted); line-height: 1.5; margin-bottom: 20px;">
                        ${programa.descripcion}
                    </p>
                    <button class="btn-acceso" style="width: 100%; border: none; cursor: pointer;">
                        Ver Plan de Estudios
                    </button>
                </div>
            `;
            
            // Inyectamos la tarjeta en el contenedor
            contenedorProgramas.innerHTML += cardHTML;
        });
    }

});

document.addEventListener("DOMContentLoaded", function () {
    console.log("App Intranet Iniciada");

    // --- 1. Proteger la Página (Requiere auth.js cargado) ---
    // auth.js se ejecuta primero y redirecciona si no hay sesión.
    // Aquí solo personalizamos el saludo con datos reales.
    const usuarioLogueado = auth.getUsuarioLogueado();
    if (usuarioLogueado) {
        setUserDataUI(usuarioLogueado);
    }

    // --- 2. Funcionalidad de Navegación Dinámica ---
    const navLinks = document.querySelectorAll(".nav-link");
    const contentArea = document.getElementById("mainContent");
    const pageTitle = document.querySelector(".page-title");

    navLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault(); // Evita recargar página

            // A. Obtener la sección destino
            const sectionTarget = this.getAttribute("data-section");
            console.log("Navegando a:", sectionTarget);

            // B. Actualizar clase 'active' en el sidebar
            navLinks.forEach(l => l.classList.remove("active"));
            this.classList.add("active");

            // C. Cambiar Título de la Cabecera
            pageTitle.textContent = this.querySelector('span').textContent;

            // D. Cambiar Sección Activa en el contenido (JS Dinámico)
            switchSection(sectionTarget);
        });
    });

    // --- Funciones de Soporte para App ---

    // Función para rellenar datos del usuario en la interfaz
    function setUserDataUI(user) {
        document.getElementById("sidebarUserName").textContent = user.nombre;
        document.getElementById("navUserName").textContent = user.nombre;
        const welcomeName = document.getElementById("welcomeUserName");
        if(welcomeName) welcomeName.textContent = user.nombre;
    }

    // Función principal para cambiar el contenido central
    function switchSection(target) {
        // Ocultar todas las secciones
        const allSections = contentArea.querySelectorAll(".dynamic-section");
        allSections.forEach(s => s.classList.remove("active-section"));

        // Buscar si ya existe la sección cargada
        let existingSection = document.getElementById(`section-${target}`);

        if (existingSection) {
            // Mostrar si existe
            existingSection.classList.add("active-section");
        } else {
            // Si no existe, cargarla dinámicamente (puedes implementarlo con fetch() más adelante)
            // Por ahora, solo mostramos el Inicio.
            console.warn(`Sección "${target}" no encontrada, mostrando Inicio.`);
            loadMockSection(target);
        }
    }

    // Función MOCK: Carga contenido de prueba para mostrar funcionalidad de botones
    function loadMockSection(target) {
        let tituloStr = target.charAt(0).toUpperCase() + target.slice(1);
        
        // Creamos la estructura básica de la tarjeta de la sección
        const newSection = document.createElement('div');
        newSection.id = `section-${target}`;
        newSection.className = 'dynamic-section active-section';
        newSection.innerHTML = `
            <div class="db-card shadow-card bg-card border-card">
                <div class="db-card-header border-bottom">
                    <h2 class="text-primary" style="font-size: 20px;">${tituloStr}</h2>
                </div>
                <div class="db-card-body">
                    <p class="text-muted">Estás visualizando la sección MOCK de ${tituloStr}. Aquí se cargarán los datos reales pronto.</p>
                </div>
            </div>
        `;
        
        contentArea.appendChild(newSection);
    }

    // --- 3. Botón Cerrar Sesión Intranet ---
    const btnLogOutPnl = document.getElementById("btnLogoutIntranet");
    if(btnLogOutPnl){
        btnLogOutPnl.addEventListener("click", function(e){
            e.preventDefault();
            auth.logout(); // auth.js maneja la redirección
        });
    }

});