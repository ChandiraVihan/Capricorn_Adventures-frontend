import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { authService } from "./api/authService";
import "./Auth.css";

export default function Auth({ mode }) {
    const isSignIn = mode === "signin";
    const isForgotPassword = mode === "forgot-password";
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const errorType = params.get("error");
        if (errorType) {
            switch (errorType) {
                case "access_denied":
                    setError("Login cancelled. You must approve access to sign in with Google.");
                    break;
                case "oauth2_failed":
                    setError("Google authentication failed. Please try again.");
                    break;
                case "user_info_failed":
                    setError("Authenticated with Google, but failed to fetch your profile.");
                    break;
                default:
                    setError("An unexpected error occurred during social login.");
            }
        }
    }, [location]);

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
            } else if (isForgotPassword) {
                await authService.forgotPassword(formData.email);
                setSuccess("If this email is registered, a reset link has been sent.");
            } else {
                const fName = formData.firstName || "";
                const lName = formData.lastName || "";

                await register(fName, lName, formData.email, formData.password);
                setSuccess("Registration successful! Please sign in.");
                setFormData({ email: "", password: "", firstName: "", lastName: "" });
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

    const getTitle = () => {
        if (isSignIn) return "Welcome Back";
        if (isForgotPassword) return "Forgot Password";
        return "Create an Account";
    };

    const getSubtitle = () => {
        if (isSignIn) return "Sign in to access your curated adventures.";
        if (isForgotPassword) return "Enter your email to receive a reset link.";
        return "Join us and start booking unforgettable experiences.";
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo-mark">
                        <span className="emoji">🎨</span>
                        <span className="brand-name">CAPRICORN ADVENTURES</span>
                    </div>
                    <h2>{getTitle()}</h2>
                    {error && <p className="auth-error" style={{ color: "red", marginTop: "10px" }}>{error}</p>}
                    {success && <p className="auth-success" style={{ color: "green", marginTop: "10px" }}>{success}</p>}
                    <p className="auth-subtitle">{getSubtitle()}</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === "signup" && (
                        <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label htmlFor="firstName">First Name</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label htmlFor="lastName">Last Name</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
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

                    {(isSignIn || mode === "signup") && (
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
                    )}

                    {isSignIn && (
                        <div className="form-options">
                            <label className="remember-me">
                                <input type="checkbox" /> Remember me
                            </label>
                            <Link to="/forgot-password" title="Forgot password?">Forgot password?</Link>
                        </div>
                    )}

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? "Processing..." : (isSignIn ? "Sign In" : isForgotPassword ? "Send Reset Link" : "Sign Up")}
                    </button>
                    {isForgotPassword && (
                        <div style={{ textAlign: 'center', marginTop: '15px' }}>
                            <Link to="/signin" className="back-to-login">Back to Sign In</Link>
                        </div>
                    )}
                </form>

                {(isSignIn || mode === "signup") && (
                    <>
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
                    </>
                )}
            </div>
        </div>
    );
}
