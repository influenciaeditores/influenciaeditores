document.addEventListener("DOMContentLoaded", async () => {

  // 1. Obtener la sesión activa en Supabase
  const { data: { session }, error } = await supabase.auth.getSession();

  // Verificar si existe sesión activa en la nube
  if (error || !session) {
    const urlParams = new URLSearchParams(window.location.search);
    const libro = urlParams.get('libro') || 'serpientes';

    alert("Por favor inicia sesión antes de realizar el pago.");
    window.location.href = `login.html?intentodecompra=${encodeURIComponent(libro)}`;
    return;
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  // Consultar nombre del perfil en Supabase
  let nombreUsuario = '';
  try {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('nombre')
      .eq('id', userId)
      .single();

    nombreUsuario = perfil?.nombre || session.user.user_metadata?.nombre || '';
  } catch (err) {
    console.error('Error al obtener perfil:', err);
  }

  // Auto-completar datos del formulario
  const campoNombre = document.getElementById("nombre");
  const campoEmail = document.getElementById("email");
  if (campoNombre) campoNombre.value = nombreUsuario;
  if (campoEmail) campoEmail.value = userEmail;

  // 2. Selección del método de pago visual
  const tarjetasMetodo = document.querySelectorAll(".tarjeta-metodo");
  tarjetasMetodo.forEach(tarjeta => {
    tarjeta.addEventListener("click", () => {
      tarjetasMetodo.forEach(t => t.classList.remove("activo"));
      tarjeta.classList.add("activo");

      const radio = tarjeta.querySelector("input[type='radio']");
      if (radio) radio.checked = true;
    });
  });

  // 3. Procesar el pago (Redirigir a pasarela externa)
  const btnPagar = document.getElementById("btn-procesar-pago");

  btnPagar?.addEventListener("click", (e) => {
    e.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const libroID = urlParams.get("libro") || "serpientes";

    // Identificar el método seleccionado (Wompi o PayPal)
    const metodoSeleccionado = document.querySelector('input[name="metodo_pago"]:checked')?.value || 'wompi';

    // Matriz de links de pago reales por libro y plataforma
    const linksDePago = {
      serpientes: {
        wompi: "https://checkout.wompi.co/l/wQtiqS",
        paypal: "https://www.paypal.com/ncp/payment/RAJYPT5FFUQF2"
      },
      libro2: {
        wompi: "HTTPS://LINK-WOMPI.CO/LIBRO2",
        paypal: "HTTPS://LINK-PAYPAL.COM/LIBRO2"
      }
    };

    const urlDestino = linksDePago[libroID]?.[metodoSeleccionado];

    if (urlDestino) {
      // Redirigir al comprador a la pasarela real (Wompi o PayPal)
      window.location.href = urlDestino;
    } else {
      alert("No se encontró el enlace de pago asignado para este producto.");
    }
  });
});

