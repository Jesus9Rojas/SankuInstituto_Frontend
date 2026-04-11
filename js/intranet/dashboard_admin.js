// /js/intranet/dashboard_admin.js

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Verificación de Seguridad (Solo Administradores)
    const rolUsuario = localStorage.getItem("usuarioRol");
    if (!localStorage.getItem("sesionActiva") || rolUsuario !== "admin") {
        alert("Acceso denegado. Área exclusiva de Dirección.");
        window.location.href = "../../../login.html";
        return;
    }

    // Cargar nombre del director en la interfaz
    const nombreUsuario = localStorage.getItem("usuarioNombre");
    if (nombreUsuario) {
        document.getElementById("saludoUsuario").textContent = `Bienvenido, ${nombreUsuario}`;
    }

    // 2. RENDERIZAR GRÁFICO (Chart.js)
    // Buscamos el elemento canvas en el HTML
    const ctx = document.getElementById('matriculasChart');
    
    if (ctx) {
        new Chart(ctx, {
            type: 'line', // Tipo de gráfico: Línea
            data: {
                labels: ['2023-I', '2023-II', '2024-I', '2024-II', '2025-I', '2025-II', '2026-I'],
                datasets: [{
                    label: 'Alumnos Matriculados',
                    data: [850, 920, 900, 1050, 1100, 1180, 1245],
                    borderColor: '#e50914', // Tu color rojo institucional
                    backgroundColor: 'rgba(229, 9, 20, 0.1)',
                    borderWidth: 3,
                    tension: 0.4, // Curva suave
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#f5f5f5' } // Texto blanco para modo oscuro
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: '#333333' },
                        ticks: { color: '#a0a0a0' }
                    },
                    x: {
                        grid: { color: '#333333' },
                        ticks: { color: '#a0a0a0' }
                    }
                }
            }
        });
    }

    // 3. BUSCADOR EN TIEMPO REAL PARA LA TABLA DE USUARIOS
    const buscador = document.getElementById("buscadorUsuarios");
    const filasTabla = document.querySelectorAll("#tablaUsuarios tbody tr");

    if (buscador) {
        buscador.addEventListener("keyup", function(e) {
            const terminoBusqueda = e.target.value.toLowerCase();

            filasTabla.forEach(fila => {
                // Obtenemos todo el texto de la fila (DNI, Nombre, Rol)
                const contenidoFila = fila.textContent.toLowerCase();
                
                // Si el término de búsqueda está en la fila, la mostramos, sino la ocultamos
                if (contenidoFila.includes(terminoBusqueda)) {
                    fila.style.display = "";
                } else {
                    fila.style.display = "none";
                }
            });
        });
    }

    // 4. SIMULACIÓN DE BOTONES DE ACCIÓN (Eliminar)
    const btnEliminar = document.querySelectorAll(".btn-action.delete");
    btnEliminar.forEach(btn => {
        btn.addEventListener("click", function(e) {
            // Confirmación nativa del navegador
            if(confirm("¿Estás seguro de que deseas suspender/eliminar a este usuario?")) {
                // Busca la fila (tr) padre del botón y la oculta simulando que se borró
                const fila = e.target.closest("tr");
                fila.style.display = "none";
            }
        });
    });
    

    
});