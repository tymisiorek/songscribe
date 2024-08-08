console.log("loaded js file");

const elem = document.getElementById('3d-graph');

console.log("Fetching network data...");
// Fetch the network data from the Flask route
fetch("http://localhost:5000/network_data")
    .then(response => response.json())
    .then(graph => {
        if (!graph.nodes || !graph.edges) {
            throw new Error("Invalid network data");
        }

        console.log("Network data fetched:", graph);

        // More aggressive sampling: Sample 1/20th of the nodes
        const sampledNodes = graph.nodes.filter((node, index) => index % 3 === 0);
        const sampledNodeIds = new Set(sampledNodes.map(node => node.id));
        const sampledLinks = graph.edges.filter(edge => sampledNodeIds.has(edge.source) && sampledNodeIds.has(edge.target));

        // Define a function to determine the z-coordinate based on community
        const communityElevation = community => {
            const baseHeight = 0;
            const elevationStep = 20;
            return baseHeight + community * elevationStep;
        };

        // Prepare nodes and links
        const nodes = sampledNodes.map(node => ({
            id: node.id,
            label: node.label,
            community: node.attributes.membership,
            caption: node.attributes.name,
            size: node.size,
            color: node.color,
            x: node.x, // Preserve existing x position if available
            y: node.y, // Preserve existing y position if available
            z: communityElevation(node.attributes.membership) // Elevate z position based on community
        }));

        const links = sampledLinks.map(edge => ({
            source: edge.source,
            target: edge.target,
            weight: edge.weight || 1,  // Assuming weight exists, otherwise default to 1
            community: Math.min(
                nodes.find(node => node.id === edge.source).community,
                nodes.find(node => node.id === edge.target).community
            )
        }));

        const gData = { nodes, links };

        const Graph = ForceGraph3D()(elem)
            .graphData(gData)
            .nodeAutoColorBy('community')
            .nodeVal('size')
            .linkAutoColorBy('community')
            .linkWidth(0.5)  // Reduce link width for better performance
            .linkDirectionalParticles(0)  // Disable directional particles for performance
            .nodeResolution(6)  // Lower node resolution for better performance
            .enableNodeDrag(false)  // Disable node dragging
            .nodeThreeObjectExtend(true)  // This setting allows you to retain custom node properties
            .onNodeHover(node => elem.style.cursor = node ? 'pointer' : null)
            .d3Force('charge', d3.forceManyBody().strength(-150))  // Increase repulsion between nodes
            .d3Force('link', d3.forceLink().distance(50))  // Increase preferred distance between connected nodes
            .d3Force('center', d3.forceCenter(0, 0, 0))  // Center the graph
            .d3VelocityDecay(0.3)  // Increase the decay rate to make the animation faster
            .d3AlphaMin(0.1)  // Increase the minimum alpha value to stop the simulation earlier
            .d3AlphaDecay(0.05)  // Increase the decay rate to make the simulation settle faster
            .onEngineStop(() => {
                Graph.zoomToFit(400);  // Ensure the graph fits in the view initially
            });

        // Set the initial camera position and orientation
        Graph.cameraPosition(
            { x: -10000, y: -20000, z: 2500 }, // Position the camera far back along the y-axis and elevated on the z-axis
            { x: 0, y: 0, z: 0 }, // Look at the center of the graph
            3000  // Duration of the initial transition in ms
        );

        // Keep the camera controls enabled
        Graph.controls().enablePan = true;
        Graph.controls().enableZoom = true;
        Graph.controls().enableRotate = true;
    })
    .catch(error => {
        console.error('Error loading the network data:', error);
    });
