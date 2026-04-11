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