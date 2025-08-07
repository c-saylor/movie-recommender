import React from 'react';
import { Container, Button } from 'react-bootstrap';
import '../styles/home.scss'; 
import { useAuth } from '../utils/Auth';
import { useFavorites } from '../utils/Favorites';

const Home: React.FC = () => {
    const {user} = useAuth();
    const {favorites} = useFavorites();
    const handleClick = () => {
        // Redirect based on user authentication and favorites
        if (!user) {
            window.location.href = '/login';
        } else if (user && !favorites.length) {
            window.location.href = '/browse';

        } else {
            window.location.href = '/recommendations';
        }
    }
    return (
        <section className="home d-flex align-items-center justify-content-center text-center page">
            <Container>
                <h1 className="display-4 fw-bold">Find Your Next Favorite Movie</h1>
                <p className="lead">Get curated recommendations based on your tastes.</p>
                <Button variant="primary" size="lg" href="#recommendations" onClick={handleClick}>
                    {!favorites.length ? 'Get Started' : 'View Recommendations'}
                </Button>
            </Container>
        </section>
    );
};

export default Home;