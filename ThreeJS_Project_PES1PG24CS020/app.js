// app.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let scene, camera, renderer;
let museumGroup, exhibits = [];
let currentPosition = new THREE.Vector3(0, 1.6, 10);
let targetPosition = currentPosition.clone();
let isDragging = false;
let previousMouseX = 0;
let loadingManager;
let loadingScreen;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

// Raycaster for detecting clicks on 3D objects
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// DOM elements for video modal
let videoModal;
let videoContainer;
let videoTitleElement;
let videoDescriptionElement;
let closeModalButton;

const museumConfig = {
    length: 100,
    width: 30,
    height: 10,
    spacing: 10
};

const playerRadius = 1.5;

const exhibitData = [
    { 
        title: "Sukhoi Su-57",
        description: "The Sukhoi Su-57 is Russia's premier fifth-generation stealth fighter, designed for air superiority and deep strike missions. Combining stealth technology with supercruise capability, advanced avionics, and thrust-vectoring engines, it delivers unmatched maneuverability and situational awareness. Its internal weapons bays, radar-absorbing materials, and reduced infrared signature make it a formidable adversary in contested airspace. Developed by Sukhoi under the PAK FA program, the Su-57 is built to rival Western stealth fighters like the F-22 and F-35. It represents a leap forward in Russian aerospace engineering, blending agility, speed, and stealth into one lethal package.",
        videoId: "PuW6Ha2sBaQ",
        model: "models/su57.glb",
        position: 0,
        side: 'left',
        xOffset: -8,
        website: "https://en.wikipedia.org/wiki/Sukhoi_Su-57",
        wallImage: "textures/su57.webp"
    },
    { 
        title: "F22 Raptor", 
        description: "The F-22 Raptor is the United States' elite fifth-generation stealth air superiority fighter, developed by Lockheed Martin. Engineered for total dominance in the skies, it combines radar-evading stealth, blistering speed, supercruise, and unmatched agility with cutting-edge avionics. Its advanced sensor fusion and situational awareness give pilots a decisive edge in any combat scenario. Armed with precision-guided weapons and thrust-vectoring engines, the Raptor can strike swiftly and vanish without a trace. As the world's first operational stealth fighter, the F-22 sets the gold standard for modern aerial warfare.", 
        videoId: "kllh5tTD07Y", 
        model: "models/f22.glb", 
        position: 1, 
        side: 'right', 
        xOffset: 8,
        website: "https://en.wikipedia.org/wiki/Lockheed_Martin_F-22_Raptor",
        wallImage: "textures/f22.jpeg"
    },
    { 
        title: "MIG 35", 
        description: "The MiG-35 is Russia's advanced multirole fighter, designed as a highly agile, cost-effective platform for both air superiority and ground attack missions. An evolution of the MiG-29, it features cutting-edge avionics, AESA radar, and enhanced thrust-vectoring engines for superior maneuverability. With integrated electronic warfare systems and precision-guided weaponry, the MiG-35 can dominate in complex combat environments. Built for high survivability and operational flexibility, it supports network-centric warfare with modern data links and targeting systems. It stands as a powerful and export-ready fighter blending modern tech with proven Russian airframe design.", 
        videoId: "HxBuf1z0AXM", 
        model: "models/mig35.glb", 
        position: 2, 
        side: 'left', 
        xOffset: -8,
        website: "https://en.wikipedia.org/wiki/Mikoyan_MiG-35",
        wallImage: "textures/mig35.png"
    },
    { 
        title: "Sukhoi su-35", 
        description: "The Sukhoi Su-35 is a highly advanced 4.5-generation multirole fighter that bridges the gap between legacy platforms and next-gen stealth fighters. Derived from the Su-27 lineage, it boasts thrust-vectoring engines, supercruise capability, and extreme agility, making it a formidable dogfighter. Its powerful Irbis-E radar, long-range missile arsenal, and advanced electronic warfare suite give it dominance in both air-to-air and air-to-ground roles. Designed for survivability and deep penetration, the Su-35 integrates modern avionics and reduced radar signature features. It showcases Russian aerospace excellence with a blend of brute force, elegance, and battlefield versatility.", 
        videoId: "uH5gGMbpcWw", 
        model: "models/su35.glb", 
        position: 3, 
        side: 'right', 
        xOffset: 8,
        website: "https://en.wikipedia.org/wiki/Sukhoi_Su-35",
        wallImage: "textures/su35.png"
    },
    { 
        title: "F35 Lighting-II", 
        description: "The F-35 Lightning II is a cutting-edge fifth-generation stealth multirole fighter developed by Lockheed Martin, designed to dominate in air, ground, and electronic warfare. With its stealth profile, sensor fusion, and advanced data-sharing capabilities, the F-35 acts as a force multiplier on the modern battlefield. Its variants—conventional, STOVL, and carrier-based—allow unmatched versatility across services and allied forces. Equipped with state-of-the-art avionics, precision-guided munitions, and a powerful internal sensor suite, it delivers unmatched situational awareness. The F-35 isn't just a fighter—it's a flying command center built for 21st-century warfare.", 
        videoId: "PyxBVuiq2NY", 
        model: "models/f35.glb", 
        position: 4, 
        side: 'left', 
        xOffset: -8,
        website: "https://en.wikipedia.org/wiki/Lockheed_Martin_F-35_Lightning_II",
        wallImage: "textures/f35.png"
    },
];

