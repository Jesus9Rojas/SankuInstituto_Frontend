// /js/intranet/dashboard_estudiante.js

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Verificar Sesión (Auth Guard Secundario)
    // Si alguien entra directo a la URL sin logearse, lo pateamos al login
    const sesionActiva = localStorage.getItem("sesionActiva");
    if (!sesionActiva) {
        window.location.href = "../../../login.html";
        return; // Detenemos la ejecución del script
    }

    // 2. Personalizar la interfaz con los datos del usuario
    const nombreUsuario = localStorage.getItem("usuarioNombre");
    const rolUsuario = localStorage.getItem("usuarioRol");

    if (nombreUsuario) {
        document.getElementById("saludoUsuario").textContent = `Hola, ${nombreUsuario}`;
        // Ponemos la primera letra del nombre en el Avatar circular
        document.querySelector(".avatar").textContent = nombreUsuario.charAt(0).toUpperCase();
    }

    if (rolUsuario) {
        // Capitalizamos la primera letra del rol (ej. "estudiante" -> "Estudiante")
        document.getElementById("rolUsuario").textContent = rolUsuario.charAt(0).toUpperCase() + rolUsuario.slice(1);
    }

    // 3. Lógica para Cerrar Sesión
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", () => {
            // Limpiamos los datos del navegador
            localStorage.clear();
            // Redirigimos al portal de inicio (o al login)
            window.location.href = "/html/login.html";
        });
    }
});