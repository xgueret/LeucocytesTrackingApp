import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger le token depuis localStorage au démarrage
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUsername = localStorage.getItem('username');

    if (storedToken) {
      setToken(storedToken);
      setUsername(storedUsername);
    }

    setLoading(false);
  }, []);

  // Fonction de connexion
  const login = async (username, password) => {
    try {
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Identifiants incorrects');
      }

      const data = await response.json();

      // Stocker le token et le nom d'utilisateur
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('username', data.username);

      setToken(data.access_token);
      setUsername(data.username);

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
  };

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = () => {
    return !!token;
  };

  const value = {
    token,
    username,
    login,
    logout,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }

  return context;
};

export default AuthContext;
