let currentToken: string | null = null;

export const setToken = (token: string | null) => {
  currentToken = token;
};

export const getToken = () => currentToken;