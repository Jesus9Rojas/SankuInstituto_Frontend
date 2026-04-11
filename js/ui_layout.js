// /js/intranet/ui_layout.js

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. SISTEMA DE NAVEGACIÓN (SPA Frontend)
    const navItems = document.querySelectorAll(".nav-item");
    const vistas = document.querySelectorAll(".vista-seccion");

    navItems.forEach(item => {
        item.addEventListener("click", (evento) => {
            evento.preventDefault(); // Evita que la página intente recargarse

            // Obtenemos a qué vista quiere ir el usuario
            const targetId = item.getAttribute("data-target");
            if (!targetId) return;

            // Paso A: Cambiar el botón activo en el menú lateral
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");

            // Paso B: Ocultar todas las vistas
            vistas.forEach(vista => {
                vista.classList.remove("activa");
                // Esperamos un momento mínimo para que la animación CSS termine antes de quitar el display
                setTimeout(() => {
                    vista.style.display = "none";
                }, 200); 
            });

            // Paso C: Mostrar la nueva vista elegida
            const nuevaVista = document.getElementById(targetId);
            if (nuevaVista) {
                setTimeout(() => {
                    nuevaVista.style.display = "block";
                    // Le damos un respiro al navegador para que renderice y luego aplicamos la clase de animación
                    setTimeout(() => nuevaVista.classList.add("activa"), 10);
                }, 200);
            }
        });
    });

    // 2. MENÚ DESPLEGABLE DEL PERFIL (Topbar)
    const btnPerfil = document.getElementById("btnPerfil");
    const menuPerfil = document.getElementById("menuPerfil");

    if (btnPerfil && menuPerfil) {
        btnPerfil.addEventListener("click", (evento) => {
            evento.stopPropagation(); // Evita que el clic se propague al documento
            menuPerfil.classList.toggle("show");
        });

        // Cerrar el menú si hacemos clic en cualquier otra parte de la pantalla
        document.addEventListener("click", (evento) => {
            if (!btnPerfil.contains(evento.target)) {
                menuPerfil.classList.remove("show");
            }
        });
    }

    // 3. (Opcional) BOTÓN CERRAR SESIÓN DESDE EL DROPDOWN
    const btnCerrarSesionTopbar = document.getElementById("btnCerrarSesionTopbar");
    if (btnCerrarSesionTopbar) {
        btnCerrarSesionTopbar.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "/html/login.html";
        });
    }
});