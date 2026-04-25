import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../api/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(authService.getCurrentUser());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            try {
                const storedUser = await authService.getUserInfo();
                if (storedUser) {
                    setUser(storedUser);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Session verification failed:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, []);

    const login = async (email, password) => {
        const data = await authService.login(email, password);
        setUser(data.user);
        return data;
    };

    const register = async (firstName, lastName, email, password) => {
        return await authService.register(firstName, lastName, email, password);
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const hasAnyRole = (...roles) => {
        if (!user?.role) return false;
        return roles.map((role) => String(role).toUpperCase()).includes(user.role);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, hasAnyRole }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
