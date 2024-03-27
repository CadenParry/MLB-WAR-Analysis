var playerData;
var avgDataGlobal;

function readData(){
    // Read the data from the csv file and call the initialize function
    d3.csv("player_visualization.csv", d3.autoType).then(playerData => {
        initialize(playerData);

        autocompleteSearchBar(playerData);
    });
}

function autocompleteSearchBar(playerData){
    var players = playerData.map(function(d){ return d.player; });
    var unique_players = [...new Set(players)];
    unique_players.sort();

    $( function() {
        $( "#searchbar" ).autocomplete({
            source: unique_players
            });
    }
    );

    $( "#searchbar" ).on( "autocompleteselect", function( event, ui ) {

        var selected_player = ui.item.value;

        console.log(selected_player);

        createLinePlot(playerData, selected_player);
    });
}

function initialize(playerData){
    createLinePlot(playerData, "");
}

function createLinePlot(data, selected_player){
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

    console.log(selected_player);

    var filtered = data.filter(function(d){ return selected_player == d.player; })
    
    var data_out_contract = filtered.filter(function(d){ return d.out_of_contract == "True"; });
    var data_in_contract = filtered.filter(function(d){ return d.out_of_contract == "False"; });

    // Declare the x (horizontal position) and y (vertical position) scales.
    const xscale = d3.scaleLinear()
        .domain(d3.extent(filtered, (_, i) => filtered[i].yearID))
    .range([marginLeft, width - marginRight]);

    const yscale = d3.scaleLinear().domain([-2, 13]).range([height - marginBottom, marginTop]);


    // Add the x-axis.
    svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(xscale)
        .tickFormat(d3.format("d")) // format labels as integers
        .ticks(d3.max(filtered, (_, i) => filtered[i].yearID) - d3.min(filtered, (_, i) => filtered[i].yearID) + 1) // one tick for each year
        .tickSizeOuter(0));

    // make the y-axis -2 to 13 and give the y-axis labels from -2 to 13
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(yscale).ticks(15))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", marginLeft)
            .attr("y", 0)
            .attr("fill", "black")
            .attr("text-anchor", "start")
            .attr("font-size", "20px")
            .text("WAR"));
    
    // console.log(data_out_contract);

    // Find break in years for out of contract
    var break_year = 0;
    var break_idx = 0;


    function prepend(value, array) {
        var newArray = array.slice();
        newArray.unshift(value);
        return newArray;
      }

    for (var i = 1; i < data_out_contract.length; i++){
        console.log(data_out_contract[i-1].yearID - data_out_contract[i].yearID);
        if ((data_out_contract[i-1].yearID - data_out_contract[i].yearID) > 1){
            break_year = data_out_contract[i].yearID;
            break_idx = i;
            break;
        }
    }
    if(break_year == 0){
        console.log('color')
        console.log(color(0));
        console.log(color(1));
        makePlayerLine(svg, data_in_contract, '#ff7f0e', xscale, yscale, "In Contract", true);
        makePlayerLine(svg, data_out_contract, '#1f77b4', xscale, yscale,  "Out of Contract", true);
        

    }
    else{

        data_out_contract_1 = data_out_contract.slice(break_idx, data_out_contract.length);
        data_out_contract_2 = data_out_contract.slice(0, break_idx);

        console.log('now')
        console.log(data_out_contract_1);
        console.log(data_out_contract_2);
        console.log(data_in_contract)

        // prepend the last element of data_in_contract to data_out_contract_1
        data_out_contract_1 = prepend(data_in_contract[data_in_contract.length - 1], data_out_contract_1);

        //data_in_contract = prepend(data_out_contract_2[data_out_contract_2.length - 1], data_out_contract);
        data_in_contract.unshift(data_out_contract_2[data_out_contract_2.length - 1])

        console.log('now')
        //console.log(data_out_contract_1);
        //console.log(data_out_contract_2);
        console.log(data_out_contract_2[data_out_contract_2.length - 1])
        console.log(data_in_contract)

        makePlayerLine(svg, data_in_contract, '#ff7f0e', xscale, yscale, "In Contract", true);
        makePlayerLine(svg, data_out_contract_1, '#1f77b4', xscale, yscale,  "Out of Contract", true);
        makePlayerLine(svg, data_out_contract_2, '#1f77b4', xscale, yscale,  "Out of Contract", false);
  
    }


    // makeHorizontalLine(svg, 8, xscale, yscale, "green", "MVP Level");
    // makeHorizontalLine(svg, 5, xscale, yscale, "blue", "All Star Level");  
    // makeHorizontalLine(svg, 2, xscale, yscale, "orange", "Substitute Level");
    // makeHorizontalLine(svg, 0, xscale, yscale, "red", "Replacement Level");
    
    // Add svg to the body
    document.body.appendChild(svg.node());
}


