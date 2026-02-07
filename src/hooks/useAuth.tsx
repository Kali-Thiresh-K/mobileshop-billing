import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import API from "@/lib/api";

interface User {
  _id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: string | null;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  login: async () => { },
  register: async () => { },
  logout: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const { data } = await API.get("/auth/profile");
          setUser(data);
          setUserRole(data.role);
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("token");
          setUser(null);
          setUserRole(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (formData: any) => {
    const { data } = await API.post("/auth/login", formData);
    localStorage.setItem("token", JSON.stringify(data.token));
    setUser(data);
    setUserRole(data.role);
  };

  const register = async (formData: any) => {
    const { data } = await API.post("/auth/register", formData);
    localStorage.setItem("token", JSON.stringify(data.token));
    setUser(data);
    setUserRole(data.role);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, userRole, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
