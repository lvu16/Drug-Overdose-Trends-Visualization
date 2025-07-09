const margin = {top: 20, right: 20, bottom: 30, left: 40};
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// add an svg
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right + 200)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// load data
d3.csv('drugoverdose.csv').then((data) => {
    console.log(data);
    console.log(data.columns);
    data.forEach(d => {
        d.YEAR = +d.YEAR;
        d.ESTIMATE = +d.ESTIMATE; 
    });

   
    // render 3 different charts based on the chart type. 
    const chartType = d3.select("#chartType");
    chartType.on("change", function () {
        const selectedChart = d3.select(this).property("value");
        svg.selectAll("*").remove();      
        if (selectedChart === "barALL") {
            renderBarChart(data);
        } else if (selectedChart === "lineAge") {
            showDropDown(false);
            renderLineChart(data);
        } else if (selectedChart === "groupBar") {
            showDropDown(false);
            renderGroupBarChart(data);
        }
        
    });


    // render bar chart by default
    renderBarChart(data);
   
    
});



// function to render bar chart
function renderBarChart(data) {
    // make sure bar chart dropdown is visible
    showDropDown(true);
    let dropdownContainer = d3.select("optionforBarChart");
    if (dropdownContainer.empty()) {
        dropdownContainer = d3.select("header")
                            .append("div")
                            .attr("id", "optionforBarChart");
    } else {
        dropdownContainer.html("");
    }

    // get data for in seperate into catergories based on sex, race to render different bar chart for each category when selecting
    const categories = Array.from(new Set(data
        .filter(d =>d.PANEL === "All drug overdose deaths" && d.AGE === "All ages")
        .map(d => d.STUB_LABEL)
    ));
    console.log(categories);

    const dropdownForBarChart = dropdownContainer
                                    .append("label")
                                    .text("Select Category: ")
                                    .append("select")
                                    .attr("id", "categoryDropdown");

    dropdownForBarChart.selectAll("option")
                        .data(categories)
                        .enter()
                        .append("option")
                        .attr("value", d => d)
                        .text(d => d);
    
    // default selected value
    let selectedCategory = categories[0];

   

    // function to update bar chart based on the selected value
    function updateChart() {
        selectedCategory = d3.select("#categoryDropdown").property("value");

        const filteredData = data.filter(d => 
            d.PANEL === "All drug overdose deaths" &&
            d.AGE === "All ages" &&
            d.STUB_LABEL === selectedCategory
        );

        svg.selectAll("*").remove();

        // define x and y scales
        const x = d3.scaleBand()
                    .domain(filteredData.map(d => d.YEAR))
                    .range([0, width])
                    .padding(0.1);
        
        const y = d3.scaleLinear()
                    .domain([0, d3.max(filteredData, d => d.ESTIMATE)])
                    .range([height, 0]);

        // add x axis
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        //add y axis
        svg.append("g")
            .call(d3.axisLeft(y));

        // add info box to display details on hover
        const infobox = d3.select("#chart").append("div")
                .attr("class", "infobox")
                .style("position", "absolute")
                .style("font-size", "12px")
                .style('background-color', 'white')
                .style('border', '1px solid black')
                .style('padding', '5px')
                .style('border-radius', '5px')
                .style('opacity', 1)
                .html(`
                        <strong>Year: </strong>  <br>
                        <strong>Estimate: </strong>  <br>
                        `);
     

        // add bars
        svg.selectAll(".bar")
            .data(filteredData)
            .enter()
            .append("rect")
            .attr("x", d => x(d.YEAR))
            .attr("y", d => y(d.ESTIMATE))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.ESTIMATE))
            .attr("fill", "#7c6e39")
            .on("mouseover", function (event, i) {
                const d = filteredData[i];
                d3.select(this).attr("opacity", 0.7);
    
                infobox.transition()
                        .duration(200)
                        .style("opacity", 1);
                    
                infobox.html(`
                    <strong>Year: </strong> ${d.YEAR} <br>
                    <strong>Estimate: </strong> ${d.ESTIMATE} <br>
                    `).style("opacity", 1);
            }) 
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 1);
    
                infobox.transition()
                        .duration(500)
                        .style("opcity", 0);

                infobox.html(`
                    <strong>Year: </strong>  <br>
                    <strong>Estimate: </strong>  <br>
                    `);       
            });

        addAxisLabels("Year", "Estimated deaths per 100 000 resident population");
       
    }

    updateChart();

    // update the bar chart for each category when selecting category
    d3.select("#categoryDropdown").on("change", updateChart);
    
    console.log("render bar chart successfully");
}