function init() {
    loadingScreen = document.getElementById('loadingScreen');
    
    // Initialize video modal elements
    videoModal = document.getElementById('videoModal');
    videoContainer = document.getElementById('videoContainer');
    videoTitleElement = document.getElementById('videoTitle');
    videoDescriptionElement = document.getElementById('videoDescription');
    closeModalButton = document.querySelector('.close-modal');
    
    // Set up modal close button
    closeModalButton.addEventListener('click', () => {
        videoModal.style.display = 'none';
        videoContainer.innerHTML = ''; // Remove iframe when closing
    });
    
    // Close modal when clicking outside content
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            videoModal.style.display = 'none';
            videoContainer.innerHTML = '';
        }
    });

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x101010, 10, 60);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.copy(currentPosition);
    targetPosition = currentPosition.clone();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.0;
    document.body.appendChild(renderer.domElement);

    loadingManager = new THREE.LoadingManager(() => {
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => loadingScreen.style.display = 'none', 500);
            }
        }, 500);
    });

    new RGBELoader(loadingManager)
        .setPath('lighting/')
        .load('Warm.hdr', function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
            scene.background = texture;
        }, undefined, (error) => {
            console.error('Error loading HDRI:', error);
        });

    createMuseum();
    loadExhibits();
    addLights();
    setupEventListeners();
    addInstructions();
    animate();
}

function createMuseum() {
    museumGroup = new THREE.Group();
    scene.add(museumGroup);

    const wallContainerGroup = new THREE.Group();
    museumGroup.add(wallContainerGroup);

    // Floor - Made more reflective
    const floorGeometry = new THREE.PlaneGeometry(museumConfig.width, museumConfig.length);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B0000, 
        roughness: 0.3,  // Lower roughness for more shine
        metalness: 0.8,  // Higher metalness for more reflectivity
        envMapIntensity: 1.0
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    museumGroup.add(floor);

    // Wall material
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(museumConfig.length, museumConfig.height), wallMaterial);
    leftWall.position.set(-museumConfig.width / 2, museumConfig.height / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    wallContainerGroup.add(leftWall);

    // Right Wall (clone of left wall)
    const rightWall = leftWall.clone();
    rightWall.position.x = museumConfig.width / 2;
    rightWall.rotation.y = -Math.PI / 2;
    wallContainerGroup.add(rightWall);

    // Back Wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(museumConfig.width, museumConfig.height), wallMaterial);
    backWall.position.set(0, museumConfig.height / 2, -museumConfig.length / 2);
    backWall.receiveShadow = true;
    wallContainerGroup.add(backWall);

    // Front Wall (with an offset to create an entrance)
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(museumConfig.width, museumConfig.height), wallMaterial);
    frontWall.position.set(0, museumConfig.height / 2, museumConfig.length / 2 - 35);
    frontWall.rotation.y = Math.PI;
    frontWall.receiveShadow = true;
    wallContainerGroup.add(frontWall);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(museumConfig.width, museumConfig.length), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    ceiling.position.y = museumConfig.height;
    ceiling.rotation.x = Math.PI / 2;
    wallContainerGroup.add(ceiling);
}

function addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(0, museumConfig.height, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.2);
    fillLight1.position.set(-museumConfig.width / 2, museumConfig.height / 2, 0);
    scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.2);
    fillLight2.position.set(museumConfig.width / 2, museumConfig.height / 2, 0);
    scene.add(fillLight2);

    exhibitData.forEach((exhibit) => {
        const zPos = -exhibit.position * museumConfig.spacing;
        const spotlight = new THREE.SpotLight(0xffffff, 8, 25, Math.PI / 6, 0.5, 1);
        spotlight.position.set(exhibit.xOffset, museumConfig.height - 2, zPos);
        spotlight.target.position.set(exhibit.xOffset, 1.5, zPos);
        spotlight.castShadow = true;
        spotlight.shadow.mapSize.width = 1024;
        spotlight.shadow.mapSize.height = 1024;
        scene.add(spotlight);
        scene.add(spotlight.target);

        const pointLight = new THREE.PointLight(0xffffff, 2, 10);
        pointLight.position.set(exhibit.xOffset, 2, zPos);
        scene.add(pointLight);

        // Add wall image behind each exhibit
        createWallImage(exhibit, zPos);
    });
}

function createWallImage(exhibit, zPos) {
    const textureLoader = new THREE.TextureLoader(loadingManager);
    textureLoader.load(exhibit.wallImage, (texture) => {
        const aspectRatio = texture.image.width / texture.image.height;
        const width = 10;
        const height = width / aspectRatio;

        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide,
            roughness: 0.7,
            metalness: 0.1
        });

        const wallImage = new THREE.Mesh(geometry, material);
        
        // Position the image on the wall behind the exhibit
        const wallX = exhibit.side === 'left' 
            ? -museumConfig.width / 2 + 0.1 
            : museumConfig.width / 2 - 0.1;
        
        wallImage.position.set(wallX, height / 2 + 1, zPos);
        wallImage.rotation.y = exhibit.side === 'left' ? Math.PI / 2 : -Math.PI / 2;
        
        scene.add(wallImage);
    }, undefined, (error) => {
        console.error(`Error loading wall image for ${exhibit.title}:`, error);
    });
}

