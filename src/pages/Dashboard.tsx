import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Overview from "./Overview";
import { Layout } from "@/components/Layout";

/**
 * Legacy Dashboard route - now redirects to Overview
 * This maintains backward compatibility while using the new scroll-flow design
 */
const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to /overview for consistency
    navigate("/overview", { replace: true });
  }, [navigate]);

  // Render Overview while redirect happens (prevents flash)
  return (
    <Layout>
      <Overview />
    </Layout>
  );
};

export default Dashboard;
