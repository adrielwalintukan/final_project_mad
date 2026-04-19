import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { Id } from "../convex/_generated/dataModel";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface User {
    _id: Id<"users">;
    name: string;
    email: string;
    role?: string;
    photoUrl?: string;
    createdAt?: number;
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initial load from storage
    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem("dailyboost_user");
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error("Failed to load user from storage:", error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadUser();
    }, []);

    // Custom setUser that also syncs to storage
    const handleSetUser = async (newUser: User | null) => {
        setUser(newUser);
        try {
            if (newUser) {
                await AsyncStorage.setItem("dailyboost_user", JSON.stringify(newUser));
            } else {
                await AsyncStorage.removeItem("dailyboost_user");
            }
        } catch (error) {
            console.error("Failed to sync user to storage:", error);
        }
    };

    // Prevent rendering app (and triggering route changes) until we check storage
    if (!isLoaded) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ user, setUser: handleSetUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
