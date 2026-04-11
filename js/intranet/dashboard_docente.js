
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Verificación de Seguridad (Solo Docentes)
    const rolUsuario = localStorage.getItem("usuarioRol");
    if (!localStorage.getItem("sesionActiva") || rolUsuario !== "docente") {
        alert("Acceso denegado. No eres docente.");
        window.location.href = "../../../login.html";
        return;
    }

    // Cargar nombre del profesor en la interfaz
    const nombreUsuario = localStorage.getItem("usuarioNombre");
    if (nombreUsuario) {
        document.getElementById("saludoUsuario").textContent = `Hola, Prof. ${nombreUsuario.split(' ')[0]}`;
    }

    // 2. LÓGICA DE ASISTENCIA (Toggle Presente/Falta)
    const presentBtns = document.querySelectorAll(".btn-toggle.present");
    const absentBtns = document.querySelectorAll(".btn-toggle.absent");

    // Función para cambiar estados
    const toggleAsistencia = (btnClickeado, hermano) => {
        btnClickeado.addEventListener("click", () => {
            btnClickeado.classList.add("active");
            hermano.classList.remove("active");
        });
    };

    // Aplicamos el evento a cada fila
    for(let i = 0; i < presentBtns.length; i++) {
        toggleAsistencia(presentBtns[i], absentBtns[i]);
        toggleAsistencia(absentBtns[i], presentBtns[i]);
    }

    // 3. LÓGICA DE NOTAS (Simulación de Autoguardado UX)
    const inputsNotas = document.querySelectorAll(".nota-input");
    const saveIndicator = document.getElementById("saveIndicator");
    let timeoutGuardado;

    inputsNotas.forEach(input => {
        // Evento 'blur' ocurre cuando el usuario hace clic fuera del input o presiona Tab/Enter
        input.addEventListener("blur", (e) => {
            let valor = e.target.value;
            
            // Validar que no pongan notas absurdas
            if(valor !== "" && (valor < 0 || valor > 20)) {
                e.target.value = "";
                e.target.style.borderColor = "var(--accent-red)";
                alert("La nota debe estar entre 0 y 20");
                return;
            } else {
                e.target.style.borderColor = "var(--border-color)";
            }

            // Simular el guardado en base de datos si el campo no está vacío
            if(valor !== "") {
                // Mostramos el mensaje de "Cambios guardados"
                saveIndicator.style.opacity = "1";
                
                // Lo ocultamos automáticamente después de 2 segundos
                clearTimeout(timeoutGuardado);
                timeoutGuardado = setTimeout(() => {
                    saveIndicator.style.opacity = "0";
                }, 2000);

                // Aquí en el futuro tu compañero de backend pondrá su función fetch()
                // fetch('/api/notas/guardar', { method: 'POST', body: ... })
            }
        });

        // Permitir guardar con Enter para mayor rapidez
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.target.blur(); // Dispara el evento de arriba
            }
        });

            const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", () => {
            // Limpiamos los datos del navegador
            localStorage.clear();
            window.location.href = "/html/login.html";
        });
    }
    });
});