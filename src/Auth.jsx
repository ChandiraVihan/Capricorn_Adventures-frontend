import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import "./Auth.css";

export default function Auth({ mode }) {
    const isSignIn = mode === "signin";
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            if (isSignIn) {
                await login(formData.email, formData.password);
                navigate("/home");
            } else {
                const nameParts = formData.name ? formData.name.split(" ") : ["", ""];
                const fName = nameParts[0] || "";
                const lName = nameParts.slice(1).join(" ") || "User";

                await register(fName, lName, formData.email, formData.password);
                setSuccess("Registration successful! Please sign in.");
                setFormData({ email: "", password: "", name: "" });
                setTimeout(() => navigate("/signin"), 2000);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8080/oauth2/authorize/google";
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo-mark">
                        <span className="emoji">🎨</span>
                        <span className="brand-name">CAPRICORN ADVENTURES</span>
                    </div>
                    <h2>{isSignIn ? "Welcome Back" : "Create an Account"}</h2>
                    {error && <p className="auth-error" style={{ color: "red", marginTop: "10px" }}>{error}</p>}
                    {success && <p className="auth-success" style={{ color: "green", marginTop: "10px" }}>{success}</p>}
                    <p className="auth-subtitle">
                        {isSignIn
                            ? "Sign in to access your curated adventures."
                            : "Join us and start booking unforgettable experiences."}
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {!isSignIn && (
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                placeholder="John Doe"
                                value={formData.name || ""}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {isSignIn && (
                        <div className="form-options">
                            <label className="remember-me">
                                <input type="checkbox" /> Remember me
                            </label>
                            <a href="#forgot" className="forgot-password">Forgot password?</a>
                        </div>
                    )}

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? "Processing..." : (isSignIn ? "Sign In" : "Sign Up")}
                    </button>
                </form>

                <div className="social-login" style={{ marginTop: "20px", textAlign: "center" }}>
                    <div className="separator" style={{ margin: "20px 0", display: "flex", alignItems: "center", textTransform: "uppercase", fontSize: "12px", color: "#666" }}>
                        <div style={{ flex: 1, height: "1px", background: "#ddd" }}></div>
                        <span style={{ padding: "0 10px" }}>Or continue with</span>
                        <div style={{ flex: 1, height: "1px", background: "#ddd" }}></div>
                    </div>
                    <button
                        onClick={handleGoogleLogin}
                        className="google-btn"
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            background: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500"
                        }}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: "18px" }} />
                        Sign in with Google
                    </button>
                </div>

                <div className="auth-footer">
                    {isSignIn ? (
                        <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
                    ) : (
                        <p>Already have an account? <Link to="/signin">Sign in</Link></p>
                    )}
                </div>
            </div>
        </div>
    );
}
