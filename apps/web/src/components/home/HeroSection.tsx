"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Lightformer, Environment, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import Link from "next/link";

function FloatingParticles() {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      group.current.rotation.x = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <group ref={group}>
      <Sparkles count={400} scale={20} size={3} speed={0.4} color="#C9A876" opacity={0.8} />
      <Sparkles count={200} scale={25} size={2} speed={0.2} color="#E8D9C8" opacity={0.5} />
    </group>
  );
}

function FloatingObjects() {
  return (
    <Float speed={2} rotationIntensity={2} floatIntensity={3}>
      <mesh position={[0, 0, -2]}>
        <torusGeometry args={[4, 0.1, 32, 100]} />
        <meshStandardMaterial color="#C9A876" metalness={1} roughness={0.1} />
      </mesh>
      <mesh position={[-5, 2, -5]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#E8D9C8" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[5, -2, -3]}>
        <octahedronGeometry args={[1.5]} />
        <meshStandardMaterial color="#6B4F3A" metalness={0.5} roughness={0.3} />
      </mesh>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow color="#C9A876" />
      <FloatingObjects />
      <FloatingParticles />
      <Environment preset="city">
        <Lightformer form="rect" intensity={2} position={[0, 5, -10]} scale={[10, 50, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}

export default function HeroSection() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-black flex flex-col justify-center items-center">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }} dpr={[1, 2]}>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="space-y-6"
        >
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-ivory font-bold tracking-tight">
            Where Beauty <br />
            <span className="text-gradient italic">Meets Perfection</span>
          </h1>
          
          <p className="text-beige text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto">
            Premium Hair, Skin & Grooming Experience
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
            <Link
              href="/book"
              className="px-8 py-4 bg-gold text-black uppercase tracking-widest text-sm font-bold hover:bg-white transition-all duration-500 w-full sm:w-auto"
            >
              Book Appointment
            </Link>
            <Link
              href="/services"
              className="px-8 py-4 border border-gold text-gold uppercase tracking-widest text-sm font-bold hover:bg-gold/10 transition-all duration-500 w-full sm:w-auto"
            >
              Explore Services
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-xs tracking-widest text-gold uppercase">Scroll to Discover</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-[1px] h-12 bg-gradient-to-b from-gold to-transparent"
        />
      </div>
    </section>
  );
}
