import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, ShoppingBag, Menu, X, User, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../security/auth';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ onCartToggle, onViewChange, currentView }) => {
    const { cartCount } = useCart();
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const navLinks = [
        { name: 'Home', path: '/', view: 'home', isLink: true },
        { name: 'Shop', path: '/', view: 'shop', isLink: true },
        { name: 'Movies', path: '/movies', isLink: true },
        { name: 'Contact Us', path: '/#contact', view: 'home', hash: 'contact', isLink: true },
    ];

    const handleLinkClick = (e, link) => {
        const isHomePage = location.pathname === '/';

        if (link.name === 'Contact Us') {
            if (isHomePage && onViewChange) {
                e.preventDefault();
                onViewChange('home');
                setTimeout(() => {
                    const el = document.getElementById('contact');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                // If on movies or another page, we go home first
                // React Router takes us to / but we want the hash
                // We'll let the default Link behavior take us to / and add a listener in Shop.jsx to scroll
                // Or much simpler: navigate and then scroll.
            }
            return;
        }

        if (link.isLink && link.view && onViewChange && isHomePage) {
            e.preventDefault();
            onViewChange(link.view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <>
            <nav style={{
                padding: '0.8rem min(2rem, 4vw)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--glass-border)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }} onClick={() => { onViewChange && onViewChange('home'); navigate('/'); }}>
                    <Smartphone color="var(--primary)" size={32} />
                    <h1 style={{ fontSize: 'min(1.4rem, 5vw)', margin: 0 }} className="neon-text">SHINE TECH</h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Desktop Links - Hidden on Mobile */}
                    <div className="hide-mobile" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        {navLinks.map((link, idx) => {
                            const isActive = link.view === currentView || (idx === 0 && !currentView && !link.view);
                            return (
                                <Link
                                    key={idx}
                                    to={link.path}
                                    onClick={(e) => handleLinkClick(e, link)}
                                    style={{
                                        color: isActive ? 'white' : 'var(--text-muted)',
                                        textDecoration: 'none',
                                        fontWeight: isActive ? '700' : '500',
                                        transition: 'color 0.3s',
                                        borderBottom: isActive ? '2px solid var(--primary)' : 'none',
                                        paddingBottom: '4px'
                                    }}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                        {/* Admin Entry */}
                        <Link to={user ? "/dashboard" : "/login"} style={{ color: user ? 'var(--primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <User size={24} />
                        </Link>

                        {/* Cart Toggle */}
                        {onCartToggle && (
                            <div
                                onClick={onCartToggle}
                                style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <ShoppingBag size={24} />
                                {cartCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '-8px',
                                        background: 'var(--primary)',
                                        color: 'black',
                                        fontSize: '0.7rem',
                                        fontWeight: '900',
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 0 10px var(--primary-glow)'
                                    }}>
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <div className="show-mobile" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ cursor: 'pointer', color: 'var(--primary)' }}>
                            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Sidebar Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 998 }}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                position: 'fixed',
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: '80%',
                                maxWidth: '300px',
                                background: 'var(--surface)',
                                zIndex: 999,
                                padding: '5rem 2rem 2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2rem',
                                borderLeft: '1px solid var(--glass-border)'
                            }}
                        >
                            {navLinks.map((link, idx) => {
                                const isActive = link.view === currentView;
                                return (
                                    <Link
                                        key={idx}
                                        to={link.path}
                                        onClick={(e) => {
                                            handleLinkClick(e, link);
                                            setIsMenuOpen(false);
                                        }}
                                        style={{
                                            fontSize: '1.5rem',
                                            color: isActive ? 'var(--primary)' : 'white',
                                            textDecoration: 'none',
                                            fontWeight: '700',
                                            letterSpacing: '1px'
                                        }}
                                    >
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
