import { Link } from "react-router-dom";
import "./Auth.css";

export default function Auth({ mode }) {
    const isSignIn = mode === "signin";

    return (
        <div className="auth-container">
            {/* 
        Header is technically sitting on top (via position absolute), 
        so we just pad the top or center the auth card nicely under the header 
      */}
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo-mark">
                        <span className="emoji">🎨</span>
                        <span className="brand-name">CAPRICORN ADVENTURES</span>
                    </div>
                    <h2>{isSignIn ? "Welcome Back" : "Create an Account"}</h2>
                    <p className="auth-subtitle">
                        {isSignIn
                            ? "Sign in to access your curated adventures."
                            : "Join us and start booking unforgettable experiences."}
                    </p>
                </div>

                <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                    {!isSignIn && (
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input type="text" id="name" placeholder="John Doe" required />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" placeholder="you@example.com" required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" placeholder="••••••••" required />
                    </div>

                    {isSignIn && (
                        <div className="form-options">
                            <label className="remember-me">
                                <input type="checkbox" /> Remember me
                            </label>
                            <a href="#forgot" className="forgot-password">Forgot password?</a>
                        </div>
                    )}

                    <button type="submit" className="auth-submit-btn">
                        {isSignIn ? "Sign In" : "Sign Up"}
                    </button>
                </form>

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
