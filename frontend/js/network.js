import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.3.0/dist/d3.min.js';

console.log("loaded js file");

// Set up the scene, camera, and renderer
const viewWidth = window.innerWidth;
const viewHeight = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, viewWidth / viewHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(viewWidth, viewHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
pointLight.position.set(50, 50, 50);
scene.add(pointLight);

// Controls for camera interaction
const controls = new OrbitControls(camera, renderer.domElement);

// Tooltip for node information
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.background = '#fff';
tooltip.style.padding = '5px';
tooltip.style.border = '1px solid #000';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

// Load the CSV data
d3.csv("/static/data/spotify_ord.csv").then(data => {
    console.log("Network data fetched:", data);

    // Convert the CSV data to the required graph structure
    const graphData = convertCSVToGraph(data);

    // Render the graph with the fetched data
    renderGraph(graphData);
});

function convertCSVToGraph(data) {
    const nodes = [];
    const links = [];
    const nodeSet = new Set();

    data.forEach(row => {
        const source = row.source;
        const target = row.target;
        const color = row.color;
        const x = parseFloat(row.x);
        const y = parseFloat(row.y);
        const z = parseFloat(row.z);

        if (!nodeSet.has(source)) {
            nodes.push({ id: source, label: source, color: color, x: x, y: y, z: z });
            nodeSet.add(source);
        }
        if (!nodeSet.has(target)) {
            nodes.push({ id: target, label: target, color: color, x: x, y: y, z: z });
            nodeSet.add(target);
        }

        links.push({ source: source, target: target, color: color });
    });

    return { nodes, links };
}

function renderGraph(graph) {
    const nodes = graph.nodes;
    const links = graph.links;

    // Add nodes to the scene
    nodes.forEach(node => {
        const geometry = new THREE.SphereGeometry(0.5);
        const material = new THREE.MeshBasicMaterial({ color: node.color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(node.x, node.y, node.z);
        sphere.userData = { label: node.label };
        scene.add(sphere);
    });

    // Add links to the scene
    links.forEach(link => {
        const material = new THREE.LineBasicMaterial({ color: link.color });
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        const points = [];
        points.push(new THREE.Vector3(sourceNode.x, sourceNode.y, sourceNode.z));
        points.push(new THREE.Vector3(targetNode.x, targetNode.y, targetNode.z));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        scene.add(line);
    });

    // Set camera position
    camera.position.z = 100;

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Tooltip handling
    function onMouseMove(event) {
        event.preventDefault();

        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length > 0) {
            const intersect = intersects[0];
            const label = intersect.object.userData.label;
            if (label) {
                tooltip.style.display = 'block';
                tooltip.style.left = event.clientX + 'px';
                tooltip.style.top = event.clientY + 'px';
                tooltip.innerHTML = label;
            }
        } else {
            tooltip.style.display = 'none';
        }
    }

    window.addEventListener('mousemove', onMouseMove, false);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
