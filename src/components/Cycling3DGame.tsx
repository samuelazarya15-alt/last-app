import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, PerspectiveCamera, Environment, ContactShadows, Sky, Instances, Instance } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { words as wordHelpersWords } from '../data/wordHelpers';
import { Prize3DOverlay } from './Prize3DOverlay';
import { voiceCoach } from '../lib/VoiceCoach';

function DetailedPlayerPortrait() {
  const skinRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const eyeRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (skinRef.current) {
      skinRef.current.roughness = 0.15 + Math.sin(t * 0.5) * 0.05;
    }
  });

  return (
    <group position={[0, 0, -5]} rotation={[0, 0, 0]}>
      {/* Torso & Jersey */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.6, 1.2, 16, 32]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.9} />
      </mesh>
      
      {/* Head (Eritrean Descent) */}
      <group position={[0, 1.8, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.45, 64, 64]} />
          <meshPhysicalMaterial 
            ref={skinRef}
            color="#5d3a24" 
            roughness={0.2} 
            transmission={0.1} 
            thickness={0.5}
            clearcoat={0.3}
          />
        </mesh>

        {/* Curly Hair */}
        <group position={[0, 0.3, 0]}>
          {Array.from({ length: 150 }).map((_, i) => {
            const phi = Math.acos(-1 + (2 * i) / 150);
            const theta = Math.sqrt(150 * Math.PI) * phi;
            const x = 0.45 * Math.cos(theta) * Math.sin(phi);
            const y = 0.45 * Math.sin(theta) * Math.sin(phi);
            const z = 0.45 * Math.cos(phi);
            if (y < 0) return null;
            return (
              <mesh key={i} position={[x, y, z]} rotation={[Math.random(), Math.random(), Math.random()]}>
                <torusGeometry args={[0.03, 0.005, 8, 16, Math.PI]} />
                <meshStandardMaterial color="#1a0f08" />
              </mesh>
            );
          })}
        </group>

        {/* Eyes */}
        {[-0.12, 0.12].map((x, i) => (
          <group key={i} position={[x, 0.05, 0.38]}>
            <mesh><sphereGeometry args={[0.06, 32, 32]} /><meshStandardMaterial color="white" /></mesh>
            <mesh position={[0, 0, 0.03]}>
              <sphereGeometry args={[0.035, 32, 32]} />
              <meshPhysicalMaterial color="#3d2b1f" roughness={0} transmission={0.8} thickness={0.1} ior={1.4} />
            </mesh>
            <mesh position={[0, 0, 0.05]}><circleGeometry args={[0.015, 16]} /><meshBasicMaterial color="black" /></mesh>
            <mesh position={[0.02, 0.02, 0.06]}><sphereGeometry args={[0.008, 8, 8]} /><meshBasicMaterial color="white" /></mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function DetailedFrontRow() {
  const manSkinRef = useRef<THREE.MeshPhysicalMaterial>(null);
  return (
    <group position={[0, 0, 10]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 1.2, 0.5]}><boxGeometry args={[10, 0.1, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
      {[
        { x: -2, text: "ሀ ለ ሐ" },
        { x: 2, text: "መ ረ ሰ" }
      ].map((b, i) => (
        <group key={i} position={[b.x, 0.5, 0.55]}>
          <mesh><planeGeometry args={[3, 1.5]} /><meshStandardMaterial color="#1e40af" side={THREE.DoubleSide} /><Text position={[0, 0, 0.01]} fontSize={0.4} color="white">{b.text}</Text></mesh>
        </group>
      ))}
      {/* Exultant Man */}
      <group position={[-1.5, 0, 0]}>
        <mesh position={[0, 1.2, 0]} castShadow><capsuleGeometry args={[0.35, 0.7, 8, 16]} /><meshStandardMaterial color="#2d1b0d" roughness={0.4} /></mesh>
        <group position={[0, 2, 0]}>
          <mesh castShadow><sphereGeometry args={[0.3, 32, 32]} /><meshPhysicalMaterial ref={manSkinRef} color="#4a2c1a" roughness={0.2} transmission={0.1} thickness={0.5} /></mesh>
          <group position={[0, -0.1, 0.2]}>
            {Array.from({ length: 20 }).map((_, i) => (
              <mesh key={i} position={[(Math.random() - 0.5) * 0.4, -Math.random() * 0.2, 0.05]} rotation={[0.2, 0, 0]}><cylinderGeometry args={[0.005, 0.005, 0.1]} /><meshStandardMaterial color="#1a0f08" /></mesh>
            ))}
          </group>
        </group>
      </group>
      {/* Cheering Woman */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 1.2, 0]} castShadow><capsuleGeometry args={[0.3, 0.6, 8, 16]} /><meshStandardMaterial color="#ef4444" roughness={0.8} /></mesh>
        <group position={[0, 1.9, 0]}>
          <mesh castShadow><sphereGeometry args={[0.28, 32, 32]} /><meshPhysicalMaterial color="#fde68a" roughness={0.3} transmission={0.15} thickness={0.4} /></mesh>
          <mesh position={[0, -0.1, 0.25]}><circleGeometry args={[0.08, 32]} /><meshBasicMaterial color="#331111" /></mesh>
        </group>
      </group>
    </group>
  );
}

function ArenaCrowd() {
  const count = 3000;
  const tiers = 5;
  const spectatorsPerTier = Math.floor(count / tiers);
  
  const spectators = useMemo(() => {
    const temp = [];
    for (let t = 0; t < tiers; t++) {
      const radius = 15 + t * 3;
      const y = t * 2.5;
      for (let i = 0; i < spectatorsPerTier; i++) {
        const angle = (i / spectatorsPerTier) * Math.PI * 2;
        if (Math.abs(Math.sin(angle)) < 0.2) continue; 

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        temp.push({
          position: [x, y - 2, z] as [number, number, number],
          rotation: [0, -angle + Math.PI / 2, 0] as [number, number, number],
          color: new THREE.Color().setHSL(Math.random(), 0.8, 0.4),
          scale: 0.7 + Math.random() * 0.6,
          offset: Math.random() * Math.PI * 2
        });
      }
    }
    return temp;
  }, []);

  return (
    <group>
      <Instances range={spectators.length}>
        <capsuleGeometry args={[0.2, 0.5, 4, 8]} />
        <meshStandardMaterial roughness={0.5} />
        {spectators.map((s, i) => (
          <SpectatorInstance key={i} {...s} />
        ))}
      </Instances>
    </group>
  );
}

function SpectatorInstance({ position, rotation, color, scale, offset }: any) {
  const ref = useRef<any>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 5 + offset) * 0.1;
    }
  });
  return <Instance ref={ref} position={position} rotation={rotation} color={color} scale={scale} />;
}

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
  const [isCinematic, setIsCinematic] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

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
        <button onClick={() => { voiceCoach.playClick(); onBack(); }} className="bg-white/80 p-2 rounded-full shadow-lg">🏠</button>
        <div className="bg-white/80 px-4 py-2 rounded-full shadow-lg font-bold">Score: {score}</div>
        <button 
          onClick={() => {
            voiceCoach.playClick();
            setIsCinematic(!isCinematic);
            setIsPortrait(false);
          }}
          className={`px-4 py-2 rounded-full shadow-lg font-bold transition-all ${isCinematic ? 'bg-orange-500 text-white' : 'bg-white/80 text-orange-600'}`}
        >
          {isCinematic ? 'EXIT' : 'CINEMATIC 🎥'}
        </button>
        <button 
          onClick={() => {
            voiceCoach.playClick();
            setIsPortrait(!isPortrait);
            setIsCinematic(false);
          }}
          className={`px-4 py-2 rounded-full shadow-lg font-bold transition-all ${isPortrait ? 'bg-blue-500 text-white' : 'bg-white/80 text-blue-600'}`}
        >
          {isPortrait ? 'EXIT' : 'PORTRAIT 📸'}
        </button>
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
        <PerspectiveCamera 
          makeDefault 
          position={isPortrait ? [0, 1.5, 0] : isCinematic ? [0, 1, 12] : [0, 4, 8]} 
          fov={isPortrait ? 25 : isCinematic ? 30 : 50} 
        />
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} castShadow />
        <Sky sunPosition={[100, 20, 100]} />
        
        <Environment preset="forest" />
        
        <Road />
        <ArenaCrowd />
        {!isPortrait && <DetailedFrontRow />}
        {isPortrait && <DetailedPlayerPortrait />}

        {/* Word Bubble in the middle */}
        {!isPortrait && (
          <>
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
          </>
        )}

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
