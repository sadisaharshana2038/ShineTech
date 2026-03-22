import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage } from '../firebase/config';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    setDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import localInventoryData from '../data/localInventory.json';

const InventoryContext = createContext();

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
};

export const InventoryProvider = ({ children }) => {
    // Add temp IDs to local inventory for stable keys and fix paths for base URL
    const initialProducts = localInventoryData.map((p, i) => {
        const fixPath = (path) => (path && path.startsWith('/inventory'))
            ? `${import.meta.env.BASE_URL}${path.slice(1)}`
            : path;

        return {
            // Use the stable ID from JSON if available, otherwise fallback to temp-p-index
            id: p.id || `temp-p-${i}`,
            ...p,
            image: fixPath(p.image),
            detailImages: (p.detailImages || []).map(fixPath)
        };
    });
    const [products, setProducts] = useState(initialProducts);
    const [movies, setMovies] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const seedingRef = React.useRef(false);
    const productsResolvedRef = React.useRef(false);
    const moviesResolvedRef = React.useRef(false);
    const ordersResolvedRef = React.useRef(false);

    const defaultInventory = localInventoryData;

    const defaultMovies = [
        {
            name: 'Avatar: The Way of Water',
            genre: 'Sci-Fi',
            isLatest: true,
            quality: '1080p',
            size720: '1.7 GB',
            size1080: '3 GB',
            image: 'movies/avatar_2022.jpg',
            duration: '3h 12m',
            downloadLink720: 'https://steve-fs1-ring-496ad73f3755.herokuapp.com/dl/69897d37a6be886707a2c7e4',
            downloadLink1080: 'https://steve-fs1-ring-496ad73f3755.herokuapp.com/dl/69897d4da6be886707a2c7e6',
            telegramLink720: 'https://t.me/AnyFileStoreRoBot?start=ODUwMA==',
            telegramLink1080: 'https://t.me/AnyFileStoreRoBot?start=ODUwMg==',
            isStarred: false,
            downloadLink: '#'
        },
        {
            name: 'Inception',
            genre: 'Sci-Fi',
            quality: '1080p',
            size720: '437 MB',
            size1080: '1.1 GB',
            image: 'movies/inception_2010.jpg',
            duration: '2h 28m',
            downloadLink720: 'https://steve-fs1-ring-496ad73f3755.herokuapp.com/dl/69897b26a6be886707a2c7cf',
            downloadLink1080: 'https://steve-fs1-ring-496ad73f3755.herokuapp.com/dl/69897b2ba6be886707a2c7d1',
            telegramLink720: 'https://t.me/AnyFileStoreRoBot?start=ODQ5NA== ',
            telegramLink1080: 'https://t.me/AnyFileStoreRoBot?start=ODQ5Ng==',
            isStarred: false,
            downloadLink: '#'
        },
        {
            name: 'The Dark Knight',
            genre: 'Action',
            quality: '1080p',
            size720: '665 MB',
            size1080: '947 MB',
            image: 'movies/dark_knight_2008.jpg',
            duration: '2h 32m',
            isLatest: true,
            downloadLink720: 'https://steve-fs1-ring-496ad73f3755.herokuapp.com/dl/698975ada6be886707a2c7c3',
            downloadLink1080: 'https://steve-fs1-ring-496ad73f3755.herokuapp.com/dl/698975b4a6be886707a2c7c5',
            telegramLink720: 'https://t.me/AnyFileStoreRoBot?start=ODQ5MA==',
            telegramLink1080: 'https://t.me/AnyFileStoreRoBot?start=ODQ5Mg==',
            isStarred: false,
            downloadLink: '#'
        },
        {
            name: 'Interstellar',
            genre: 'Sci-Fi',
            quality: '1080p',
            size720: '625 MB',
            size1080: '1.2 GB',
            image: 'movies/interstellar_2014.jpg',
            duration: '2h 49m',
            isLatest: true,
            downloadLink720: 'https://steve-fs1-ring-496ad73f3755.herokuapp.com/dl/6989703ca6be886707a2c7bf',
            downloadLink1080: 'https://steve-fs1-ring-496ad73f3755.herokuapp.com/dl/6989707aa6be886707a2c7c1',
            telegramLink720: 'https://t.me/AnyFileStoreRoBot?start=ODQ4Ng==',
            telegramLink1080: 'https://t.me/AnyFileStoreRoBot?start=ODQ4OA==',
            isStarred: false,
            downloadLink: '#'
        }
    ];

    useEffect(() => {
        let unsubscribeProducts = () => { };
        let unsubscribeMovies = () => { };
        let unsubscribeOrders = () => { };

        const checkReady = () => {
            // Resolve if all 3 core collections are ready (or ignore movies/orders if empty on first load)
            if (productsResolvedRef.current && ordersResolvedRef.current && (moviesResolvedRef.current || import.meta.env.DEV)) {
                setLoading(false);
            }
        };

        // Instant Stream Start (No awaits)
        const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));

        unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Priority Logic: Database items first (already sorted by query)
            // Then add local defaults that aren't in the database yet.
            const dbProducts = data.filter(p => !p.deleted);
            const remainingDefaults = initialProducts.filter(def => 
                !dbProducts.some(p => p.name === def.name)
            );

            const mergedProducts = [...dbProducts, ...remainingDefaults];

            // Final filter for specific blacklisted names
            const blacklistedNames = ['GTS - 1346', 'GTS - 1373', 'KTS - 1369'];
            const finalProducts = mergedProducts.filter(p => !blacklistedNames.includes(p.name));

            setProducts(finalProducts);

            if (!productsResolvedRef.current) {
                productsResolvedRef.current = true;
                checkReady();
            }
        }, (error) => {
            console.error("Firestore Products Snapshot Error:", error);
            if (error.code === 'failed-precondition') {
                alert("⚠️ DATABASE INDEX REQUIRED: Please click the link in the browser console (Ctrl+Shift+J) to build the required index for sorting products.");
            }
        });

        const moviesQuery = query(collection(db, 'movies'), orderBy('createdAt', 'desc'));
        unsubscribeMovies = onSnapshot(moviesQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Deduplication and tombstone filtering
            const movieMap = {};
            const uniqueMovies = data.filter(movie => {
                if (movie.deleted) return false;
                if (movieMap[movie.name]) return false;
                movieMap[movie.name] = true;
                return true;
            });

            setMovies(uniqueMovies);

            if (!moviesResolvedRef.current && (uniqueMovies.length > 0 || !snapshot.metadata.hasPendingWrites)) {
                moviesResolvedRef.current = true;
                checkReady();
            }

            // Sync default movies into cloud if they don't exist
            if (!snapshot.metadata.hasPendingWrites) {
                const fixedDefaultMovies = defaultMovies.map(m => ({
                    ...m,
                    image: m.image.startsWith('http') ? m.image : `${import.meta.env.BASE_URL}${m.image}`.replace('//', '/')
                }));

                fixedDefaultMovies.forEach(defMovie => {
                    const existing = uniqueMovies.find(m => m.name === defMovie.name);
                    if (!existing) {
                        console.log(`Seeding missing default movie: ${defMovie.name}`);
                        addMovie(defMovie);
                    } else if (existing.image !== defMovie.image || (!existing.size720 && defMovie.size720)) {
                        console.log(`Updating existing default movie: ${defMovie.name}`);
                        updateMovie(existing.id, defMovie, true);
                    }
                });
            }
        });

        // Real-time Orders Listener
        const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(data);

            if (!ordersResolvedRef.current) {
                ordersResolvedRef.current = true;
                checkReady();
            }
        });

        return () => {
            unsubscribeProducts();
            unsubscribeMovies();
            unsubscribeOrders();
        };
    }, []);

    const uploadImage = async (file, path) => {
        if (!file || typeof file === 'string') return file; // Already a URL or null
        try {
            const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        }
    };

    const addProduct = async (product, imageFile = null) => {
        try {
            let imageUrl = product.image;
            if (imageFile) {
                imageUrl = await uploadImage(imageFile, 'inventory');
            }

            const productWithTime = {
                ...product,
                image: imageUrl,
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'products'), productWithTime);
            alert("✅ SUCCESS: Product added to Cloud. Check the top of your list!");
        } catch (error) {
            console.error("Error adding product: ", error);
            alert(`❌ ERROR: Failed to add product. ${error.message}`);
            throw error;
        }
    };

    const removeProduct = async (id) => {
        try {
            const sid = id.toString();
            // Global Deletion Sync: Instead of just deleting, we mark it as deleted 
            // so other PCs know to remove it from their local lists too.
            await setDoc(doc(db, 'products', sid), { deleted: true });
            alert("✅ SUCCESS: Product removed globally.");
        } catch (error) {
            console.error("Error removing product: ", error);
            alert(`❌ ERROR: Failed to remove product. ${error.message}`);
        }
    };

    const updateProduct = async (id, updatedProduct, imageFile = null) => {
        try {
            let imageUrl = updatedProduct.image;
            if (imageFile) {
                imageUrl = await uploadImage(imageFile, 'inventory');
            }

            const productData = { ...updatedProduct, image: imageUrl };

            if (id.startsWith('local-') || id.startsWith('temp-p-')) {
                const originalLocalItem = products.find(p => p.id === id);
                const { id: _, ...finalData } = { ...originalLocalItem, ...productData };

                console.log("Migrating/Updating local product with stable Doc ID:", id);
                await setDoc(doc(db, 'products', id), finalData);
                alert("✅ SUCCESS: Cloud updated/migrated.");
                return;
            }

            const productRef = doc(db, 'products', id);
            await updateDoc(productRef, productData);
            alert("✅ SUCCESS: Cloud updated.");
        } catch (error) {
            console.error("Error updating product: ", error);
            alert(`❌ ERROR: Failed to update product. ${error.message}`);
            throw error;
        }
    };

    const addMovie = async (movie, imageFile = null) => {
        try {
            let imageUrl = movie.image;
            if (imageFile) {
                imageUrl = await uploadImage(imageFile, 'movies');
            }

            const movieWithTime = {
                ...movie,
                image: imageUrl,
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'movies'), movieWithTime);
            alert("✅ SUCCESS: Movie added to Cloud.");
        } catch (error) {
            console.error("Error adding movie: ", error);
            alert(`❌ ERROR: Failed to add movie. ${error.message}`);
            throw error;
        }
    };

    const removeMovie = async (id) => {
        try {
            const sid = id.toString();
            // Movie Deletion Sync: Use tombstones so it stays deleted on other PCs
            await setDoc(doc(db, 'movies', sid), { deleted: true });
            alert("✅ SUCCESS: Movie removed globally.");
        } catch (error) {
            console.error("Error removing movie: ", error);
            alert(`❌ ERROR: Failed to remove movie. ${error.message}`);
        }
    };

    const updateMovie = async (id, updatedMovie, imageFile = null, silent = false) => {
        try {
            let imageUrl = updatedMovie.image;
            if (imageFile) {
                imageUrl = await uploadImage(imageFile, 'movies');
            }

            const movieData = { ...updatedMovie, image: imageUrl };
            const movieRef = doc(db, 'movies', id);
            await updateDoc(movieRef, movieData);
            if (!silent) alert("✅ SUCCESS: Movie updated.");
        } catch (error) {
            console.error("Error updating movie: ", error);
            if (!silent) alert(`❌ ERROR: Failed to update movie. ${error.message}`);
            throw error;
        }
    };

    const resetInventory = async () => {
        console.warn("Reset inventory called. Cloud data remains unless manually cleared.");
    };

    const resetDatabase = async () => {
        console.log("Reset Database triggered...");
        if (!window.confirm("⚠️ DANGER: This will delete ALL cloud-synced products and movies. Local defaults will be restored. This cannot be undone. Are you sure?")) return;
        if (!window.confirm("FINAL CONFIRMATION: Are you absolutely sure?")) return;

        console.log("Reset confirmed by user. Starting deletion...");
        try {
            setLoading(true);
            const productSnap = await getDocs(collection(db, 'products'));
            const movieSnap = await getDocs(collection(db, 'movies'));

            const deletePromises = [];
            productSnap.forEach(doc => {
                deletePromises.push(deleteDoc(doc.ref));
            });
            movieSnap.forEach(doc => {
                deletePromises.push(deleteDoc(doc.ref));
            });

            if (deletePromises.length === 0) {
                alert("Cloud is already empty.");
                return;
            }

            await Promise.all(deletePromises);
            alert(`✅ SUCCESS: ${deletePromises.length} records removed from Cloud.`);
            window.location.reload();
        } catch (error) {
            console.error("Error resetting cloud database:", error);
            alert(`❌ ERROR: Failed to reset database. ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const updateStock = async (id, newStock) => {
        try {
            const sid = id.toString();
            if (sid.startsWith('local-') || sid.startsWith('temp-p-')) {
                const productToMigrate = products.find(p => p.id === sid);
                if (productToMigrate) {
                    const { id: _, ...productData } = productToMigrate;
                    productData.stock = newStock;

                    console.log("Updating stable cloud document (Stock):", sid);
                    await setDoc(doc(db, 'products', sid), productData);
                    alert(`✅ SUCCESS: Stock set to ${newStock}.`);
                }
                return;
            }

            const productRef = doc(db, 'products', id);
            await updateDoc(productRef, { stock: newStock });
            if (newStock < 5) {
                console.warn(`Low stock warning for ${id}: ${newStock} left.`);
            }
            alert(`✅ SUCCESS: Stock set to ${newStock}.`);
        } catch (error) {
            console.error("Error updating stock: ", error);
            alert(`❌ ERROR: Failed to update stock. ${error.message}`);
            throw error;
        }
    };

    // --- Order Management ---
    const addOrder = async (orderData) => {
        try {
            const completeOrder = {
                ...orderData,
                status: 'Pending',
                createdAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, 'orders'), completeOrder);
            return docRef.id;
        } catch (error) {
            console.error("Error placing order:", error);
            throw error;
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, { status: newStatus });
            
            // Auto-adjust inventory if order is "Completed"
            if (newStatus === 'Completed') {
                const order = orders.find(o => o.id === orderId);
                if (order && order.items) {
                    for (const item of order.items) {
                        const product = products.find(p => p.id === item.id);
                        if (product) {
                            const newStock = Math.max(0, (product.stock || 0) - item.quantity);
                            await updateStock(product.id, newStock);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            throw error;
        }
    };

    const removeOrder = async (orderId) => {
        try {
            await deleteDoc(doc(db, 'orders', orderId));
        } catch (error) {
            console.error("Error deleting order:", error);
            throw error;
        }
    };

    return (
        <InventoryContext.Provider value={{
            products, addProduct, removeProduct, updateProduct, updateStock,
            movies, addMovie, removeMovie, updateMovie, 
            orders, addOrder, updateOrderStatus, removeOrder,
            resetInventory, resetDatabase,
            loading
        }}>
            {children}
        </InventoryContext.Provider>
    );
};
