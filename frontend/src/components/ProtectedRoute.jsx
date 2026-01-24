import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [searchParams] = useSearchParams();
    const isDemo = searchParams.get("demo") === "true";

    useEffect(() => {
        // Skip auth check in demo mode
        if (isDemo) {
            setIsAuthenticated(true);
            return;
        }

        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
        };
        checkAuth();
    }, [isDemo]);

    if (isAuthenticated === null) return <div>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/" replace />;
    return children;
};

export default ProtectedRoute;
