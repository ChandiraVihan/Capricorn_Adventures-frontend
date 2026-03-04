import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authService } from "./api/authService";
import "./Auth.css";

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const t = params.get("token");
        if (t) {
            setToken(t);
        } else {
            setError("Invalid or missing reset token.");
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword(token, newPassword);
            setSuccess("Password reset successful! Redirecting to sign in...");
            setTimeout(() => navigate("/signin"), 3000);
        } catch (err) {
            setError(err.message || "Failed to reset password. The link may have expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo-mark">
                        <span className="emoji">🎨</span>
                        <span className="brand-name">CAPRICORN ADVENTURES</span>
                    </div>
                    <h2>Reset Your Password</h2>
                    {error && (
                        <div className="auth-error" style={{ color: "red", marginTop: "10px", textAlign: 'center' }}>
                            <p>{error}</p>
                            {!token && <Link to="/forgot-password" style={{ display: 'block', marginTop: '10px' }}>Request a new link</Link>}
                        </div>
                    )}
                    {success && <p className="auth-success" style={{ color: "green", marginTop: "10px" }}>{success}</p>}
                    <p className="auth-subtitle">
                        Please enter your new password below.
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={!token || !!success}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={!token || !!success}
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading || !token || !!success}>
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                    <div style={{ textAlign: 'center', marginTop: '15px' }}>
                        <Link to="/signin" className="back-to-login">Back to Sign In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
