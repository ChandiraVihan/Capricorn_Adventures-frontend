import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "./api/authService";

export default function OAuth2RedirectHandler() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const processRedirect = async () => {
            const searchParams = new URLSearchParams(location.search);
            const accessToken = searchParams.get("accessToken");
            const refreshToken = searchParams.get("refreshToken");

            if (accessToken && refreshToken) {
                localStorage.setItem("token", accessToken);
                localStorage.setItem("refreshToken", refreshToken);

                try {
                    // Fetch user info immediately and store in localStorage
                    const user = await authService.getUserInfo();
                    
                    if (user && user.role === "ADMIN") {
                        window.location.href = "/admin/adventures";
                    } else {
                        window.location.href = "/home";
                    }
                } catch (err) {
                    console.error("Failed to fetch user info after social login", err);
                    navigate("/signin?error=user_info_failed");
                }
            } else {
                navigate("/signin?error=oauth2_failed");
            }
        };

        processRedirect();
    }, [location, navigate]);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <p>Processing social login... Please wait.</p>
        </div>
    );
}
