console.log("loaded js file")

const width = 960, height = 600;

const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().on("zoom", (event) => {
        svg.attr("transform", event.transform);
    }))
    .append("g");

const color = d3.scaleOrdinal(d3.schemeCategory10);
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

console.log("Fetching artist IDs...");
// Fetch artist IDs from the backend
d3.json("http://localhost:5000/artist_ids").then(artistIds => {
    console.log("Artist IDs fetched:", artistIds);
    const artistIdSet = new Set(artistIds);

    console.log("Fetching network data...");
    // Fetch the initial network data
    d3.json("http://localhost:5000/network_data").then(graph => {
        console.log("Network data fetched:", graph);

        // Filter nodes to only include artists
        const filteredNodes = graph.nodes.filter(node => artistIdSet.has(node.label));
        
        // Filter links to only include those between filtered nodes
        const filteredLinks = graph.links.filter(link => 
            artistIdSet.has(link.source) && artistIdSet.has(link.target)
        );

        console.log('Filtered Nodes:', filteredNodes);
        console.log('Filtered Links:', filteredLinks);

        const link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(filteredLinks)
            .enter().append("line")
            .attr("class", "link");

        const node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(filteredNodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", 5)
            .attr("fill", d => d.color)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(d.label)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        node.append("title")
            .text(d => d.label);

        const simulation = d3.forceSimulation(filteredNodes)
            .force("link", d3.forceLink(filteredLinks).id(d => d.label))
            .force("charge", d3.forceManyBody().strength(-100))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .on("tick", ticked);

        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        }

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }).catch(error => {
        console.error('Error loading the network data:', error);
    });
}).catch(error => {
    console.error('Error loading the artist IDs:', error);
});
