import React, { useState } from 'react';
import { useAuth } from '../security/auth';
import { LayoutDashboard, Package, ShoppingCart, LogOut, Plus, Trash2, X, Image as ImageIcon, Film, Download, ShieldCheck, HardDrive, Monitor, Edit2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useInventory } from '../context/InventoryContext';
import { sanitizeInput, validateUrl } from '../utils/securityUtils';
import { formatPrice } from '../utils/formatUtils';
import { formatImagePath } from '../utils/urlUtils';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const { 
        products, addProduct, removeProduct, updateProduct, updateStock, 
        movies, addMovie, removeMovie, updateMovie, 
        orders, updateOrderStatus, removeOrder,
        resetInventory, resetDatabase, loading 
    } = useInventory();


    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'movies', or 'orders'
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Responsive State
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);



    const getStatusColor = (status) => {
        switch (status) {
            case 'Shipped': return 'var(--primary)';
            case 'Delivered': return 'var(--success)';
            case 'Processing': return 'var(--accent)';
            case 'Pending': return 'var(--warning)';
            case 'Completed': return 'var(--success)';
            case 'Cancelled': return 'var(--danger)';
            default: return 'var(--text-muted)';
        }
    };

    // Form States
    const [newProduct, setNewProduct] = useState({ name: '', brand: '', category: 'Audio & Sounds', subCategory: '', price: '', stock: '', image: '', detailImages: [] });
    const [mainImageFile, setMainImageFile] = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]);
    
    const [newMovie, setNewMovie] = useState({ name: '', genre: 'Action', quality: '4K', duration: '', size720: '', size1080: '', image: '', downloadLink: '', downloadLink720: '', downloadLink1080: '', telegramLink720: '', telegramLink1080: '' });
    const [movieImageFile, setMovieImageFile] = useState(null);

    const openEditModal = (item) => {
        setEditingItem(item);
        if (activeTab === 'inventory') {
            setNewProduct({ ...item, detailImages: item.detailImages || [] });
        } else {
            setNewMovie({ ...item });
        }
        setIsProductModalOpen(true);
    };

    const closeFormModal = () => {
        setIsProductModalOpen(false);
        setEditingItem(null);
        setMainImageFile(null);
        setGalleryFiles([]);
        setMovieImageFile(null);
        setNewProduct({ name: '', brand: '', category: 'Audio & Sounds', subCategory: '', price: '', stock: '', image: '', detailImages: [] });
        setNewMovie({ name: '', genre: 'Action', quality: '4K', size720: '', size1080: '', image: '', downloadLink: '', downloadLink720: '', downloadLink1080: '', telegramLink720: '', telegramLink1080: '' });
    };

    const compressImage = (base64Str, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (err) => {
                console.error("Image compression failed", err);
                resolve(base64Str); // Fallback to original if compression fails
            };
        });
    };

    const handleImageUrlInput = (url, target, setter) => {
        const formatted = formatImagePath(url);
        setter({ ...target, image: formatted });
    };

    const handleImageError = (e, type = 'product') => {
        e.target.src = type === 'movie' 
            ? 'https://placehold.co/600x900/1a1a1a/ffffff?text=Poster+Coming+Soon'
            : 'https://placehold.co/600x600/1a1a1a/ffffff?text=Image+Coming+Soon';
        e.target.onerror = null; // Prevent infinite loop
    };

    const [galleryUrl, setGalleryUrl] = useState('');
    const handleAddGalleryLink = () => {
        if (!galleryUrl) return;
        setNewProduct(prev => ({
            ...prev,
            detailImages: [...prev.detailImages, galleryUrl]
        }));
        setGalleryUrl('');
    };

    const handleFileChange = (e, setter, isGallery = false) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (isGallery) {
            setGalleryFiles(prev => [...prev, file]);
        } else {
            setter(file);
        }
        
        // Show preview using blob URL
        const reader = new FileReader();
        reader.onload = (event) => {
            if (isGallery) {
                setNewProduct(prev => ({
                    ...prev,
                    detailImages: [...prev.detailImages, event.target.result]
                }));
            } else {
                if (activeTab === 'inventory') {
                    setNewProduct(prev => ({ ...prev, image: event.target.result }));
                } else {
                    setNewMovie(prev => ({ ...prev, image: event.target.result }));
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const removeDetailImage = (index) => {
        setNewProduct(prev => ({
            ...prev,
            detailImages: prev.detailImages.filter((_, i) => i !== index)
        }));
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!newProduct.image) { alert('Please upload a product image.'); return; }

        const productData = {
            ...newProduct,
            name: sanitizeInput(newProduct.name),
            brand: sanitizeInput(newProduct.brand),
            price: parseFloat(newProduct.price),
            stock: parseInt(newProduct.stock)
        };

        if (productData.price < 0 || productData.stock < 0) {
            alert("Price and Stock cannot be negative.");
            return;
        }

        // Data Size Check (Firestore Limit is 1MB, we target <800KB for safety)
        const approxSize = JSON.stringify(productData).length;
        if (approxSize > 800000) {
            alert(`Too much data! (${Math.round(approxSize / 1024)}KB). Please remove some detail photos or use smaller images.`);
            return;
        }

        try {
            setIsSubmitting(true);
            const sizeInKB = Math.round(approxSize / 1024);
            console.log(`Submitting product data: ${sizeInKB}KB`);

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Timeout: Cloud is taking too long to respond. This usually happens if your Firebase Daily Quota is exceeded.")), 30000)
            );

            if (editingItem) {
                // If editing, we might need to handle new gallery files migration to URLs
                // For simplicity, we assume new uploads are handled by mainImageFile
                const updatedProductData = { ...productData };
                if (mainImageFile) {
                    await Promise.race([updateProduct(editingItem.id, updatedProductData, mainImageFile), timeoutPromise]);
                } else {
                    await Promise.race([updateProduct(editingItem.id, updatedProductData), timeoutPromise]);
                }
            } else {
                await Promise.race([addProduct(productData, mainImageFile), timeoutPromise]);
            }
            setIsSubmitting(false);
            closeFormModal();
        } catch (error) {
            setIsSubmitting(false);
            const errorMessage = error.message || "Unknown Cloud Error";
            alert(`⚠️ SUBMISSION FAILED\n\nReason: ${errorMessage}\n\nNote: If you see "Quota exceeded", please wait for 24 hours for Firebase to reset or check your Firebase Console.`);
            console.error("Submission failed:", error);
        }
    };

    const handleAddMovie = async (e) => {
        e.preventDefault();
        if (!newMovie.image) {
            alert('Security Error: Please upload a poster image.');
            return;
        }

        const movieData = {
            ...newMovie,
            name: sanitizeInput(newMovie.name),
            genre: sanitizeInput(newMovie.genre),
            size720: sanitizeInput(newMovie.size720),
            size1080: sanitizeInput(newMovie.size1080),
            downloadLink: newMovie.downloadLink || '#',
            downloadLink720: newMovie.downloadLink720 || '#',
            downloadLink1080: newMovie.downloadLink1080 || '#',
            telegramLink720: newMovie.telegramLink720 || '#',
            telegramLink1080: newMovie.telegramLink1080 || '#'
        };

        try {
            setIsSubmitting(true);
            if (editingItem) {
                await updateMovie(editingItem.id, movieData, movieImageFile);
            } else {
                await addMovie(movieData, movieImageFile);
            }
            setIsSubmitting(false);
            closeFormModal();
        } catch (error) {
            setIsSubmitting(false);
            console.error("Movie submission failed:", error);
            // Alert is handled in Context
        }
    };

    const handleStockToggle = (item) => {
        if (activeTab !== 'inventory') return;

        const currentStock = item.stock || 0;
        const newStockStr = window.prompt(`Update stock for "${item.name}":`, currentStock);

        if (newStockStr !== null) {
            const newStock = parseInt(newStockStr);
            if (!isNaN(newStock) && newStock >= 0) {
                updateStock(item.id, newStock);
            } else {
                alert("Please enter a valid positive number.");
            }
        }
    };

    const handleStarToggle = async (item) => {
        try {
            if (activeTab === 'inventory') {
                await updateProduct(item.id, { isStarred: !item.isStarred });
            } else if (activeTab === 'movies') {
                await updateMovie(item.id, { isStarred: !item.isStarred });
            }
        } catch (error) {
            console.error("Error toggling star:", error);
        }
    };

    const handleResetStars = async () => {
        const itemType = activeTab === 'inventory' ? 'Products' : 'Movies';
        if (!window.confirm(`Are you sure you want to remove ALL ${itemType} from Top/Archive? This cannot be undone.`)) return;

        const starredItems = activeTab === 'inventory'
            ? products.filter(p => p.isStarred)
            : movies.filter(m => m.isStarred);

        if (starredItems.length === 0) {
            alert(`No starred ${itemType.toLowerCase()} to reset.`);
            return;
        }

        try {
            setIsSubmitting(true);
            for (const item of starredItems) {
                if (activeTab === 'inventory') {
                    await updateProduct(item.id, { isStarred: false });
                } else {
                    await updateMovie(item.id, { isStarred: false });
                }
            }
            setIsSubmitting(false);
            alert(`Successfully unstarred ${starredItems.length} ${itemType.toLowerCase()}.`);
        } catch (error) {
            setIsSubmitting(false);
            console.error("Error resetting stars:", error);
            alert("Failed to reset some stars.");
        }
    };

    const handleFixPaths = async () => {
        if (!window.confirm("This will scan ALL items in Cloud and fix broken '/Shine-Tech/' prefixes. Continue?")) return;
        
        try {
            setIsSubmitting(true);
            let fixCount = 0;
            const productionPrefix = '/Shine-Tech/';

            // Fix Products
            for (const p of products) {
                if (p.image && p.image.startsWith(productionPrefix)) {
                    const fixedImage = p.image.replace(productionPrefix, '');
                    await updateProduct(p.id, { image: fixedImage });
                    fixCount++;
                }
                // Also check detailImages
                if (p.detailImages && p.detailImages.some(img => img.startsWith(productionPrefix))) {
                    const fixedDetails = p.detailImages.map(img => img.startsWith(productionPrefix) ? img.replace(productionPrefix, '') : img);
                    await updateProduct(p.id, { detailImages: fixedDetails });
                    fixCount++;
                }
            }

            // Fix Movies
            for (const m of movies) {
                if (m.image && m.image.startsWith(productionPrefix)) {
                    const fixedImage = m.image.replace(productionPrefix, '');
                    await updateMovie(m.id, { image: fixedImage }, null, true);
                    fixCount++;
                }
            }

            setIsSubmitting(false);
            alert(`✅ SUCCESS: Fixed ${fixCount} entries.`);
        } catch (error) {
            setIsSubmitting(false);
            console.error("Path fix failed:", error);
            alert("Failed to fix some paths.");
        }
    };
    
    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#020305', position: 'relative' }}>
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, backdropFilter: 'blur(5px)' }}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                initial={false}
                animate={{ x: isMobile && !isSidebarOpen ? -320 : 0 }}
                transition={{ type: 'spring', damping: 20 }}
                style={{
                    width: '300px',
                    background: 'var(--surface)',
                    borderRight: '1px solid var(--glass-border)',
                    padding: '2.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    height: '100vh',
                    zIndex: 1000,
                    left: 0,
                    top: 0
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <ShieldCheck color="var(--primary)" size={32} />
                        <h2 className="neon-text" style={{ fontSize: '1.5rem', margin: 0 }}>SHINE ADMIN</h2>
                    </div>
                    {isMobile && <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X size={24} /></button>}
                </div>

                <nav style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {[
                        { id: 'inventory', label: 'Inventory', icon: <Package size={20} /> },
                        { id: 'movies', label: 'Movies', icon: <Film size={20} /> },
                        { id: 'orders', label: 'Orders', icon: <ShoppingCart size={20} />, badge: orders.filter(o => o.status === 'Pending').length > 0 ? orders.filter(o => o.status === 'Pending').length : null },
                    ].map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); if (isMobile) setIsSidebarOpen(false); }}
                            className="btn"
                            style={{
                                justifyContent: 'flex-start',
                                background: activeTab === tab.id ? 'rgba(0, 102, 255, 0.1)' : 'transparent',
                                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                                border: '1px solid',
                                borderColor: activeTab === tab.id ? 'rgba(0, 102, 255, 0.2)' : 'transparent',
                                position: 'relative'
                            }}
                        >
                            {tab.icon} {tab.label}
                            {tab.badge && (
                                <span style={{
                                    position: 'absolute',
                                    right: '1rem',
                                    background: 'var(--primary)',
                                    color: 'black',
                                    fontSize: '0.6rem',
                                    fontWeight: '900',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '10px'
                                }}>{tab.badge}</span>
                            )}
                        </div>
                    ))}
                </nav>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                    <button 
                        onClick={handleFixPaths} 
                        className="btn" 
                        style={{ 
                            width: '100%', 
                            color: 'white', 
                            background: 'var(--accent)', 
                            justifyContent: 'center',
                            marginBottom: '0.5rem',
                            border: 'none',
                            fontWeight: 'bold'
                        }}
                    >
                        <ImageIcon size={20} /> Fix Broken Image Paths
                    </button>
                    <button 
                        onClick={() => {
                            resetDatabase();
                        }} 
                        className="btn" 
                        style={{ 
                            width: '100%', 
                            color: 'white', 
                            background: 'var(--danger)', 
                            justifyContent: 'center',
                            marginBottom: '1rem',
                            border: 'none',
                            fontWeight: 'bold',
                            boxShadow: '0 0 15px rgba(255, 59, 48, 0.3)'
                        }}
                    >
                        <Trash2 size={20} /> Clear All Cloud Data
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                            {user?.name?.[0] || 'A'}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.9rem', fontWeight: '700', margin: 0 }}>{user?.name || 'Administrator'}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>System Root</p>
                        </div>
                    </div>
                    <button onClick={logout} className="btn" style={{ width: '100%', color: 'var(--danger)', background: 'rgba(255, 59, 48, 0.05)', justifyContent: 'center' }}>
                        <LogOut size={20} /> Logout System
                    </button>
                </div>
            </motion.div>

            {/* Main Content */}
            <main style={{
                marginLeft: isMobile ? 0 : '300px',
                flexGrow: 1,
                padding: isMobile ? '1.5rem' : '3rem',
                maxWidth: '1600px',
                width: '100%',
                transition: 'margin-left 0.3s ease'
            }}>
                <header style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '1.5rem' : '0', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '3.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {isMobile && (
                            <button onClick={() => setIsSidebarOpen(true)} className="btn" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.8rem' }}>
                                <LayoutDashboard size={20} color="var(--primary)" />
                            </button>
                        )}
                        <div>
                            <h1 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: '900', letterSpacing: '-1px' }} className="neon-text">
                                {activeTab === 'inventory' ? 'Inventory Control' : activeTab === 'movies' ? 'Media Archive' : 'Order Management'}
                                {loading && <span style={{ fontSize: '1rem', marginLeft: '1rem', color: 'var(--primary)', opacity: 0.6 }}>(Syncing...)</span>}
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.9rem' : '1.1rem' }}>Admin: {user?.name}. Cloud Sync: {loading ? 'Active' : 'Connected'}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', width: isMobile ? '100%' : 'auto' }}>
                        <button onClick={() => window.location.reload()} className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', flex: isMobile ? 1 : 'initial', justifyContent: 'center' }}>
                            <Monitor size={16} /> {isMobile ? 'Reload' : 'Hard Reload'}
                        </button>
                        <button onClick={() => setIsProductModalOpen(true)} className="btn btn-primary" style={{ padding: '0.8rem 2rem', flex: isMobile ? 1 : 'initial', justifyContent: 'center' }}>
                            <Plus size={20} /> {isMobile ? 'Add' : 'New Entry'}
                        </button>
                    </div>
                </header>



                <section>
                    <div className="glass-card" style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '1rem' : '0', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {activeTab === 'inventory' ? <Package color="var(--primary)" /> : activeTab === 'movies' ? <Film color="var(--primary)" /> : <ShoppingCart color="var(--primary)" />}
                                Recent {activeTab === 'inventory' ? 'Stock' : activeTab === 'movies' ? 'Archive' : 'Orders'}
                            </h2>
                            <div style={{ display: 'flex', gap: '0.5rem', width: isMobile ? '100%' : 'auto' }}>
                                {(activeTab === 'inventory' || activeTab === 'movies') && (
                                    <button onClick={handleResetStars} className="btn" style={{ fontSize: '0.8rem', background: 'rgba(255, 165, 0, 0.1)', color: 'orange', padding: '0.5rem 1rem', flex: 1, border: '1px solid orange' }}>
                                        Reset Top
                                    </button>
                                )}
                                <button className="btn" style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', flex: 1 }}>Export CSV</button>
                                <button className="btn" style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', flex: 1 }}>Reload</button>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto', margin: '0 -1.5rem', padding: '0 1.5rem' }}>
                            {activeTab === 'orders' ? (
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 1rem', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <th style={{ padding: '0 1rem' }}>ORDER ID</th>
                                            <th style={{ padding: '0 1rem' }}>CUSTOMER</th>
                                            <th style={{ padding: '0 1rem' }}>AMOUNT</th>
                                            <th style={{ padding: '0 1rem' }}>DATE</th>
                                            <th style={{ padding: '0 1rem' }}>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order, idx) => (
                                            <motion.tr
                                                key={order.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                onClick={() => setSelectedOrder(order)}
                                                style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', cursor: 'pointer' }}
                                                whileHover={{ background: 'rgba(255,255,255,0.05)' }}
                                            >
                                                <td style={{ padding: '1.5rem 1rem', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                                    <div style={{ fontWeight: '800' }}>#{order.id.slice(-6).toUpperCase()}</div>
                                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{order.items?.length || 0} items</div>
                                                </td>
                                                <td style={{ padding: '1.5rem 1rem' }}>
                                                    <div style={{ fontWeight: '600' }}>{order.customer?.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>{order.customer?.phone}</div>
                                                </td>
                                                <td style={{ padding: '1.5rem 1rem', fontWeight: '800' }}>{formatPrice(order.total || 0)}</td>
                                                <td style={{ padding: '1.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                    {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                                </td>
                                                <td style={{ padding: '1.5rem 1rem', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: '900',
                                                        background: `${getStatusColor(order.status)}15`,
                                                        color: getStatusColor(order.status),
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '20px',
                                                        border: `1px solid ${getStatusColor(order.status)}30`
                                                    }}>
                                                        {order.status?.toUpperCase() || 'PENDING'}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 1rem', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            <th style={{ padding: '0 1rem' }}>NAME / ID</th>
                                            <th style={{ padding: '0 1rem' }}>{activeTab === 'inventory' ? 'BRAND / CATEGORY' : 'GENRE / QUALITY'}</th>
                                            <th style={{ padding: '0 1rem' }}>{activeTab === 'inventory' ? 'PRICE / STOCK' : 'SIZE / DURATION'}</th>
                                            <th style={{ padding: '0 1rem' }}>STATUS</th>
                                            <th style={{ padding: '0 1rem' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(activeTab === 'inventory' ? products : (activeTab === 'movies' ? movies : [])).map((item, idx) => (
                                            <motion.tr
                                                key={item.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}
                                            >
                                                <td style={{ padding: '1.5rem 1rem', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                                    <div style={{ fontWeight: '800' }}>{item.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: #{item.id}</div>
                                                </td>
                                                <td style={{ padding: '1.5rem 1rem' }}>
                                                    <div style={{ color: 'white', fontWeight: '600' }}>{activeTab === 'inventory' ? item.brand : item.genre}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>{activeTab === 'inventory' ? item.category : item.quality}</div>
                                                </td>
                                                <td style={{ padding: '1.5rem 1rem' }}>
                                                    <div style={{ fontWeight: '800' }}>{activeTab === 'inventory' ? formatPrice(item.price) : (item.size1080 || item.size720 || item.size || 'N/A')}</div>
                                                    <div style={{ fontSize: '0.7rem', color: activeTab === 'inventory' && item.stock <= 5 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                                        {activeTab === 'inventory' ? `${item.stock} in stock` : item.duration}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.5rem 1rem' }}>
                                                    <span
                                                        onClick={() => handleStockToggle(item)}
                                                        style={{
                                                            fontSize: '0.7rem',
                                                            fontWeight: '900',
                                                            background: activeTab === 'inventory'
                                                                ? (item.stock > 0 ? 'rgba(0, 255, 102, 0.1)' : 'rgba(255, 59, 48, 0.1)')
                                                                : 'rgba(0, 255, 102, 0.1)',
                                                            color: activeTab === 'inventory'
                                                                ? (item.stock > 0 ? 'var(--success)' : 'var(--danger)')
                                                                : 'var(--success)',
                                                            padding: '0.4rem 0.8rem',
                                                            borderRadius: '20px',
                                                            border: `1px solid ${activeTab === 'inventory' ? (item.stock > 0 ? 'rgba(0, 255, 102, 0.2)' : 'rgba(255, 59, 48, 0.2)') : 'rgba(0, 255, 102, 0.2)'}`,
                                                            cursor: activeTab === 'inventory' ? 'pointer' : 'default',
                                                            userSelect: 'none'
                                                        }}>
                                                        {activeTab === 'inventory'
                                                            ? (item.stock > 0 ? 'IN STOCK' : 'OUT OF STOCK')
                                                            : 'ACTIVE'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1.5rem 1rem', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                                        {activeTab === 'inventory' && (
                                                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                                                <button
                                                                    onClick={() => updateProduct(item.id, { isStarred: !item.isStarred })}
                                                                    title="Toggle Top Rated"
                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.isStarred ? '#FFD700' : 'rgba(255, 255, 255, 0.2)', padding: 0 }}
                                                                >
                                                                    <Star size={20} fill={item.isStarred ? '#FFD700' : 'none'} />
                                                                </button>
                                                                <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }} />
                                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                                        <Star
                                                                            key={s}
                                                                            size={14}
                                                                            fill={s <= (item.rating || 0) ? '#0066FF' : 'none'}
                                                                            color={s <= (item.rating || 0) ? '#0066FF' : 'rgba(255, 255, 255, 0.2)'}
                                                                            style={{ cursor: 'pointer' }}
                                                                            onClick={() => updateProduct(item.id, { rating: s })}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {activeTab === 'movies' && (
                                                            <button
                                                                onClick={() => handleStarToggle(item)}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.isStarred ? '#FFD700' : 'rgba(255, 255, 255, 0.2)', padding: 0 }}
                                                            >
                                                                <Star size={18} fill={item.isStarred ? '#FFD700' : 'none'} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openEditModal(item)}
                                                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => activeTab === 'inventory' ? removeProduct(item.id) : removeMovie(item.id)}
                                                            style={{ background: 'none', border: 'none', color: 'var(--danger)', opacity: 0.6, cursor: 'pointer', padding: 0 }}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: 'relative', width: '100%', maxWidth: '700px', maxHeight: '90vh', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 1 }}>
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Order #{selectedOrder.id.slice(-6).toUpperCase()}</h3>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status: {selectedOrder.status}</p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                                    <div>
                                        <h4 style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Customer Details</h4>
                                        <p style={{ fontWeight: '700', marginBottom: '0.2rem' }}>{selectedOrder.customer?.name}</p>
                                        <p style={{ fontSize: '0.9rem' }}>{selectedOrder.customer?.phone}</p>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{selectedOrder.customer?.address}</p>
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Update Status</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'].map(status => (
                                                <button 
                                                    key={status} 
                                                    onClick={() => updateOrderStatus(selectedOrder.id, status)}
                                                    style={{ 
                                                        fontSize: '0.65rem', padding: '0.4rem 0.8rem', borderRadius: '20px', cursor: 'pointer',
                                                        background: selectedOrder.status === status ? getStatusColor(status) : 'rgba(255,255,255,0.05)',
                                                        color: selectedOrder.status === status ? 'white' : 'var(--text-muted)',
                                                        border: `1px solid ${selectedOrder.status === status ? getStatusColor(status) : 'var(--glass-border)'}`
                                                    }}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <h4 style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Order Items</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {selectedOrder.items?.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '12px' }}>
                                            <img 
                                                src={formatImagePath(item.image)} 
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} 
                                                alt="" 
                                                onError={(e) => handleImageError(e, 'product')}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>{item.name}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.quantity} x {formatPrice(item.price)}</p>
                                            </div>
                                            <p style={{ fontWeight: '800' }}>{formatPrice(item.price * item.quantity)}</p>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '800' }}>Total Amount</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)' }}>{formatPrice(selectedOrder.total)}</span>
                                </div>

                                {selectedOrder.customer?.note && (
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <h4 style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Customer Note</h4>
                                        <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>"{selectedOrder.customer.note}"</p>
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: '1.5rem 2rem', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '1rem' }}>
                                <button 
                                    onClick={() => {
                                        const msg = encodeURIComponent(`Hello ${selectedOrder.customer?.name}, regarding your order #${selectedOrder.id.slice(-6).toUpperCase()} at Shine Tech...`);
                                        window.open(`https://wa.me/${selectedOrder.customer?.phone?.replace(/\+/g, '')}?text=${msg}`, '_blank');
                                    }}
                                    className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    Contact via WhatsApp
                                </button>
                                <button 
                                    onClick={() => {
                                        if (confirm("Permanently delete this order?")) {
                                            removeOrder(selectedOrder.id);
                                            setSelectedOrder(null);
                                        }
                                    }}
                                    className="btn" style={{ background: 'rgba(255, 59, 48, 0.1)', color: 'var(--danger)', border: '1px solid rgba(255, 59, 48, 0.2)' }}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Modal */}
            <AnimatePresence>
                {isProductModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeFormModal} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass-card"
                            style={{
                                position: 'relative',
                                zIndex: 1001,
                                maxWidth: '600px',
                                width: '100%',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                padding: isMobile ? '1.5rem' : '2.5rem'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2>{editingItem ? 'Edit' : 'Add New'} {activeTab === 'inventory' ? 'Product' : 'Movie'}</h2>
                                <button onClick={closeFormModal} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            {activeTab === 'inventory' ? (
                                <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    <input required type="text" className="btn" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }} value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Product Name" />
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                        <input required type="text" className="btn" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }} value={newProduct.brand} onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })} placeholder="Brand" />
                                        <select className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', textAlign: 'left' }} value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value, subCategory: '' })}>
                                            {['Audio & Sounds', 'Battery & Capacity', 'Case & Protection', 'Data & Storage', 'Cables & Adapters', 'Wearables & Trackers'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    {newProduct.category === 'Data & Storage' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '800' }}>SELECT SUB-CATEGORY</p>
                                            <select
                                                required
                                                className="btn"
                                                style={{ background: 'rgba(0, 102, 255, 0.1)', border: '1px solid var(--primary)', color: 'white', textAlign: 'left' }}
                                                value={newProduct.subCategory}
                                                onChange={(e) => setNewProduct({ ...newProduct, subCategory: e.target.value })}
                                            >
                                                <option value="">-- Choose Subcategory --</option>
                                                <option value="Flash Drives">Flash Drives</option>
                                                <option value="SD Cards">SD Cards</option>
                                                <option value="OTG">OTG</option>
                                            </select>
                                        </div>
                                    )}
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                        <input required type="number" className="btn" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }} value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="Price (Rs.)" />
                                        <input required type="number" className="btn" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }} value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} placeholder="Initial Stock" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ position: 'relative' }}>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Main Preview Image Link (Drive/Web)</p>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="url"
                                                    className="btn"
                                                    style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', flex: 1 }}
                                                    value={newProduct.image.startsWith('data:') ? '' : newProduct.image}
                                                    onChange={(e) => handleImageUrlInput(e.target.value, newProduct, setNewProduct)}
                                                    placeholder="Paste image link..."
                                                />
                                                <label className="btn btn-primary" style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                    <Plus size={18} />
                                                    <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, setMainImageFile)} />
                                                </label>
                                            </div>
                                            {newProduct.image && (
                                                <div style={{ position: 'absolute', right: '10px', top: '32px', width: '30px', height: '30px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--primary)', zIndex: 1 }}>
                                                    <img 
                                                        src={formatImagePath(newProduct.image)} 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                        onError={(e) => handleImageError(e, 'product')} 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Gallery Photo Link (Add one by one)</p>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="url"
                                                    className="btn"
                                                    style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', flex: 1 }}
                                                    value={galleryUrl}
                                                    onChange={(e) => setGalleryUrl(formatImagePath(e.target.value))}
                                                    placeholder="Paste gallery link..."
                                                />
                                                {galleryUrl && (
                                                    <div style={{ position: 'absolute', right: '55px', top: '32px', width: '30px', height: '30px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--primary)', zIndex: 1 }}>
                                                        <img 
                                                            src={formatImagePath(galleryUrl)} 
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                            onError={(e) => handleImageError(e, 'product')} 
                                                        />
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={handleAddGalleryLink}
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.5rem' }}
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {newProduct.detailImages.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
                                            {newProduct.detailImages.map((img, idx) => (
                                                <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                                    <img 
                                                        src={formatImagePath(img)} 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                        onError={(e) => handleImageError(e, 'product')}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDetailImage(idx)}
                                                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,59,48,0.8)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        className={`btn ${isSubmitting ? 'btn-disabled' : 'btn-primary'}`}
                                        disabled={isSubmitting}
                                        style={{ marginTop: '1rem', padding: '1rem', position: 'relative' }}
                                    >
                                        {isSubmitting ? 'Syncing with Cloud...' : (editingItem ? 'Save Changes' : 'Submit Product')}
                                        {isSubmitting && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'inline-block', marginLeft: '10px' }}>⌛</motion.div>}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleAddMovie} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                    <input required type="text" className="btn" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }} value={newMovie.name} onChange={(e) => setNewMovie({ ...newMovie, name: e.target.value })} placeholder="Movie Title" />
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                        <select className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', textAlign: 'left' }} value={newMovie.genre} onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}>
                                            {['Action', 'Sci-Fi', 'Horror', 'Drama', 'Adventure', 'Animation'].map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                        <select className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', textAlign: 'left' }} value={newMovie.quality} onChange={(e) => setNewMovie({ ...newMovie, quality: e.target.value })}>
                                            {['4K', '1080p', '720p', 'Blu-ray'].map(q => <option key={q} value={q}>{q}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Movie Poster Link (Drive/Web)</p>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="url"
                                                className="btn"
                                                style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', flex: 1 }}
                                                value={newMovie.image.startsWith('data:') ? '' : newMovie.image}
                                                onChange={(e) => handleImageUrlInput(e.target.value, newMovie, setNewMovie)}
                                                placeholder="Paste poster link..."
                                            />
                                            <label className="btn btn-primary" style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <Plus size={18} />
                                                <input type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, setMovieImageFile)} />
                                            </label>
                                        </div>
                                        {newMovie.image && (
                                            <div style={{ position: 'absolute', right: '10px', top: '32px', width: '30px', height: '30px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--primary)', zIndex: 1 }}>
                                                <img 
                                                    src={formatImagePath(newMovie.image)} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                    onError={(e) => handleImageError(e, 'movie')} 
                                                />
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            className="btn"
                                            style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', width: '100%', marginTop: '0.5rem' }}
                                            value={newMovie.duration}
                                            onChange={(e) => setNewMovie({ ...newMovie, duration: e.target.value })}
                                            placeholder="Movie Runtime (e.g. 2h 15m)"
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                        <input type="text" className="btn" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }} value={newMovie.size720} onChange={(e) => setNewMovie({ ...newMovie, size720: e.target.value })} placeholder="720p Size (e.g. 600MB)" />
                                        <input type="text" className="btn" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }} value={newMovie.size1080} onChange={(e) => setNewMovie({ ...newMovie, size1080: e.target.value })} placeholder="1080p Size (e.g. 1.2GB)" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                        <input type="url" className="btn" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }} value={newMovie.downloadLink720} onChange={(e) => setNewMovie({ ...newMovie, downloadLink720: e.target.value })} placeholder="720p Direct Link" />
                                        <input type="url" className="btn" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }} value={newMovie.telegramLink720} onChange={(e) => setNewMovie({ ...newMovie, telegramLink720: e.target.value })} placeholder="720p Telegram Link" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                        <input type="url" className="btn" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }} value={newMovie.downloadLink1080} onChange={(e) => setNewMovie({ ...newMovie, downloadLink1080: e.target.value })} placeholder="1080p Direct Link" />
                                        <input type="url" className="btn" style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }} value={newMovie.telegramLink1080} onChange={(e) => setNewMovie({ ...newMovie, telegramLink1080: e.target.value })} placeholder="1080p Telegram Link" />
                                    </div>
                                    <button
                                        type="submit"
                                        className={`btn ${isSubmitting ? 'btn-disabled' : 'btn-primary'}`}
                                        disabled={isSubmitting}
                                        style={{ marginTop: '1rem', padding: '1rem' }}
                                    >
                                        {isSubmitting ? 'Syncing with Cloud...' : (editingItem ? 'Save Changes' : 'Add to Archive')}
                                        {isSubmitting && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'inline-block', marginLeft: '10px' }}>⌛</motion.div>}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >
        </div >
    );
};

export default Dashboard;
