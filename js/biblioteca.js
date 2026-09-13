 document.addEventListener('DOMContentLoaded', async () => {

  // 1. Comprobar si existe sesión activa en Supabase
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    alert("Debes iniciar sesión para acceder a tu biblioteca.");
    window.location.href = 'login.html';
    return;
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  // 2. Procesar compra entrante desde Wompi o PayPal
  const urlParams = new URLSearchParams(window.location.search);
  const libroParam = urlParams.get('libro') || urlParams.get('libroComprado');
  const compraExitosa = urlParams.get('compraExitosa') === 'true';

  // 3. Obtener el perfil actual en Supabase
  let { data: perfil, error: fetchError } = await supabase
    .from('perfiles')
    .select('libros_comprados, nombre')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error al consultar perfil en Supabase:', fetchError);
  }

  // Sanitizar el resultado para asegurar que SIEMPRE sea un Array de JavaScript
  let misLibrosActuales = [];
  if (Array.isArray(perfil?.libros_comprados)) {
    misLibrosActuales = perfil.libros_comprados;
  } else if (typeof perfil?.libros_comprados === 'string' && perfil.libros_comprados.trim() !== '') {
    misLibrosActuales = [perfil.libros_comprados];
  }

  // 4. Procesar la compra si viene por la URL
  if (compraExitosa && libroParam) {
    const libroIDLimpio = libroParam.trim();

    if (!misLibrosActuales.includes(libroIDLimpio)) {
      misLibrosActuales.push(libroIDLimpio);

      // UPSERT enviando ID, EMAIL y LIBROS COMPRADOS para evitar errores NOT NULL
      const { error: upsertError } = await supabase
        .from('perfiles')
        .upsert({ 
          id: userId,
          email: userEmail,
          libros_comprados: misLibrosActuales 
        }, { onConflict: 'id' });

      if (upsertError) {
        console.error('Error al guardar la compra en Supabase:', upsertError);
        alert('No se pudo guardar la compra en la nube: ' + upsertError.message);
      } else {
        alert("¡Pago confirmado! Tu libro ha sido añadido a tu biblioteca.");
      }
    }

    // Limpiar la URL para evitar procesar la compra dos veces al recargar
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const nombreUsuario = perfil?.nombre || userEmail;
  console.log(`Cargando biblioteca de ${nombreUsuario}. Libros comprados en la nube:`, misLibrosActuales);

  // 5. Filtrar las tarjetas de los libros en el HTML
  const tarjetas = document.querySelectorAll('.book-card');
  const gridLibros = document.getElementById('grid-libros');
  const mensajeVacio = document.getElementById('mensaje-vacio');

  let librosVisibles = 0;

  tarjetas.forEach(tarjeta => {
    const libroID = tarjeta.getAttribute('data-libro-id');

    // Comprobación de coincidencia insensible a mayúsculas/minúsculas
    const tieneElLibro = misLibrosActuales.some(
      idComprado => String(idComprado).toLowerCase().trim() === String(libroID).toLowerCase().trim()
    );

    if (tieneElLibro) {
      tarjeta.style.display = 'block';
      librosVisibles++;
    } else {
      tarjeta.style.display = 'none';
    }
  });

  // 6. Alternar vista entre cuadrícula de libros y mensaje de biblioteca vacía
  if (librosVisibles === 0) {
    if (gridLibros) gridLibros.style.display = 'none';
    if (mensajeVacio) mensajeVacio.style.display = 'block';
  } else {
    if (gridLibros) gridLibros.style.display = 'grid';
    if (mensajeVacio) mensajeVacio.style.display = 'none';
  }
});
