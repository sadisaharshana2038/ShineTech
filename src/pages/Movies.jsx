import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Play, Calendar, Clock, Monitor, Search, Filter, ShieldCheck, HardDrive, X, Smartphone } from 'lucide-react';
import Navbar from '../components/Navbar';
import VisitorCounter from '../components/VisitorCounter';
import { useInventory } from '../context/InventoryContext';
import { formatImagePath } from '../utils/urlUtils';

const Movies = () => {
    const { movies = [], loading } = useInventory();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);
    const [activeDownloadId, setActiveDownloadId] = useState(null);
    const [activeQuality, setActiveQuality] = useState(null); // '720' or '1080'
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const handleImageError = (e) => {
        console.warn(`Movie image failed to load: ${e.target.src}`);
        e.target.src = 'https://placehold.co/600x900/1a1a1a/ffffff?text=Poster+Coming+Soon';
        e.target.onerror = null; // Prevent infinite loop
    };

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const genres = ['All', 'Latest', 'Action', 'Sci-Fi', 'Horror', 'Drama', 'Adventure', 'Animation'];

    const filteredMovies = movies.filter(movie => {
        const matchesSearch = movie.name.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesGenre = selectedGenre === 'All' || movie.genre === selectedGenre;

        if (selectedGenre === 'Latest') {
            // Logic for latest: explicit flag or highest IDs
            matchesGenre = movie.isLatest || movie.id > 203;
        }

        return matchesSearch && matchesGenre;
    });

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'white', paddingTop: '6rem' }}>

            {/* Hero Section */}
            <div style={{
                height: '30vh',
                minHeight: '200px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(to bottom, transparent, var(--background)), url("https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1920") center/cover'
            }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ position: 'relative', textAlign: 'center', zIndex: 1, padding: '0 1rem' }}
                >
                    <h1 className="neon-text" style={{ fontSize: 'clamp(2rem, 10vw, 4rem)', marginBottom: '0.5rem' }}>CINEMA ARCHIVE</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.8rem, 3vw, 1.1rem)', letterSpacing: '0.2em' }}>PREMIUM DOWNLOADS • 4K ULTRA HD</p>
                </motion.div>
            </div>

            <main className="movies-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem min(2rem, 4vw)' }}>
                {/* Search & Filter Bar */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    marginBottom: '3rem'
                }}>
                    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '600px', padding: '0.8rem 1.2rem', margin: '0 auto' }}>
                        <Search size={20} color="var(--primary)" />
                        <input
                            type="text"
                            placeholder="Search archive..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'white', width: '100%', fontSize: '1rem', outline: 'none' }}
                        />
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '0.6rem',
                        overflowX: 'auto',
                        padding: '0.5rem 0',
                        maxWidth: '100%',
                        justifyContent: isMobile ? 'flex-start' : 'center'
                    }} className="hide-scrollbar mobile-container">
                        {genres.map(genre => (
                            <button
                                key={genre}
                                onClick={() => setSelectedGenre(genre)}
                                className="btn"
                                style={{
                                    background: selectedGenre === genre ? 'var(--primary)' : 'var(--surface)',
                                    color: selectedGenre === genre ? 'black' : 'var(--text-muted)',
                                    borderRadius: '10px',
                                    padding: '0.5rem 1rem',
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.9rem',
                                    border: selectedGenre === genre ? 'none' : '1px solid var(--glass-border)'
                                }}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Movie Grid */}
                <div className="movies-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                    gap: '1.5rem'
                }}>
                    <AnimatePresence mode='popLayout'>
                        {loading && movies.length === 0 ? (
                            [...Array(8)].map((_, i) => (
                                <div key={i} className="glass-card shimmer" style={{ height: '450px', background: 'rgba(255,255,255,0.05)' }} />
                            ))
                        ) : filteredMovies.map((movie, index) => (
                            <motion.div
                                layout
                                key={movie.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-card"
                                style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
                            >
                                <div
                                    onClick={() => setSelectedPreviewImage(formatImagePath(movie.image))}
                                    style={{ position: 'relative', height: isMobile ? '300px' : '400px', cursor: 'pointer', overflow: 'hidden' }}
                                >
                                    <motion.img
                                        whileHover={{ scale: 1.05 }}
                                        src={formatImagePath(movie.image)}
                                        alt={movie.name}
                                        onError={handleImageError}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        background: 'rgba(0,0,0,0.8)',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--primary)',
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        color: 'var(--primary)',
                                        backdropFilter: 'blur(5px)'
                                    }}>
                                        {movie.quality || '4K'}
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: '2rem 1rem 1rem',
                                        background: 'linear-gradient(to top, var(--surface), transparent)'
                                    }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'rgba(111, 66, 193, 0.2)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                                                {movie.genre}
                                            </span>
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem' }}>{movie.name}</h3>
                                    </div>
                                </div>

                                {/* Content */}
                                <div style={{ padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Clock size={14} /> {movie.duration || '2h 15m'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <HardDrive size={14} />
                                            {movie.size720 && movie.size1080 ? (
                                                <span style={{ fontSize: '0.85rem' }}>{movie.size720} | {movie.size1080}</span>
                                            ) : (
                                                movie.size || '4.2 GB'
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', minHeight: '45px' }}>
                                        <AnimatePresence mode="wait">
                                            {activeDownloadId === movie.id ? (
                                                <motion.div
                                                    key={activeQuality ? 'platforms' : 'qualities'}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    style={{ display: 'flex', gap: '0.4rem', flex: 1, width: '100%' }}
                                                >
                                                    {activeQuality === null ? (
                                                        <>
                                                            {(() => {
                                                                const has720 = (movie.downloadLink720 && movie.downloadLink720 !== '#') || (movie.telegramLink720 && movie.telegramLink720 !== '#');
                                                                const has1080 = (movie.downloadLink1080 && movie.downloadLink1080 !== '#') || (movie.telegramLink1080 && movie.telegramLink1080 !== '#');

                                                                return (
                                                                    <>
                                                                        <button
                                                                            onClick={() => setActiveQuality('720')}
                                                                            className="btn"
                                                                            style={{
                                                                                flex: 2,
                                                                                justifyContent: 'center',
                                                                                fontSize: '0.85rem',
                                                                                padding: '0.4rem',
                                                                                background: has720 ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                                                color: has720 ? 'black' : 'var(--text-muted)',
                                                                                opacity: has720 ? 1 : 0.5,
                                                                                pointerEvents: has720 ? 'auto' : 'none'
                                                                            }}
                                                                        >
                                                                            720p
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setActiveQuality('1080')}
                                                                            className="btn"
                                                                            style={{
                                                                                flex: 2,
                                                                                justifyContent: 'center',
                                                                                fontSize: '0.85rem',
                                                                                padding: '0.4rem',
                                                                                background: has1080 ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                                                color: has1080 ? 'black' : 'var(--text-muted)',
                                                                                opacity: has1080 ? 1 : 0.5,
                                                                                pointerEvents: has1080 ? 'auto' : 'none'
                                                                            }}
                                                                        >
                                                                            1080p
                                                                        </button>
                                                                    </>
                                                                );
                                                            })()}
                                                            <button
                                                                onClick={() => { setActiveDownloadId(null); setActiveQuality(null); }}
                                                                className="btn"
                                                                style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem', flex: 1, justifyContent: 'center' }}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {(() => {
                                                                const directLink = activeQuality === '720' ? movie.downloadLink720 : movie.downloadLink1080;
                                                                const telegramLink = activeQuality === '720' ? movie.telegramLink720 : movie.telegramLink1080;
                                                                const hasDirect = directLink && directLink !== '#';
                                                                const hasTelegram = telegramLink && telegramLink !== '#';

                                                                return (
                                                                    <>
                                                                        <a
                                                                            href={hasDirect ? directLink : undefined}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="btn"
                                                                            style={{
                                                                                flex: 3,
                                                                                justifyContent: 'center',
                                                                                fontSize: '0.75rem',
                                                                                padding: '0.4rem',
                                                                                whiteSpace: 'nowrap',
                                                                                background: hasDirect ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                                                color: hasDirect ? 'black' : 'var(--text-muted)',
                                                                                opacity: hasDirect ? 1 : 0.5,
                                                                                pointerEvents: hasDirect ? 'auto' : 'none'
                                                                            }}
                                                                        >
                                                                            Direct
                                                                        </a>
                                                                        <a
                                                                            href={hasTelegram ? telegramLink : undefined}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="btn"
                                                                            style={{
                                                                                flex: 3,
                                                                                justifyContent: 'center',
                                                                                fontSize: '0.75rem',
                                                                                padding: '0.4rem',
                                                                                whiteSpace: 'nowrap',
                                                                                background: hasTelegram ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                                                color: hasTelegram ? 'black' : 'var(--text-muted)',
                                                                                opacity: hasTelegram ? 1 : 0.5,
                                                                                pointerEvents: hasTelegram ? 'auto' : 'none'
                                                                            }}
                                                                        >
                                                                            Telegram
                                                                        </a>
                                                                    </>
                                                                );
                                                            })()}
                                                            <button
                                                                onClick={() => setActiveQuality(null)}
                                                                className="btn"
                                                                style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem', flex: 1, justifyContent: 'center' }}
                                                            >
                                                                <Filter size={14} style={{ transform: 'rotate(180deg)' }} />
                                                            </button>
                                                        </>
                                                    )}
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="button"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    style={{ display: 'flex', gap: '1rem', flex: 1, width: '100%' }}
                                                >
                                                    <button
                                                        onClick={() => { setActiveDownloadId(movie.id); setActiveQuality(null); }}
                                                        className="btn btn-primary"
                                                        style={{ flex: 1, justifyContent: 'center' }}
                                                    >
                                                        <Download size={18} /> Download
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredMovies.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '5rem' }}>
                        <Monitor size={64} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.3 }} />
                        <h2 style={{ color: 'var(--text-muted)' }}>No movies found in this sector.</h2>
                        <button onClick={() => { setSearchQuery(''); setSelectedGenre('All'); }} className="btn" style={{ marginTop: '1rem' }}>Clear Filters</button>
                    </div>
                )}
            </main>

            {/* Security Footer */}
            <footer style={{ padding: '4rem 2rem', background: 'var(--surface)', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--success)' }}>
                    <ShieldCheck size={20} />
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.2em' }}>ENCRYPTED DOWNLOAD LINK PROTECTION ACTIVE</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>© 2026 SHINE TECH DIGITAL ARCHIVE. All rights reserved.</p>
            </footer>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {selectedPreviewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedPreviewImage(null)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 2000,
                            background: 'rgba(0,0,0,0.9)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 'min(2rem, 5vw)',
                            cursor: 'zoom-out'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: 'relative',
                                maxWidth: '90vw',
                                maxHeight: '90vh',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                border: '1px solid var(--glass-border)',
                                boxShadow: '0 0 50px rgba(0,0,0,0.5), 0 0 30px var(--primary-glow)',
                                cursor: 'default'
                            }}
                        >
                            <img
                                src={selectedPreviewImage}
                                alt="Preview"
                                onError={handleImageError}
                                style={{
                                    display: 'block',
                                    maxWidth: '100%',
                                    maxHeight: '90vh',
                                    objectFit: 'contain'
                                }}
                            />
                            <button
                                onClick={() => setSelectedPreviewImage(null)}
                                style={{
                                    position: 'absolute',
                                    top: '1.5rem',
                                    right: '1.5rem',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'white',
                                    padding: '0.8rem',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(5px)',
                                    transition: 'all 0.3s'
                                }}
                                className="hover-glow"
                            >
                                <X size={24} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <footer style={{ marginTop: '4rem', padding: '3rem 2rem', borderTop: '1px solid var(--glass-border)', textAlign: 'center', background: 'rgba(0,0,0,0.3)' }}>
                <VisitorCounter />
                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '0.8rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <Smartphone size={20} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.2rem' }} className="neon-text">SHINE TECH</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>© 2026 High-Security Commerce System. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Movies;
