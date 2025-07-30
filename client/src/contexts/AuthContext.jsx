import React, { createContext, useContext, useState, useEffect } from "react";

// Tạo Context
const AuthContext = createContext();

// Custom hook để sử dụng AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khởi tạo state từ localStorage khi component mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        console.log("Initializing auth with:", {
          storedToken: !!storedToken,
          storedUser,
        });

        if (storedToken && storedUser && storedUser !== "undefined") {
          const parsedUser = JSON.parse(storedUser);
          console.log("Parsed user:", parsedUser);
          setToken(storedToken);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Xóa dữ liệu lỗi
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Hàm login
  const login = (userData, userToken) => {
    try {
      console.log("Login called with:", { userData, userToken: !!userToken });
      localStorage.setItem("token", userToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setToken(userToken);
      setUser(userData);
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  // Hàm logout
  const logout = () => {
    console.log("Logout called");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  // Hàm cập nhật thông tin user
  const updateUser = (updatedUser) => {
    try {
      console.log("Update user called with:", updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  // Kiểm tra xem user có đăng nhập không
  const isAuthenticated = !!token && !!user;

  console.log("Auth state:", {
    isAuthenticated,
    user: !!user,
    token: !!token,
    loading,
  });

  // Kiểm tra role
  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
