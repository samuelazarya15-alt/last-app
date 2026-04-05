import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Text, Float, ContactShadows, useHelper, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Timer, ArrowLeft, Star, Flame, Snowflake } from 'lucide-react';
import { words } from '../data/wordHelpers';
import { logGameSession } from '../lib/progress';
import { voiceCoach } from '../lib/VoiceCoach';

// --- 3D Components ---

function Pitch() {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      {/* Grass with stripes */}
      {[...Array(12)].map((_, i) => (
        <mesh key={i} position={[0, -30 + i * 5 + 2.5, 0]} receiveShadow>
          <planeGeometry args={[40, 5]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#2d5a27" : "#346b2d"} />
        </mesh>
      ))}
      
      {/* Outer Boundary */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[38, 58]} />
        <meshStandardMaterial color="white" wireframe />
      </mesh>

      {/* Center Line */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[38, 0.1]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Center Circle */}
      <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[4.9, 5, 64]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Penalty Area (Bottom) */}
      <group position={[0, -24, 0.02]}>
        <mesh>
          <planeGeometry args={[16, 10]} />
          <meshStandardMaterial color="white" wireframe />
        </mesh>
        <mesh position={[0, 5, 0]} rotation={[0, 0, Math.PI]}>
          <ringGeometry args={[3.9, 4, 64, 1, 0, Math.PI]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </group>

      {/* Penalty Area (Top) */}
      <group position={[0, 24, 0.02]}>
        <mesh>
          <planeGeometry args={[16, 10]} />
          <meshStandardMaterial color="white" wireframe />
        </mesh>
        <mesh position={[0, -5, 0]}>
          <ringGeometry args={[3.9, 4, 64, 1, 0, Math.PI]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </group>

      {/* Corner Flags */}
      {[[-19, -29], [19, -29], [-19, 29], [19, 29]].map(([x, y], i) => (
        <group key={i} position={[x, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 2]} />
            <meshStandardMaterial color="yellow" />
          </mesh>
          <mesh position={[0.25, 1.8, 0]}>
            <planeGeometry args={[0.5, 0.4]} />
            <meshStandardMaterial color="red" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Goal() {
  return (
    <group position={[0, 0, -25]}>
      {/* Posts */}
      <mesh position={[-4, 2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 4]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[4, 2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 4]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0, 4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 8.2]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Net - More detailed */}
      <mesh position={[0, 2, -1.5]} receiveShadow>
        <boxGeometry args={[8, 4, 3]} />
        <meshStandardMaterial color="white" wireframe opacity={0.1} transparent />
      </mesh>
      {/* Back supports */}
      <mesh position={[-4, 0, -3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 6]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[4, 0, -3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 6]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
}

function Ball({ position, type }: { position: [number, number, number], type: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  const getColor = () => {
    if (type === 'golden') return '#FFD700';
    if (type === 'fire') return '#FF4500';
    if (type === 'ice') return '#00BFFF';
    return 'white';
  };

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <sphereGeometry args={[0.4, 32, 32]} />
      <meshStandardMaterial 
        color={getColor()} 
        emissive={type !== 'standard' ? getColor() : 'black'}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

function Scoreboard({ score, time }: { score: number, time: number }) {
  return (
    <group position={[0, 10, -28]}>
      <mesh castShadow>
        <boxGeometry args={[10, 5, 0.5]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <Text
        position={[0, 1, 0.3]}
        fontSize={1}
        color="white"
      >
        SCORE: {score}
      </Text>
      <Text
        position={[0, -1, 0.3]}
        fontSize={1}
        color={time <= 10 ? "red" : "white"}
      >
        TIME: {time}s
      </Text>
    </group>
  );
}

function Humanoid({ 
  position, 
  animState, 
  kitColor = "#ef4444", 
  shortColor = "#1e3a8a", 
  skinColor = "#fde68a",
  targetX = 0,
  isKicking = false
}: { 
  position: [number, number, number], 
  animState: string, 
  kitColor?: string, 
  shortColor?: string, 
  skinColor?: string,
  targetX?: number,
  isKicking?: boolean
}) {
  const groupRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;
    const lerpSpeed = 0.3; // Faster response

    let targetPos = [...position];
    let targetRotLegL = 0;
    let targetRotLegR = 0;
    let targetRotArmL = 0;
    let targetRotArmR = 0;
    let targetRotTorso = 0;
    let targetHeadY = 2.4;
    let targetArmLZ = 0;
    let targetArmRZ = 0;

    if (animState === 'run') {
      groupRef.current.position.z -= delta * 12;
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.05;
      
      const runSpeed = 15;
      const swing = Math.sin(t * runSpeed) * 0.8;
      const bob = Math.abs(Math.sin(t * runSpeed)) * 0.3;
      
      targetPos[1] = bob;
      targetRotLegL = swing;
      targetRotLegR = -swing;
      targetRotArmL = -swing * 1.2;
      targetRotArmR = swing * 1.2;
      targetRotTorso = Math.sin(t * runSpeed) * 0.1;
      targetHeadY = 2.4 + Math.sin(t * runSpeed * 2) * 0.05;

    } else if (animState === 'kick') {
      targetRotLegR = -Math.PI / 2.2;
      targetRotLegL = Math.PI / 6;
      targetRotArmL = Math.PI / 4;
      targetRotArmR = -Math.PI / 4;
      targetRotTorso = -0.2;
    } else if (animState === 'celebrate') {
      const jump = Math.abs(Math.sin(t * 12)) * 1.2;
      targetPos[1] = jump;
      targetRotArmR = -Math.PI / 1.2;
      targetArmRZ = -0.5;
      targetRotArmL = Math.sin(t * 15) * 0.5;
      targetArmLZ = 1.2;
      targetRotLegL = -0.2;
      targetRotLegR = -0.2;
    } else if (animState === 'miss') {
      targetHeadY = 2.1;
      targetRotTorso = 0.4;
      const headShake = Math.sin(t * 8) * 0.3;
      if (headRef.current) headRef.current.rotation.y = headShake;
      targetRotArmL = 0.3;
      targetRotArmR = -0.3;
      targetArmLZ = 0.2;
      targetArmRZ = -0.2;
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, position[2], 0.05);
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, position[0], 0.05);
    } else if (animState === 'dive-left') {
      targetPos[0] = -3;
      targetPos[1] = 0.5;
      groupRef.current.rotation.z = Math.PI / 2.5;
      targetRotArmL = Math.PI / 2;
      targetRotArmR = Math.PI / 2;
    } else if (animState === 'dive-right') {
      targetPos[0] = 3;
      targetPos[1] = 0.5;
      groupRef.current.rotation.z = -Math.PI / 2.5;
      targetRotArmL = -Math.PI / 2;
      targetRotArmR = -Math.PI / 2;
    } else {
      targetPos[1] = Math.sin(t * 2) * 0.05;
      targetRotArmL = Math.sin(t * 2) * 0.1;
      targetRotArmR = -Math.sin(t * 2) * 0.1;
      targetHeadY = 2.4 + Math.sin(t * 2) * 0.02;
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, position[2], 0.1);
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, position[0], 0.1);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
    }

    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetPos[1], lerpSpeed);
    if (animState !== 'run' && animState !== 'miss') {
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetPos[0], lerpSpeed);
    }

    if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, targetRotLegL, lerpSpeed);
    if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, targetRotLegR, lerpSpeed);
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, targetRotArmL, lerpSpeed);
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, targetArmLZ, lerpSpeed);
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, targetRotArmR, lerpSpeed);
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetArmRZ, lerpSpeed);
    }
    if (torsoRef.current) torsoRef.current.rotation.y = THREE.MathUtils.lerp(torsoRef.current.rotation.y, targetRotTorso, lerpSpeed);
    if (headRef.current) headRef.current.position.y = THREE.MathUtils.lerp(headRef.current.position.y, targetHeadY, lerpSpeed);
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Torso - Jersey */}
      <mesh ref={torsoRef} position={[0, 1.5, 0]} castShadow>
        <capsuleGeometry args={[0.35, 0.8, 4, 8]} />
        <meshStandardMaterial color={kitColor} />
      </mesh>
      {/* Head */}
      <mesh ref={headRef} position={[0, 2.4, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color={skinColor} />
        {/* Eyes */}
        <mesh position={[-0.1, 0.05, 0.22]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[0.1, 0.05, 0.22]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </mesh>
      {/* Legs - Shorts & Socks */}
      <group position={[-0.22, 0.5, 0]} ref={leftLegRef}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.12, 0.5]} />
          <meshStandardMaterial color={shortColor} />
        </mesh>
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.6]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0, -0.45, 0.1]} castShadow>
          <boxGeometry args={[0.2, 0.15, 0.4]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </group>
      <group position={[0.22, 0.5, 0]} ref={rightLegRef}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.12, 0.5]} />
          <meshStandardMaterial color={shortColor} />
        </mesh>
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.6]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0, -0.45, 0.1]} castShadow>
          <boxGeometry args={[0.2, 0.15, 0.4]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </group>
      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.5, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.5, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
    </group>
  );
}

