// js/catalogo.js

document.addEventListener("DOMContentLoaded", () => {
  const btnComprar = document.querySelector(".btn-comprar");

  btnComprar?.addEventListener("click", (e) => {
    e.preventDefault();

    const usuarioLogueado = localStorage.getItem("usuarioactivo");
    const libroID = "serpientes"; // Identificador del libro actual

    if (usuarioLogueado) {
      // Si ya está autenticado, va directo al checkout
      window.location.href = `checkout.html?libro=${libroID}`;
    } else {
      // Si no ha ingresado, se le pide registrarse/loguearse
      alert("Debes iniciar sesión o registrarte para realizar la compra.");
      window.location.href = `registro.html?intentodecompra=${libroID}`;
    }
  });
});