console.log("loaded js file");

const elem = document.getElementById('3d-graph');
const infoDiv = document.getElementById('node-info');

console.log("Fetching network data...");
// Fetch the network data from the Flask route
fetch("http://localhost:5000/network_data")
    .then(response => response.json())
    .then(graph => {
        if (!graph.nodes || !graph.edges) {
            throw new Error("Invalid network data");
        }

        console.log("Network data fetched:", graph);

        const sampledNodes = graph.nodes.filter((node, index) => index % 1 === 0);
        const sampledNodeIds = new Set(sampledNodes.map(node => node.label)); // Use label as the ID now
        const sampledLinks = graph.edges.filter(edge => sampledNodeIds.has(edge.source) && sampledNodeIds.has(edge.target));

        // Prepare nodes and links
        const nodes = sampledNodes.map(node => ({
            id: node.label,  // Retain the original ID
            community: node.attributes['Modularity Class'],
            caption: node.attributes.artist_name || node.attributes.name,  // Display the artist name if available
            size: node.size,
            color: node.color
        }));

        const links = sampledLinks.map(edge => {
            const sourceNode = nodes.find(node => node.id === edge.source);
            const targetNode = nodes.find(node => node.id === edge.target);

            const sourceColor = sourceNode.color.match(/\d+/g).map(Number);
            const targetColor = targetNode.color.match(/\d+/g).map(Number);

            // Calculate the average color
            const avgColor = `rgb(${Math.floor((sourceColor[0] + targetColor[0]) / 2)},
                                  ${Math.floor((sourceColor[1] + targetColor[1]) / 2)},
                                  ${Math.floor((sourceColor[2] + targetColor[2]) / 2)})`;

            return {
                source: edge.source,
                target: edge.target,
                weight: edge.weight || 1,  // Assuming weight exists, otherwise default to 1
                color: avgColor,
                community: Math.min(
                    sourceNode.community,
                    targetNode.community
                )
            };
        });

        const gData = { nodes, links };

        const Graph = ForceGraph3D()(elem)
            .graphData(gData)
            .nodeAutoColorBy('community')
            .nodeVal('size')
            .linkColor(link => link.color) // Use the calculated average color for links
            .linkWidth(0.8)  // Reduce link width for better performance
            .linkDirectionalParticles(0.4)  // Disable directional particles for performance
            .nodeResolution(10)  // Lower node resolution for better performance
            .enableNodeDrag(false)  // Disable node dragging
            .nodeThreeObjectExtend(true)  // This setting allows you to retain custom node properties
            .onNodeHover(node => elem.style.cursor = node ? 'pointer' : null)
            .onNodeClick(node => {
                if (node) {
                    infoDiv.textContent = `Artist: ${node.caption}`;  // Display artist name if available
                }
            })
            .d3Force('charge', d3.forceManyBody().strength(-175))  // Increase repulsion between nodes
            .d3Force('link', d3.forceLink().distance(70))  // Increase preferred distance between connected nodes
            .d3Force('center', d3.forceCenter(elem.clientWidth / 2, elem.clientHeight / 2).strength(0.1))  // Reduce pull towards the center
            .d3VelocityDecay(0.3)  // Increase the decay rate to make the animation faster
            .d3AlphaMin(0.1)  // Increase the minimum alpha value to stop the simulation earlier
            .d3AlphaDecay(0.05);  // Increase the decay rate to make the simulation settle faster

        // Keep the camera controls enabled
        Graph.controls().enablePan = true;
        Graph.controls().enableZoom = true;
        Graph.controls().enableRotate = true;
    })
    .catch(error => {
        console.error('Error loading the network data:', error);
    });