function Player({ position, isKicking, targetX, isGoal }: { position: [number, number, number], isKicking: boolean, targetX: number, isGoal: boolean | null }) {
  const [animState, setAnimState] = useState<'idle' | 'run' | 'kick' | 'celebrate' | 'miss'>('idle');

  useEffect(() => {
    if (isKicking) {
      setAnimState('run');
      setTimeout(() => setAnimState('kick'), 250); // Faster run-to-kick
    }
  }, [isKicking]);

  useEffect(() => {
    if (isGoal === true) {
      setAnimState('celebrate');
      setTimeout(() => setAnimState('idle'), 3000);
    } else if (isGoal === false) {
      setAnimState('miss');
      setTimeout(() => setAnimState('idle'), 2000);
    }
  }, [isGoal]);

  return (
    <Humanoid 
      position={position} 
      animState={animState} 
      targetX={targetX} 
      isKicking={isKicking}
      kitColor="#ef4444" // Red Kit
      shortColor="#1e3a8a" // Blue Shorts
    />
  );
}

function Goalkeeper({ ballPos, isKicking, targetX }: { ballPos: [number, number, number], isKicking: boolean, targetX: number }) {
  const [animState, setAnimState] = useState<'idle' | 'dive-left' | 'dive-right'>('idle');
  const [currentX, setCurrentX] = useState(0);
  const pos: [number, number, number] = [currentX, 0, -24.5];

  useEffect(() => {
    if (isKicking) {
      // Goalkeeper reacts faster
      const reactionDelay = 150 + Math.random() * 100;
      
      setTimeout(() => {
        const moveTarget = targetX * 0.9;
        setCurrentX(moveTarget);

        if (Math.abs(targetX) > 1.2) {
          setAnimState(targetX > 0 ? 'dive-right' : 'dive-left');
        }
      }, reactionDelay);

      setTimeout(() => {
        setAnimState('idle');
        setCurrentX(0);
      }, 2000);
    }
  }, [isKicking, targetX]);

  return (
    <Humanoid 
      position={pos} 
      animState={animState} 
      kitColor="#fbbf24" // Yellow GK Kit
      shortColor="#1f2937" // Dark Shorts
      skinColor="#fde68a"
    />
  );
}