function loadExhibits() {
    const dracoLoader = new DRACOLoader(loadingManager);
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    const gltfLoader = new GLTFLoader(loadingManager);
    gltfLoader.setDRACOLoader(dracoLoader);

    exhibitData.forEach((exhibit) => {
        const zPosition = -exhibit.position * museumConfig.spacing;

        gltfLoader.load(exhibit.model, (gltf) => {
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            model.position.sub(center);

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 4.0 / maxDim;
            model.scale.setScalar(scale);

            model.position.set(exhibit.xOffset, 1.5, zPosition);

            model.traverse(node => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            scene.add(model);

            const exhibitObject = {
                mesh: model,
                position: zPosition,
                panel: null,
                xOffset: exhibit.xOffset,
                side: exhibit.side,
                title: exhibit.title,
                description: exhibit.description,
                videoId: exhibit.videoId,
                website: exhibit.website,
                autoRotate: true,
                autoRotationSpeed: 0.005
            };

            exhibits.push(exhibitObject);
            createExhibitPanel(exhibitObject);
        }, undefined, (error) => {
            console.error(`Error loading ${exhibit.model}:`, error);
        });
    });
}

function createExhibitPanel(exhibit) {
    const panel = document.createElement('div');
    panel.className = 'exhibit-panel';
    panel.style.display = 'none';

    panel.innerHTML = `
        <h3 class="exhibit-title">${exhibit.title}</h3>
        <div class="video-container">
            <iframe src="https://www.youtube-nocookie.com/embed/${exhibit.videoId}?mute=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
        <a href="${exhibit.website}" target="_blank" class="website-link">Wiki</a>
        <button class="toggle-description">Show Description ▼</button>
        <div class="exhibit-description">${exhibit.description}</div>
    `;

    document.body.appendChild(panel);

    const toggleBtn = panel.querySelector('.toggle-description');
    const description = panel.querySelector('.exhibit-description');
    toggleBtn.addEventListener('click', () => {
        description.classList.toggle('expanded');
        toggleBtn.textContent = description.classList.contains('expanded') ? 'Hide Description ▲' : 'Show Description ▼';
    });

    addRotationControls(panel, exhibit);
    exhibit.panel = panel;
}

function addRotationControls(panel, exhibit) {
    const controls = document.createElement('div');
    controls.className = 'rotation-controls';
    controls.innerHTML = `
        <div class="rotate-group"><button class="rotate-btn" data-axis="x" data-dir="1">X+</button><button class="rotate-btn" data-axis="x" data-dir="-1">X-</button></div>
        <div class="rotate-group"><button class="rotate-btn" data-axis="y" data-dir="1">Y+</button><button class="rotate-btn" data-axis="y" data-dir="-1">Y-</button></div>
        <div class="rotate-group"><button class="rotate-btn" data-axis="z" data-dir="1">Z+</button><button class="rotate-btn" data-axis="z" data-dir="-1">Z-</button></div>
    `;
    panel.appendChild(controls);

    const rotationSpeed = 0.02;
    const activeRotation = { x: 0, y: 0, z: 0 };

    const setupHoldListener = (btn, axis, dir) => {
        const apply = (e) => { e.stopPropagation(); activeRotation[axis] = dir * rotationSpeed; exhibit.autoRotate = false; };
        const clear = (e) => { e.stopPropagation(); activeRotation[axis] = 0; };
        btn.addEventListener('mousedown', apply);
        btn.addEventListener('mouseup', clear);
        btn.addEventListener('mouseleave', clear);
        btn.addEventListener('touchstart', apply);
        btn.addEventListener('touchend', clear);
    };

    controls.querySelectorAll('.rotate-btn').forEach(btn => {
        const axis = btn.dataset.axis;
        const dir = parseFloat(btn.dataset.dir);
        setupHoldListener(btn, axis, dir);
    });

    exhibit.rotationControl = activeRotation;
}

function updateExhibitPanels() {
    exhibits.forEach(exhibit => {
        if (!exhibit.panel || !exhibit.mesh) return;

        const modelPos = new THREE.Vector3();
        exhibit.mesh.getWorldPosition(modelPos);
        const distance = camera.position.distanceTo(modelPos);
        const visibilityThreshold = 6;
        const autoRotationStopDistance = 6;

        // Update auto-rotation state based on distance
        exhibit.autoRotate = distance > autoRotationStopDistance;

        if (distance > visibilityThreshold) {
            exhibit.panel.style.opacity = '0';
            exhibit.panel.style.pointerEvents = 'none';
            exhibit.panel.style.display = 'none';
            return;
        }

        exhibit.panel.style.display = 'block';
        const projected = modelPos.clone().project(camera);
        
        const screenX = (projected.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-(projected.y * 0.5) + 0.5) * window.innerHeight;

        const panelWidth = 350;
        const offset = 40;

        // Position panel higher and more to the side
        let panelLeft;
        if (exhibit.side === 'right') {
            panelLeft = screenX + offset;
            // Push further right if near edge
            if (screenX > window.innerWidth * 0.7) {
                panelLeft = window.innerWidth - panelWidth - 20;
            }
        } else {
            panelLeft = screenX - panelWidth - offset;
            // Push further left if near edge
            if (screenX < window.innerWidth * 0.3) {
                panelLeft = 20;
            }
        }

        // Position panel higher up
        exhibit.panel.style.left = `${panelLeft}px`;
        exhibit.panel.style.top = `${screenY - 200}px`; // Increased vertical offset

        const opacity = Math.max(0, 1 - ((distance - 5) / (visibilityThreshold - 5)));
        exhibit.panel.style.opacity = opacity;
        exhibit.panel.style.pointerEvents = opacity > 0.8 ? 'auto' : 'none';
    });
}

function setupEventListeners() {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Mouse events for camera rotation
    document.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMouseX = e.clientX;
    });
    document.addEventListener('mouseup', () => { isDragging = false; });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - previousMouseX;
        previousMouseX = e.clientX;
        camera.rotation.y -= deltaX * 0.004;
    });

    // Click event for interacting with 3D objects
    renderer.domElement.addEventListener('click', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        for (let i = 0; i < intersects.length; i++) {
            const intersectedObject = intersects[i].object;
            const clickedExhibit = exhibits.find(ex => ex.mesh === intersectedObject);

            if (clickedExhibit) {
                // Show the modal with the YouTube video
                videoTitleElement.textContent = clickedExhibit.title;
                videoDescriptionElement.textContent = clickedExhibit.description;
                
                // Create iframe for YouTube video
                videoContainer.innerHTML = `
                    <iframe 
                        src="https://www.youtube-nocookie.com/embed/${clickedExhibit.videoId}?autoplay=1&mute=1" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
                
                videoModal.style.display = 'flex';
                break;
            }
        }
    });

    // Keyboard events for player movement
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = true; break;
            case 'KeyS': moveBackward = true; break;
            case 'KeyA': moveLeft = true; break;
            case 'KeyD': moveRight = true; break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = false; break;
            case 'KeyS': moveBackward = false; break;
            case 'KeyA': moveLeft = false; break;
            case 'KeyD': moveRight = false; break;
        }
    });

    // Touch events for camera rotation on mobile
    document.addEventListener('touchstart', (e) => {
        isDragging = true;
        previousMouseX = e.touches[0].clientX;
    });
    document.addEventListener('touchend', () => { isDragging = false; });
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const deltaX = e.touches[0].clientX - previousMouseX;
        previousMouseX = e.touches[0].clientX;
        camera.rotation.y -= deltaX * 0.005;
    }, { passive: false });
}

function addInstructions() {
    const instructions = document.createElement('div');
    instructions.className = 'instructions';
    instructions.innerHTML = '<strong>WASD</strong> to move • <strong>Click & Drag</strong> to look • <strong>Click</strong> on aircraft to view details';
    document.body.appendChild(instructions);
    setTimeout(() => {
        instructions.style.opacity = '0';
        setTimeout(() => instructions.remove(), 1000);
    }, 8000);
}

function animate() {
    requestAnimationFrame(animate);

    const moveSpeed = 0.1;
    const direction = new THREE.Vector3();
    if (moveForward) direction.z -= 1;
    if (moveBackward) direction.z += 1;
    if (moveLeft) direction.x -= 1;
    if (moveRight) direction.x += 1;

    if (direction.length() > 0) {
        direction.normalize().applyEuler(camera.rotation);
        targetPosition.addScaledVector(direction, moveSpeed);
    }

    targetPosition.x = Math.max(-museumConfig.width / 2 + playerRadius, Math.min(museumConfig.width / 2 - playerRadius, targetPosition.x));
    targetPosition.z = Math.max(-museumConfig.length / 2 + playerRadius, Math.min((museumConfig.length / 2 - 35) - playerRadius, targetPosition.z));
    currentPosition.lerp(targetPosition, 0.1);
    camera.position.copy(currentPosition);

    // Update exhibit rotations
    exhibits.forEach(exhibit => {
        if (exhibit.mesh) {
            // Apply manual rotation if any
            if (exhibit.rotationControl) {
                exhibit.mesh.rotation.x += exhibit.rotationControl.x;
                exhibit.mesh.rotation.y += exhibit.rotationControl.y;
                exhibit.mesh.rotation.z += exhibit.rotationControl.z;
            }
            
            // Apply auto-rotation when not being manually controlled
            if (exhibit.autoRotate) {
                exhibit.mesh.rotation.y += exhibit.autoRotationSpeed;
            }
        }
    });

    updateExhibitPanels();
    renderer.render(scene, camera);
}

window.onload = init;
