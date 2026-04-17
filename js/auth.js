const usuariosMock = [
    { usuario: "alumno01", clave: "1234", rol: "estudiante", nombre: "Juan Pérez" },
    { usuario: "docente01", clave: "profe2024", rol: "docente", nombre: "María Gómez" },
    { usuario: "admin", clave: "admin123", rol: "admin", nombre: "Director Carlos" }
];

// 2. Esperamos a que el HTML cargue completamente
document.addEventListener("DOMContentLoaded", () => {
    
    // Capturamos los elementos de la interfaz
    const loginForm = document.getElementById("loginForm");
    const errorMsg = document.getElementById("errorMessage");

    if (loginForm) {
        
        loginForm.addEventListener("submit", function(evento) {
            // Evitamos que el formulario recargue la página al hacer clic
            evento.preventDefault(); 

            // Extraemos los valores de los inputs
            const userIngresado = document.getElementById("username").value;
            const passIngresada = document.getElementById("password").value;

            // 3. Buscamos coincidencias
            // Recorremos nuestro array buscando que usuario y contraseña coincidan exactamente
            const usuarioEncontrado = usuariosMock.find(
                (u) => u.usuario === userIngresado && u.clave === passIngresada
            );

            if (usuarioEncontrado) {
                // ÉXITO: Ocultamos el error por si estaba visible
                errorMsg.style.display = "none";
                
                // Guardamos la sesión en el navegador de forma temporal
                localStorage.setItem("sesionActiva", "true");
                localStorage.setItem("usuarioRol", usuarioEncontrado.rol);
                localStorage.setItem("usuarioNombre", usuarioEncontrado.nombre);

                // 4. Redirección directa y rápida según el rol (sin alertas de confirmación)
                if (usuarioEncontrado.rol === "estudiante") {
                    window.location.href = "intranet/estudiante/dashboard.html";
                } else if (usuarioEncontrado.rol === "docente") {
                    window.location.href = "intranet/docente/dashboard.html";
                } else if (usuarioEncontrado.rol === "admin") {
                    window.location.href = "intranet/admin/dashboard.html";
                }
            } else {
                // FALLO: Mostramos el mensaje en rojo de credenciales incorrectas
                errorMsg.style.display = "block";
            }
        });
    }
});

// --- LÓGICA PARA EL OJITO DE LA CONTRASEÑA ---
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", function () {
            // Alternamos el tipo de input entre "password" y "text"
            const tipoActual = passwordInput.getAttribute("type");
            if (tipoActual === "password") {
                passwordInput.setAttribute("type", "text");
                // Cambiamos el icono a un ojito tachado
                this.classList.remove("fa-eye");
                this.classList.add("fa-eye-slash");
            } else {
                passwordInput.setAttribute("type", "password");
                // Volvemos al icono del ojito normal
                this.classList.remove("fa-eye-slash");
                this.classList.add("fa-eye");
            }
        });
    }