// --- Main Component ---

type BallType = 'standard' | 'golden' | 'fire' | 'ice';

export function StadiumGame({ language, onBack, setDoveMessage, setDoveCheering }: any) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [currentTarget, setCurrentTarget] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<{id: string, index: number} | null>(null);
  const [level, setLevel] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [ballType, setBallType] = useState<BallType>('standard');
  const [ballPos, setBallPos] = useState<[number, number, number]>([0, 0.4, -15]);
  const [targetX, setTargetX] = useState(0);
  const [isGoal, setIsGoal] = useState<boolean | null>(null);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setLevel(1);
    setGameState('playing');
    setIsGoal(null);
    nextRound(1);
    setDoveMessage("Kick the ball to the matching Tigrinya word!");
  };

  const nextRound = useCallback((currentLevel: number) => {
    let actionWords = words.filter(w => w.category === 'Verbs' || w.category === 'Nature' || w.category === 'Sports');
    if (actionWords.length === 0) actionWords = words; // Fallback to all words if filter is empty

    let numOptions = 2;
    if (currentLevel === 2) numOptions = 3;
    if (currentLevel >= 3) numOptions = 4;

    const target = actionWords[Math.floor(Math.random() * actionWords.length)];
    setCurrentTarget(target);
    
    const opts = new Set<any>();
    opts.add(target);
    while (opts.size < Math.min(numOptions, actionWords.length)) {
      const randomWord = actionWords[Math.floor(Math.random() * actionWords.length)];
      if (randomWord) opts.add(randomWord);
    }
    
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    
    const rand = Math.random();
    if (rand > 0.9) setBallType('golden');
    else if (rand > 0.8) setBallType('fire');
    else if (rand > 0.7) setBallType('ice');
    else setBallType('standard');

    setBallPos([0, 0.4, -15]);
    setIsAnimating(false);
    setIsGoal(null);
    setSelectedOption(null);

    const targetLang = language || 'english';
    const translation = target.translations[targetLang as keyof typeof target.translations];
    voiceCoach.playDualAudio(translation, targetLang, target.audioUrl);
  }, [language]);

  const handleSelect = (id: string, index: number) => {
    if (gameState !== 'playing' || !currentTarget || isAnimating) return;
    setSelectedOption({ id, index });
    voiceCoach.playSfx('pop');
  };

  const handleKick = () => {
    if (!selectedOption || isAnimating) return;

    const { id, index } = selectedOption;
    setIsAnimating(true);
    setIsGoal(null);
    voiceCoach.playSfx('kick');

    const isCorrect = id === currentTarget.id;
    
    // Calculate target X
    let x = (index - (options.length - 1) / 2) * 3;
    
    if (!isCorrect) {
      if (Math.abs(x) < 4) {
        x = x < 0 ? -6 : 6;
      }
    } else {
      if (Math.abs(x) >= 4) {
        x = x < 0 ? -2 : 2;
      }
    }
    
    setTargetX(x);

    // Animate ball
    let startTime = performance.now();
    const animateBall = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / 600, 1);
      
      const newZ = -15 - progress * 15;
      const newX = progress * x;
      
      const heightMultiplier = isCorrect ? 2 : 3; 
      const newY = 0.4 + Math.sin(progress * Math.PI) * heightMultiplier;
      
      setBallPos([newX, newY, newZ]);

      if (progress < 1) {
        requestAnimationFrame(animateBall);
      } else {
        checkResult(id);
      }
    };
    
    setTimeout(() => requestAnimationFrame(animateBall), 250);
  };

  const checkResult = (id: string) => {
    if (id === currentTarget.id) {
      setIsGoal(true);
      voiceCoach.playCorrect();
      setDoveCheering(true);
      
      let points = 10;
      let message = "GOAL! Great job!";
      let confettiColors = ['#FFD700', '#00FF00', '#0000FF', '#FF0000'];

      if (ballType === 'golden') {
        points = 30;
        message = "GOLDEN GOAL! +30 points!";
        confettiColors = ['#FFD700', '#FFFACD', '#DAA520'];
      } else if (ballType === 'fire') {
        points = 20;
        message = "FIRE SHOT! +20 points!";
        confettiColors = ['#FF4500', '#FF8C00', '#FF0000'];
      } else if (ballType === 'ice') {
        points = 15;
        message = "COOL GOAL! +15 points!";
        confettiColors = ['#00BFFF', '#87CEEB', '#FFFFFF'];
      }

      setDoveMessage(message);
      const newScore = score + points;
      setScore(newScore);
      
      let nextLevel = level;
      if (newScore > 0 && newScore % 50 === 0) {
        nextLevel += 1;
        setLevel(nextLevel);
        setDoveMessage(`Level Up! You are now level ${nextLevel}!`);
        voiceCoach.playSfx('success');
      }
      
      confetti({
        particleCount: ballType === 'golden' ? 250 : 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: confettiColors
      });

      setTimeout(() => {
        setIsGoal(null);
        setDoveCheering(false);
        nextRound(nextLevel);
      }, 2000);
    } else {
      setIsGoal(false);
      voiceCoach.playIncorrect();
      setDoveMessage("MISSED! Try again!");
      setTimeout(() => {
        setIsGoal(null);
        setIsAnimating(false);
        setBallPos([0, 0.4, -15]);
      }, 2000); // Wait longer for the miss animation to finish
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('end');
      logGameSession('football', score, 60);
      setDoveMessage(`Great job! You scored ${score} points!`);
    }
  }, [timeLeft, gameState, score]);

  return (
    <div className="flex flex-col items-center justify-start w-full h-full relative overflow-hidden bg-sky-400">
      {/* Header - Truly out of the stadium area */}
      <div className="w-full bg-white/95 backdrop-blur-md z-20 shadow-lg border-b-4 border-green-500/30">
        <div className="w-full flex justify-between items-center px-4 py-2">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center shadow-md text-green-600 hover:scale-110 active:scale-95 transition-all border-2 border-green-100"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex gap-2">
            <div className="bg-blue-50 px-3 py-1 rounded-xl shadow-sm flex items-center gap-1 border border-blue-100">
              <span className="font-black text-blue-700 text-xs tracking-tight">LVL {level}</span>
            </div>
            <div className="bg-yellow-50 px-3 py-1 rounded-xl shadow-sm flex items-center gap-1 border border-yellow-100">
              <Trophy className="text-yellow-600" size={14} />
              <span className="font-black text-yellow-700 text-xs tracking-tight">{score}</span>
            </div>
            <div className="bg-red-50 px-3 py-1 rounded-xl shadow-sm flex items-center gap-1 border border-red-100">
              <Timer className={timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-red-400"} size={14} />
              <span className={`font-black text-xs tracking-tight ${timeLeft <= 10 ? "text-red-600" : "text-gray-700"}`}>{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Eye-catching Question Box - Now part of the solid header */}
        <AnimatePresence>
          {gameState === 'playing' && currentTarget && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 py-3 text-center shadow-inner"
            >
              <p className="text-white/80 font-black text-[10px] uppercase tracking-[0.3em] leading-none mb-1">Target Word</p>
              <h3 className="text-4xl font-black text-white leading-tight drop-shadow-lg tracking-tight">
                {currentTarget.translations[language || 'english']}
              </h3>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0 pt-32">
        <Canvas shadows camera={{ position: [0, 8, 10], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <directionalLight 
            position={[10, 20, 10]} 
            intensity={2} 
            castShadow 
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-10, 10, -10]} intensity={1} color="#ffffff" />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            maxPolarAngle={Math.PI / 2.1} 
            minPolarAngle={Math.PI / 4}
            target={[0, 0, -10]}
          />

          <Pitch />
          <Goal />
          <Ball position={ballPos} type={ballType} />
          <Player position={[0, 0, -10]} isKicking={isAnimating} targetX={targetX} isGoal={isGoal} />
          <Goalkeeper ballPos={ballPos} isKicking={isAnimating} targetX={targetX} />
          <ContactShadows opacity={0.4} scale={40} blur={2} far={10} />
          <Sky sunPosition={[100, 20, 100]} />

          <Suspense fallback={null}>
            <Scoreboard score={score} time={timeLeft} />
          </Suspense>
        </Canvas>
      </div>

      {/* Header */}
      {/* (Moved to top of return) */}

      <AnimatePresence mode="wait">
        {gameState === 'start' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center flex-1 z-10"
          >
            <div className="text-6xl mb-6">⚽</div>
            <h2 className="text-4xl font-black text-white mb-4 text-center drop-shadow-lg">3D Word Football</h2>
            <p className="text-white font-bold mb-8 text-center max-w-xs drop-shadow-md">
              Score goals by matching Tigrinya words!
            </p>
            <button 
              onClick={startGame}
              className="bg-white text-green-600 px-12 py-4 rounded-3xl font-black text-2xl shadow-xl hover:scale-105 transition-transform"
            >
              START!
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && currentTarget && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-end flex-1 w-full max-w-md z-10 pb-6 pointer-events-none"
          >
            {/* Kick Ball Button */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: selectedOption ? 1 : 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleKick}
              disabled={isAnimating}
              className="bg-orange-500 text-white px-12 py-4 rounded-full font-black text-2xl shadow-[0_8px_0_rgb(194,65,12)] border-2 border-white mb-6 pointer-events-auto active:translate-y-2 active:shadow-none transition-all"
            >
              KICK BALL! ⚽
            </motion.button>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3 w-full px-6 pointer-events-auto">
              {options.map((item, index) => (
                <motion.button
                  key={item.id}
                  disabled={isAnimating}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(item.id, index)}
                  className={`backdrop-blur-sm py-4 px-4 rounded-2xl shadow-xl border-4 transition-all flex flex-col items-center justify-center ${
                    selectedOption?.id === item.id 
                      ? 'bg-green-500 border-white text-white' 
                      : 'bg-white/90 border-transparent text-gray-800 hover:border-green-400'
                  }`}
                >
                  <span className={`text-xl font-geez font-black ${selectedOption?.id === item.id ? 'text-white' : 'text-gray-800'}`}>
                    {item.translations.tigrinya}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {gameState === 'end' && (
          <motion.div 
            key="end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center flex-1 z-10"
          >
            <div className="text-6xl mb-6">🏆</div>
            <h2 className="text-3xl font-black text-white mb-2 drop-shadow-md">Match Over!</h2>
            <p className="text-xl font-bold text-white mb-8 drop-shadow-md">You scored {score} points!</p>
            <div className="flex gap-4">
              <button 
                onClick={onBack}
                className="bg-white text-gray-600 px-8 py-4 rounded-2xl font-black shadow-lg active:translate-y-1 transition-all"
              >
                BACK
              </button>
              <button 
                onClick={startGame}
                className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg active:translate-y-1 transition-all border-2 border-white"
              >
                PLAY AGAIN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
