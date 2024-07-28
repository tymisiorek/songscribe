console.log("loaded js file");
//define svg and add zoom function
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

console.log("Fetching network data...");
d3.json("/network_data").then(graph => {
    console.log("Network data fetched:", graph);

    //filter out nodes with no edges
    const linkedNodes = new Set();
    graph.links.forEach(link => {
        linkedNodes.add(link.source);
        linkedNodes.add(link.target);
    });
    const nodes = graph.nodes.filter(node => linkedNodes.has(node.id));
    const nodeIdSet = new Set(nodes.map(node => node.id));
    const links = graph.links.filter(link => nodeIdSet.has(link.source) && nodeIdSet.has(link.target));

    console.log('Filtered Nodes:', nodes);
    console.log('Filtered Links:', links);

    //add edges
    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("class", "link");

    //add nodes and functionality
    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
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

    //fetch user artists + highlight user artists on the graph
    console.log("Fetching artist IDs...");
    d3.json("/artist_ids").then(artistIds => {
        console.log("Artist IDs fetched:", artistIds);
        const artistIdSet = new Set(artistIds);

        //highlight favorite artists
        svg.selectAll("circle.node")
            .attr("r", d => artistIdSet.has(d.label) ? 10 : 5) 
            .attr("fill", d => artistIdSet.has(d.label) ? "blue" : d.color); 

        //move user artists towards center
        function favoriteForce(alpha) {
            nodes.forEach(node => {
                if (artistIdSet.has(node.label)) {
                    node.vx -= (node.x - width / 2) * alpha * 0.1;
                    node.vy -= (node.y - height / 2) * alpha * 0.1;
                }
            });
        }

        //define forces
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-100))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("favorite", favoriteForce)
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

    }).catch(error => {
        console.error('Error loading the artist IDs:', error);
    });

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
