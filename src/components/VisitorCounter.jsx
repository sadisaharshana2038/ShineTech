import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { Users, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VisitorCounter = () => {
    const [count, setCount] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const statsRef = doc(db, 'stats', 'visitors');

        const initializeCounter = async () => {
            try {
                const docSnap = await getDoc(statsRef);

                // Check session to prevent multi-counts for same user
                const sessionKey = 'shine_tech_visited';
                const hasVisited = sessionStorage.getItem(sessionKey);

                if (!docSnap.exists()) {
                    // Initialize if doesn't exist
                    await setDoc(statsRef, { count: 1 });
                    sessionStorage.setItem(sessionKey, 'true');
                } else if (!hasVisited) {
                    // Increment only if not visited in this session
                    await updateDoc(statsRef, {
                        count: increment(1)
                    });
                    sessionStorage.setItem(sessionKey, 'true');
                }
            } catch (error) {
                console.error("Error initializing visitor counter:", error);
            }
        };

        initializeCounter();

        // Real-time listener for the count
        const unsubscribe = onSnapshot(statsRef, (doc) => {
            if (doc.exists()) {
                setCount(doc.data().count);
                setIsLoaded(true);
            }
        });

        return () => unsubscribe();
    }, []);

    if (!isLoaded) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.8rem',
                padding: '0.6rem 1.2rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '30px',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}
        >
            <div style={{ position: 'relative' }}>
                <Users size={16} color="var(--primary)" />
                <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: '6px',
                        height: '6px',
                        background: 'var(--success)',
                        borderRadius: '50%',
                        boxShadow: '0 0 8px var(--success)'
                    }}
                />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Live Visitors:
                </span>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={count}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        style={{
                            fontSize: '0.9rem',
                            fontWeight: '900',
                            color: 'white',
                            textShadow: '0 0 10px rgba(255,255,255,0.3)'
                        }}
                    >
                        {count.toLocaleString()}
                    </motion.span>
                </AnimatePresence>
            </div>

            <div style={{ width: '1px', height: '12px', background: 'var(--glass-border)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Activity size={14} color="var(--success)" style={{ opacity: 0.7 }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: '700' }}>ONLINE</span>
            </div>
        </motion.div>
    );
};

export default VisitorCounter;
