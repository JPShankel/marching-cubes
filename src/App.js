import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { marchCubes } from './march.js';
import { validateTileTable, diagnoseTileTable } from './validate.js';

const GRID_SIZE = 64;
const WORLD_SIZE = 10;

const defaultSources = [
  { x:  2.5, y:  1.0, z:  0.5, strength: 8 },
  { x: -2.0, y: -1.5, z:  1.0, strength: 7 },
  { x:  0.5, y:  2.0, z: -2.0, strength: 6 },
  { x: -1.0, y: -0.5, z: -1.5, strength: 9 },
];

export default function App() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    // Validate tile table on startup
    diagnoseTileTable();
    const errors = validateTileTable();
    if (errors.length > 0) {
      console.error(`Tile table: ${errors.length} errors (first 10):`, errors.slice(0, 10));
    } else {
      console.log('Tile table: all checks passed.');
    }

    // Scene setup
    const W = mount.clientWidth;
    const H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111118);

    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.set(0, 0, 18);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);
    const dir1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dir1.position.set(5, 10, 7);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0x8888ff, 0.5);
    dir2.position.set(-8, -5, -4);
    scene.add(dir2);

    const material = new THREE.MeshStandardMaterial({
      color: 0x44aaff,
      roughness: 0.35,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    let meshRef = null;

    const state = {
      threshold: 0.8,
      sources: defaultSources.map(s => ({ ...s })),
    };

    function rebuild() {
      if (meshRef) {
        scene.remove(meshRef);
        meshRef.geometry.dispose();
      }
      const geo = marchCubes(state.sources, state.threshold, GRID_SIZE, WORLD_SIZE);
      meshRef = new THREE.Mesh(geo, material);
      scene.add(meshRef);
    }

    rebuild();

    // GUI
    const gui = new GUI({ title: 'Marching Cubes' });
    gui.add(state, 'threshold', 0.1, 3.0, 0.01).name('Threshold').onChange(rebuild);

    const srcFolder = gui.addFolder('Sources');
    const addBtn = { 'Add Source': addSource };
    srcFolder.add(addBtn, 'Add Source');

    let sourceFolders = [];

    function rebuildSourceFolders() {
      sourceFolders.forEach(f => f.destroy());
      sourceFolders = [];
      state.sources.forEach((src, i) => {
        const f = srcFolder.addFolder(`Source ${i + 1}`);
        f.add(src, 'x', -4, 4, 0.1).onChange(rebuild);
        f.add(src, 'y', -4, 4, 0.1).onChange(rebuild);
        f.add(src, 'z', -4, 4, 0.1).onChange(rebuild);
        f.add(src, 'strength', 1, 20, 0.1).onChange(rebuild);
        const actions = { Remove: () => removeSource(i) };
        f.add(actions, 'Remove');
        f.close();
        sourceFolders.push(f);
      });
    }

    function addSource() {
      state.sources.push({ x: 0, y: 0, z: 0, strength: 5 });
      rebuildSourceFolders();
      rebuild();
    }

    function removeSource(i) {
      if (state.sources.length <= 1) return;
      state.sources.splice(i, 1);
      rebuildSourceFolders();
      rebuild();
    }

    rebuildSourceFolders();

    // Render loop
    let animId;
    function animate() {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Resize
    function onResize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      gui.destroy();
      controls.dispose();
      renderer.dispose();
      if (mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
    />
  );
}
