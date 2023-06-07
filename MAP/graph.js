const dims = { width: 1200, height: 550 };

const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", dims.width)
  .attr("height", dims.height);

const projection = d3
  .geoMercator()
  .center([78.078743, 27.891535]) // GPS of location to zoom on
  .scale(800); // This is like the zoom
//   .translate([-600, 300]);

Promise.all([
  d3.json("./india_state.geojson"),
  d3.csv(
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_gpsLocSurfer.csv"
  ),
]).then(function (initialize) {
  let dataGeo = initialize[0];
  let data = initialize[1];

  // Create a color scale
  const color = d3
    .scaleOrdinal()
    .domain(data.map((d) => d.homecontinent))
    .range(d3.schemePaired);

  // Add a scale for bubble size
  const valueExtent = d3.extent(data, (d) => +d.n);
  const size = d3
    .scaleSqrt()
    .domain(valueExtent) // What's in the data
    .range([1, 50]); // Size in pixel

  // Draw the map
  svg
    .append("g")
    .selectAll("path")
    .data(dataGeo.features)
    .join("path")
    .attr("fill", "#b8b8b8")
    .attr("d", d3.geoPath().projection(projection))
    .style("stroke", "none")
    .style("opacity", 0.3);
  // .attr("transform", `translate(-800, 0)`);

  const locations = [
    { lat: 22.5726, lng: 88.3639 },
    { lat: 28.7041, lng: 77.1025 },
  ];

  svg
    .append("g")
    .attr("class", "cluster-markers")
    .selectAll("g")
    .data(locations)
    .enter()
    .append("g")
    .attr("data-date", (d) => console.log(d))
    .attr("transform", function (d) {
      return "translate(" + projection([d.lng, d.lat]) + ")";
    })
    .append("circle")
    .attr("fill", "blue")
    .attr("r", 5)
    .attr("transform", `translate(-2.5, -2.5)`);

  const markers = d3.select(".cluster-markers");

  markers
    .append("g")
    .selectAll("circle")
    .data(locations)
    .enter()
    .append("circle")
    .attr("cx", (d) => projection([d.lng, d.lat])[0])
    .attr("cy", (d) => projection([d.lng, d.lat])[1])
    .attr("r", 8)
    .attr("fill", "none")
    .attr("stroke-width", 1)
    .attr("stroke", "blue")
    .attr("transform", `translate(-2.6, -2.6)`);
});
