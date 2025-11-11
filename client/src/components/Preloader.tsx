import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const Preloader: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const loader = new GLTFLoader();
    loader.load(
      "https://cdn.jsdelivr.net/gh/Neon-Nomad/amunet_phone_center@main/amunet_phone_center/public/models/phone.glb",
      (gltf) => {
        const phone = gltf.scene;
        scene.add(phone);

        camera.position.z = 5;

        let time = 0;
        const animate = () => {
          requestAnimationFrame(animate);
          time += 0.05;
          phone.position.y = Math.sin(time) * 0.2;
          phone.rotation.y += 0.01;
          renderer.render(scene, camera);
        };

        animate();
      }
    );

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 9999,
        backgroundColor: "#F0F0F0",
      }}
    />
  );
};

export default Preloader;
