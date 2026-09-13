document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const password = document.getElementById('password');
  const confirmPassword = document.getElementById('confirm-password');
  const passwordError = document.getElementById('passwordError');

  // Mantiene el parámetro de compra si el usuario decide hacer clic en "Inicia sesión aquí"
  const urlParams = new URLSearchParams(window.location.search);
  const intentoCompra = urlParams.get('intentodecompra');

  if (intentoCompra) {
    const enlaceLogin = document.querySelector('.form-footer a');
    if (enlaceLogin) {
      enlaceLogin.href = `login.html?intentodecompra=${encodeURIComponent(intentoCompra)}`;
    }
  }

  // Validaciones visuales de contraseña
  function validatePasswords() {
    if (!confirmPassword || confirmPassword.value === '') {
      confirmPassword?.classList.remove('input-error');
      if (passwordError) passwordError.style.display = 'none';
      return true;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.classList.add('input-error');
      if (passwordError) passwordError.style.display = 'block';
      return false;
    } else {
      confirmPassword.classList.remove('input-error');
      if (passwordError) passwordError.style.display = 'none';
      return true;
    }
  }

  confirmPassword?.addEventListener('input', validatePasswords);
  password?.addEventListener('input', () => {
    if (confirmPassword && confirmPassword.value !== '') {
      validatePasswords();
    }
  });

  // Procesamiento del formulario de Registro con Supabase
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!validatePasswords()) {
      confirmPassword.focus();
      return;
    }

    const emailInput = document.getElementById('email')?.value.toLowerCase().trim();
    const nombreInput = document.getElementById('fullname')?.value.trim() || '';
    const passwordInput = password.value;

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailInput,
        password: passwordInput,
        options: {
          data: {
            nombre: nombreInput
          }
        }
      });

         if (authError) {
        const errorMsg = authError.message ? authError.message.toLowerCase() : '';
        if (errorMsg.includes('already registered')) {
          alert('Este correo ya se encuentra registrado. Por favor inicia sesión.');
          window.location.href = intentoCompra 
            ? `login.html?intentodecompra=${encodeURIComponent(intentoCompra)}` 
            : 'login.html';
          return;
        }
        alert('Error al registrar usuario: ' + authError.message);
        return;
      }


      // 2. Insertar perfil en la tabla 'perfiles' de Supabase
      if (authData?.user) {
        const { error: perfilError } = await supabase
          .from('perfiles')
          .insert([
            {
              id: authData.user.id,
              email: emailInput,
              nombre: nombreInput,
              libros_comprados: []
            }
          ]);

        if (perfilError) {
          console.error('Error al crear perfil en la base de datos:', perfilError);
        }
      }

      // 3. Notificación adaptada para confirmación de correo
      alert('¡Registro exitoso! Te hemos enviado un correo de confirmación. Por favor revisa tu bandeja de entrada (o carpeta de spam) y haz clic en el enlace para activar tu cuenta.');

      // Redirigir al LOGIN preservando la intención de compra
      if (intentoCompra) {
        window.location.href = `login.html?intentodecompra=${encodeURIComponent(intentoCompra)}`;
      } else {
        window.location.href = 'login.html';
      }

    } catch (err) {
      console.error('Error inesperado en el registro:', err);
      alert('Ocurrió un error inesperado al procesar el registro.');
    }
  });
});

