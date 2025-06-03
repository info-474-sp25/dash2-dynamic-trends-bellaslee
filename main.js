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

// 2.a: LOAD...
d3.csv("data.csv").then(data => {
    data.forEach(d => {
        d.year = new Date(d.Event_Date).getFullYear();
        d.severity = d.Injury_Severity.replace(/\s*\(.*?\)\s*/g, "").trim();
    })

    const cleanData = data.filter(d => d.severity != "Unavailable"
        && d.year != null
    )

    console.log(cleanData);

    const dataMap = d3.rollup(
        cleanData,
        v => v.length, // Count number of rows
        d => d.year
    );

    const groupedData = d3.rollups(
        cleanData,
        v => v.length,
        d => d.severity,
        d => d.year
    );

    const lineDataBySeverity = new Map(
        groupedData.map(([severity, entries]) => [
            severity,
            entries.map(([year, count]) => ({ year, count }))
                .sort((a, b) => a.year - b.year)
        ])
    );
    console.log("Line data by severity:", lineDataBySeverity);

    // Flatten all grouped data into a single array for computing global extents
    const allLineData = Array.from(lineDataBySeverity.values()).flat();


    // 3.a: SET SCALES FOR CHART 1
    let xYear = d3.scaleLinear()
        .domain(d3.extent(allLineData, d => d.year))
        .range([0, width]);

    let yAccidents = d3.scaleLinear()
        .domain([0, d3.max(allLineData, d => d.count)])
        .range([height, 0]);

    const line = d3.line()
        .x(d => xYear(d.year))
        .y(d => yAccidents(d.count));


    // 4.a: PLOT DATA FOR CHART 1
    // svgLine.append("path.data-line")
    //     .datum(lineData)
    //     .attr("d", line)
    //     .attr("stroke", "salmon")
    //     .attr("stroke-width", 2)
    //     .attr("fill", "none")
    //     .attr("class", "data-line");

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


    // 7.a: INTERACTIVITY
    function linearRegression(data) {
        const n = data.length;
        const sumX = d3.sum(data, d => d.year);
        const sumY = d3.sum(data, d => d.count);
        const sumXY = d3.sum(data, d => d.year * d.count);
        const sumX2 = d3.sum(data, d => d.year * d.year);

        // Calculate slope (m) and intercept (b)
        const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const b = (sumY - m * sumX) / n;

        // Generate points for the trendline
        const trendlineData = data.map(d => ({
            year: d.year,
            count: m * d.year + b
        }));

        return trendlineData;
    };

    // Function to draw the trendline if the checkbox is checked
    function drawTrendline(selectedCategory) {
        const filteredData = lineDataBySeverity.get(selectedCategory) || [];
        if (filteredData.length === 0) return;

        const trendlineData = linearRegression(filteredData);

        // Remove the previous trendline if it exists
        svgLine.selectAll(".trendline").remove();

        // Add the trendline path
        svgLine.append("path")
            .datum(trendlineData)
            .attr("class", "trendline")
            .attr("d", d3.line()
                .x(d => xYear(d.year))
                .y(d => yAccidents(d.count))
            )
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5");
    }

    function updateChart(selected) {
        const filteredData = lineDataBySeverity.get(selected) || [];

        // Remove existing lines
        svgLine.selectAll("path.data-line").remove();
        svgLine.selectAll(".trendline").remove(); // Remove the previous trendline

        // Add new line
        svgLine.append("path")
            .datum(filteredData)
            .attr("class", "data-line")
            .attr("d", d3.line()
                .x(d => xYear(d.year))
                .y(d => yAccidents(d.count))
            )
            .style("stroke", "salmon")
            .style("fill", "none")
            .style("stroke-width", 2);

        // Redraw the trendline automatically after the category changes
        if (d3.select("#trendline-toggle").property("checked")) {
            drawTrendline(selected); // Draw the trendline if the checkbox is checked
        }
    }

    updateChart("Incident");
    console.log("Filtered data for Fatal:", lineDataBySeverity.get("Fatal"));
    console.log("Available injury severities:", Array.from(new Set(cleanData.map(d => d.severity))));

    // Event listeners
    d3.select("#trendline-toggle").on("change", function () {
        const isChecked = d3.select(this).property("checked");
        const selectedCategory = d3.select("#injurySelect").property("value");

        if (isChecked) {
            drawTrendline(selectedCategory);
        } else {
            svgLine.selectAll(".trendline").remove();
        }
    });

    d3.select("#injurySelect").on("change", function () {
        var selected = d3.select(this).property("value");
        updateChart(selected); // Update the chart based on the selected option
    });
});