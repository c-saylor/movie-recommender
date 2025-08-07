import React from 'react';
import { Container } from 'react-bootstrap';
import tmdbLogo from '../assets/images/tmdb-logo.svg'
import '../styles/credits.scss';

const Credits: React.FC = () => {
    return (
        <section className="credits page">
            <Container>
                <h2>Credits</h2>
                <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
            <a 
                href="https://www.themoviedb.org/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TMDB"
            >
                <img src={tmdbLogo} alt="TMDB logo" className="tmdb-logo"/>
            </a>
            </Container>
        </section>
    );
}

export default Credits;