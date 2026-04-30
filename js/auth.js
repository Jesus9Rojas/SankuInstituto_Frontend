document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const errorMsg = document.getElementById("errorMessage");

    if (loginForm) {
        loginForm.addEventListener("submit", async function(evento) {
            evento.preventDefault();
            
            const emailIngresado = document.getElementById("username").value; 
            const passIngresada = document.getElementById("password").value;

            try {
                // Modificar el botón a estado de carga
                const btnSubmit = loginForm.querySelector('button[type="submit"]');
                const textoOriginal = btnSubmit.textContent;
                btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> CONECTANDO...';
                btnSubmit.disabled = true;

                const response = await fetch('http://localhost:8080/api/v1/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        email: emailIngresado, 
                        password: passIngresada 
                    })
                });

                if (response.ok) {
                    const data = await response.json(); // AuthResponseDTO
                    errorMsg.style.display = "none";
                    
                    localStorage.setItem("sesionActiva", "true");
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("usuarioRol", data.rol.toLowerCase());
                    localStorage.setItem("usuarioNombre", data.nombre);
                    localStorage.setItem("usuarioId", data.usuarioId);

                    // Redirección según rol devuelto por el backend
                    const rolStr = data.rol.toUpperCase();
                    if (rolStr === "ALUMNO") {
                        window.location.href = "intranet/estudiante/dashboard.html";
                    } else if (rolStr === "DOCENTE") {
                        window.location.href = "intranet/docente/dashboard.html";
                    } else if (rolStr === "ADMINISTRADOR") {
                        window.location.href = "intranet/admin/dashboard.html";
                    } else if (rolStr === "COORDINADOR") {
                        window.location.href = "intranet/coordinador/dashboard.html";
                    }
                } else {
                    errorMsg.textContent = "Credenciales incorrectas o usuario inactivo.";
                    errorMsg.style.display = "block";
                    btnSubmit.innerHTML = textoOriginal;
                    btnSubmit.disabled = false;
                }
            } catch (error) {
                console.error("Error en la petición:", error);
                errorMsg.textContent = "Error de conexión con el servidor.";
                errorMsg.style.display = "block";
                btnSubmit.innerHTML = textoOriginal;
                btnSubmit.disabled = false;
            }
        });
    }

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