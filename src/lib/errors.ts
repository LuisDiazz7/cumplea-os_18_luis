export function mensajeUsuario(error: unknown, fallback: string): string {
  const e = (error ?? {}) as { code?: string; message?: string; name?: string }

  switch (e.code) {
    case '23505':
      return 'Ese invitado ya ingresó.'
    case '23514':
      return 'El nombre debe tener al menos 2 caracteres.'
    case '23502':
      return 'Faltan datos obligatorios.'
    case '42501':
    case '42503':
      return 'No tienes permisos para realizar esta acción.'
    case 'invalid_credentials':
      return 'Correo o contraseña incorrectos.'
    case 'email_not_confirmed':
      return 'Aún no confirmas tu correo electrónico.'
    case 'over_request_rate_limit':
    case 'request_rate_limit_exceeded':
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
    case 'db_error':
      return 'Error interno del servidor de Auth. Inténtalo de nuevo.'
    case 'user_already_exists':
      return 'Ese usuario ya existe.'
    case 'weak_password':
      return 'La contraseña es demasiado débil.'
    case 'same_password':
      return 'La contraseña no puede ser igual a la anterior.'
    case 'email_address_invalid':
      return 'El correo no parece válido.'
    case 'PGRST301':
    case 'PGRST302':
      return 'Tu sesión expiró. Inicia sesión de nuevo.'
  }

  if (e.name === 'AuthApiError') {
    const msg = (e.message ?? '').toLowerCase()
    if (/rate limit/i.test(msg)) {
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
    }
    if (/not confirmed|confirmado/i.test(msg)) {
      return 'Aún no confirmas tu correo electrónico.'
    }
    return 'No se pudo iniciar sesión. Verifica tus datos e inténtalo de nuevo.'
  }

  if (e.name === 'PostgrestError') {
    return 'Error al consultar la base de datos. Inténtalo de nuevo.'
  }

  const mensaje = e.message ?? ''
  if (/failed to fetch|load failed|network error|connection|timeout/i.test(mensaje)) {
    return 'No se pudo conectar. Revisa tu internet e inténtalo de nuevo.'
  }

  return fallback
}