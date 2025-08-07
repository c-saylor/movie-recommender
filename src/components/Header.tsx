import React, { useEffect, useRef, useState } from 'react';
import {useNavigate} from 'react-router-dom';
import { Navbar, Container, Nav, Form, FormControl, Button, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../utils/Auth';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import '../styles/header.scss';

const Header: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const {suggestions} = useSearchSuggestions(searchQuery);
    const dropDownRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate();
    const {logout} = useAuth(); 

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        navigate(`/all?query=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery('');
        setShowDropdown(false);
    }

    const handleSelectSuggestion = (title: string) => {
        if (!title.trim()) return;
        navigate(`/all?query=${encodeURIComponent(title.trim())}`);
        setSearchQuery('');
        setShowDropdown(false);
    }

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropDownRef.current && !dropDownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <Navbar expand="lg" data-bs-theme="dark" bg="dark" className="sticky-top shadow-sm">
            <Container>
                <Navbar.Brand href="/">
                    MovieMatch
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="main-navbar" />
                <Navbar.Collapse id="main-navbar">
                    <Nav className="ms-auto">
                        <Nav.Link href="/" className={window.location.pathname === '/' ? 'active' : ''}>Home</Nav.Link>
                        <Nav.Link href="/browse" className={window.location.pathname === '/browse' ? 'active' : ''}>Browse</Nav.Link>
                        <Nav.Link href="/recommendations" className={window.location.pathname === '/recommendations' ? 'active' : ''}>Recommendations</Nav.Link>
                        <Nav.Link href="/all" className={window.location.pathname === '/all' ? 'active' : ''}>All Movies</Nav.Link>
                        <Nav.Link href="/credits" className={window.location.pathname === '/credits' ? 'active' : ''}>Credits</Nav.Link>
                        <NavDropdown title={<i className="bi bi-person-circle"/>} id="basic-nav-dropdown">
                            <NavDropdown.Item href="/favorites">
                                Favorites
                            </NavDropdown.Item>
                            <NavDropdown.Item href="/watchlist">
                                Watchlist
                            </NavDropdown.Item>
                            <NavDropdown.Item href="/not-interested">
                                Not Interested
                            </NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={() => handleLogout()}>
                                Log out
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>

                    <Form className="d-flex search-bar" onSubmit={handleSubmit}>
                        <FormControl 
                            type="search" 
                            placeholder="Search movies..." 
                            className="me-2" aria-label="Search" 
                            value={searchQuery} 
                            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                            onChange={(e) => {setSearchQuery(e.target.value); setShowDropdown(true);}} 
                        />
                        <Button variant="warning" type="submit">Search</Button>
                        {showDropdown && suggestions.length > 0 && (
                            <div className="search-dropdown" ref={dropDownRef}>
                                {suggestions.map((movie) => (
                                    <div key={movie.id} className="dropdown-item" onClick={() => handleSelectSuggestion(movie.title)}>
                                        {movie.title}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Form>

                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default Header;