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

        // Prepare nodes and links
        const nodes = graph.nodes.map(node => ({
            id: node.id,
            label: node.label,
            community: node.attributes.membership,
            caption: node.attributes.name,
            size: node.size,
            color: node.color
        }));

        const links = graph.edges.map(edge => ({
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
            .linkWidth(0)
            .linkDirectionalParticles('weight')
            .linkDirectionalParticleSpeed('weight')
            .nodeLabel(node => `${node.label}: ${node.caption}`)
            .onNodeHover(node => elem.style.cursor = node ? 'pointer' : null);
    })
    .catch(error => {
        console.error('Error loading the network data:', error);
    });
