// add div for tooltip
d3.select(".chart-outer")
   .insert("div", ":first-child")
   .attr("id", "tooltip")
   .attr("class", "tooltip")
   .style("opacity", "0");

// setup chart
const height = 380;
const width = 1300;
const paddingY = 60;
const paddingX = 100;
const colorScheme = [
   "#a50026",
   "#d73027",
   "#f46d43",
   "#fdae61",
   "#fee090",
   "#ffffbf",
   "#e0f3f8",
   "#abd9e9",
   "#74add1",
   "#4575b4",
   "#313695"
].reverse();
const chartContainer = d3.select(".chart");

chartContainer
   .append("div")
   .attr("id", "title")
   .attr("class", "title-container")
   .append("h1")
   .attr("class", "title")
   .text("Monthly Global Land-Surface Temperature");

d3.select("#title")
   .append("p")
   .attr("class", "sub-title")
   .text("1753 - 2015: base temperature 8.66℃");

const chart = chartContainer
   .append("svg")
   .attr("width", width + paddingX)
   .attr("height", height + paddingY);

d3.json(
   "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
).then((data) => {
   console.log(data);
   const { baseTemperature: baseTemp, monthlyVariance: variance } = data;

   // months (y-axis)
   const yAxisScale = d3
      .scaleBand()
      .range([0, height])
      .domain([...Array(12).keys()]);
   const yAxis = d3
      .axisLeft(yAxisScale)
      .tickValues(yAxisScale.domain())
      .tickFormat((m) => {
         const date = new Date();
         const format = d3.timeFormat("%B");
         date.setUTCMonth(m);
         return format(date);
      })
      .tickSize(7);

   chart
      .append("g")
      .call(yAxis)
      .attr("id", "y-axis")
      .attr("transform", "translate(60, 20)");

   // years (x-axis)
   const years = [...new Set(variance.map((m) => m.year))];
   const xAxisScale = d3.scaleBand().range([0, width]).domain(years);
   const xAxis = d3
      .axisBottom(xAxisScale)
      .tickValues(xAxisScale.domain().filter((y) => !(y % 15)))
      .tickSize(9);

   chart
      .append("g")
      .call(xAxis)
      .attr("id", "x-axis")
      .attr("transform", `translate(60, ${height + 20})`);

   // temperature data
   const [minTemp, maxTemp] = d3.extent(variance.map((v) => v.variance + baseTemp));
   const rangeStep = (maxTemp - minTemp) / colorScheme.length;
   const rangeDomain = [...new Array(11).keys()].map((i) => minTemp + i * rangeStep);
   const colorScale = d3.scaleThreshold().domain(rangeDomain.slice(1)).range(colorScheme);
   console.log(colorScale(5));

   chart
      .selectAll("rect")
      .data(variance)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("transform", "translate(60,20)")
      .attr("data-month", (d) => d.month)
      .attr("data-year", (d) => d.year)
      .attr("y", (d) => yAxisScale(d.month - 1))
      .attr("x", (d) => xAxisScale(d.year))
      .attr("height", (d) => yAxisScale.bandwidth(d.month - 1))
      .attr("width", (d) => xAxisScale.bandwidth(d.year))
      .attr("fill", d => colorScale(baseTemp + d.variance));
});
