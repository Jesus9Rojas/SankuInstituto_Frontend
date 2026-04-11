// /js/mocks/db_publica.js

const db_programas = [
    {
        id: 1,
        titulo: "Desarrollo de Software",
        duracion: "3 Años (6 Ciclos)",
        descripcion: "Domina lenguajes de programación, bases de datos y desarrollo de aplicaciones web y móviles.",
        icono: "💻",
        etiqueta: "Alta Demanda"
    },
    {
        id: 2,
        titulo: "Administración de Redes",
        duracion: "3 Años (6 Ciclos)",
        descripcion: "Especialízate en infraestructura, servidores cloud y ciberseguridad empresarial.",
        icono: "🌐",
        etiqueta: "Tecnología"
    },
    {
        id: 3,
        titulo: "Diseño Gráfico Digital",
        duracion: "3 Años (6 Ciclos)",
        descripcion: "Crea identidades visuales, interfaces (UI/UX) y domina la suite de Adobe.",
        icono: "🎨",
        etiqueta: "Creatividad"
    }
];

// Hacemos que la variable esté disponible globalmente
window.db_programas = db_programas;