const dims = { height: 500, width: 900 };

const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", dims.width + 100)
  .attr("height", dims.height + 100);

const graph = svg.append("g").attr("transform", `translate(50,50)`);

// data strat
const stratify = d3
  .stratify()
  .id((d) => d.name)
  .parentId((d) => d.parent);

const tree = d3.tree().size([dims.width, dims.height]);

// create ordinal scale
const colour = d3.scaleOrdinal(["#f4511e", "#e91e63", "#e53935", "#9c27b0"]);

const tip = d3
  .tip()
  .attr("class", "tip card")
  .html((d) => {
    let content = `<div class="name">Name : <strong>${d.data.name}</strong></div>`;
    content += `<div class="name">Department : <strong>${d.data.department}</strong></div>`;

    return content;
  });

graph.call(tip);

// update fucntion

const update = (data) => {
  // remove current nodes
  graph.selectAll(".node").remove();
  graph.selectAll(".link").remove();

  // get udated root node data
  const rootNode = stratify(data);

  const treeData = tree(rootNode);

  // get node selection and join data
  const nodes = graph.selectAll(".node").data(treeData.descendants());

  // get lin selection and join data
  const links = graph.selectAll(".link").data(treeData.links());

  //enter new links
  links
    .enter()
    .append("path")
    .transition()
    .duration(300)
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke", "#aaa")
    .attr("stroke-width", 2)
    .attr(
      "d",
      d3
        .linkVertical()
        .x((d) => d.x)
        .y((d) => d.y)
    );

  // Create enter node groups
  const enterNodes = nodes
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", (d) => `translate(${d.x},${d.y} )`);

  // Create rects to enter nodes
  enterNodes
    .append("rect")
    .attr("fill", (d) => colour(d.data.department))
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .attr("height", 40)
    .attr("width", (d) => d.data.name.length * 16)
    .attr("rx", 10)
    .attr("transform", (d) => {
      const t = d.data.name.length * 8;
      return `translate(${-t}, -25)`;
    });

  // append name text
  enterNodes
    .append("text")
    .attr("text-anchor", "middle")
    .attr("fill", "#fff")
    .text((d) => d.data.name);

  graph
    .selectAll("rect")
    .on("mouseover", (d, i, n) => tip.show(d, n[i]))
    .on("mouseout", (d, i, n) => tip.hide());
};

// data & firebase hook-up
var data = [];

db.collection("employees").onSnapshot((res) => {
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
