import React, { useState } from 'react';
import { useAuth } from '../utils/Auth';
import '../styles/login.scss';
import { Container } from 'react-bootstrap';

export const Login: React.FC = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState("");

    return (
        <section className="login-container d-flex align-items-center justify-content-center text-center page">
            <Container>
                <p className="display-4 fw-bold">Sign in to get customized recommendations.</p>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (username.trim()) {
                        login(username.trim());
                        window.location.href = '/recommendations';
                    }
                }
                }>
                    <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    <button type="submit">Log In</button>
                </form>
            </Container>
        </section>
    )
}

export default Login;