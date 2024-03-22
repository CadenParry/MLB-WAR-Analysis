
var playerData;
var avgDataGlobal;

function readData(){
    // Read the data from the csv file and call the initialize function
    d3.csv("player_visualization.csv", d3.autoType).then(playerData => {
        d3.csv("avgs.csv", d3.autoType).then(avgData => {
            avgDataGlobal = avgData;
            initialize(playerData, avgData);
        });
    });
}

function initialize(playerData, avgData){
    populatePlayerDropdown(playerData);
    createLinePlot(playerData, avgDataGlobal);
}

function createLinePlot(data, avgData){

    // Remove the previous plot
    d3.select("#lineplot").remove();
    d3.select("#legend").selectAll("*").remove();

    const width = 928;
    const height = 400;
    const marginTop = 40;
    const marginRight = 30;
    const marginBottom = 30;
    const marginLeft = 40;

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("id", "lineplot")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");


    // Get colors for the players
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    
    var selected_player = $('#playerdd').val();

    var filtered = data.filter(function(d){ return selected_player == d.player; })
    console.log(filtered);
    var data_incontract = filtered.filter(function(d){ return d.out_of_contract == "True"; });
    var data_outcontract = filtered.filter(function(d){ return d.out_of_contract == "False"; });

    // Declare the x (horizontal position) and y (vertical position) scales.
    const xscale = d3.scaleLinear()
        .domain(d3.extent(filtered, (_, i) => filtered[i].yearID))
    .range([marginLeft, width - marginRight]);

    const yscale = d3.scaleLinear([0, d3.max(filtered, (_, i) => filtered[i].OPS)], [height - marginBottom, marginTop]);

    // Add the x-axis.
    svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(xscale)
        .tickFormat(d3.format("d")) // format labels as integers
        .ticks(d3.max(filtered, (_, i) => filtered[i].yearID) - d3.min(filtered, (_, i) => filtered[i].yearID) + 1) // one tick for each year
        .tickSizeOuter(0));

    // Add the y-axis, remove the domain line, add grid lines and a label.
    svg.append("g")
        .attr("transform", `translate(0, ${marginLeft})`)
        .call(d3.axisLeft(xscale).ticks(height / 10))
        .call(g => g.select(".domain"))
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", marginLeft)
            .attr("y", 0)
            .attr("fill", "black")
            .attr("text-anchor", "start")
            .attr("font-size", "20px")
            .text("OPS"));
            
    makePlayerLine(svg, data_incontract, color(0), xscale, yscale, "In Contract");
    makePlayerLine(svg, data_outcontract, color(1), xscale, yscale, "Out of Contract");

    makeAvgLine(svg, avgData, color(3), xscale, yscale, "Average", filtered[0]['pos'])
    
    // Add svg to the body
    document.body.appendChild(svg.node());

}


function makeAvgLine(svg, avgData, color, xscale, yscale, label, pos){

    console.log(avgData);

    // Declare the line generator.
    const avg_line = d3.line()
        .x(d => xscale(d.yearID))
        .y(d => yscale(pos == "h" ? d.OPS : d.ERA));

    // Append a path for the line.
    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 3)
        .attr("d", avg_line(avgData));


    // Add dots to the line
    svg.selectAll("dot")
        .data(avgData)
        .enter().append("circle")
        .attr("r", 10)
        .attr("cx", function(d) { return xscale(d.Year);})
        .attr("cy", function(d) { return yscale(parseFloat(pos == "h" ? d.OPS : d.ERA )); })
        .attr("fill", color);

    // Add to legend
    d3.select("#legend").append("div")
        .attr("class", "dot")
        .style("background-color", color);

    d3.select("#legend").append("text")
        .text(label)
        .style("padding", "5px")
        .style("font-size", "18px");

    d3.select("#legend").append("br")

    // Add the tooltip
    svg.selectAll("dot")
        .data(avgData)
        .enter().append("text")
        .attr("x", function(d) { return xscale(d.Year); })
        .attr("y", function(d) { return yscale(parseFloat(pos == "h" ? d.OPS : d.ERA )); })
        // .text(function(d) { return d.OPS; })
        // .style("font-size", "15px")
        // .attr("alignment-baseline","middle");

}

