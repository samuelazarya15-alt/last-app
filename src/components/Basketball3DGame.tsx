import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, PerspectiveCamera, Environment, ContactShadows, Stars, Sparkles, Instances, Instance, useTexture } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { words as wordHelpersWords } from '../data/wordHelpers';
import { Prize3DOverlay } from './Prize3DOverlay';
import { voiceCoach } from '../lib/VoiceCoach';

interface BallProps {
  id: number;
  word: string;
  position: [number, number, number];
  isCorrect: boolean;
  onSelect: (id: number) => void;
  isAnimating: boolean;
}

function GeezFireTrail({ position, isAnimating }: { position: THREE.Vector3, isAnimating: boolean }) {
  const letters = ['ኸ', 'ወ', 'ዐ', 'ዘ'];
  const trailRefs = useRef<THREE.Group[]>([]);

  useFrame((state) => {
    if (!isAnimating) return;
    const t = state.clock.elapsedTime;
    trailRefs.current.forEach((ref, i) => {
      if (ref) {
        // Dynamic comet tail motion
        const delay = (i + 1) * 0.15;
        const orbitRadius = 0.3 + Math.sin(t * 8 + i) * 0.2;
        const angle = t * 15 + i * (Math.PI / 2);
        
        const targetX = position.x + Math.cos(angle) * orbitRadius;
        const targetY = position.y + Math.sin(angle) * orbitRadius;
        const targetZ = position.z + delay * 10;

        ref.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.2);
        ref.scale.setScalar((1 - i * 0.15) * (1 + Math.sin(t * 20) * 0.3));
        ref.rotation.y += 0.2;
      }
    });
  });

  if (!isAnimating) return null;

  return (
    <group>
      {letters.map((char, i) => (
        <group key={i} ref={(el) => (trailRefs.current[i] = el!)}>
          {/* Flame Core */}
          <Text
            fontSize={0.8}
            color={i % 2 === 0 ? "#ff4500" : "#00bfff"} // Orange and Blue flames
          >
            {char}
          </Text>
          {/* Flame Aura */}
          <Sparkles count={15} scale={0.5} size={2} speed={2} color={i % 2 === 0 ? "#ff8c00" : "#00bfff"} />
          <pointLight intensity={2} distance={2} color={i % 2 === 0 ? "#ff4500" : "#00bfff"} />
        </group>
      ))}
    </group>
  );
}

