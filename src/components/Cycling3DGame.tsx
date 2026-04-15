import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, PerspectiveCamera, Environment, ContactShadows, Sky } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { words as wordHelpersWords } from '../data/wordHelpers';
import { Prize3DOverlay } from './Prize3DOverlay';
import { voiceCoach } from '../lib/VoiceCoach';

function Rider({ position, color, word, isCorrect, onSelect, isAnimating }: any) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Pedal animation
      const pedalRotation = state.clock.elapsedTime * 10;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 15) * 0.05;
      
      if (isAnimating && isCorrect) {
        groupRef.current.position.z -= 0.2;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} onClick={onSelect}>
      {/* Bicycle Frame */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.1, 0.1, 1.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Wheels */}
      <mesh position={[0, 0.3, 0.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.3, 0.05, 16, 100]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, 0.3, -0.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.3, 0.05, 16, 100]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Rider Body */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[0.4, 0.8, 0.3]} />
        <meshStandardMaterial color="#ffebcd" />
      </mesh>
      {/* Helmet */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Word Label */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {word}
      </Text>
    </group>
  );
}

function Road() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material.map) {
        material.map.offset.y -= 0.05;
      }
    }
  });

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#fff';
    ctx.fillRect(60, 0, 8, 40);
    ctx.fillRect(60, 80, 8, 40);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 10);
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -20]} receiveShadow ref={meshRef}>
      <planeGeometry args={[10, 100]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

export function Cycling3DGame({ language, onBack, setDoveMessage, setDoveCheering }: any) {
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPrize, setShowPrize] = useState(false);
  const [prizeType, setPrizeType] = useState<'dog' | 'cat' | 'cow'>('dog');
  const [score, setScore] = useState(0);

  const startNewRound = () => {
    const shuffled = [...wordHelpersWords].sort(() => Math.random() - 0.5);
    const target = shuffled[0];
    const others = shuffled.slice(1, 3);
    const allOptions = [target, ...others].sort(() => Math.random() - 0.5);
    
    setCurrentWord(target);
    setOptions(allOptions);
    setIsAnimating(false);
    setDoveMessage(`Help the rider with: ${target.translations[language || 'english']}`);
  };

  useEffect(() => {
    startNewRound();
  }, []);

  const handleSelect = (id: number) => {
    if (isAnimating) return;

    if (id === currentWord.id) {
      setIsAnimating(true);
      setDoveCheering(true);
      voiceCoach.speak("Great hit!", language || 'english');
      setScore(s => s + 1);

      setTimeout(() => {
        setDoveCheering(false);
        if (score > 0 && score % 3 === 0) {
          const types: ('dog' | 'cat' | 'cow')[] = ['dog', 'cat', 'cow'];
          setPrizeType(types[Math.floor(Math.random() * types.length)]);
          setShowPrize(true);
        } else {
          startNewRound();
        }
      }, 2000);
    } else {
      voiceCoach.speak("Try again!", language || 'english');
    }
  };

  return (
    <div className="w-full h-full relative bg-sky-400 overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button onClick={onBack} className="bg-white/80 p-2 rounded-full shadow-lg">🏠</button>
        <div className="bg-white/80 px-4 py-2 rounded-full shadow-lg font-bold">Score: {score}</div>
      </div>

      <AnimatePresence>
        {currentWord && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-white/90 px-8 py-4 rounded-3xl shadow-xl border-4 border-blue-400 text-center"
          >
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Hit the bubble</p>
            <h2 className="text-3xl font-black text-blue-600">{currentWord.translations[language || 'english']}</h2>
          </motion.div>
        )}
      </AnimatePresence>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={50} />
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} castShadow />
        <Sky sunPosition={[100, 20, 100]} />
        
        <Environment preset="forest" />
        
        <Road />

        {/* Word Bubble in the middle */}
        <Float speed={5} rotationIntensity={0.2} floatIntensity={0.5}>
          <mesh position={[0, 1.5, -5]} castShadow>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="white" transparent opacity={0.6} />
            <Text
              position={[0, 0, 1.1]}
              fontSize={0.4}
              color="#1e40af"
              anchorX="center"
              anchorY="middle"
              font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
            >
              {currentWord?.tigrinya}
            </Text>
          </mesh>
        </Float>

        {options.map((opt, i) => (
          <Rider
            key={opt.id}
            position={[(i - 1) * 2.5, 0, 2]}
            color={['#ef4444', '#22c55e', '#eab308'][i]}
            word={opt.tigrinya}
            isCorrect={opt.id === currentWord?.id}
            onSelect={() => handleSelect(opt.id)}
            isAnimating={isAnimating}
          />
        ))}

        <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
      </Canvas>

      {showPrize && (
        <Prize3DOverlay 
          type={prizeType} 
          onClose={() => {
            setShowPrize(false);
            startNewRound();
          }} 
        />
      )}
    </div>
  );
}
