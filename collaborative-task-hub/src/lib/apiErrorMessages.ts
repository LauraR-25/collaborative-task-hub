const CONFLICT_MESSAGES = new Set([
  'Email already registered',
  'Username already registered',
  'Phone already registered',
  'Resource already exists',
]);

export const mapConflictMessage = (message?: string, fallback = 'Conflict'): string => {
  if (!message) return fallback;
  const normalized = message.trim();
  if (CONFLICT_MESSAGES.has(normalized)) return normalized;
  return normalized || fallback;
};

export const mapRegisterConflictMessageEs = (message?: string): string => {
  const normalized = (message || '').trim().toLowerCase();

  if (normalized.includes('username') || normalized.includes('user')) {
    return 'Ya hay un usuario con ese nombre.';
  }
  if (normalized.includes('email') || normalized.includes('correo')) {
    return 'Ya hay una cuenta registrada con ese correo.';
  }
  if (normalized.includes('phone') || normalized.includes('telefono') || normalized.includes('teléfono')) {
    return 'Ya hay una cuenta registrada con ese teléfono.';
  }
  if (normalized.includes('resource already exists') || normalized.includes('ya existe')) {
    return 'Ya hay un usuario con ese nombre.';
  }

  return 'Ya existe una cuenta con esos datos.';
};

export const mapProfilePhoneConflictMessageEs = (message?: string): string => {
  const normalized = (message || '').trim().toLowerCase();
  if (normalized.includes('phone') || normalized.includes('telefono') || normalized.includes('teléfono')) {
    return 'Ya hay una cuenta registrada con ese teléfono.';
  }
  return 'No se pudo guardar el teléfono porque ya está en uso.';
};
