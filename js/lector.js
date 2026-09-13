// js/lector.js

document.addEventListener("DOMContentLoaded", async () => {
  const CARPETA_LIBROS = "libros/";
  const urlParams = new URLSearchParams(window.location.search);
  const archivoLibro = urlParams.get('libro'); // Recibe "serpientes.epub" o "libros/serpientes.epub"

  // 0. VALIDACIÓN DE SEGURIDAD CON SUPABASE
  if (!archivoLibro) {
    alert("No se especificó ningún libro.");
    window.location.href = 'biblioteca.html';
    return;
  }

  // Extraer el identificador limpio (ej: "libros/serpientes.epub" -> "serpientes")
  const libroIDBuscado = archivoLibro.split('/').pop().replace('.epub', '').trim().toLowerCase();

  // Validar si hay sesión activa en Supabase
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    alert("Debes iniciar sesión para acceder a tus lecturas.");
    window.location.href = 'login.html';
    return;
  }

  const userId = session.user.id;

  // Consultar permisos en la tabla 'perfiles'
  const { data: perfil, error: fetchError } = await supabase
    .from('perfiles')
    .select('libros_comprados')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error("❌ Error verificando permisos de lectura:", fetchError);
    window.location.href = 'biblioteca.html';
    return;
  }

  // Normalizar la lista de libros del usuario
  let misLibros = [];
  if (Array.isArray(perfil?.libros_comprados)) {
    misLibros = perfil.libros_comprados;
  } else if (typeof perfil?.libros_comprados === 'string' && perfil.libros_comprados.trim() !== '') {
    misLibros = [perfil.libros_comprados];
  }

  // Comprobar si posee el libro
  const tienePermiso = misLibros.some(idComprado => {
    const idNube = String(idComprado).toLowerCase().replace('.epub', '').trim();
    return idNube === libroIDBuscado;
  });

  if (!tienePermiso) {
    alert("No tienes acceso a este libro. Puedes adquirirlo en nuestro catálogo.");
    window.location.href = 'catalogo.html';
    return;
  }

  console.log("✅ Acceso verificado y autorizado para el libro:", libroIDBuscado);

  // =========================================================
  // CÓDIGO ORIGINAL DE LECTURA E INTERFAZ (PRESERVADO INTACTO)
  // =========================================================

  // 1. Determinar la ruta correcta del archivo
  let EPUB_URL = CARPETA_LIBROS + "libro.epub";

  if (archivoLibro) {
    // Si la URL ya trae "libros/", lo dejamos tal cual; de lo contrario le agregamos "libros/"
    EPUB_URL = archivoLibro.startsWith(CARPETA_LIBROS) 
      ? archivoLibro 
      : CARPETA_LIBROS + archivoLibro;
  }

  console.log("📖 Cargando archivo EPUB desde:", EPUB_URL);

  const viewerEl = document.getElementById("viewer");
  if (!viewerEl) {
    console.error("❌ No se encontró el elemento id='viewer' en el HTML.");
    return;
  }

  // 2. Inicializar ePub.js dentro del DOM ya cargado
  const book = ePub(EPUB_URL);

  let colorFondoActual = "#ffffff";
  let colorTextoActual = "#1a1a1a";

  const rendition = book.renderTo("viewer", {
    width: "100%",
    height: "100%",
    spread: "always"
  });

  rendition.display().then(() => {
    console.log("✅ ¡Página de EPUB cargada correctamente!");
  }).catch(err => {
    console.error("❌ Error al desplegar la primera página del EPUB:", err);
  });

  // Cargar título en el header
  book.loaded.metadata.then(function(meta) {
    const titleElement = document.getElementById("book-title");
    if (titleElement) {
      titleElement.textContent = meta.title || "Lectura";
    }
  });

  // Navegación con botones
  document.getElementById("next")?.addEventListener("click", () => rendition.next());
  document.getElementById("prev")?.addEventListener("click", () => rendition.prev());

  // Navegación con teclado
  document.addEventListener("keyup", function(e) {
    if (e.key === "ArrowLeft") rendition.prev();
    if (e.key === "ArrowRight") rendition.next();
  });

  // =========================================================
  // APLICACIÓN DE TEMAS E INYECCIÓN DE ESTILOS
  // =========================================================
  function aplicarTema(bgHex, textHex) {
    colorFondoActual = bgHex;
    colorTextoActual = textHex;

    // 1. Aplica el tema dentro de las páginas del ePub via ePub.js
    rendition.themes.register("custom-theme", {
      "body": { 
        "background-color": `${bgHex} !important`, 
        "color": `${textHex} !important` 
      },
      "p, span, a, div, h1, h2, h3, h4, li": { 
        "color": `${textHex} !important` 
      }
    });
    rendition.themes.select("custom-theme");

    // 2. Colorea el contenedor exacto que envuelve la página para evitar que el color se salga
    const vistas = document.querySelectorAll(".epub-view, .epub-container");
    vistas.forEach(el => {
      el.style.backgroundColor = bgHex;
    });
  }

  // Inyección continua en el renderizado de páginas
  rendition.hooks.content.register(function(contents) {
    const doc = contents.document;
    if (doc) {
      const style = doc.createElement("style");
      style.innerHTML = `
        html, body {
          background-color: ${colorFondoActual} !important;
          color: ${colorTextoActual} !important;
        }
      `;
      doc.head.appendChild(style);
    }
  });

  // Eventos de botones de Tema
  document.getElementById("theme-light")?.addEventListener("click", () => aplicarTema("#ffffff", "#1a1a1a"));
  document.getElementById("theme-sepia")?.addEventListener("click", () => aplicarTema("#f4ecd8", "#5b4636"));
  document.getElementById("theme-dark")?.addEventListener("click", () => aplicarTema("#3b3636", "#e0e0e0"));

  // =========================================================
  // TAMAÑO DE FUENTE
  // =========================================================
  let escalaFuente = 100;

  function cambiarTamano(incremento) {
    escalaFuente += incremento;
    if (escalaFuente < 70) escalaFuente = 70;
    if (escalaFuente > 200) escalaFuente = 200;

    rendition.themes.fontSize(`${escalaFuente}%`);
    rendition.themes.default({
      "p, span, a, div, li": {
        "font-size": `${escalaFuente}% !important`
      }
    });
  }

  document.getElementById("font-increase")?.addEventListener("click", () => cambiarTamano(10));
  document.getElementById("font-decrease")?.addEventListener("click", () => cambiarTamano(-10));

  // =========================================================
  // CAMBIO DE DISPOSICIÓN CON RE-CÁLCULO DE LIENZO
  // =========================================================
  document.getElementById("view-single")?.addEventListener("click", () => {
    if (viewerEl) viewerEl.style.maxWidth = "600px";
    rendition.spread("none");
    setTimeout(() => rendition.resize(), 100);
  });

  document.getElementById("view-double")?.addEventListener("click", () => {
    if (viewerEl) viewerEl.style.maxWidth = "100%";
    rendition.spread("always");
    setTimeout(() => rendition.resize(), 100);
  });

  // =========================================================
  // TABLA DE CONTENIDOS (ÍNDICE / CAPÍTULOS)
  // =========================================================
  book.loaded.navigation.then(function(toc) {
    const select = document.getElementById("toc-select");
    if (!select) return;

    select.innerHTML = '<option value="">Ir a capítulo...</option>';

    function agregarCapitulos(items, sangria = "") {
      items.forEach(function(item) {
        const option = document.createElement("option");
        option.value = item.href;
        option.textContent = sangria + item.label.trim();
        select.appendChild(option);

        if (item.subitems && item.subitems.length > 0) {
          agregarCapitulos(item.subitems, sangria + "— ");
        }
      });
    }

    agregarCapitulos(toc);

    select.addEventListener("change", function(e) {
      const href = e.target.value;
      if (href) {
        rendition.display(href);
      }
    });
  });
});
