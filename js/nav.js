document.addEventListener("DOMContentLoaded", async () => {
  // 1. Obtener los datos del usuario logueado desde localStorage
  const usuarioactivo = JSON.parse(localStorage.getItem("usuarioactivo"));
  const navLeft = document.querySelector(".nav-left");
  const navRight = document.querySelector(".nav-right");

  if (usuarioactivo) {
    // A. Revelar "Mi Biblioteca" en el menú principal izquierdo
    if (navLeft && !document.querySelector(".link-biblioteca-privada")) {
      const linkBiblioteca = document.createElement("a");
      linkBiblioteca.href = "biblioteca.html";
      linkBiblioteca.className = "link-login link-biblioteca-privada";
      linkBiblioteca.textContent = "Mi Biblioteca";
      navLeft.appendChild(linkBiblioteca);
    }

    // B. Reemplazar Login/Registro por el Saludo y botón "Salir" en el lado derecho
    if (navRight) {
      const primerNombre = usuarioactivo.nombre 
        ? usuarioactivo.nombre.split(" ")[0] 
        : "Lector";

      navRight.innerHTML = `
        <span class="saludo-usuario" style="font-family: 'Inter', sans-serif; font-size: 0.9rem; color: #2b414e; font-weight: 500; margin-right: 10px;">
          Hola, ${primerNombre}
        </span>
        <a href="biblioteca.html" class="btn-biblioteca" style="background-color: #2b414e; color: #fff; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-size: 0.85rem; font-weight: 500; margin-right: 8px;">
          📚 Mi Biblioteca
        </a>
        <button id="btn-logout" class="btn-logout" style="background: transparent; border: 1px solid #ccc; color: #666; padding: 7px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
          Salir
        </button>
      `;

      // Programar la acción de Salir con Supabase
      const btnLogout = document.getElementById("btn-logout");
      if (btnLogout) {
        btnLogout.addEventListener("click", async () => {
          if (window.supabase) {
            await window.supabase.auth.signOut();
          }
          localStorage.removeItem("usuarioactivo");
          alert("Has cerrado sesión correctamente.");
          window.location.href = "index.html";
        });
      }
    }
  }

  // Protección: Si no está logueado e intenta entrar directo a biblioteca.html
  if (window.location.pathname.includes("biblioteca.html")) {
    if (window.supabase) {
      const { data: { session } } = await window.supabase.auth.getSession();
      if (!session) {
        alert("Debes iniciar sesión para acceder a tu biblioteca.");
        window.location.href = "login.html";
      }
    }
  }
});





