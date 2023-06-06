const margin = { top: 40, right: 20, bottom: 50, left: 100 };
const graphWidth = 560 - margin.left - margin.right;
const graphHeight = 360 - margin.top - margin.bottom;

const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", graphWidth + margin.left + margin.right)
  .attr("height", graphHeight + margin.top + margin.bottom);

const graph = svg
  .append("g")
  .attr("width", graphWidth)
  .attr("height", graphHeight)
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

const lg = svg
  .append("defs")
  .append("linearGradient")
  .attr("id", "grad1")
  // .attr("x1", "0%")
  .attr("x2", "0%")
  // .attr("y1", "0%")
  .attr("y2", "100%");

lg.append("stop")
  .attr("offset", "60%")
  .style("stop-color", "#009DD3") //end in red
  .style("stop-opacity", 1);

lg.append("stop")
  .attr("offset", "90%")
  .style("stop-color", "#CBF7FF") //start in blue
  .style("stop-opacity", 1);

//scales
const x = d3.scaleTime().range([0, graphWidth]);
const y = d3.scaleLinear().range([graphHeight, 0]);

// axes groups
const xAxisGroup = graph
  .append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0, ${graphHeight})`);

const yAxisGroup = graph.append("g").attr("class", "y-axis");

//d3 area path generator

const area = d3
  .area()
  .x(function (d) {
    return x(new Date(d.date));
  })
  .y0(y(0))
  .y1(function (d) {
    return y(d.distance);
  })
  .curve(d3.curveNatural);

// d3 line path generator

const line = d3
  .line()
  .x(function (d) {
    return x(new Date(d.date));
  })
  .y(function (d) {
    return y(d.distance);
  })
  .curve(d3.curveNatural);

// area path element
const areaPath = graph.append("path");

// line path element
const linePath = graph.append("path");

const tip = d3
  .tip()
  .attr("class", "tip card")
  .html((d) => {
    let content = `<div class="name">${d.activity} : <strong>${d.distance}</strong></div>`;
    return content;
  });

graph.call(tip);

const update = (data) => {
  data = data.filter((item) => item.activity === activity);

  // sort data based on date
  data.sort((a, b) => new Date(a.date) - new Date(b.date));

  x.domain(d3.extent(data, (d) => new Date(d.date)));
  y.domain([0, d3.max(data, (d) => d.distance)]);

  // update area data
  areaPath
    .data([data])
    .attr("fill", "url(#grad1)")
    .attr("stroke", "#fff")
    .attr("d", area);

  linePath
    .data([data])
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("d", line);

  // Create circles for objects
  graph.append("circle").attr("class", ".circle-point");
  const circles = graph.selectAll(".circle-point").data(data);

  // Create circles outline
  graph.append("circle").attr("class", ".circle-outline");
  const circleOutline = graph.selectAll(".circle-outline").data(data);

  // delete points
  circles.exit().remove();
  circleOutline.exit().remove();

  // update current points
  circles
    .attr("r", 4)
    .attr("cx", (d) => x(new Date(d.date)))
    .attr("cy", (d) => y(d.distance));

  circleOutline
    .attr("r", 6)
    .attr("cx", (d) => x(new Date(d.date)))
    .attr("cy", (d) => y(d.distance));

  // add new circles
  circles
    .enter()
    .append("circle")
    .attr("class", "circle-point")
    .attr("r", 4)
    .attr("cx", (d) => x(new Date(d.date)))
    .attr("cy", (d) => y(d.distance))
    .attr("fill", "#fff")
    .transition()
    .duration(750);

  circleOutline
    .enter()
    .append("circle")
    .attr("class", "circle-outline")
    .attr("r", 6)
    .attr("cx", (d) => x(new Date(d.date)))
    .attr("cy", (d) => y(d.distance))
    .attr("fill", "transparent")
    .attr("stroke", "#fff")
    .attr("Stroke-width", 2)
    .transition()
    .duration(750);

  graph
    .selectAll(".circle-outline")
    .on("mouseover", (d, i, n) => {
      // handleMouseOver(d, i, n);
      tip.show(d, n[i]);
    })
    .on("mouseout", (d, i, n) => {
      // handleMouseOut(d, i, n);
      tip.hide(d, n[i]);
    });

  //Create axes
  const xAxis = d3.axisBottom(x).ticks(4).tickFormat(d3.timeFormat("%b %d"));
  const yAxis = d3
    .axisLeft(y)
    .ticks(4)
    .tickFormat((d) => d + "m");

  // Call axes
  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);
};

var data = [];

db.collection("activities").onSnapshot((res) => {
  res.docChanges().forEach((change) => {
    const doc = { ...change.doc.data(), id: change.doc.id };

    switch (change.type) {
      case "added":
        data.push(doc);
        break;
      case "modified":
        const index = data.findIndex((item) => item.id == doc.id);
        data[index] = doc;
        break;
      case "removed":
        data = data.filter((item) => item.id !== doc.id);
        break;
      default:
        break;
    }
  });

  update(data);
});

const handleMouseOver = (d, i, n) => {
  d3.select(n[i]).attr("r", 6);
};

const handleMouseOut = (d, i, n) => {
  d3.select(n[i]).attr("r", 4);
};
