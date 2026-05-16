import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Container, Nav, Form, FormControl, Button, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../utils/Auth';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import '../styles/header.scss';

const Header: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const {suggestions} = useSearchSuggestions(searchQuery);
    const dropDownRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate();
    const location = useLocation();
    const {logout} = useAuth();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        navigate(`/all?query=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery('');
        setShowDropdown(false);
        setActiveIndex(-1);
    }

    const handleSelectSuggestion = (title: string) => {
        if (!title.trim()) return;
        navigate(`/all?query=${encodeURIComponent(title.trim())}`);
        setSearchQuery('');
        setShowDropdown(false);
        setActiveIndex(-1);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showDropdown || !suggestions.length) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                if (activeIndex >= 0) {
                    e.preventDefault();
                    handleSelectSuggestion(suggestions[activeIndex].title);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setActiveIndex(-1);
                break;
        }
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
                        <Nav.Link href="/" className={location.pathname === '/' ? 'active' : ''}>Home</Nav.Link>
                        <Nav.Link href="/browse" className={location.pathname === '/browse' ? 'active' : ''}>Browse</Nav.Link>
                        <Nav.Link href="/recommendations" className={location.pathname === '/recommendations' ? 'active' : ''}>Recommendations</Nav.Link>
                        <Nav.Link href="/all" className={location.pathname === '/all' ? 'active' : ''}>All Movies</Nav.Link>
                        <Nav.Link href="/credits" className={location.pathname === '/credits' ? 'active' : ''}>Credits</Nav.Link>
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
                            className="me-2"
                            aria-label="Search"
                            aria-autocomplete="list"
                            value={searchQuery}
                            onBlur={() => setTimeout(() => { setShowDropdown(false); setActiveIndex(-1); }, 150)}
                            onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); setActiveIndex(-1); }}
                            onKeyDown={handleKeyDown}
                        />
                        <Button variant="warning" type="submit">Search</Button>
                        {showDropdown && suggestions.length > 0 && (
                            <div className="search-dropdown" ref={dropDownRef}>
                                {suggestions.map((movie, index) => (
                                    <div
                                        key={movie.id}
                                        className={`dropdown-item${index === activeIndex ? ' active' : ''}`}
                                        onClick={() => handleSelectSuggestion(movie.title)}
                                    >
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