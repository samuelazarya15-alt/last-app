import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Text, Stars, ContactShadows, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import * as THREE from 'three';

interface Prize3DOverlayProps {
  type: 'dog' | 'cat' | 'cow';
  onClose: () => void;
}

function Animal({ type }: { type: 'dog' | 'cat' | 'cow' }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.2;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  if (type === 'cow') {
    return (
      <group ref={groupRef}>
        {/* Body */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.5, 1, 2.5]} />
          <meshStandardMaterial color="#f5f5dc" />
        </mesh>
        {/* Hump (Zebu style) */}
        <mesh position={[0, 0.6, 0.5]} castShadow>
          <boxGeometry args={[0.8, 0.4, 0.8]} />
          <meshStandardMaterial color="#f5f5dc" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.5, 1.5]} castShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#f5f5dc" />
        </mesh>
        {/* Horns */}
        <mesh position={[0.3, 1, 1.5]} rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.05, 0.05, 0.5]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.3, 1, 1.5]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.05, 0.05, 0.5]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* Legs */}
        <mesh position={[0.5, -0.8, 0.8]} castShadow>
          <boxGeometry args={[0.3, 0.8, 0.3]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        <mesh position={[-0.5, -0.8, 0.8]} castShadow>
          <boxGeometry args={[0.3, 0.8, 0.3]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        <mesh position={[0.5, -0.8, -0.8]} castShadow>
          <boxGeometry args={[0.3, 0.8, 0.3]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        <mesh position={[-0.5, -0.8, -0.8]} castShadow>
          <boxGeometry args={[0.3, 0.8, 0.3]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        {/* Spots */}
        <mesh position={[0.76, 0.2, 0.5]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshStandardMaterial color="#3d2b1f" />
        </mesh>
      </group>
    );
  }

  if (type === 'dog') {
    return (
      <group ref={groupRef}>
        {/* Body */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.8, 0.8, 1.5]} />
          <meshStandardMaterial color="#d2b48c" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.6, 0.8]} castShadow>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial color="#d2b48c" />
        </mesh>
        {/* Ears */}
        <mesh position={[0.35, 1, 0.8]}>
          <boxGeometry args={[0.1, 0.4, 0.2]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        <mesh position={[-0.35, 1, 0.8]}>
          <boxGeometry args={[0.1, 0.4, 0.2]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        {/* Legs */}
        <mesh position={[0.3, -0.6, 0.5]} castShadow>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshStandardMaterial color="#d2b48c" />
        </mesh>
        <mesh position={[-0.3, -0.6, 0.5]} castShadow>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshStandardMaterial color="#d2b48c" />
        </mesh>
        <mesh position={[0.3, -0.6, -0.5]} castShadow>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshStandardMaterial color="#d2b48c" />
        </mesh>
        <mesh position={[-0.3, -0.6, -0.5]} castShadow>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshStandardMaterial color="#d2b48c" />
        </mesh>
        {/* Tail */}
        <mesh position={[0, 0.4, -0.8]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.5]} />
          <meshStandardMaterial color="#d2b48c" />
        </mesh>
      </group>
    );
  }

  // Cat
  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.6, 0.6, 1.2]} />
        <meshStandardMaterial color="#ffa500" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.5, 0.7]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#ffa500" />
      </mesh>
      {/* Ears */}
      <mesh position={[0.2, 0.8, 0.7]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.1, 0.2, 4]} />
        <meshStandardMaterial color="#ffa500" />
      </mesh>
      <mesh position={[-0.2, 0.8, 0.7]} rotation={[0, 0, -0.2]}>
        <coneGeometry args={[0.1, 0.2, 4]} />
        <meshStandardMaterial color="#ffa500" />
      </mesh>
      {/* Legs */}
      <mesh position={[0.2, -0.5, 0.4]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.2, -0.5, 0.4]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.2, -0.5, -0.4]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.2, -0.5, -0.4]} castShadow>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 0.3, -0.7]} rotation={[0.8, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.6]} />
        <meshStandardMaterial color="#ffa500" />
      </mesh>
    </group>
  );
}

export function Prize3DOverlay({ type, onClose }: Prize3DOverlayProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Play sound
    const audio = new Audio();
    if (type === 'cow') {
       // Simple mooo sound simulation or use a placeholder
       // For now let's use a generic win sound as I don't have animal sound assets
       // But I'll try to use the speech synthesis for the animal sound
       const utterance = new SpeechSynthesisUtterance("Moooooo!");
       utterance.pitch = 0.5;
       window.speechSynthesis.speak(utterance);
    } else if (type === 'dog') {
       const utterance = new SpeechSynthesisUtterance("Woof! Woof!");
       window.speechSynthesis.speak(utterance);
    } else {
       const utterance = new SpeechSynthesisUtterance("Meow!");
       window.speechSynthesis.speak(utterance);
    }

    const timer = setTimeout(() => {
      // Auto close after some time or wait for user click
    }, 5000);

    return () => clearTimeout(timer);
  }, [type]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute top-10 text-center"
        >
          <h2 className="text-5xl font-black text-yellow-400 drop-shadow-[0_4px_0_rgb(180,83,9)] mb-2">
            YOU WON A PRIZE!
          </h2>
          <p className="text-white text-2xl font-bold uppercase tracking-widest">
            A New {type.toUpperCase()} Friend!
          </p>
        </motion.div>

        <div className="w-full h-[60vh]">
          <Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} castShadow />
            <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
              <Animal type={type} />
            </Float>

            <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
            <Environment preset="city" />
            <OrbitControls enableZoom={false} autoRotate />
          </Canvas>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="mt-8 bg-yellow-400 text-yellow-900 px-12 py-4 rounded-full text-2xl font-black shadow-[0_8px_0_rgb(180,83,9)] active:translate-y-2 active:shadow-none transition-all"
        >
          AWESOME!
        </motion.button>
      </div>
    </motion.div>
  );
}
