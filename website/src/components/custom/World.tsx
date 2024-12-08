import { useEffect, useRef, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import ProcessRequest from './ProcessRequest';
import { scene, draggableObjects } from '~/stores/stores';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { useStore } from '@nanostores/react';

const addNewObject = (path: string, index: number, scene: THREE.Scene) => {
  const loader = new OBJLoader();
  return new Promise<THREE.Object3D>((resolve) => {
    loader.load(
      path,
      (object) => {
        object.position.set((index % 5) * 2 - 3, 0.5, 0);
        scene.add(object);
        resolve(object);
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
        resolve(new THREE.Object3D()); // Resolve with an empty object to avoid hanging
      }
    );
  });
};

export const addNextObject = async (item, $draggableObjects, $scene, items, itemsSet) => {
  const startTime = Date.now();

  const object = await addNewObject(item.model3d, $draggableObjects.length, $scene);
  draggableObjects.set([...$draggableObjects, object]); // Update the store

  item.ready = true;
  item.timeDownload = (Date.now() - startTime) / 1000;
  item.timeMeshAndDownload = item.timeDownload + item.timeMeshImage;
  itemsSet.set([...items]);
};

export default function World() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [controls, setControls] = useState<DragControls | null>(null); // Store controls in state

  const $scene = useStore(scene);
  const $draggableObjects = useStore(draggableObjects, $scene);

  useEffect(() => {
    if (!canvasRef.current) return;

    // const intervalId = setInterval(() => {
    //   addNextObject($draggableObjects, $scene);
    // }, 3000);
    const camera = new THREE.PerspectiveCamera(75, 1024 / 600, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(1024, 600);

    const orbitControls = new OrbitControls(camera, renderer.domElement);

    // addNextObject();
    const textureLoader = new THREE.TextureLoader();
    const backgroundTexture = textureLoader.load('');
    $scene.background = backgroundTexture;

    const groundTexture = textureLoader.load('/ground.webp');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(3, 3);

    const groundGeometry = new THREE.CircleGeometry(8, 32);
    const groundMaterial = new THREE.MeshBasicMaterial({
      map: groundTexture,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    $scene.add(ground);

    const light = new THREE.AmbientLight(0xffffff, 4);
    $scene.add(light);

    camera.position.set(2, 8, 3);
    camera.lookAt(0, 0, 0);

    // Set up DragControls once after the initial objects are loaded
    const initializeDragControls = () => {
      if (!controls) {
        const newControls = new DragControls($draggableObjects, camera, renderer.domElement);

        newControls.addEventListener('dragstart', () => {
          orbitControls.enabled = false;
        });
        newControls.addEventListener('dragend', () => {
          orbitControls.enabled = true;
        });

        setControls(newControls);
      }
    };

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render($scene, camera);
    };

    initializeDragControls(); // Call this once after scene setup

    animate();

    window.addEventListener('resize', () => {
      // camera.aspect = window.innerWidth / window.innerHeight;
      // camera.updateProjectionMatrix();
      // renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return () => {
      clearInterval(intervalId); // Clear interval on unmount
      renderer.dispose();
      if (controls) {
        controls.dispose(); // Dispose of DragControls
      }
    };
  }, []);

  useEffect(() => {
    // Effect to update DragControls when draggableObjects changes
    if (controls && $draggableObjects.length > 0) {
      // Remove old objects and add the current ones from the store
      const objects = controls.getObjects();

      if ($draggableObjects.length) {
        controls.objects.push($draggableObjects[$draggableObjects.length - 1]);
      }
    }
  }, [$draggableObjects, controls]);

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
      <p className="text-center">Try to drag and drop your assets, use your mouse to move the camera</p>
      <canvas
        ref={canvasRef}
        id="world"
        className="block mx-auto border border-8 border-black rounded-lg shadow-lg"
      ></canvas>
    </div>
  );
}