// function to render line chart
function renderLineChart(data) {
    showDropDown(false);
    svg.selectAll("*").remove();
    d3.select("#optionforBarChart").remove();

    // fiter data to based on age and all drug
    const filteredData = data.filter(d => d.PANEL === "All drug overdose deaths" && d.AGE !== "All ages")
                            .map(d=>({
                                ...d,
                                YEAR: +d.YEAR,
                                ESTIMATE: +d.ESTIMATE,

                            }));
    console.log("filtered data line chart:", filteredData);
                        
    // filter data and group by age
    const ageGroups = Array.from(new Set(filteredData.map(d=>d.AGE)));
    console.log("age groups: ",ageGroups);

    const uniqueYears = Array.from(new Set(filteredData.map(d => d.YEAR))).sort((a, b) => a - b);

    // define scales for x axis and y axis
    const x = d3.scaleLinear()
                .domain([d3.min(uniqueYears) - 1, d3.max(uniqueYears) + 1])
                .range([0, width]);

    const y = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => d.ESTIMATE)])
                .range([height, 0]);


    // add x and y axis
    svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x)
            .tickValues(uniqueYears)
            .tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    const line = d3.line()
                    .x(d => x(d.YEAR))
                    .y(d => y(d.ESTIMATE));
                    
    
    // define color for each age group
    const color = d3.scaleOrdinal(d3.schemeCategory10)
                    .domain(ageGroups);

    addAxisLabels("Year", "Estimated deaths per 100 000 resident population");
    

    // create a tooltip div that is initially hidden
    const tooltip = d3.select("#chart").append("div")
                                    .attr("class", "tooltip")
                                    .style("position", "absolute")
                                    .style("font-size", "12px")
                                    .style('background-color', 'white')
                                    .style('border', '1px solid black')
                                    .style('padding', '5px')
                                    .style('border-radius', '5px')
                                    .style('opacity', 0); // Start with opacity 0 to keep it hidden

    // render lines based on age group
    ageGroups.forEach((age) => {
        const ageData = filteredData.filter(d => d.AGE === age);
        console.log(`data for age group ${age}: `, ageData);

        // add line
        svg.append("path")
            .datum(ageData) //bind the data for this age group
            .attr("fill", "none")
            .attr("stroke", color(age)) //color based on age group
            .attr("stroke-width", 2)
            .attr("d", line);
        
        // add circles for each data point
        svg.selectAll(`.point-${age.replace(/\s/g, "-")}`)
            .data(ageData)
            .enter()
            .append("circle")
            .attr("cx", d =>x(d.YEAR))
            .attr("cy", d => y(d.ESTIMATE))
            .attr("r", 3)
            .attr("fill", color(age))
            .on("mouseover", function (event, i) {

                const d = ageData[i];
                const cx  = +d3.select(this).attr("cx");
                const cy  = +d3.select(this).attr("cy");
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);

                tooltip.html(`<strong>Age Group: </strong> ${d.AGE}
                                <br><strong>Year: </strong> ${d.YEAR} 
                                <br><strong>Estimate: </strong>${d.ESTIMATE}`)
                        .style("left", (cx+ 20) + "px")
                        .style("top", (cy) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0)
            });
    });

    // add legend
    const legend = svg.append("g")
                    .attr("transform", `translate(${width}, 20)`); //position to the right of the chart


    ageGroups.forEach((age, i) => {
        const legendRow = legend.append("g")
                        .attr("transform", `translate(0, ${i * 20})`) // space rows 20px apart

        legendRow.append("line")
                .attr("x1", 0)
                .attr("x2", 30)
                .attr("y1", 7.5)
                .attr("y2", 7.5)
                .attr("stroke", color(age))
                .attr("stroke-width", 2);
                

        legendRow.append("text")
                .attr("x", 40)
                .attr("y", 12)
                .attr("text-anchor", "start")
                .attr("font-size", "12px")
                .text(age);
    });

    console.log("Line chart rendered successfully.");
}



