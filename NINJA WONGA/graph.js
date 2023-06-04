const dims = { height: 300, width: 300, radius: 150 };

const cent = { x: dims.width / 2 + 20, y: dims.height / 2 + 20 };

let total_expenses = 0;

const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", dims.width + 150)
  .attr("height", dims.height + 150);

svg
  .append("circle")
  .attr("cx", cent.x)
  .attr("cy", cent.y)
  .attr("stroke", "#29B6F6")
  .attr("stroke-wdith", 2)
  .attr("r", dims.radius + 10)
  .attr("fill", "transparent")
  .attr("class", "path");

svg
  .append("circle")
  .attr("cx", cent.x)
  .attr("cy", cent.y)
  .attr("stroke", "#29B6F6")
  .attr("stroke-wdith", 2)
  .attr("r", dims.radius - 45)
  .attr("fill", "transparent")
  .attr("class", "path-rev");

const graph = svg
  .append("g")
  .attr("transform", `translate(${cent.x}, ${cent.y})`);

const title = svg
  .append("text")
  .text("Total expenses")
  .attr("x", cent.x)
  .attr("y", cent.y)
  .attr("text-anchor", "middle")
  .attr("class", "center-text");

const total_val = svg
  .append("text")
  .text(total_expenses)
  .attr("x", cent.x)
  .attr("y", cent.y + 35)
  .attr("text-anchor", "middle")
  .attr("class", "center-text-val");

const lg = svg
  .append("defs")
  .append("linearGradient")
  .attr("id", "grad1")
  .attr("x1", "0%")
  .attr("x2", "100%")
  .attr("y1", "0%")
  .attr("y2", "0%");

lg.append("stop")
  .attr("offset", "6%")
  .style("stop-color", "#FFC700") //end in red
  .style("stop-opacity", 1);

lg.append("stop")
  .attr("offset", "94%")
  .style("stop-color", "#FFDA58") //start in blue
  .style("stop-opacity", 1);

const lg2 = svg
  .append("defs")
  .append("linearGradient")
  .attr("id", "grad2")
  .attr("x1", "0%")
  .attr("x2", "100%")
  .attr("y1", "0%")
  .attr("y2", "0%");

lg2
  .append("stop")
  .attr("offset", "0%")
  .style("stop-color", "#6ECE78") //end in red
  .style("stop-opacity", 1);

lg2
  .append("stop")
  .attr("offset", "100%")
  .style("stop-color", "#1B7C51") //start in blue
  .style("stop-opacity", 1);

const pie = d3
  .pie()
  .sort(null)
  .value((d) => d.cost);

const arcPath = d3
  .arc()
  .outerRadius(dims.radius)
  .innerRadius(dims.radius / 1.3);

// const color = d3.scaleOrdinal(["url(#grad1)", "url(#grad2)"]);

const color = d3.scaleOrdinal(d3["schemeSet3"]);

// Legend setup

const legendGroup = svg
  .append("g")
  .attr("transform", `translate(${dims.width + 60}, 10)`);

const outlineCircle = svg.append("g");

outlineCircle.append("circle").attr("fill", "#fff");

const legend = d3.legendColor().shape("circle").scale(color).shapePadding(10);
// .orient("horizontal");

const tip = d3
  .tip()
  .attr("class", "tip card")
  .html((d) => {
    let content = `<div class="name">${d.data.name} : <strong>${d.data.cost}</strong></div>`;

    content += `<div class="delete" >Click slice to delete</div>`;
    return content;
  });

graph.call(tip);

const update = (data) => {
  total_expenses = 0;

  data.forEach((item) => {
    total_expenses = total_expenses + item.cost;
  });

  total_val.text(total_expenses);

  //  update color scale domain
  color.domain(data.map((d) => d.name));

  legendGroup.call(legend);
  legendGroup
    .selectAll("text")
    .attr("fill", "#fff")
    .attr("font-family", "Segoe UI");

  // join enhanced (pie) data to path elements
  const paths = graph.selectAll("path").data(pie(data));

  // handle remove path
  paths.exit().transition().duration(750).attrTween("d", arcTweenExit).remove();

  // handle the current path
  paths
    .attr("d", (d) => arcPath(d))
    .transition()
    .duration(750)
    .attrTween("d", arcTweenUpdate);

  paths
    .enter()
    .append("path")
    .attr("class", "arc")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .style("fill", (d) => color(d.data.name))
    .each(function (d) {
      this._current = d;
    })
    .transition()
    .duration(750)
    .attrTween("d", arcTweenEnter);

  graph
    .selectAll("path")
    .on("mouseover", (d, i, n) => {
      handleMouseOver(d, i, n);
      tip.show(d, n[i]);
    })
    .on("mouseout", (d, i, n) => {
      handleMouseOut(d, i, n);
      tip.hide();
    })
    .on("click", handleClick);
};

var data = [];

db.collection("expenses").onSnapshot((res) => {
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

const arcTweenEnter = (d) => {
  var i = d3.interpolate(d.endAngle, d.startAngle);

  return function (t) {
    d.startAngle = i(t);
    return arcPath(d);
  };
};

const arcTweenExit = (d) => {
  var i = d3.interpolate(d.startAngle, d.endAngle);

  return function (t) {
    d.startAngle = i(t);
    return arcPath(d);
  };
};

function arcTweenUpdate(d) {
  var i = d3.interpolate(this._current, d);

  this._current = i(1);

  return function (t) {
    return arcPath(i(t));
  };
}

// Event handlers

const handleMouseOver = (d, i, n) => {
  console.log(d3.select(n[i]));
  d3.select(n[i])
    .transition("changeSliceFill")
    .duration(300)
    .style("fill", "#fff");
};

const handleMouseOut = (d, i, n) => {
  d3.select(n[i])
    .transition("changeSliceFill")
    .duration(300)
    .style("fill", color(d.data.name));
};

const handleClick = (d, i, n) => {
  const id = d.data.id;

  db.collection("expenses").doc(id).delete();
};
