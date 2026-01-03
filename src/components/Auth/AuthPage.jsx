import { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../../supabase/auth';
import { isConfigured } from '../../supabase/client';
import './AuthPage.css';

function AuthPage({ inviteCode }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isConfigured) {
            setError('Supabase not configured. Check browser console for instructions.');
            return;
        }

        setLoading(true);
        setError(null);

        const result = isLogin
            ? await signInWithEmail(email, password)
            : await signUpWithEmail(email, password);

        if (result.error) {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-logo">
                    <svg width="124" height="96" viewBox="0 0 28 20">
                        <path
                            fill="currentColor"
                            d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461742 10.3416 0C8.49087 0.318797 6.68679 0.879656 4.97999 1.67671C1.68049 6.67671 0.737949 11.5475 1.21069 16.3558C3.24064 17.8616 5.53633 18.9768 7.99999 19.6417C8.51413 18.9616 8.96927 18.2379 9.35923 17.4791C8.61333 17.2058 7.89999 16.8616 7.22999 16.4558C7.40469 16.3291 7.57576 16.1983 7.74306 16.0641C11.8029 17.9791 16.2417 17.9791 20.2569 16.0641C20.4244 16.1983 20.5955 16.3291 20.77 16.4558C20.0988 16.8616 19.3855 17.2058 18.6408 17.4791C19.0307 18.2379 19.4859 18.9616 20 19.6417C22.4649 18.9768 24.7606 17.8616 26.7893 16.3558C27.3477 10.7579 25.8883 5.9308 23.0212 1.67671ZM9.68041 13.4475C8.39776 13.4475 7.34399 12.2717 7.34399 10.82C7.34399 9.36825 8.37361 8.19255 9.68041 8.19255C10.9829 8.19255 12.0401 9.36825 12.0168 10.82C12.0168 12.2717 10.9829 13.4475 9.68041 13.4475ZM18.3196 13.4475C17.0369 13.4475 15.9832 12.2717 15.9832 10.82C15.9832 9.36825 17.0128 8.19255 18.3196 8.19255C19.6264 8.19255 20.6802 9.36825 20.6569 10.82C20.6569 12.2717 19.6264 13.4475 18.3196 13.4475Z"
                        />
                    </svg>
                </div>

                {inviteCode && (
                    <div className="auth-invite-notice">
                        🎉 You've been invited to join a server! Log in or sign up to accept.
                    </div>
                )}

                <h1>{isLogin ? 'Welcome back!' : 'Create an account'}</h1>
                <p className="auth-subtitle">
                    {isLogin ? "We're so excited to see you again!" : 'Join the conversation'}
                </p>

                {!isConfigured && (
                    <div className="auth-warning">
                        ⚠️ Supabase not configured. Open browser console (F12) for setup instructions.
                    </div>
                )}

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">EMAIL</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">PASSWORD</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="6+ characters"
                            required
                            minLength={6}
                            autoComplete={isLogin ? "current-password" : "new-password"}
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <p className="auth-switch">
                    {isLogin ? "Need an account? " : "Already have an account? "}
                    <button
                        type="button"
                        className="auth-switch-btn"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                        }}
                    >
                        {isLogin ? 'Register' : 'Log In'}
                    </button>
                </p>

                <div className="auth-features">
                    <div className="feature">
                        <span className="feature-icon">💬</span>
                        <span>Real-time messaging</span>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">🏠</span>
                        <span>Create & join servers</span>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">🌐</span>
                        <span>Public & persistent</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthPage;
