export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user_id: string;
  email: string;
  name: string;
}

export interface RefreshResponse {
  access_token: string;
}

const USERS_KEY = 'taskflow_users';

// Inicializa con un usuario de prueba si no hay datos
const initializeUsers = () => {
  const users = localStorage.getItem(USERS_KEY);
  if (!users) {
    const defaultUsers = [
      {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
};

// Obtener usuarios
const getUsers = (): any[] => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

// Guardar usuarios
const saveUsers = (users: any[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Generar token simple (solo un id de sesión)
const generateToken = (userId: string) => {
  return `mock-token-${userId}-${Date.now()}`;
};

// Inicializar al cargar el módulo
initializeUsers();

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    console.log('🔐 Login attempt:', payload.email);
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getUsers();
    const user = users.find(u => u.email === payload.email && u.password === payload.password);
    if (!user) {
      console.error('❌ Login failed: invalid credentials');
      throw new Error('Credenciales inválidas');
    }

    const token = generateToken(user.id);
    console.log('✅ Login successful:', user.email);
    return {
      access_token: token,
      user_id: user.id,
      email: user.email,
      name: user.name,
    };
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    console.log('📝 Register attempt:', payload.email);
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getUsers();
    const existing = users.find(u => u.email === payload.email);
    if (existing) {
      console.error('❌ Register failed: email already exists');
      throw new Error('El correo ya está registrado');
    }

    const newUser = {
      id: Math.random().toString(36).substring(2, 9),
      name: payload.name,
      email: payload.email,
      password: payload.password,
    };
    users.push(newUser);
    saveUsers(users);
    console.log('✅ Register successful:', newUser);

    const token = generateToken(newUser.id);
    return {
      access_token: token,
      user_id: newUser.id,
      email: payload.email,
      name: payload.name,
    };
  },

  refresh: async (): Promise<RefreshResponse> => {
    throw new Error('Not implemented');
  },

  logout: async (): Promise<void> => {
    // No hacer nada en modo mock
  },

  getMe: async (): Promise<{ user: any }> => {
    throw new Error('Not implemented');
  },
};