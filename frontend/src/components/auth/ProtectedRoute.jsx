import { Navigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import RouteLoadingFallback from "../common/RouteLoadingFallback";

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  if (loading && !isDemo) {
    return <RouteLoadingFallback />;
  }

  if (!session && !isDemo) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
