import React, { useState, useEffect } from 'react';
import { Smartphone, ShoppingBag, ArrowRight, Play, Star, ShieldCheck, ChevronLeft, ChevronRight, X, Maximize2, Trash2, Plus, Minus, ShoppingCart, MessageCircle, MapPin, Eye, CheckCircle2, User, Mail, Send, Clock, Headphones, BatteryCharging, Cable, Shield, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useInventory } from '../context/InventoryContext';
import Navbar from '../components/Navbar';
import VisitorCounter from '../components/VisitorCounter';
import { formatPrice } from '../utils/formatUtils';
import { formatImagePath } from '../utils/urlUtils';

const Shop = ({ currentView, setCurrentView, isCartOpen, setIsCartOpen }) => {
    const { addToCart, cartItems, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart } = useCart();
    const { products, movies = [], addOrder, loading } = useInventory();
    
    const handleImageError = (e, type = 'product') => {
        e.target.src = type === 'movie' 
            ? 'https://placehold.co/600x900/1a1a1a/ffffff?text=Poster+Coming+Soon'
            : 'https://placehold.co/600x600/1a1a1a/ffffff?text=Image+Coming+Soon';
        e.target.onerror = null; // Prevent infinite loop
    };

    const location = useLocation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeSubCategory, setActiveSubCategory] = useState('All');
    const staticCategories = [
        { title: "Audio & Sounds", icon: <Headphones size={24} />, image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=400" },
        { title: "Battery & Capacity", icon: <BatteryCharging size={24} />, image: "https://images.unsplash.com/photo-16104924ec985-b145c7d0de0f?q=80&w=400" },
        { title: "Cables & Adapters", icon: <Cable size={24} />, image: "https://images.unsplash.com/photo-1610945415295-d9baf0602581?q=80&w=400" },
        { title: "Case & Protection", icon: <Shield size={24} />, image: "https://images.unsplash.com/photo-1544816153-12ad5d714b21?q=80&w=400" },
        { title: "Data & Storage", icon: <Monitor size={24} />, image: "https://images.unsplash.com/photo-1562976540-1502c2145186?q=80&w=400" },
        { title: "Wearables & Trackers", icon: <User size={24} />, image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=400" },
        { title: "Projectors", icon: <Maximize2 size={24} />, image: "https://images.unsplash.com/photo-1535016120720-40c646bebbd6?q=80&w=400" }
    ];

    // Derive categories from actual products + static definitions
    const dynamicCategories = Array.from(new Set(products.map(p => p.category)))
        .filter(Boolean)
        .map(catTitle => {
            const staticDef = staticCategories.find(c => c.title === catTitle);
            return staticDef || { title: catTitle, image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400" };
        });

    // Fallback if products haven't loaded yet to show the list
    const categoryList = dynamicCategories.length > 0 ? dynamicCategories : staticCategories;

    // Derive ranked products dynamically from the inventory
    const getRankedProducts = () => {
        const sortedByRating = [...products].sort((a, b) => (b.rating || 5) - (a.rating || 5));
        const onSale = products.filter(p => p.oldPrice || p.price < (p.originalPrice || p.price));
        
        return {
            topRated: products.filter(p => p.isStarred).slice(0, 3).length > 0 
                ? products.filter(p => p.isStarred).slice(0, 3) 
                : sortedByRating.slice(0, 3),
            bestSelling: sortedByRating.slice(3, 6), // Approximation
            onSale: onSale.length > 0 ? onSale.slice(0, 3) : products.filter(p => p.stock > 0).slice(0, 3)
        };
    };

    const dynamicRankedProducts = getRankedProducts();

    const carouselSlides = [
        {
            id: 1,
            title: "Premium Protection",
            subtitle: "Luxury Leather Series.",
            description: "Experience the ultimate touch of class with our hand-crafted Italian leather cases.",
            image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=60&w=1200",
            accent: "var(--primary)"
        },
        {
            id: 2,
            title: "Charging Redefined",
            subtitle: "3-in-1 Wireless Hub.",
            description: "Power your ecosystem with our sleek, high-speed magnetic charging stations.",
            image: "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?q=60&w=1200",
            accent: "var(--accent)"
        },
        {
            id: 3,
            title: "Audio Perfection",
            subtitle: "Crystal Clear Acoustics.",
            description: "Immerse yourself in high-fidelity sound with our premium wireless earbud collection.",
            image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=60&w=1200",
            accent: "var(--primary-glow)"
        },
        {
            id: 4,
            title: "MagSafe Collection",
            subtitle: "Magnetic Elegance.",
            description: "Discover our full range of magnetic wallets, mounts, and accessories for the modern explorer.",
            image: "https://images.unsplash.com/photo-1629131726692-1accd0c93ce0?q=60&w=1200",
            accent: "var(--success)"
        },
        {
            id: 5,
            title: "Kingston Technology",
            subtitle: "Performance Unleashed.",
            description: "Industry-leading SSDs, memory, and flash storage solutions for ultimate speed and reliability.",
            image: formatImagePath('kingston-slide.jpg'),
            accent: "#c8102e"
        }
    ];

    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [activeDetailImage, setActiveDetailImage] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // Checkout States
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '', note: '' });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            setActiveDetailImage(selectedProduct.image);
        }
    }, [selectedProduct]);

    // Product Detail Auto-Slide (every 4 seconds)
    useEffect(() => {
        let interval;
        if (selectedProduct && selectedProduct.detailImages && selectedProduct.detailImages.length > 0) {
            const allImages = [selectedProduct.image, ...selectedProduct.detailImages];
            interval = setInterval(() => {
                setActiveDetailImage(current => {
                    const currentIndex = allImages.indexOf(current);
                    const nextIndex = (currentIndex + 1) % allImages.length;
                    return allImages[nextIndex];
                });
            }, 4000);
        }
        return () => clearInterval(interval);
    }, [selectedProduct]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Prioritize Starred Products for Home View
    const getHomeProducts = () => {
        // STRICT: Only show what the user has starred. If nothing is starred, show nothing (or empty state).
        return products.filter(p => p.isStarred);
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
        const matchesSubCategory = activeSubCategory === 'All' || product.subCategory === activeSubCategory;
        return matchesSearch && matchesCategory && matchesSubCategory;
    });

    const displayProducts = currentView === 'home' ? getHomeProducts() : filteredProducts;
    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);

    const handleCheckoutSubmit = async (e) => {
        e.preventDefault();
        if (cartItems.length === 0) return;

        try {
            setIsSubmittingOrder(true);
            const orderId = await addOrder({
                customer: customerInfo,
                items: cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image
                })),
                total: cartTotal,
                itemCount: cartCount
            });

            clearCart();
            setIsCheckoutOpen(false);
            setCustomerInfo({ name: '', phone: '', address: '', note: '' });
            alert(`✅ Order Placed Successfully!\nOrder ID: #${orderId.slice(-6).toUpperCase()}\nWe will contact you shortly via WhatsApp.`);
        } catch (error) {
            console.error("Order failed:", error);
            alert("❌ Failed to place order. Please check your connection.");
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    const StarRating = ({ rating = 5 }) => (
        <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    size={14}
                    fill={s <= rating ? "#FFD700" : "none"}
                    color={s <= rating ? "#FFD700" : "rgba(255,255,255,0.2)"}
                />
            ))}
        </div>
    );

    return (
        <div style={{ background: 'var(--background)', color: 'white', minHeight: '100vh', position: 'relative' }}>
            {/* Navbar is now in App.jsx */}

            {/* Hero Carousel - Only on Home */}
            <AnimatePresence>
                {currentView === 'home' && (
                    <motion.section
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'min(600px, 80vh)', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ position: 'relative', overflow: 'hidden', background: '#000' }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                style={{ height: '100%', width: '100%', position: 'relative' }}
                            >
                                {/* Background Image */}
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: carouselSlides[currentSlide].bg || 'black'
                                }}>
                                    <img
                                        src={carouselSlides[currentSlide].image}
                                        alt={carouselSlides[currentSlide].title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: carouselSlides[currentSlide].fit || 'cover',
                                            filter: carouselSlides[currentSlide].brightness === 'none'
                                                ? 'none'
                                                : 'brightness(0.4) contrast(1.1)',
                                            objectPosition: 'center right',
                                            padding: carouselSlides[currentSlide].fit === 'contain' ? '2rem' : '0'
                                        }}
                                    />
                                </div>

                                {/* Gradient Overlay - Conditional */}
                                {carouselSlides[currentSlide].theme !== 'light' && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 100%)',
                                        zIndex: 1,
                                        pointerEvents: 'none'
                                    }} />
                                )}

                                <div style={{
                                    position: 'relative',
                                    zIndex: 2,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    padding: '0 min(4rem, 5vw)',
                                    maxWidth: '800px',
                                    pointerEvents: 'none'
                                }}>
                                    <motion.span
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        style={{
                                            color: carouselSlides[currentSlide].accent,
                                            fontWeight: '800',
                                            letterSpacing: '2px',
                                            fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
                                            marginBottom: '0.5rem'
                                        }}
                                    >
                                        PREMIUM COLLECTION
                                    </motion.span>
                                    <motion.h2
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        style={{
                                            fontSize: 'clamp(2rem, 10vw, 4rem)',
                                            marginBottom: '0.5rem',
                                            lineHeight: '1.1',
                                            color: carouselSlides[currentSlide].theme === 'light' ? '#000' : '#fff'
                                        }}
                                    >
                                        {carouselSlides[currentSlide].title}
                                    </motion.h2>
                                    <motion.h3
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        style={{
                                            fontSize: 'clamp(1.2rem, 5vw, 2rem)',
                                            marginBottom: '0.8rem',
                                            opacity: 0.9,
                                            color: carouselSlides[currentSlide].theme === 'light' ? '#333' : '#fff'
                                        }}
                                        className={carouselSlides[currentSlide].theme === 'light' ? '' : 'neon-text'}
                                    >
                                        {carouselSlides[currentSlide].subtitle}
                                    </motion.h3>
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        style={{
                                            color: carouselSlides[currentSlide].theme === 'light' ? '#555' : 'var(--text-muted)',
                                            fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
                                            marginBottom: '1.5rem',
                                            maxWidth: '500px'
                                        }}
                                    >
                                        {carouselSlides[currentSlide].description}
                                    </motion.p>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.7 }}
                                        style={{ pointerEvents: 'auto' }}
                                    >
                                        <button className="btn btn-primary" style={{ padding: '0.8rem 1.8rem', fontSize: '0.9rem' }}>
                                            EXPLORE NOW <ArrowRight size={18} />
                                        </button>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Carousel Controls */}
                        <button onClick={prevSlide} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '1rem', color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                            <ChevronLeft size={24} />
                        </button>
                        <button onClick={nextSlide} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '1rem', color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                            <ChevronRight size={24} />
                        </button>

                        {/* Pagination Dots */}
                        <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '1rem' }}>
                            {carouselSlides.map((_, index) => (
                                <div
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    style={{
                                        width: index === currentSlide ? '40px' : '12px',
                                        height: '12px',
                                        borderRadius: '6px',
                                        background: index === currentSlide ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: index === currentSlide ? '0 0 10px var(--primary-glow)' : 'none'
                                    }}
                                />
                            ))}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* Featured Categories - Only on Home */}
            {currentView === 'home' && (
                <section className="shop-section" style={{ padding: '4rem min(2rem, 4vw)', maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 className="section-title" style={{ marginBottom: '2.5rem', textAlign: 'center', fontSize: 'clamp(1.8rem, 5vw, 2.5rem)' }}>Featured <span className="neon-text">Categories</span></h2>
                    <div className="category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: '1rem' }}>
                        {categoryList.map((cat, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ scale: 1.02 }}
                                className="glass-card"
                                style={{ display: 'flex', padding: '1.2rem', gap: '1rem', alignItems: 'center' }}
                            >
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{cat.title}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Explore latest tech gear.</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setActiveCategory(cat.title);
                                            setCurrentView('shop');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}
                                    >
                                        Shop All <ArrowRight size={14} />
                                    </button>
                                </div>
                                <img src={cat.image} alt={cat.title} style={{ width: 'clamp(80px, 20vw, 100px)', height: '100px', objectFit: 'contain', opacity: 0.8 }} />
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Product Grid / Full Catalog */}
            <main className="shop-section" style={{ padding: '4rem min(2rem, 4vw)', maxWidth: '1200px', margin: '0 auto' }}>
                {(currentView !== 'home' || displayProducts.length > 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem' }}>
                        <h2 className="section-title" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginBottom: '1rem', textAlign: 'center' }}>
                            {currentView === 'home' ? 'Top' : 'Smart'} <span className="neon-text">{currentView === 'home' ? 'Products' : 'Catalog'}</span>
                        </h2>
                    </div>
                )}

                {currentView === 'shop' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}
                    >
                        {/* Search Bar */}
                        <div style={{ position: 'relative', width: '100%' }}>
                            <Smartphone style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={20} />
                            <input
                                type="text"
                                placeholder="Search gear..."
                                className="btn"
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '0.8rem 1rem 0.8rem 3.5rem',
                                    textAlign: 'left',
                                    fontSize: '1rem',
                                    borderRadius: '12px'
                                }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Category Quick Filters */}
                        <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', padding: '0.5rem 0', marginBottom: '1rem' }} className="hide-scrollbar mobile-container">
                            {['All', ...categoryList.map(c => c.title)].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        setActiveCategory(cat);
                                        setActiveSubCategory('All');
                                    }}
                                    className="glass-card"
                                    style={{
                                        padding: '0.6rem 1.2rem',
                                        whiteSpace: 'nowrap',
                                        background: activeCategory === cat ? 'var(--primary)' : 'var(--glass)',
                                        borderColor: activeCategory === cat ? 'var(--primary)' : 'var(--glass-border)',
                                        color: activeCategory === cat ? 'black' : 'white',
                                        fontWeight: '700',
                                        fontSize: '0.9rem',
                                        justifyContent: 'center',
                                        borderRadius: '12px'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Data & Storage Sub-Filters */}
                        <AnimatePresence>
                            {activeCategory === 'Data & Storage' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}
                                    className="hide-scrollbar"
                                >
                                    {['All', 'Flash Drives', 'SD Cards', 'OTG'].map(sub => (
                                        <button
                                            key={sub}
                                            onClick={() => setActiveSubCategory(sub)}
                                            style={{
                                                padding: '0.4rem 1rem',
                                                fontSize: '0.75rem',
                                                borderRadius: '8px',
                                                background: activeSubCategory === sub ? 'rgba(0, 102, 255, 0.2)' : 'transparent',
                                                border: `1px solid ${activeSubCategory === sub ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                                                color: activeSubCategory === sub ? 'var(--primary)' : 'var(--text-muted)',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {sub.toUpperCase()}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '2rem' }}>
                    {loading && products.length === 0 ? (
                        [...Array(8)].map((_, i) => (
                            <div key={i} className="glass-card shimmer" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: '300px', background: 'rgba(255,255,255,0.05)' }} />
                                <div style={{ padding: '1.5rem', flex: 1 }}>
                                    <div style={{ height: '14px', width: '40%', background: 'rgba(255,255,255,0.05)', marginBottom: '10px' }} />
                                    <div style={{ height: '18px', width: '80%', background: 'rgba(255,255,255,0.05)', marginBottom: '15px' }} />
                                    <div style={{ height: '30px', width: '100%', background: 'rgba(255,255,255,0.05)' }} />
                                </div>
                            </div>
                        ))
                    ) : displayProducts.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed var(--glass-border)' }}>
                            <Smartphone size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <h3 style={{ color: 'var(--text-muted)' }}>No gear found in this category.</h3>
                            <button onClick={() => { setActiveCategory('All'); setSearchQuery(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', marginTop: '1rem', cursor: 'pointer' }}>
                                View All Products
                            </button>
                        </div>
                    ) : displayProducts.map(product => (
                        <motion.div
                            key={product.id}
                            whileHover={{ y: -10 }}
                            className="glass-card"
                            style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                            onClick={() => setSelectedProduct(product)}
                        >
                            <div className="product-card-image" style={{ position: 'relative', overflow: 'hidden', height: '300px' }}>
                                <img 
    src={formatImagePath(product.image)} 
    alt={product.name} 
    onError={(e) => handleImageError(e, 'product')}
    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
/>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileHover={{ opacity: 1 }}
                                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                                >
                                    <div style={{ background: 'var(--primary)', color: 'black', borderRadius: '50%', padding: '0.8rem', display: 'flex', boxShadow: '0 0 20px var(--primary-glow)' }}>
                                        <Eye size={24} />
                                    </div>
                                </motion.div>
                            </div>
                            <div className="product-card-info" style={{ padding: '1.5rem' }}>
                                <span style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '800' }}>{product.brand.toUpperCase()}</span>
                                <h3 style={{ margin: '0.5rem 0' }}>{product.name}</h3>
                                <div style={{ marginBottom: '0.8rem' }}>
                                    <StarRating rating={product.rating} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>{formatPrice(product.price)}</span>
                                    <button
                                        className="btn btn-primary"
                                        style={{
                                            padding: '0.6rem',
                                            opacity: product.stock > 0 ? 1 : 0.5,
                                            pointerEvents: product.stock > 0 ? 'auto' : 'none',
                                            background: product.stock > 0 ? 'var(--primary)' : 'var(--text-muted)'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (product.stock > 0) {
                                                addToCart(product);
                                                setIsCartOpen(true);
                                            }
                                        }}
                                    >
                                        <ShoppingBag size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {
                    currentView === 'home' && (
                        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                            <button
                                className="btn btn-primary"
                                style={{ padding: '1.2rem 3rem', fontSize: '1.1rem' }}
                                onClick={() => {
                                    setCurrentView('shop');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            >
                                VIEW FULL CATALOG <ArrowRight size={20} />
                            </button>
                        </div>
                    )
                }
            </main >

            {/* Cinema Archive Preview - Only on Home */}
            {
                currentView === 'home' && (
                    <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', marginBottom: '4rem', border: '1px solid var(--glass-border)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                            <h2 className="section-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Latest <span className="neon-text">Cinema Archive</span></h2>
                            <p style={{ color: 'var(--text-muted)' }}>Premium movie downloads in 4K Ultra HD</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
                            {movies.filter(m => m.isStarred).slice(0, 4).map((movie, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -5 }}
                                    className="glass-card"
                                    style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                                    onClick={() => navigate('/movies')}
                                >
                                    <div style={{ height: '350px', position: 'relative' }}>
                                        <img 
    src={formatImagePath(movie.image)} 
    alt={movie.name} 
    onError={(e) => handleImageError(e, 'movie')}
    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
/>
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem 1rem 1rem', background: 'linear-gradient(to top, var(--surface), transparent)' }}>
                                            <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{movie.name}</h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>{movie.quality}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                            <Link to="/movies" className="btn btn-primary" style={{ padding: '1rem 2.5rem', textDecoration: 'none' }}>
                                BROWSE FULL ARCHIVE <Play size={18} style={{ marginLeft: '0.5rem' }} />
                            </Link>
                        </div>
                    </section>
                )
            }

            {/* Ranked Lists - Only on Home */}
            {
                currentView === 'home' && (
                    <section style={{ padding: '4rem min(2.5rem, 5vw)', maxWidth: '1200px', margin: '0 auto', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', marginBottom: '4rem', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                            <div>
                                <h2 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '0.8rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <Star size={24} color="var(--primary)" /> Top Rated
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {dynamicRankedProducts.topRated.map((p, idx) => (
                                        <div key={idx} className="hover-lift" style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', cursor: 'pointer' }} onClick={() => setSelectedProduct(p)}>
                                            <div style={{ width: '80px', height: '80px', position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'var(--surface)' }}>
                                                <img 
    src={formatImagePath(p.image)} 
    alt={p.name} 
    onError={(e) => handleImageError(e, 'product')}
    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
/>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ fontSize: '1rem', marginBottom: '0.3rem', color: 'white' }}>{p.name}</h4>
                                                <div style={{ marginBottom: '0.4rem' }}>
                                                    <StarRating rating={p.rating} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.1rem' }}>{formatPrice(p.price)}</span>
                                                    {p.oldPrice && <span style={{ opacity: 0.5, textDecoration: 'line-through', fontSize: '0.85rem' }}>{formatPrice(p.oldPrice)}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h2 style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '0.8rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <ShoppingBag size={24} color="var(--accent)" /> Best Selling
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {dynamicRankedProducts.bestSelling.map((p, idx) => (
                                        <div key={idx} className="hover-lift" style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', cursor: 'pointer' }} onClick={() => setSelectedProduct(p)}>
                                            <div style={{ width: '80px', height: '80px', position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'var(--surface)' }}>
                                                <img 
    src={formatImagePath(p.image)} 
    alt={p.name} 
    onError={(e) => handleImageError(e, 'product')}
    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
/>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ fontSize: '1rem', marginBottom: '0.3rem', color: 'white' }}>{p.name}</h4>
                                                <div style={{ marginBottom: '0.4rem' }}>
                                                    <StarRating rating={p.rating} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: '900', color: 'var(--accent)', fontSize: '1.1rem' }}>{formatPrice(p.price)}</span>
                                                    {p.oldPrice && <span style={{ opacity: 0.5, textDecoration: 'line-through', fontSize: '0.85rem' }}>{formatPrice(p.oldPrice)}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h2 style={{ borderBottom: '2px solid var(--success)', paddingBottom: '0.8rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <ShieldCheck size={24} color="var(--success)" /> On Sale
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {dynamicRankedProducts.onSale.map((p, idx) => (
                                        <div key={idx} className="hover-lift" style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', cursor: 'pointer' }} onClick={() => setSelectedProduct(p)}>
                                            <div style={{ width: '80px', height: '80px', position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'var(--surface)' }}>
                                                <img 
    src={formatImagePath(p.image)} 
    alt={p.name} 
    onError={(e) => handleImageError(e, 'product')}
    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
/>
                                                <div style={{ position: 'absolute', top: 5, left: 5, background: 'var(--success)', color: 'black', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '900' }}>
                                                    SALE
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ fontSize: '1rem', marginBottom: '0.3rem', color: 'white' }}>{p.name}</h4>
                                                <div style={{ marginBottom: '0.4rem' }}>
                                                    <StarRating rating={p.rating} />
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: '900', color: 'var(--success)', fontSize: '1.1rem' }}>{formatPrice(p.price)}</span>
                                                    {p.oldPrice && <span style={{ opacity: 0.5, textDecoration: 'line-through', fontSize: '0.85rem' }}>{formatPrice(p.oldPrice)}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )
            }
            {/* Cart Sidebar */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000 }}
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
                                width: '100%',
                                maxWidth: '400px',
                                background: 'var(--surface)',
                                zIndex: 1001,
                                display: 'flex',
                                flexDirection: 'column',
                                borderLeft: '1px solid var(--glass-border)',
                                boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <ShoppingCart color="var(--primary)" size={24} />
                                    <h2 style={{ fontSize: '1.2rem' }}>Your Cart</h2>
                                </div>
                                <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                                {cartItems.length === 0 ? (
                                    <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                                        <ShoppingBag size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                        <p>Your cart is empty</p>
                                        <button onClick={() => setIsCartOpen(false)} className="btn btn-primary" style={{ marginTop: '1.5rem', padding: '0.8rem 1.5rem' }}>
                                            Go Shopping
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {cartItems.map(item => (
                                            <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <img src={item.image} alt={item.name} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px' }} />
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ fontSize: '1rem', margin: 0 }}>{item.name}</h4>
                                                    <p style={{ color: 'var(--primary)', fontWeight: '700', margin: '0.2rem 0', fontSize: '0.9rem' }}>{formatPrice(item.price)}</p>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.5rem' }}>
                                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', borderRadius: '4px', padding: '2px' }}>
                                                            <Minus size={14} />
                                                        </button>
                                                        <span style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', borderRadius: '4px', padding: '2px' }}>
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {cartItems.length > 0 && (
                                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Total</span>
                                        <span style={{ fontSize: '1.3rem', fontWeight: '800' }}>{formatPrice(cartTotal)}</span>
                                    </div>
                                    <button 
                                        onClick={() => setIsCheckoutOpen(true)}
                                        className="btn btn-primary" 
                                        style={{ width: '100%', padding: '1.2rem', fontSize: '1rem', fontWeight: '700' }}
                                    >
                                        CHECKOUT NOW
                                    </button>
                                    <button onClick={clearCart} style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}>
                                        Clear Cart
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Checkout Modal */}
            <AnimatePresence>
                {isCheckoutOpen && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 4000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem'
                    }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCheckoutOpen(false)}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.85)',
                                backdropFilter: 'blur(10px)'
                            }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '500px',
                                background: 'var(--surface)',
                                borderRadius: '24px',
                                border: '1px solid var(--glass-border)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                                zIndex: 1
                            }}
                        >
                            <div style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Complete Order</h3>
                                <button onClick={() => setIsCheckoutOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            
                            <form onSubmit={handleCheckoutSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Name</label>
                                    <input 
                                        required
                                        type="text"
                                        placeholder="Your full name"
                                        value={customerInfo.name}
                                        onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.8rem', borderRadius: '8px', outline: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>WhatsApp Phone Number</label>
                                    <input 
                                        required
                                        type="tel"
                                        placeholder="e.g. +94 77 123 4567"
                                        value={customerInfo.phone}
                                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.8rem', borderRadius: '8px', outline: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Delivery Address</label>
                                    <textarea 
                                        required
                                        placeholder="Full address for delivery"
                                        value={customerInfo.address}
                                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.8rem', borderRadius: '8px', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Note (Optional)</label>
                                    <input 
                                        type="text"
                                        placeholder="Anything else we should know?"
                                        value={customerInfo.note}
                                        onChange={(e) => setCustomerInfo({...customerInfo, note: e.target.value})}
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.8rem', borderRadius: '8px', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ marginTop: '1rem', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Total Amount</span>
                                        <span style={{ fontWeight: '800', color: 'var(--primary)' }}>{formatPrice(cartTotal)}</span>
                                    </div>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>Payment method: Cash on Delivery / Bank Transfer</p>
                                </div>

                                <button 
                                    className="btn btn-primary" 
                                    disabled={isSubmittingOrder}
                                    style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', fontWeight: '800', marginTop: '1rem', opacity: isSubmittingOrder ? 0.7 : 1 }}
                                >
                                    {isSubmittingOrder ? 'PLACING ORDER...' : 'PLACE ORDER'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Product Detail Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 3000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        pointerEvents: 'auto'
                    }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.92)',
                                backdropFilter: 'blur(15px)',
                                cursor: 'zoom-out'
                            }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '1100px',
                                maxHeight: '95vh',
                                background: 'var(--surface)',
                                borderRadius: '24px',
                                border: '1px solid var(--glass-border)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 40px 100px rgba(0,0,0,1)',
                                zIndex: 1,
                                margin: 'auto'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                width: '100%',
                                overflowY: 'auto'
                            }}>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', padding: '0.6rem', cursor: 'pointer', zIndex: 10, display: 'flex' }}
                                >
                                    <X size={20} />
                                </button>

                                <div style={{
                                    flex: isMobile ? 'none' : '1.3',
                                    height: isMobile ? '350px' : 'auto',
                                    background: 'var(--surface-brighter)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '1.5rem',
                                    padding: '2rem'
                                }}>
                                    <div style={{ width: '100%', height: isMobile ? '350px' : '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <motion.img
    key={activeDetailImage}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    src={formatImagePath(activeDetailImage)}
    alt={selectedProduct.name}
    onError={(e) => handleImageError(e, 'product')}
    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
/>
                                    </div>

                                    {selectedProduct.detailImages && selectedProduct.detailImages.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                            {[selectedProduct.image, ...selectedProduct.detailImages].map((img, i) => (
                                                <motion.div
                                                    key={i}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setActiveDetailImage(img)}
                                                    style={{
                                                        width: '50px',
                                                        height: '50px',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        cursor: 'pointer',
                                                        border: `2px solid ${activeDetailImage === img ? 'var(--primary)' : 'var(--glass-border)'}`,
                                                        background: 'var(--surface)'
                                                    }}
                                                >
                                                    <img 
    src={formatImagePath(img)} 
    alt="detail" 
    onError={(e) => handleImageError(e, 'product')}
    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
/>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{
                                    flex: 1,
                                    padding: 'clamp(1.5rem, 5vw, 4rem)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    background: 'var(--surface)'
                                }}>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                            <span style={{ color: 'var(--primary)', fontWeight: '900', letterSpacing: '2px', fontSize: '0.65rem', textTransform: 'uppercase' }}>{selectedProduct.brand}</span>
                                            <div style={{ height: '1px', flex: 1, background: 'linear-gradient(to right, var(--primary), transparent)', opacity: 0.1 }} />
                                        </div>
                                        <h2 style={{ fontSize: 'clamp(1.8rem, 8vw, 3.5rem)', fontWeight: '900', marginBottom: '1.5rem', lineHeight: '1.1', color: 'white' }}>{selectedProduct.name}</h2>

                                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                                            <div style={{ minWidth: '120px' }}>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>Unit Price</p>
                                                <p style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--primary)' }}>{formatPrice(selectedProduct.price)}</p>
                                            </div>
                                            <div style={{ width: '1px', background: 'var(--glass-border)', display: isMobile && window.innerWidth < 480 ? 'none' : 'block' }} />
                                            <div>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>Rating</p>
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <StarRating rating={selectedProduct.rating} />
                                                </div>
                                            </div>
                                            <div style={{ width: '1px', background: 'var(--glass-border)', display: isMobile && window.innerWidth < 480 ? 'none' : 'block' }} />
                                            <div>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>Inventory Status</p>
                                                <p style={{ fontSize: '1rem', fontWeight: '800', color: selectedProduct.stock > 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {selectedProduct.stock > 0 ? <CheckCircle2 size={18} /> : <X size={18} />}
                                                    {selectedProduct.stock > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '2rem' }}>
                                            <h4 style={{ fontSize: '1rem', marginBottom: '0.8rem', color: 'white', fontWeight: '800', letterSpacing: '1px' }}>DESCRIPTION</h4>
                                            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>{selectedProduct.description || 'Engineered for absolute performance and reliability. Unmatched quality for your tech ecosystem.'}</p>
                                        </div>

                                        {selectedProduct.specs && selectedProduct.specs.length > 0 && (
                                            <div style={{ marginBottom: '2rem' }}>
                                                <h4 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'white', fontWeight: '800', letterSpacing: '1px' }}>KEY SPECS</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
                                                    {selectedProduct.specs.map((spec, i) => (
                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)' }} />
                                                            {spec}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                                        <button
                                            className="btn btn-primary"
                                            disabled={selectedProduct.stock <= 0}
                                            style={{
                                                flex: 1,
                                                padding: '1.2rem',
                                                justifyContent: 'center',
                                                borderRadius: '16px',
                                                fontSize: '1.1rem',
                                                fontWeight: '800',
                                                gap: '0.8rem',
                                                opacity: selectedProduct.stock > 0 ? 1 : 0.5,
                                                cursor: selectedProduct.stock > 0 ? 'pointer' : 'not-allowed',
                                                background: selectedProduct.stock > 0 ? 'var(--primary)' : 'var(--text-muted)'
                                            }}
                                            onClick={() => {
                                                if (selectedProduct.stock > 0) {
                                                    addToCart(selectedProduct);
                                                    setIsCartOpen(true);
                                                    setSelectedProduct(null);
                                                }
                                            }}
                                        >
                                            <ShoppingBag size={22} /> {selectedProduct.stock > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Contact Us Section */}
            <section id="contact" style={{ padding: '4rem min(2rem, 5vw)', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <h2 style={{ fontSize: 'clamp(2.5rem, 8vw, 3.5rem)', fontWeight: '800', marginBottom: '2.5rem', color: 'white' }}>Contact <span className="neon-text">Us</span></h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', alignItems: 'center' }}>
                        {[
                            { label: 'Address', value: '368/4 , Baseline Road , Dematagoda , Colombo 09' },
                            { label: 'Phone', value: '+94 70 753 3476' },
                            { label: 'E-mail', value: 'shinetech@gmail.com' },
                            { label: 'Hours', value: '7:00 AM – 07:00 PM, Everyday' }
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem', justifyContent: 'center', width: '100%', alignItems: 'center' }}>
                                <span style={{ color: '#0066FF', fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: '800' }}>{item.label}:</span>
                                <span style={{ color: 'white', fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: '500', maxWidth: '100%' }}>{item.value}</span>
                            </div>
                        ))}

                    </div>
                </div>
                <div style={{ width: '100%', marginTop: '8rem', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                    <a
                        href="https://telegra.ph/Sadisa-Harshana-02-05"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="creator-button"
                    >
                        Website Creator
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ marginTop: '0', padding: '3rem 2rem', borderTop: '1px solid var(--glass-border)', textAlign: 'center', background: 'var(--surface)' }}>
                <VisitorCounter />
                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '0.8rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <Smartphone size={20} color="var(--primary)" />
                    <h3 style={{ fontSize: '1.2rem' }} className="neon-text">SHINE TECH</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>© 2026 High-Security Commerce System. All rights reserved.</p>
            </footer>

            {/* Floating Contact Bar */}
            <div style={{
                position: 'fixed',
                bottom: 'min(2rem, 5vw)',
                right: 'min(2rem, 5vw)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem',
                zIndex: 100
            }}>
                <motion.a
                    href="https://wa.me/94707533476"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, x: -5 }}
                    whileTap={{ scale: 0.9 }}
                    className="glass-card"
                    style={{
                        width: 'clamp(45px, 12vw, 55px)',
                        height: 'clamp(45px, 12vw, 55px)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#25D366',
                        background: 'rgba(37, 211, 102, 0.1)',
                        boxShadow: '0 0 20px rgba(37, 211, 102, 0.4)',
                        border: '2px solid rgba(37, 211, 102, 0.3)',
                        padding: 0
                    }}
                >
                    <MessageCircle size={24} />
                </motion.a>

                <motion.a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, x: -5 }}
                    whileTap={{ scale: 0.9 }}
                    className="glass-card"
                    style={{
                        width: '55px',
                        height: '55px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FF3B30',
                        background: 'rgba(255, 59, 48, 0.1)',
                        boxShadow: '0 0 20px rgba(255, 59, 48, 0.4)',
                        border: '2px solid rgba(255, 59, 48, 0.3)',
                        padding: 0
                    }}
                >
                    <MapPin size={28} />
                </motion.a>
            </div>
        </div >
    );
};

export default Shop;
