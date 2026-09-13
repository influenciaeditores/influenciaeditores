document.addEventListener('DOMContentLoaded', () => {

  // Capturamos el formulario por su id exacta del HTML
  const form = document.getElementById('login-form');

  form?.addEventListener('submit', async (event) => {

    // Validar requerimientos del HTML
    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      return;
    }

    event.preventDefault();

    // Capturamos los inputs usando las IDs del HTML
    const emailInput = document.getElementById('login-email')?.value.toLowerCase().trim();
    const passwordInput = document.getElementById('login-password')?.value;

    if (!emailInput || !passwordInput) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    try {
      // 1. Iniciar sesión en Supabase con correo y contraseña
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
      });

      if (authError) {
        alert('Correo o contraseña incorrectos. Por favor verifica tus datos.');
        console.error('Error al iniciar sesión:', authError.message);
        return;
      }

      // 2. Obtener la información del perfil desde la tabla 'perfiles'
      const userId = authData.user.id;
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('nombre, email')
        .eq('id', userId)
        .single();

      const nombreUsuario = perfilData?.nombre || authData.user.user_metadata?.nombre || 'Usuario';

      // 3. Guardar la sesión activa local para compatibilidad rápida con la UI
      localStorage.setItem('usuarioactivo', JSON.stringify({
        id: userId,
        nombre: nombreUsuario,
        email: authData.user.email,
        isLoggedIn: true
      }));

      // 4. Detectar si venía de un intento de compra desde el catálogo
      const urlParams = new URLSearchParams(window.location.search);
      const intentocompra = urlParams.get('intentodecompra');

      if (intentocompra) {
        // Redirige al checkout llevando el libro seleccionado
        window.location.href = `checkout.html?libro=${intentocompra}`;
      } else {
        // Redirige al index si era un login normal
        window.location.href = 'index.html';
      }

    } catch (err) {
      console.error('Error inesperado durante el login:', err);
      alert('Ocurrió un error inesperado. Inténtalo de nuevo.');
    }
  });

});