function makeHorizontalLine(svg, yValue, xscale, yscale, color, label){
    var line = svg.append("line")
       .attr("x1", xscale.range()[0])  // start of the line at the left side of the graph
       .attr("y1", yscale(yValue))     // y-position is scaled with yscale
       .attr("x2", xscale.range()[1])  // end of the line at the right side of the graph
       .attr("y2", yscale(yValue))     // y-position is the same as y1 to make the line horizontal
       .attr("stroke", color)          // color of the line
       .attr("stroke-width", 3)        // thickness of the line
       .attr("stroke-dasharray", "5,5") // make the line dashed
       .attr("stroke-opacity", 0.4);   // make the line lighter

    var line = svg.append("line")
       .attr("x1", xscale.range()[0])  // start of the line at the left side of the graph
       .attr("y1", yscale(yValue))     // y-position is scaled with yscale
       .attr("x2", xscale.range()[1])  // end of the line at the right side of the graph
       .attr("y2", yscale(yValue))     // y-position is the same as y1 to make the line horizontal
       .attr("stroke", color)          // color of the line
       .attr("stroke-width", 20)        // thickness of the line
    //    .attr("stroke-dasharray", "5,5") // make the line dashed
       .attr("stroke-opacity", 0);   // make the line lighter

    var text = svg.append("text")
       .attr("x", xscale.range()[0]) // position the label at the start of the x-axis
       .attr("y", yscale(yValue)+20)    // position the label at the same height as the line
       .text(label)                  // set the text of the label
       .attr("text-anchor", "start") // left align the text
       .attr("dominant-baseline", "middle") // vertically center the text
       .attr("fill", color)          // set the color of the text
       .attr("font-size", "20px")    // set the font size of the text
    //    .attr("font-weight", "bold")
       .style("opacity", 0);         // initially hide the text

    line.on("mouseover", function() {
        text.style("opacity", 1);    // show the text when mouse is over the line
    });

    line.on("mouseout", function() {
        text.style("opacity", 0);    // hide the text when mouse is out of the line
    });
}


function makeAvgLine(svg, avgData, color, xscale, yscale, label, pos){

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
        .attr("r", 7)
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

function makePlayerLine(svg, playerdata, color, xscale, yscale, label, add_to_legend){

    // console.log(label);
    // console.log(playerdata);

    // Declare the line generator.
    const player_line = d3.line()
        .x(d => xscale(d.yearID))
        .y(d => yscale(d.WAR));

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
        .attr("r", 7)
        .attr("cx", function(d) { return xscale(d.yearID);})
        .attr("cy", function(d) { return yscale(parseFloat(d.WAR)); })
        .attr("fill", color);

    // Add to legend
    if (add_to_legend){
            
        d3.select("#legend").append("div")
            .attr("class", "dot")
            .style("background-color", color);

        d3.select("#legend").append("text")
            .text(label)
            .style("padding", "5px")
            .style("font-size", "18px");

        d3.select("#legend").append("br")

    }
    // Add the tooltip
    // svg.selectAll("dot")
    //     .data(playerdata)
    //     .enter().append("text")
    //     .attr("x", function(d) { return xscale(d.yearID); })
    //     .attr("y", function(d) { return yscale(parseFloat(d.WAR)); })
    //     .text(function(d) { return d.WAR; })
    //     .style("font-size", "15px")
    //     .attr("alignment-baseline","middle");

}


function makeBarPlot(data){


    var aggdata = d3.rollup(data, v => d3.mean(v, d => d.val), d => d.player);

    newdata = [];
    var keys = Array.from(aggdata.keys());
    for (var i = 0; i < keys.length; i++){
        newdata.push({'name': keys[i], 'sum': aggdata.get(keys[i])});
    }

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