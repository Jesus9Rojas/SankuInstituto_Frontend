const usuariosMock = [
    { usuario: "alumno01", clave: "1234", rol: "estudiante", nombre: "Juan Pérez" },
    { usuario: "docente01", clave: "profe2024", rol: "docente", nombre: "María Gómez" },
    { usuario: "admin", clave: "admin123", rol: "admin", nombre: "Director Carlos" },
    { usuario: "coord01", clave: "coord123", rol: "coordinador", nombre: "Roberto Sánchez" }
];

const usuariosGuardados = JSON.parse(localStorage.getItem("usuariosRegistrados")) || [];
usuariosMock = [...usuariosMock, ...usuariosGuardados];

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const errorMsg = document.getElementById("errorMessage");

    if (loginForm) {
        loginForm.addEventListener("submit", function(evento) {
            evento.preventDefault(); 
            const userIngresado = document.getElementById("username").value;
            const passIngresada = document.getElementById("password").value;

            const usuarioEncontrado = usuariosMock.find(
                (u) => u.usuario === userIngresado && u.clave === passIngresada
            );

            if (usuarioEncontrado) {
                errorMsg.style.display = "none";
                localStorage.setItem("sesionActiva", "true");
                localStorage.setItem("usuarioRol", usuarioEncontrado.rol);
                localStorage.setItem("usuarioNombre", usuarioEncontrado.nombre);

                // Redirección según rol
                if (usuarioEncontrado.rol === "estudiante") {
                    window.location.href = "intranet/estudiante/dashboard.html";
                } else if (usuarioEncontrado.rol === "docente") {
                    window.location.href = "intranet/docente/dashboard.html";
                } else if (usuarioEncontrado.rol === "admin") {
                    window.location.href = "intranet/admin/dashboard.html";
                } else if (usuarioEncontrado.rol === "coordinador") { // NUEVA RUTA
                    window.location.href = "intranet/coordinador/dashboard.html";
                }
            } else {
                errorMsg.style.display = "block";
            }
        });
    }

    // LÓGICA PARA EL OJITO DE LA CONTRASEÑA
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", function () {
            const tipoActual = passwordInput.getAttribute("type");
            if (tipoActual === "password") {
                passwordInput.setAttribute("type", "text");
                this.classList.remove("fa-eye");
                this.classList.add("fa-eye-slash");
            } else {
                passwordInput.setAttribute("type", "password");
                this.classList.remove("fa-eye-slash");
                this.classList.add("fa-eye");
            }
        });
    }
});