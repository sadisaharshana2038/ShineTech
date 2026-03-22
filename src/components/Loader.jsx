import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Loader = ({ onFinished, ready }) => {
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const startTimeRef = React.useRef(Date.now());
    const minDuration = 400; // Snappier high-tech vibe
    const timeoutDuration = 8000; // 8s safety limit

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                const elapsed = Date.now() - startTimeRef.current;

                // 1. If everything is ready and min time passed, finish
                if (ready && elapsed >= minDuration) {
                    clearInterval(timer);
                    setIsComplete(true);
                    setTimeout(onFinished, 150); // Faster transition
                    return 100;
                }

                // 2. If data is ready but min time NOT passed, climb towards 100%
                if (ready) {
                    return Math.min(100, prev + 5);
                }

                // 3. If NOT ready, climb to 90% then crawl
                if (prev < 90) {
                    const targetProgress = (elapsed / 2000) * 90; // Aim for 90% in 2s
                    return Math.min(90, targetProgress);
                }

                // 4. Safety timeout
                if (elapsed >= timeoutDuration) {
                    clearInterval(timer);
                    setIsComplete(true);
                    setTimeout(onFinished, 200);
                    return 100;
                }

                return Math.min(99, prev + 0.1); // Slightly faster crawl
            });
        }, 16);

        return () => clearInterval(timer);
    }, [onFinished, ready]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
            transition={{ duration: 0.8 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: '#020305',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                overflow: 'hidden'
            }}
        >
            {/* Mesh Background */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.05) 0%, transparent 70%), radial-gradient(circle at 20% 80%, rgba(255, 0, 255, 0.05) 0%, transparent 50%)',
                zIndex: -2
            }} />

            {/* Digital Matrix Grid */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                zIndex: -1,
                opacity: 0.5
            }} />

            {/* Scanning Bar */}
            <motion.div
                animate={{ y: ['0%', '100%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100px',
                    background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.1), transparent)',
                    zIndex: 0
                }}
            />

            {/* Central Orbital System */}
            <div style={{ position: 'relative', width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                {/* Outer Rotating Ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        border: '1px dashed rgba(0, 255, 255, 0.2)',
                        borderRadius: '50%'
                    }}
                />

                {/* Main Progress Rings */}
                <svg width="280" height="280" viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--primary)" />
                            <stop offset="100%" stopColor="#ff00ff" />
                        </linearGradient>
                    </defs>

                    {/* Ghost Tracking Circle */}
                    <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />

                    {/* Primary Neon Ring */}
                    <motion.circle
                        cx="50" cy="50" r="46"
                        fill="none"
                        stroke="url(#neonGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        style={{
                            pathLength: progress / 100,
                            filter: 'drop-shadow(0 0 10px var(--primary-glow))'
                        }}
                    />

                    {/* Fragmented Ring Layer */}
                    {[0, 1, 2, 3].map((i) => (
                        <motion.circle
                            key={i}
                            cx="50" cy="50" r="40"
                            fill="none"
                            stroke="var(--primary)"
                            strokeWidth="1"
                            strokeDasharray="10 20"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
                        />
                    ))}
                </svg>

                {/* Core Percentage Readout */}
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <motion.div
                        style={{ display: 'flex', alignItems: 'flex-start' }}
                        animate={isComplete ? { scale: [1, 1.1, 1] } : {}}
                    >
                        <span style={{
                            fontSize: '5.5rem',
                            fontWeight: '950',
                            letterSpacing: '-4px',
                            fontFamily: '"Rajdhani", "Inter", sans-serif',
                            color: 'white',
                            textShadow: '0 0 20px rgba(0,255,255,0.5)'
                        }}>
                            {Math.round(progress)}
                        </span>
                        <span style={{
                            fontSize: '1.8rem',
                            fontWeight: '800',
                            color: '#ff00ff',
                            marginTop: '1.2rem',
                            marginLeft: '4px'
                        }}>%</span>
                    </motion.div>

                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        style={{
                            fontSize: '0.65rem',
                            letterSpacing: '0.6em',
                            color: 'var(--primary)',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            marginTop: '-10px'
                        }}
                    >
                        {isComplete ? 'System Ready' : 'Processing Core'}
                    </motion.div>
                </div>
            </div>

            {/* Floating Data Frangments */}
            <div style={{
                position: 'absolute',
                bottom: '10%',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '2rem',
                fontSize: '0.6rem',
                fontFamily: 'monospace',
                color: 'rgba(0, 255, 255, 0.3)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <span>ENCRYPT_STK: HIGH</span>
                    <span>LAYER_01: ACTIVE</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <span>SHINE_OS: V2.4.9</span>
                    <span>MEM_ALLOC: DONE</span>
                </div>
            </div>

            {/* Particle Glow */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                style={{
                    position: 'absolute',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, transparent 70%)',
                    zIndex: -1
                }}
            />
        </motion.div>
    );
};

export default Loader;
