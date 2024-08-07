console.log("loaded js file");

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

const container = svg.append("g");

const color = d3.scaleOrdinal(d3.schemeCategory10);
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

console.log("Fetching network data...");
// Fetch the network data from the Flask route
d3.json("http://localhost:5000/network_data").then(graph => {
    if (!graph.nodes || !graph.edges) {
        throw new Error("Invalid network data");
    }

    console.log("Network data fetched:", graph);

    const link = container.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.edges)
        .enter().append("line")
        .attr("class", "link")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1);

    const node = container.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", d => d.size)
        .attr("fill", d => d.color)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(d.attributes.name)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    node.append("title")
        .text(d => d.attributes.name);

    const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on("zoom", (event) => {
            container.attr("transform", event.transform);
        });

    svg.call(zoom);

    function getNodeById(id) {
        return graph.nodes.find(node => node.id === id);
    }

    function ticked() {
        link
            .attr("x1", d => getNodeById(d.source).x)
            .attr("y1", d => getNodeById(d.source).y)
            .attr("x2", d => getNodeById(d.target).x)
            .attr("y2", d => getNodeById(d.target).y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }

    function dragstarted(event, d) {
        if (!event.active) ticked();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
        d.x = event.x;
        d.y = event.y;
        ticked();
    }

    function dragended(event, d) {
        d.fx = null;
        d.fy = null;
    }

    function zoomToFit() {
        const bounds = container.node().getBBox();
        const fullWidth = bounds.width;
        const fullHeight = bounds.height;
        const midX = bounds.x + fullWidth / 2;
        const midY = bounds.y + fullHeight / 2;

        const scale = 0.9 / Math.max(fullWidth / width, fullHeight / height);
        const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }

    ticked();
    zoomToFit();
}).catch(error => {
    console.error('Error loading the network data:', error);
});
