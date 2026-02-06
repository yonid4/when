import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";

import { supabase } from "../../services/supabaseClient.js";

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  useEffect(() => {
    if (isDemo) {
      setIsAuthenticated(true);
      return;
    }

    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(Boolean(session));
    }
    checkAuth();
  }, [isDemo]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
