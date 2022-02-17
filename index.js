// add div for tooltip
d3.select(".chart-outer")
   .insert("div", ":first-child")
   .attr("id", "tooltip")
   .attr("class", "tooltip")
   .style("opacity", "0");

// setup chart
const height = 300;
const width = 1000;
const paddingY = 180;
const paddingX = 140;
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
const chart = chartContainer
   .append("svg")
   .attr("width", width + paddingX)
   .attr("height", height + paddingY);

// title
chartContainer
   .append("div")
   .lower() // inserts at the start of parent
   .attr("id", "title")
   .attr("class", "title-container")
   .append("h1")
   .attr("class", "title")
   .text("Monthly Global Land-Surface Temperature");

d3.json(
   "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
).then((data) => {
   const { baseTemperature: baseTemp, monthlyVariance: variance } = data;

   // add dynamic sub-title based of data
   d3.select("#title")
      .append("p")
      .attr("id", "description")
      .text(`${d3.extent(variance, d => d.year).join(" - ")}: base temperature ${baseTemp}°C`)
      .style("font-weight", "bold");

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
      .attr("transform", `translate(${paddingX / 2 + 30}, 20)`);

   chart
      .append("g")
      .attr("transform", "translate(30, 180)")
      .append("text")
      .attr("transform", "rotate(-90)")
      .style("font-size", "smaller")
      .text("months");

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
      .attr("transform", `translate(${paddingX / 2 + 30}, ${height + 20})`);

   chart
      .append("g")
      .attr("transform", `translate(${(width + paddingX) / 2}, ${height + 60})`)
      .append("text")
      .style("font-size", "smaller")
      .text("years");

   // temperature data
   const [minTemp, maxTemp] = d3.extent(variance.map((v) => v.variance + baseTemp));
   const rangeStep = (maxTemp - minTemp) / colorScheme.length;
   const rangeDomain = [...new Array(11).keys()].map((i) => minTemp + i * rangeStep);
   const colorScale = d3.scaleThreshold().domain(rangeDomain.slice(1)).range(colorScheme);

   chart
      .selectAll("rect")
      .data(variance)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("transform", `translate(${paddingX / 2 + 30},20)`)
      .attr("data-month", (d) => d.month - 1)
      .attr("data-year", (d) => d.year)
      .attr("data-temp", (d) => d.variance + baseTemp)
      .attr("y", (d) => yAxisScale(d.month - 1))
      .attr("x", (d) => xAxisScale(d.year))
      .attr("height", (d) => yAxisScale.bandwidth(d.month - 1))
      .attr("width", (d) => xAxisScale.bandwidth(d.year))
      .attr("fill", (d) => colorScale(baseTemp + d.variance))
      .on("mouseenter", (event, d) => {
         const xValue = xAxisScale(d.year);
         const yValue = yAxisScale(d.month - 1);
         const format = d3.timeFormat("%B");
         d3
            .select("#tooltip")
            .attr("data-year", d.year)
            .style("opacity", "0.9")
            .style("z-index", "1")
            .style("left", `${xValue - 0.5}px`)
            .style("top", `${yValue + 15}px`).html(`
               <p><span class="tt-label">DATE:</span>${d.year} - ${format(
            new Date().setUTCMonth(d.month - 1)
         )}</p>
               <p><span class="tt-label">TEMPERATURE:</span>${+parseFloat(
                  baseTemp + d.variance
               ).toFixed(2)}°C</p>
               <p><span class="tt-label">VARIANCE:</span>${parseFloat(d.variance)}°C</p>
            `);
      })
      .on("mouseout", () => {
         d3.select("#tooltip").style("opacity", "0").style("z-index", "-1");
      });

   // legend
   const legendScale = d3.scaleLinear().domain([minTemp, maxTemp]).range([0, 400]);
   const legendAxis = d3
      .axisBottom()
      .scale(legendScale)
      .tickValues(colorScale.domain())
      .tickSize(9)
      .tickFormat(d3.format(".1f"));

   chart
      .append("rect")
      .attr("width", 420)
      .attr("height", 105)
      .attr("x", 35)
      .attr("y", height + 74)
      .style("fill", "#e9f1f1")
      .style("stroke", "black")
      .style("stroke-width", "1px");

   const legendContainer = chart
      .append("g")
      .attr("transform", `translate(${paddingX / 2 - 25}, ${height + 130})`);

   const legend = legendContainer
      .append("g")
      .call(legendAxis)
      .attr("id", "legend");

   legendContainer
      .append("text")
      .text("Legend")
      .attr("x", 178)
      .attr("y", -37)
      .style("font-size", "smaller")
      .style("text-decoration", "underline");

   legendContainer
      .append("text")
      .text("temperatures in °C")
      .style("font-size", "smaller")
      .attr("x", 144)
      .attr("y", 36);

   function setRange(color) {
      const extent = colorScale.invertExtent(color);
      if (extent[0] === undefined) {
         extent[0] = minTemp;
      }
      if (extent[1] === undefined) {
         extent[1] = maxTemp;
      }
      return extent;
   }

   legend
      .append("g")
      .selectAll("rect")
      .data(colorScale.range().map(setRange))
      .enter()
      .append("rect")
      .attr("height", 30)
      .attr("width", 400 / colorScale.range().length)
      .attr("x", (d) => legendScale(d[0]))
      .attr("transform", "translate(0, -30)")
      .attr("fill", (d) => colorScale(d[0]))
      .style("stroke", "black")
      .style("stroke-width", "1px");
});