// function to render grouped bar chart
function renderGroupBarChart(data) {
    svg.selectAll("*").remove();
    d3.select("#optionforBarChart").remove();

    // filter data based all drug type
    const filteredData = data.filter(d =>
         ["All drug overdose deaths", "Drug overdose deaths involving any opioid", "Drug overdose deaths involving methadone", "Drug overdose deaths involving heroin"]
         .includes(d.PANEL) &&
         d.AGE === "All ages" &&
         d.STUB_LABEL === "All persons"
        );
    
    console.log(filteredData);

    const years = Array.from(new Set(filteredData.map(d => d.YEAR))).sort((a,b) => a - b);
    const drugTypes = ["All drug overdose deaths", "Drug overdose deaths involving any opioid", "Drug overdose deaths involving methadone", "Drug overdose deaths involving heroin"];
    

    const x0 = d3.scaleBand() //outer scale for year
                .domain(years)
                .range([-1, width + 1])
                .padding(0.2);
            
    const x1 = d3.scaleBand()
                .domain(drugTypes) //inner scale for drug types
                .range([0, x0.bandwidth()])
                .padding(0.05);

    const y = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => d.ESTIMATE)])
                .range([height, 0]);
    
    const color = d3.scaleOrdinal(d3.schemeCategory10)
                .domain(drugTypes)
                .range(["#7c6e39", "#feb236", "#d64161", "#ff7b25"]);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x0).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    addAxisLabels("Year", "Estimated deaths per 100 000 resident population");



    // render group bar
    svg.selectAll(".year-group")
        .data(years)
        .enter()
        .append("g")
        .attr("class", "year-group")
        .attr("transform", d => `translate(${x0(d)}, 0)`)
        .selectAll("rect")
        .data(year => drugTypes.map(drugType => ({
            year,
            drugType,
            estimate: filteredData.find(d => d.YEAR === year && d.PANEL === drugType)?.ESTIMATE || 0
        })))
        .enter()
        .append("rect")
        .attr("x", d => x1(d.drugType))
        .attr("y", d => y(d.estimate))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.estimate))
        .attr("fill", d => color(d.drugType))
        .on("mouseover", function (event, i) {
            d3.select(this).attr("opacity", 0.7);
        }) 
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 1);
        });



    // add legend
    const legend = svg.append("g")
                    .attr("transform", `translate(20, 20)`); //position to the right of the chart


    drugTypes.forEach((drugType, i) => {
        const legendRow = legend.append("g")
                        .attr("transform", `translate(0, ${i * 20})`) // space rows 20px apart

        legendRow.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", color(drugType))
                

        legendRow.append("text")
                .attr("x", 20)
                .attr("y", 12)
                .attr("text-anchor", "start")
                .attr("font-size", "12px")
                .text(drugType);
    });
                
}


// // function to toggle option for barchart
function showDropDown(show) {
    let dropdownContainer = d3.select("optionforBarChart");
    if (show) {
        if(dropdownContainer.empty()) {
            dropdownContainer = d3.select("header")
                            .append("div")
                            .attr("id", "optionforBarChart");
        }
        dropdownContainer.style("display", "block");
    } else {
        if (!dropdownContainer.empty()) {
            dropdownContainer.style("display", "none");
        }
    }
    
}


// function to create axis labels
function addAxisLabels(xLabel, yLabel) {
    svg.append("text")
        .attr("class", "xAxislabel")
        .attr("text-anchor", "middle")
        .attr("x", width/2)
        .attr("y", height + margin.bottom)
        .attr("font_size", "14px")
        .text(xLabel);

    svg.append("text")
        .attr("class", "yAxislabel")
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90)`)
        .attr("x", -height/2)
        .attr("y", -margin.left + 15)
        .attr("font_size", "14px")
        .text(yLabel);
}