function makePlayerLine(svg, playerdata, color, xscale, yscale, label){

    //console.log(playerdata);

    // Declare the line generator.
    const player_line = d3.line()
        .x(d => xscale(d.yearID))
        .y(d => yscale(d.OPS));

    // Append a path for the line.
    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 3)
        .attr("d", player_line(playerdata));


    // Add dots to the line
    svg.selectAll("dot")
        .data(playerdata)
        .enter().append("circle")
        .attr("r", 10)
        .attr("cx", function(d) { return xscale(d.yearID);})
        .attr("cy", function(d) { return yscale(parseFloat(d.OPS)); })
        .attr("fill", color);

    // Add to legend
    d3.select("#legend").append("div")
        .attr("class", "dot")
        .style("background-color", color);

    d3.select("#legend").append("text")
        .text(label)
        .style("padding", "5px")
        .style("font-size", "18px");

    d3.select("#legend").append("br")

    // Add the tooltip
    svg.selectAll("dot")
        .data(playerdata)
        .enter().append("text")
        .attr("x", function(d) { return xscale(d.yearID); })
        .attr("y", function(d) { return yscale(parseFloat(d.OPS)); })
        // .text(function(d) { return d.OPS; })
        // .style("font-size", "15px")
        // .attr("alignment-baseline","middle");

}

function populatePlayerDropdown(data){
    //Get unique values of the metric column 
    var unique_players = [...new Set(data.map(item => item.player))];

    console.log(unique_players);
    // var unique_metrics = ['WAR', 'oWAR', 'dWAR']
            // I want to add OPS+, OPS, wRC+, wOBA to the dropdown

    // Populate the 'playerdd' dropdown with the unique values
    var playerdd = d3.select("#playerdd");
    playerdd.selectAll("option")
        .data(unique_players)
        .enter()
        .append("option")
        .text(function(d) { return d; })
        .attr("value", function(d) { return d; });

    d3.select("#playerdd").on("change", function(){
        createLinePlot(data, avgDataGlobal);
    });
}

function populateCheckboxes(data){
    //Get unique player names 
    // var unique_players = [...new Set(data.map(item => item.Player_Name))];
    var unique_players = ['Robinson Cano'];

    for(var i = 0; i < unique_players.length; i++){
        var checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.name = "player";
        checkbox.value = unique_players[i];
        checkbox.id = unique_players[i];
        if (unique_players[i] == 'Team'){
            checkbox.checked = true;
        }
        checkbox.onchange = function() {
            createLinePlot(data, avgDataGlobal);
        }

        var label = document.createElement('label');
        label.htmlFor = unique_players[i];
        label.appendChild(document.createTextNode(unique_players[i]));

        var br = document.createElement('br');

        document.getElementById('player-checkboxes').appendChild(checkbox);
        document.getElementById('player-checkboxes').appendChild(label);
        document.getElementById('player-checkboxes').appendChild(br);
    }
}


function makeBarPlot(data){


    var aggdata = d3.rollup(data, v => d3.mean(v, d => d.val), d => d.Player_Name);

    newdata = [];
    var keys = Array.from(aggdata.keys());
    for (var i = 0; i < keys.length; i++){
        newdata.push({'name': keys[i], 'sum': aggdata.get(keys[i])});
    }

    // console.log(newdata);

    //Sort newdata by sum
    newdata.sort((a, b) => (a.sum > b.sum) ? 1 : -1);

    d3.select("#barplot").remove();

    // Declare the chart dimensions and margins.
    const width = 928;
    const height = 200;
    const marginTop = 40;
    const marginRight = 30;
    const marginBottom = 30;
    const marginLeft = 40;

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("id", "barplot")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
        
        //d3.groupSort(data, ([d]) => -d.frequency, (d) => d.letter)) // descending frequency
    // Declare the x (horizontal position) scale.
    const x = d3.scaleBand()
        .domain(newdata.map(d => d.name))
        .range([marginLeft, width - marginRight])
        .padding(0.1);

    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear()
        .domain([0, d3.max(newdata, d => d.sum)]).nice()
        .range([height - marginBottom, marginTop]);

    // Add a rect for each bar.
    svg.append("g")
        .attr("fill", "steelblue")
    .selectAll()
    .data(newdata)
    .join("rect")
        .attr("x", (d) => x(d.name))
        .attr("y", (d) => y(d.sum))
        .attr("height", (d) => y(0) - y(d.sum))
        .attr("width", x.bandwidth());

    // Add the x-axis.
    svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(xscale)
        .tickFormat(d3.format("d")) // format labels as integers
        .ticks(d3.max(filtered, (_, i) => filtered[i].Year) - d3.min(filtered, (_, i) => filtered[i].Year) + 1) // one tick for each year
        .tickSizeOuter(0));

    // Add the y-axis and label, and remove the domain line.
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).tickFormat((y) => (y * 100).toFixed()))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("Average value of metric (%)"));

        // Return the SVG element.
        // return svg.node();
    document.body.appendChild(svg.node());

}



readData();