function Ball({ id, word, position, isCorrect, onSelect, isAnimating }: BallProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [targetPos, setTargetPos] = useState<THREE.Vector3 | null>(null);
  const [currentPos, setCurrentPos] = useState(new THREE.Vector3(...position));

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      if (isAnimating && isCorrect && targetPos) {
        meshRef.current.position.lerp(targetPos, 0.1);
        meshRef.current.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.1);
        meshRef.current.scale.z = 1.8; // High-speed stretch
        setCurrentPos(meshRef.current.position.clone());
      } else if (!isAnimating) {
        meshRef.current.rotation.y += 0.01;
        meshRef.current.scale.setScalar(1);
      }
      
      // Pulsing magma effect
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.emissiveIntensity = 1 + Math.sin(t * 5) * 0.5;
      }
    }
  });

  const handleClick = () => {
    if (isCorrect) {
      setTargetPos(new THREE.Vector3(0, 4, -5)); // Position of the hoop
    }
    onSelect(id);
  };

  return (
    <>
      <Float speed={isAnimating ? 0 : 2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh
          ref={meshRef}
          position={position}
          onClick={handleClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          castShadow
        >
          <sphereGeometry args={[0.8, 64, 64]} />
          <meshStandardMaterial 
            color="#1a1a1a" // Obsidian base
            roughness={0.05}
            metalness={0.9}
            emissive="#ff4500" // Magma orange
            emissiveIntensity={1}
          />
          {/* Magma Characters on surface */}
          <group rotation={[0, 0, 0]}>
            <Text position={[0, 0, 0.81]} fontSize={0.4} color="#ff8c00">ሀ</Text>
            <Text position={[0, 0, -0.81]} rotation={[0, Math.PI, 0]} fontSize={0.4} color="#ff8c00">ለ</Text>
            <Text position={[0.81, 0, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.4} color="#ff8c00">ሐ</Text>
          </group>
          
          <Text
            position={[0, 0.5, 0.85]}
            fontSize={0.25}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {word}
          </Text>
          {isAnimating && isCorrect && (
            <Sparkles count={100} scale={2} size={4} speed={3} color="#ff4500" />
          )}
        </mesh>
      </Float>
      {isAnimating && isCorrect && <GeezFireTrail position={currentPos} isAnimating={isAnimating} />}
    </>
  );
}

function Hoop() {
  return (
    <group position={[0, 3, -6]}>
      {/* Backboard */}
      <mesh position={[0, 1, -0.5]} castShadow>
        <boxGeometry args={[4, 3, 0.1]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Rim */}
      <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.8, 0.05, 16, 100]} />
        <meshStandardMaterial color="red" />
      </mesh>
      {/* Net (Simplified) */}
      <mesh position={[0, -0.5, 0.5]} rotation={[Math.PI, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.5, 1, 16, 1, true]} />
        <meshStandardMaterial color="white" wireframe />
      </mesh>
      {/* Post */}
      <mesh position={[0, -3, -0.6]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

function Humanoid({ 
  position, 
  animState, 
  kitColor = "#ef4444", 
  shortColor = "#1e3a8a", 
  skinColor = "#fde68a"
}: { 
  position: [number, number, number], 
  animState: 'idle' | 'celebrate' | 'defend', 
  kitColor?: string, 
  shortColor?: string, 
  skinColor?: string
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    if (animState === 'idle') {
      // Breathing/Idle bobbing
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.05;
      if (leftArmRef.current) leftArmRef.current.rotation.z = 0.2 + Math.sin(t * 2) * 0.1;
      if (rightArmRef.current) rightArmRef.current.rotation.z = -0.2 - Math.sin(t * 2) * 0.1;
    } else if (animState === 'celebrate') {
      // Jumping and waving
      groupRef.current.position.y = position[1] + Math.abs(Math.sin(t * 10)) * 0.5;
      if (leftArmRef.current) leftArmRef.current.rotation.z = 2.5 + Math.sin(t * 15) * 0.5;
      if (rightArmRef.current) rightArmRef.current.rotation.z = -2.5 - Math.sin(t * 15) * 0.5;
    } else if (animState === 'defend') {
      // Side-to-side defensive stance
      groupRef.current.position.x = position[0] + Math.sin(t * 4) * 1.5;
      groupRef.current.position.y = position[1] + Math.abs(Math.sin(t * 8)) * 0.1;
      if (leftArmRef.current) leftArmRef.current.rotation.z = 1.2 + Math.sin(t * 10) * 0.2;
      if (rightArmRef.current) rightArmRef.current.rotation.z = -1.2 - Math.sin(t * 10) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Torso */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.6, 4, 8]} />
        <meshStandardMaterial color={kitColor} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      {/* Arms */}
      <group ref={leftArmRef} position={[-0.4, 1.5, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.4, 1.5, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
      </group>
      {/* Legs */}
      <mesh position={[-0.15, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.6, 4, 8]} />
        <meshStandardMaterial color={shortColor} />
      </mesh>
      <mesh position={[0.15, 0.4, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.6, 4, 8]} />
        <meshStandardMaterial color={shortColor} />
      </mesh>
    </group>
  );
}

function DetailedPlayerPortrait() {
  const skinRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const eyeRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const ballRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (skinRef.current) {
      // Sweat sheen pulsing
      skinRef.current.roughness = 0.15 + Math.sin(t * 0.5) * 0.05;
    }
  });

  return (
    <group position={[0, -0.5, 8]} rotation={[0, 0, 0]}>
      {/* 1. Torso & Jersey (Mesh Texture) */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.6, 1.2, 16, 32]} />
        <meshStandardMaterial 
          color="#3b82f6" 
          roughness={0.9} 
          metalness={0}
          // Simulate mesh weave with a high-frequency wireframe overlay or bump
          wireframe={false}
        />
      </mesh>
      {/* Jersey Trim */}
      <mesh position={[0, 1.1, 0]}>
        <torusGeometry args={[0.4, 0.05, 16, 100]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>

      {/* 2. Head (Eritrean Descent, Pore Detail, Sweat) */}
      <group position={[0, 1.8, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.45, 64, 64]} />
          <meshPhysicalMaterial 
            ref={skinRef}
            color="#5d3a24" // Rich Eritrean skin tone
            roughness={0.2} // Sweat sheen
            metalness={0}
            transmission={0.1} // SSS
            thickness={0.5}
            clearcoat={0.3} // Extra sweat layer
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Strained Neck Muscles (Simulated with cylinders) */}
        {[-0.2, 0.2].map((x, i) => (
          <mesh key={i} position={[x, -0.4, -0.1]} rotation={[0.2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.08, 0.6]} />
            <meshStandardMaterial color="#4d2a14" />
          </mesh>
        ))}

        {/* 3. Strand-based Curly Hair */}
        <group position={[0, 0.3, 0]}>
          {Array.from({ length: 150 }).map((_, i) => {
            const phi = Math.acos(-1 + (2 * i) / 150);
            const theta = Math.sqrt(150 * Math.PI) * phi;
            const x = 0.45 * Math.cos(theta) * Math.sin(phi);
            const y = 0.45 * Math.sin(theta) * Math.sin(phi);
            const z = 0.45 * Math.cos(phi);
            if (y < 0) return null; // Only top half
            return (
              <mesh key={i} position={[x, y, z]} rotation={[Math.random(), Math.random(), Math.random()]}>
                <torusGeometry args={[0.03, 0.005, 8, 16, Math.PI]} />
                <meshStandardMaterial color="#1a0f08" />
              </mesh>
            );
          })}
        </group>

        {/* 4. Refractive Eyes with Reflections */}
        {[-0.12, 0.12].map((x, i) => (
          <group key={i} position={[x, 0.05, 0.38]}>
            <mesh>
              <sphereGeometry args={[0.06, 32, 32]} />
              <meshStandardMaterial color="white" />
            </mesh>
            <mesh position={[0, 0, 0.03]}>
              <sphereGeometry args={[0.035, 32, 32]} />
              <meshPhysicalMaterial 
                ref={eyeRef}
                color="#3d2b1f" 
                roughness={0} 
                metalness={0.5}
                transmission={0.8}
                thickness={0.1}
                ior={1.4}
              />
            </mesh>
            {/* Pupil */}
            <mesh position={[0, 0, 0.05]}>
              <circleGeometry args={[0.015, 16]} />
              <meshBasicMaterial color="black" />
            </mesh>
            {/* Catch Light Reflection */}
            <mesh position={[0.02, 0.02, 0.06]}>
              <sphereGeometry args={[0.008, 8, 8]} />
              <meshBasicMaterial color="white" />
            </mesh>
          </group>
        ))}

        {/* 5. Triumphant Expression (Slight Smile) */}
        <mesh position={[0, -0.2, 0.4]} rotation={[0.1, 0, 0]}>
          <torusGeometry args={[0.12, 0.01, 8, 16, Math.PI]} />
          <meshBasicMaterial color="#331111" />
        </mesh>
      </group>

      {/* 6. High-Gloss Basketball */}
      <group position={[0.8, 1.2, 0.5]}>
        <mesh castShadow ref={ballRef}>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial 
            color="#d97706" 
            roughness={0.1} 
            metalness={0.2}
          />
        </mesh>
        {/* Ball Seams */}
        <mesh>
          <sphereGeometry args={[0.355, 32, 32]} />
          <meshStandardMaterial color="black" wireframe />
        </mesh>
      </group>
    </group>
  );
}

function DetailedFrontRow() {
  const manSkinRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const womanSkinRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const youngSkinRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Subtle facial/muscle movement simulation via scale/position
    if (manSkinRef.current) manSkinRef.current.emissiveIntensity = 0.1 + Math.sin(t * 2) * 0.05;
  });

  return (
    <group position={[0, -1.5, 12.5]} rotation={[0, Math.PI, 0]}>
      {/* Railing with Ge'ez Banners */}
      <mesh position={[0, 1.2, 0.5]}>
        <boxGeometry args={[10, 0.1, 0.1]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {[
        { x: -2, text: "ሀ ለ ሐ" },
        { x: 2, text: "መ ረ ሰ" }
      ].map((b, i) => (
        <group key={i} position={[b.x, 0.5, 0.55]}>
          <mesh>
            <planeGeometry args={[3, 1.5]} />
            <meshStandardMaterial color="#1e40af" side={THREE.DoubleSide} />
            <Text position={[0, 0, 0.01]} fontSize={0.4} color="white">{b.text}</Text>
          </mesh>
        </group>
      ))}

      {/* 1. Exultant Man (Beard, Sweat, Pores) */}
      <group position={[-1.5, 0, 0]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <capsuleGeometry args={[0.35, 0.7, 8, 16]} />
          <meshStandardMaterial color="#2d1b0d" roughness={0.4} />
        </mesh>
        <group position={[0, 2, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.3, 32, 32]} />
            <meshPhysicalMaterial 
              ref={manSkinRef}
              color="#4a2c1a" 
              roughness={0.2} // Sweat sheen
              metalness={0.1}
              transmission={0.1} // SSS simulation
              thickness={0.5}
            />
          </mesh>
          {/* Strand-based Beard (Simulated with many small cylinders) */}
          <group position={[0, -0.1, 0.2]}>
            {Array.from({ length: 20 }).map((_, i) => (
              <mesh key={i} position={[(Math.random() - 0.5) * 0.4, -Math.random() * 0.2, 0.05]} rotation={[0.2, 0, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 0.1]} />
                <meshStandardMaterial color="#1a0f08" />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      {/* 2. Cheering Woman (Open-mouthed, Knit Jersey) */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <capsuleGeometry args={[0.3, 0.6, 8, 16]} />
          <meshStandardMaterial 
            color="#ef4444" 
            roughness={0.8} // Knit texture simulation
            metalness={0}
          />
        </mesh>
        <group position={[0, 1.9, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.28, 32, 32]} />
            <meshPhysicalMaterial 
              ref={womanSkinRef}
              color="#fde68a" 
              roughness={0.3}
              transmission={0.15}
              thickness={0.4}
            />
          </mesh>
          {/* Open Mouth */}
          <mesh position={[0, -0.1, 0.25]}>
            <circleGeometry args={[0.08, 32]} />
            <meshBasicMaterial color="#331111" />
          </mesh>
        </group>
      </group>

      {/* 3. Younger Fan (Intense Excitement, Eye Reflections) */}
      <group position={[1.5, 0, 0]}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
        <group position={[0, 1.8, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.25, 32, 32]} />
            <meshPhysicalMaterial 
              ref={youngSkinRef}
              color="#fcd34d" 
              roughness={0.25}
              transmission={0.2}
              thickness={0.3}
            />
          </mesh>
          {/* Detailed Eyes with Reflections */}
          {[-0.08, 0.08].map((x, i) => (
            <group key={i} position={[x, 0.05, 0.22]}>
              <mesh>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshStandardMaterial color="white" />
              </mesh>
              <mesh position={[0, 0, 0.02]}>
                <sphereGeometry args={[0.02, 16, 16]} />
                <meshStandardMaterial color="black" roughness={0} metalness={1} />
              </mesh>
              {/* Eye Reflection */}
              <mesh position={[0.01, 0.01, 0.03]}>
                <sphereGeometry args={[0.005, 8, 8]} />
                <meshBasicMaterial color="white" />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

function ArenaCrowd() {
  const count = 2000;
  const tiers = 8;
  const spectatorsPerTier = Math.floor(count / tiers);
  
  const spectators = useMemo(() => {
    const temp = [];
    for (let t = 0; t < tiers; t++) {
      const radius = 14 + t * 2.5;
      const y = t * 2;
      for (let i = 0; i < spectatorsPerTier; i++) {
        const angle = (i / spectatorsPerTier) * Math.PI * 2;
        // Skip the court area (roughly)
        if (Math.abs(Math.sin(angle)) < 0.15) continue; 

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
      {/* Banners */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 11.5;
        const z = Math.sin(angle) * 11.5;
        return (
          <group key={i} position={[x, 2, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
            <mesh>
              <planeGeometry args={[4, 1.5]} />
              <meshStandardMaterial color="#1e40af" side={THREE.DoubleSide} />
              <Text
                position={[0, 0, 0.01]}
                fontSize={0.5}
                color="white"
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
              >
                ኸ ወ ዐ ዘ
              </Text>
            </mesh>
          </group>
        );
      })}

      {/* Instanced Spectators */}
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
      // Cheering animation
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 5 + offset) * 0.1;
    }
  });
  return <Instance ref={ref} position={position} rotation={rotation} color={color} scale={scale} />;
}

export function Basketball3DGame({ language, onBack, setDoveMessage, setDoveCheering }: any) {
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPrize, setShowPrize] = useState(false);
  const [prizeType, setPrizeType] = useState<'dog' | 'cat' | 'cow'>('dog');
  const [score, setScore] = useState(0);
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'celebrate'>('idle');
  const [defenderAnim, setDefenderAnim] = useState<'idle' | 'celebrate' | 'defend'>('defend');
  const [isCinematic, setIsCinematic] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  const startNewRound = () => {
    const shuffled = [...wordHelpersWords].sort(() => Math.random() - 0.5);
    const target = shuffled[0];
    const others = shuffled.slice(1, 4);
    const allOptions = [target, ...others].sort(() => Math.random() - 0.5);
    
    setCurrentWord(target);
    setOptions(allOptions);
    setIsAnimating(false);
    setPlayerAnim('idle');
    setDefenderAnim('defend');
    setDoveMessage(`Find the ball for: ${target.translations[language || 'english']}`);
  };

  useEffect(() => {
    startNewRound();
  }, []);

  const handleSelect = (id: number) => {
    if (isAnimating) return;
    voiceCoach.playClick();

    if (id === currentWord.id) {
      setIsAnimating(true);
      setDoveCheering(true);
      setPlayerAnim('celebrate');
      setDefenderAnim('idle'); // Defender stops defending when goal is scored
      voiceCoach.speak("Goal!", language || 'english');
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
    <div className="w-full h-full relative bg-slate-900 overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button 
          onClick={() => {
            voiceCoach.playClick();
            onBack();
          }} 
          className="bg-white/80 p-2 rounded-full shadow-lg"
        >
          🏠
        </button>
        <div className="bg-white/80 px-4 py-2 rounded-full shadow-lg font-bold">Score: {score}</div>
        <button 
          onClick={() => {
            voiceCoach.playClick();
            setIsCinematic(!isCinematic);
            setIsPortrait(false);
          }}
          className={`px-4 py-2 rounded-full shadow-lg font-bold transition-all ${isCinematic ? 'bg-orange-500 text-white' : 'bg-white/80 text-orange-600'}`}
        >
          {isCinematic ? 'Exit Cinematic' : 'Cinematic View 🎥'}
        </button>
        <button 
          onClick={() => {
            voiceCoach.playClick();
            setIsPortrait(!isPortrait);
            setIsCinematic(false);
          }}
          className={`px-4 py-2 rounded-full shadow-lg font-bold transition-all ${isPortrait ? 'bg-blue-500 text-white' : 'bg-white/80 text-blue-600'}`}
        >
          {isPortrait ? 'Exit Portrait' : 'Action Portrait 📸'}
        </button>
      </div>

      <AnimatePresence>
        {currentWord && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-white/90 px-8 py-4 rounded-3xl shadow-xl border-4 border-orange-400 text-center"
          >
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Find the ball</p>
            <h2 className="text-3xl font-black text-orange-600">{currentWord.translations[language || 'english']}</h2>
          </motion.div>
        )}
      </AnimatePresence>

      <Canvas shadows>
        <PerspectiveCamera 
          makeDefault 
          position={isPortrait ? [0, 1.5, 12] : isCinematic ? [0, 1, 15] : [0, 4, 12]} 
          fov={isPortrait ? 25 : isCinematic ? 30 : 50} 
        />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ff8c00" castShadow />
        <spotLight position={[0, 10, 0]} intensity={2} color="#00bfff" castShadow />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={200} scale={20} size={1} speed={0.2} color="#ffd700" />
        
        <Environment preset="night" />
        
        {/* Arena Lighting */}
        <spotLight position={[15, 20, 15]} angle={0.3} penumbra={1} intensity={2} color="#ffffff" castShadow />
        <spotLight position={[-15, 20, -15]} angle={0.3} penumbra={1} intensity={2} color="#ffffff" castShadow />
        <spotLight position={[15, 20, -15]} angle={0.3} penumbra={1} intensity={2} color="#ffffff" castShadow />
        <spotLight position={[-15, 20, 15]} angle={0.3} penumbra={1} intensity={2} color="#ffffff" castShadow />
        
        <ArenaCrowd />
        {!isPortrait && <DetailedFrontRow />}
        {isPortrait && <DetailedPlayerPortrait />}
        
        {/* Court */}
        {!isPortrait && (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#1a2e1a" roughness={0.8} />
            </mesh>
            
            <Hoop />

            {/* Characters */}
            <Humanoid 
              position={[-4, -2, 4]} 
              animState={playerAnim} 
              kitColor="#3b82f6" 
              shortColor="#1e3a8a" 
              skinColor="#5d3a24"
            />
            <Humanoid 
              position={[0, -2, -4]} 
              animState={defenderAnim} 
              kitColor="#ef4444" 
              shortColor="#7f1d1d" 
              skinColor="#fde68a"
            />

            {options.map((opt, i) => (
              <Ball
                key={opt.id}
                id={opt.id}
                word={opt.tigrinya}
                position={[(i - 1.5) * 2.5, 0, 2]}
                isCorrect={opt.id === currentWord?.id}
                onSelect={handleSelect}
                isAnimating={isAnimating}
              />
            ))}
          </>
        )}

        <ContactShadows position={[0, -1.9, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI/4} maxPolarAngle={Math.PI/2} />
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
