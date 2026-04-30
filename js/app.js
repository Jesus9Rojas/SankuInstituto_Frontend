document.addEventListener("DOMContentLoaded", async () => {
    // 1. RENDERIZADO DINÁMICO DE PROGRAMAS
    const contenedorProgramas = document.getElementById("contenedor-programas");
    
    if (contenedorProgramas) {
        try {
            // Reemplaza window.db_programas por tu API real
            const response = await fetch('/api/v1/carreras');
            if (response.ok) {
                const programasBD = await response.json();
                contenedorProgramas.innerHTML = "";
                
                programasBD.forEach(programa => {
                    // Mapeamos los datos del backend a tu HTML
                    const cardHTML = `
                        <div class="card-programa">
                            <span class="etiqueta">${programa.tipo === 'CURSO_CORTO' ? 'Curso' : 'Alta Demanda'}</span>
                            <div class="icono-programa"><i class="fa-solid fa-graduation-cap"></i></div>
                            <h3 style="margin-bottom: 10px; font-size: 20px;">${programa.nombre}</h3>
                            <p style="color: var(--text-muted); line-height: 1.5; margin-bottom: 20px;">
                                ${programa.descripcion || 'Conoce más sobre esta especialidad.'}
                            </p>
                            <button class="btn-acceso" style="width: 100%; border: none; cursor: pointer;">
                                Ver Plan de Estudios
                            </button>
                        </div>
                    `;
                    contenedorProgramas.innerHTML += cardHTML;
                });
            }
        } catch (error) {
            console.error("Error cargando programas:", error);
            contenedorProgramas.innerHTML = "<p>Error al cargar los programas. Intenta más tarde.</p>";
        }
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