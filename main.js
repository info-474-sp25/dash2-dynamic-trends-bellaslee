// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svgLine = d3.select("#lineChart1") // If you change this ID, you must change it in index.html too
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// const svgBar = d3.select("#lineChart2")
//     .append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//     .append("g")
//     .attr("transform", `translate(${margin.left},${margin.top})`);

// (If applicable) Tooltip element for interactivity
// const tooltip = ...

// 2.a: LOAD...
d3.csv("data.csv").then(data => {
    // 2.b: ... AND TRANSFORM DATA
    data.forEach(d => {
        d.year = new Date(d.Event_Date).getFullYear();
    })

    const cleanData = data.filter(d => d.Injury_Severity != "Unavailable"
        && d.year != null
    )

    console.log(cleanData);

    const dataMap = d3.rollup(
        cleanData,
        v => v.length, // Count number of rows
        d => d.year
    );

    const lineData = Array.from(dataMap, ([year, accidents]) => ({ year, accidents }))
        .sort((a, b) => b.year - a.year);

    console.log("Data map: ", dataMap);
    console.log("Line data: ", lineData)

    // 3.a: SET SCALES FOR CHART 1
    let xYear = d3.scaleLinear()
        .domain([d3.min(lineData, d => d.year), d3.max(lineData, d => d.year)])
        .range([0, width]);

    let yAccidents = d3.scaleLinear()
        .domain([0, d3.max(lineData, d => d.accidents)])
        .range([height, 0]);

    const line = d3.line()
        .x(d => xYear(d.year))
        .y(d => yAccidents(d.accidents));


    // 4.a: PLOT DATA FOR CHART 1
    svgLine.append("path")
        .datum(lineData)
        .attr("d", line)
        .attr("stroke", "salmon")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    // 5.a: ADD AXES FOR CHART 1
    svgLine.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xYear)
            .tickFormat(d3.format("d")) // remove decimals
        );

    svgLine.append("g")
        .call(d3.axisLeft(yAccidents));

    // 6.a: ADD LABELS FOR CHART 1
    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left / 2 - 10)
        .text("Number of Incidents")

    // 7.a: ADD INTERACTIVITY FOR CHART 1


    // ==========================================
    //         CHART 2 (if applicable)
    // ==========================================

    // 3.b: SET SCALES FOR CHART 2


    // 4.b: PLOT DATA FOR CHART 2


    // 5.b: ADD AXES FOR CHART 


    // 6.b: ADD LABELS FOR CHART 2


    // 7.b: ADD INTERACTIVITY FOR CHART 2


});