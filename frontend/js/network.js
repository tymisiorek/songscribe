console.log("loaded js file");

// Define SVG and add zoom function
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

let simulation, link, node, graphData;

console.log("Fetching network data...");
d3.json("/network_data").then(graph => {
    console.log("Network data fetched:", graph);
    graphData = graph;

    // Initial render with a degree threshold
    updateGraph(2);
});

function updateGraph(degreeThreshold) {
    // Filter out nodes and edges based on degree threshold
    const degreeCount = new Map();
    graphData.links.forEach(link => {
        degreeCount.set(link.source, (degreeCount.get(link.source) || 0) + 1);
        degreeCount.set(link.target, (degreeCount.get(link.target) || 0) + 1);
    });

    const filteredNodes = graphData.nodes.filter(node => degreeCount.get(node.id) >= degreeThreshold);
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
    const filteredLinks = graphData.links.filter(link => filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target));

    console.log('Filtered Nodes:', filteredNodes);
    console.log('Filtered Links:', filteredLinks);

    // Remove existing nodes and links
    if (node) node.remove();
    if (link) link.remove();

    // Add links
    link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(filteredLinks)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke-width", 1)
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6);

    // Add nodes and functionality
    node = svg.append("g")
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

    // Define forces
    simulation = d3.forceSimulation(filteredNodes)
        .force("link", d3.forceLink(filteredLinks).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-100))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);

    function ticked() {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }
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

// Add a degree threshold slider
const slider = d3.select("body").append("input")
    .attr("type", "range")
    .attr("min", 1)
    .attr("max", 10)
    .attr("value", 2)
    .style("width", "960px")
    .on("input", function() {
        updateGraph(+this.value);
    });

d3.select("body").append("p")
    .text("Degree Threshold")
    .style("margin", "10px 0");

d3.select("body").append("p")
    .text("Use the slider to adjust the degree threshold for filtering nodes and edges.")
    .style("margin", "10px 0");