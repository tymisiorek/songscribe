console.log("loaded js file");

const elem = document.getElementById('3d-graph');
const infoDiv = document.getElementById('node-info');

console.log("Fetching network data");

fetch("http://localhost:5000/network_data")
    .then(response => response.json())
    .then(graph => {
        if (!graph.nodes || !graph.edges) {
            throw new Error("Invalid network data");
        }

        console.log("Network data fetched:", graph);

        const sampledNodes = graph.nodes.filter((node, index) => index % 1 === 0);
        const sampledNodeIds = new Set(sampledNodes.map(node => node.label));
        const sampledLinks = graph.edges.filter(edge => sampledNodeIds.has(edge.source) && sampledNodeIds.has(edge.target));

        //map nodes and links
        const nodes = sampledNodes.map(node => ({
            id: node.label, 
            community: node.attributes['Modularity Class'],
            caption: node.attributes.artist_name || node.attributes.name, 
            size: node.size,
            color: node.color
        }));

        const links = sampledLinks.map(edge => {
            const sourceNode = nodes.find(node => node.id === edge.source);
            const targetNode = nodes.find(node => node.id === edge.target);

            const sourceColor = sourceNode.color.match(/\d+/g).map(Number);
            const targetColor = targetNode.color.match(/\d+/g).map(Number);

            //Calculate the average color
            const avgColor = `rgb(${Math.floor((sourceColor[0] + targetColor[0]) / 2)},
                                  ${Math.floor((sourceColor[1] + targetColor[1]) / 2)},
                                  ${Math.floor((sourceColor[2] + targetColor[2]) / 2)})`;

            return {
                source: edge.source,
                target: edge.target,
                weight: edge.weight || 1, 
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
            .linkColor(link => link.color) //Use calculated average color for links
            .linkWidth(0.8)  
            .linkDirectionalParticles(0.4)  
            .nodeResolution(10)  
            .enableNodeDrag(false)  
            .nodeThreeObjectExtend(true) 
            .onNodeHover(node => elem.style.cursor = node ? 'pointer' : null)
            .onNodeClick(node => {
                if (node) {
                    infoDiv.textContent = `Artist: ${node.caption}`;  //Display artist name if available
                }
            })
            .d3Force('charge', d3.forceManyBody().strength(-500))  //Increase repulsion between nodes
            .d3Force('link', d3.forceLink().distance(150))  //Increase preferred distance between connected nodes
            .d3Force('center', d3.forceCenter(elem.clientWidth / 2, elem.clientHeight / 2).strength(0.1))  //Reduce pull towards the center
            .d3Force('collision', d3.forceCollide().radius(d => d.size * 1.5))  //Prevent nodes from overlapping
            .d3AlphaMin(0.1) 
            .d3AlphaDecay(0.05); 

        Graph.controls().enablePan = true;
        Graph.controls().enableZoom = true;
        Graph.controls().enableRotate = true;
    })
    .catch(error => {
        console.error('Error loading the network data:', error);
    });
