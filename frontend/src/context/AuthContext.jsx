import { createContext, useContext, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('brandflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [company, setCompany] = useState(() => {
    const saved = localStorage.getItem('brandflow_company');
    return saved ? JSON.parse(saved) : null;
  });

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('brandflow_token', res.data.token);
    localStorage.setItem('brandflow_user', JSON.stringify(res.data.user));
    if (res.data.company) localStorage.setItem('brandflow_company', JSON.stringify(res.data.company));
    setUser(res.data.user);
    setCompany(res.data.company);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem('brandflow_token');
    localStorage.removeItem('brandflow_user');
    localStorage.removeItem('brandflow_company');
    setUser(null);
    setCompany(null);
  }

  return (
    <AuthContext.Provider value={{ user, company, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
