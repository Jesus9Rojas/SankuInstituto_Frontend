document.addEventListener("DOMContentLoaded", async () => {
    
    // DICCIONARIO DE DISEÑO
    const disenoCarreras = {
        "Gestión Administrativa": {
            icono: "fa-chart-column",
            badgeText: "Negocios",
            badgeColor: "bg-card1",
            bgImage: "url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80')"
        },
        "Farmacia Técnica": {
            icono: "fa-pills",
            badgeText: "Ciencias de la Salud",
            badgeColor: "bg-card3",
            bgImage: "url('https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80')"
        },
        "Enfermería Técnica": {
            icono: "fa-user-nurse",
            badgeText: "Ciencias de la Salud",
            badgeColor: "bg-card4",
            bgImage: "url('https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80')"
        },
        "Fisioterapia y Rehabilitación": {
            icono: "fa-person-walking-with-cane",
            badgeText: "Ciencias de la Salud",
            badgeColor: "bg-card2",
            bgImage: "url('https://images.unsplash.com/photo-1576671081837-49000212a370?auto=format&fit=crop&q=80')"
        },
        "Inyectoterapia y Primeros Auxilios": {
            icono: "fa-syringe",
            badgeText: "Curso Corto",
            badgeColor: "bg-primary",
            bgImage: "none"
        },
        "DEFAULT": { 
            icono: "fa-graduation-cap",
            badgeText: "Programa Técnico",
            badgeColor: "bg-primary",
            bgImage: "url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80')"
        }
    };

    let carrerasData = []; 

    try {
        const response = await fetch('http://localhost:8080/api/v1/carreras'); 
        if (response.ok) {
            carrerasData = await response.json();
            
            // 1. CARGAR EL MENÚ DESPLEGABLE DINÁMICAMENTE
            const menuDropdown = document.getElementById("menu-programas-dinamico");
            if (menuDropdown) {
                menuDropdown.innerHTML = ""; 
                const programas = carrerasData.filter(c => c.tipo === 'CARRERA');
                
                programas.forEach(prog => {
                    const paramsMenu = new URLSearchParams(window.location.search);
                    const isActivo = paramsMenu.get('id') == prog.idCarrera ? 'active-drop' : '';
                    menuDropdown.innerHTML += `<a href="programa.html?id=${prog.idCarrera}" class="dropdown-link ${isActivo}">${prog.nombre}</a>`;
                });
            }
        }
    } catch (error) {
        console.error("Error cargando la data:", error);
    }

    // 2. SI ESTAMOS EN programa.html
    const urlParams = new URLSearchParams(window.location.search);
    const idPrograma = urlParams.get('id');

    if (idPrograma && document.getElementById("prog-titulo-1")) {
        const carreraActual = carrerasData.find(c => c.idCarrera == idPrograma);

        if (carreraActual) {
            const palabras = carreraActual.nombre.trim().split(" ");
            const primeraPalabra = palabras.shift();
            const restoDelTitulo = palabras.join(" "); 

            document.getElementById("prog-titulo-1").textContent = primeraPalabra;
            document.getElementById("prog-titulo-2").textContent = restoDelTitulo;
            
            const diseno = disenoCarreras[carreraActual.nombre] || disenoCarreras["DEFAULT"];
            
            const header = document.getElementById("header-programa");
            if(header) {
                header.style.background = `linear-gradient(to right, rgba(0, 51, 153, 0.9), rgba(0, 168, 255, 0.4)), ${diseno.bgImage} center/cover`;
            }

            const badge = document.getElementById("prog-badge");
            if(badge) {
                badge.textContent = diseno.badgeText;
                badge.className = `text-white shadow-card ${diseno.badgeColor}`; 
                badge.style.display = "inline-block";
                badge.style.padding = "5px 15px";
                badge.style.borderRadius = "20px";
            }

            const iconElement = document.getElementById("prog-icono");
            if(iconElement) {
                iconElement.className = `fa-solid ${diseno.icono} text-white`;
            }

            document.getElementById("prog-desc").innerHTML = carreraActual.descripcion || "";
            document.getElementById("perfil").innerHTML = carreraActual.perfilAcademico || "<p class='text-muted'>Información en actualización.</p>";
            document.getElementById("mercado").innerHTML = carreraActual.mercadoLaboral || "<p class='text-muted'>Información en actualización.</p>";
            document.getElementById("beneficios").innerHTML = carreraActual.beneficios || "<p class='text-muted'>Información en actualización.</p>";
            document.getElementById("requisitos").innerHTML = carreraActual.requisitos || "<p class='text-muted'>Información en actualización.</p>";

            document.title = `${carreraActual.nombre} - Instituto Tech`;
        } else {
            document.getElementById("prog-titulo-1").textContent = "Programa";
            document.getElementById("prog-titulo-2").textContent = "No Encontrado";
            document.getElementById("prog-desc").textContent = "La carrera que buscas no existe o ha sido deshabilitada.";
        }
    }

    // 3. SI ESTAMOS EN cursos.html
    const contenedorCursos = document.getElementById("contenedor-cursos-dinamico");
    
    if (contenedorCursos) {
        const cursosCortos = carrerasData.filter(c => c.tipo === 'CURSO_CORTO');
        contenedorCursos.innerHTML = ""; 

        if(cursosCortos.length === 0) {
            contenedorCursos.innerHTML = "<h3 class='text-center text-muted'>Nuevos cursos se publicarán pronto.</h3>";
        }

        cursosCortos.forEach((curso, index) => {
            const bgColors = [
                "linear-gradient(135deg, #00c6ff, #0072ff)", 
                "linear-gradient(135deg, #ff416c, #ff4b2b)", 
                "linear-gradient(135deg, #11998e, #38ef7d)"  
            ];
            const colorActual = bgColors[index % bgColors.length];
            const diseno = disenoCarreras[curso.nombre] || disenoCarreras["DEFAULT"];

            const cursoHTML = `
            <div class="curso-horizontal-card shadow-card border-card bg-card">
                <div class="curso-sidebar-info" style="background: ${colorActual};">
                    <h3>Especialízate rápidamente y adquiere habilidades prácticas de alta demanda.</h3>
                    <i class="fa-solid ${diseno.icono} big-icon"></i>
                </div>
                <div class="curso-contenido-box">
                    <h3 class="text-primary curso-titulo"><i class="fa-solid ${diseno.icono} text-accent"></i> ${curso.nombre}</h3>
                    
                    <div class="tab-menu curso-tabs">
                        <button class="tab-btn active" onclick="openCursoTab(event, 'cont-${curso.idCarrera}', 'curso${curso.idCarrera}')">Contenido</button>
                        <button class="tab-btn" onclick="openCursoTab(event, 'merc-${curso.idCarrera}', 'curso${curso.idCarrera}')">Mercado Laboral</button>
                        <button class="tab-btn" onclick="openCursoTab(event, 'ben-${curso.idCarrera}', 'curso${curso.idCarrera}')">Beneficios</button>
                        <button class="tab-btn" onclick="openCursoTab(event, 'req-${curso.idCarrera}', 'curso${curso.idCarrera}')">Requisitos</button>
                    </div>
                    <div class="tab-content-wrapper">
                        <div id="cont-${curso.idCarrera}" class="tab-pane curso${curso.idCarrera} active">
                            <p class="text-muted">${curso.descripcion || ''}</p>
                            <div class="mt-15">${curso.perfilAcademico || ''}</div>
                        </div>
                        <div id="merc-${curso.idCarrera}" class="tab-pane curso${curso.idCarrera}">
                            ${curso.mercadoLaboral || '<p class="text-muted">Amplio campo laboral.</p>'}
                        </div>
                        <div id="ben-${curso.idCarrera}" class="tab-pane curso${curso.idCarrera}">
                            ${curso.beneficios || '<p class="text-muted">Múltiples beneficios institucionales.</p>'}
                        </div>
                        <div id="req-${curso.idCarrera}" class="tab-pane curso${curso.idCarrera}">
                            ${curso.requisitos || '<p class="text-muted">Consulta los requisitos con admisión.</p>'}
                        </div>
                    </div>
                </div>
            </div>
            `;
            contenedorCursos.innerHTML += cursoHTML;
        });
    }

    // 4. SI ESTAMOS EN contactanos.html (LLENAR EL SELECT)
    const selectPrograma = document.getElementById("select-programa-interes");
    
    if (selectPrograma && carrerasData.length > 0) {
        selectPrograma.innerHTML = '<option value="" disabled selected>Selecciona una opción...</option>';
        
        const carreras = carrerasData.filter(c => c.tipo === 'CARRERA');
        const cursos = carrerasData.filter(c => c.tipo === 'CURSO_CORTO');

        if (carreras.length > 0) {
            const grupoCarreras = document.createElement('optgroup');
            grupoCarreras.label = "Programas de Estudio";
            carreras.forEach(c => {
                grupoCarreras.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`;
            });
            selectPrograma.appendChild(grupoCarreras);
        }

        if (cursos.length > 0) {
            const grupoCursos = document.createElement('optgroup');
            grupoCursos.label = "Cursos Cortos";
            cursos.forEach(c => {
                grupoCursos.innerHTML += `<option value="${c.nombre}">${c.nombre}</option>`;
            });
            selectPrograma.appendChild(grupoCursos);
        }
        
        selectPrograma.innerHTML += '<option value="Consulta General">Consulta General / Otros</option>';
    }
});