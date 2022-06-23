// Define plots parameters
var width =  800;
var height = width; // macroSynteny height
var fontSize = 10;
var tooltipDelay = 800; // tooltip delay time in miliseconds
var formatValue = d3.format(".2~s");

// microSynteny dimension parameters
var heatmapMargin = ({top: 10, right: 0, bottom: 20, left: 0});
var microSyntenyMargin = ({top: 5, right: 0, bottom: 10, left: 0});
var microSyntenyHeight = 400; // microSynteny plot height
var heatmapHeight = 30; // heatmap rectangle height

//var querySyntenyY = microSyntenyMargin.top + 40 + 10;
//var subjectSyntenyY = microSyntenyHeight - microSyntenyMargin.bottom - 50;

Shiny.addCustomMessageHandler("plotMacroSynteny", plotMacroSynteny);

var querySpecies = null;
var subjectSpecies = null;
var ribbonEnterTime = null;
var ribbonOutTime = null;

function plotMacroSynteny(macroSyntenyData){

    console.log(macroSyntenyData);
    var queryChrInfo = convertShinyData(macroSyntenyData.queryChrInfo);
    var subjectChrInfo = convertShinyData(macroSyntenyData.subjectChrInfo);
    var ribbonData = convertShinyData(macroSyntenyData.ribbon);
    let queryChrColor = macroSyntenyData.queryChrColor;
    let subjectChrColor = macroSyntenyData.subjectChrColor;
    let macroRibbonColor = macroSyntenyData.ribbonColor;
    querySpecies = macroSyntenyData.querySpecies;
    subjectSpecies = macroSyntenyData.subjectSpecies;

    // sort ribbonData according to ribbon width (descending)
    ribbonData.sort(function(a, b){
        return (b.queryEnd - b.queryStart) - (a.queryEnd - a.queryStart);
    });
    // console.log(querySpecies);
    // console.log(queryChrInfo);
    // console.log(subjectChrInfo);
    // console.log(ribbonData);
    console.log(queryChrColor);
    console.log(subjectChrColor);

    // create svg node
    //const svg = d3.create("svg");
        //.attr("viewBox", [-width / 2, -height / 2, width, height]);

    // Define colors
    var colors = d3.quantize(d3.interpolateRgb.gamma(2.2)(queryChrColor, subjectChrColor),
                             queryChrInfo.length + subjectChrInfo.length);

    if(macroSyntenyData.plotMode === "circular"){
        // cirular plot codes
        // define plot dimension
        let width =  800;
        let height = width; // macroSynteny height
        let outerRadius = Math.min(width, height) * 0.5 - 60;
        let innerRadius = outerRadius - 10;
        let padAngle = 5 / innerRadius;

        // remove old svgs
        d3.select("#macroSyntenyBlock")
            .select("svg").remove(); // remove svg first
        d3.select("#geneDensityBlock")
            .select("svg").remove(); // remove geneDensity plot
        d3.select("#microSyntenyBlock")
            .select("svg").remove(); // remove microSynteny also
        //d3.select("#macroSyntenyBlock")
        //    .append(() => svg.node());
        // create svg
        const svg = d3.select("#macroSyntenyBlock")
              .append("svg")
              .attr("viewBox", [-width / 2, -height / 2, width, height]);
        // create viewBox of svg
        //svg.attr("viewBox", [-width / 2, -height / 2, width, height]);

        // prepare necessary data
        queryChrInfo = calc_circular_angle(queryChrInfo, Math.PI, 2*Math.PI, padAngle);
        console.log(queryChrInfo);
        // prepare query tick data
        var queryTickStep = d3.tickStep(0, d3.sum(queryChrInfo.map(e => e.value)), 40);
        queryChrInfo.forEach((e) => {
            const k = (e.endAngle - e.startAngle - e.padAngle) / e.value;
            e.tickData = d3.range(0, e.value, queryTickStep).map(d => {
                return {value: d, angle: d * k + e.startAngle + e.padAngle/2};
            });
        });

        subjectChrInfo = calc_circular_angle(subjectChrInfo, 0, Math.PI, padAngle);
        // prepare subject tick data
        var subjectTickStep = d3.tickStep(0, d3.sum(subjectChrInfo.map(e => e.value)), 40);
        subjectChrInfo.forEach((e) => {
            const k = (e.endAngle - e.startAngle - e.padAngle) / e.value;
            e.tickData = d3.range(0, e.value, subjectTickStep).map(d => {
                return {value: d, angle: d * k + e.startAngle + e.padAngle/2};
            });
        });

        ribbonData.forEach((d) => {
            d.ribbonAngle = {};
            let sourceChr = queryChrInfo.filter(e => e.data.chr === d.queryChr)[0];
            let targetChr = subjectChrInfo.filter(e => e.data.chr === d.subjectChr)[0];

            const x = d3.scaleLinear()
                  .domain([sourceChr.data.start, sourceChr.data.end])
                  .range([sourceChr.startAngle+sourceChr.padAngle/2,
                          sourceChr.endAngle-sourceChr.padAngle/2]);

            const y = d3.scaleLinear()
                  .domain([targetChr.data.start, targetChr.data.end])
                  .range([targetChr.startAngle+targetChr.padAngle/2,
                          targetChr.endAngle-targetChr.padAngle/2]);

            const sourceOutAngle = {startAngle: x(d.queryStart),
                                    endAngle: x(d.queryEnd)};

            const targetOutAngle = {startAngle: y(d.subjectStart),
                                    endAngle: y(d.subjectEnd)};

            if(d.orientation === "+"){
                d.ribbonAngle = {
                    source: {startAngle: sourceOutAngle.startAngle, endAngle: sourceOutAngle.endAngle},
                    target: {startAngle: targetOutAngle.startAngle, endAngle: targetOutAngle.endAngle}
                };
            }else{
                d.ribbonAngle = {
                    source: {startAngle: sourceOutAngle.startAngle, endAngle: sourceOutAngle.endAngle},
                    target: {startAngle: targetOutAngle.endAngle, endAngle: targetOutAngle.startAngle}
                };
            }
        });

        // Arc generator function
        var arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        const queryGroup = svg.append("g")
              .attr("class", "macroQueryArc")
              .attr("font-size", fontSize)
              .attr("font-family", "sans-serif")
              .selectAll("g")
              .data(queryChrInfo)
              .join("g");

        queryGroup.append("path")
            .attr("fill", d => colors[d.index])
            .attr("d", d => arc(d))
            .attr("data-tippy-content", d => "Query: " + d.data.chr)
            .on("mouseover", (e, d) => {
                ribbonEnterTime = new Date().getTime();
                d3.selectAll(".from_" + d.data.chr)
                    .transition()
                    .delay(tooltipDelay)
                    .duration(50)
                    .style("fill", "red");
                d3.select(".macroRibbons")
                    .selectAll("path")
                    .filter(":not(.from_" + d.data.chr + ")")
                    .transition()
                    .delay(tooltipDelay)
                    .duration(50)
                    .attr("opacity", 0.1);
            })
            .on("mouseout", (e, d) => {
                ribbonOutTime = new Date().getTime();
                if(ribbonOutTime-ribbonEnterTime<=8000){
                    d3.selectAll(".from_" + d.data.chr)
                        .transition()
                        .duration(50)
                        .style("fill", macroRibbonColor);
                }
                d3.select(".macroRibbons")
                    .selectAll("path")
                    .filter(":not(.from_" + d.data.chr + ")")
                    .transition()
                    .duration(50)
                    .attr("opacity", 0.6);
            });
        // group.append("title")
        //     .text(d => d.data.chr);

        // Add hiden arc path for labels
        // Idea is from https://www.visualcinnamon.com/2015/09/placing-text-on-arcs/
        queryGroup.append("path")
            .attr("id", d => "queryGroup" + d.index)
            .attr("fill", "none")
            .attr("d", (d) => {
                let pathRegex = /(^.+?)L/;
                let newArc = pathRegex.exec( arc(d) )[1];
                //Replace all the commas so that IE can handle it
                newArc = newArc.replace(/,/g , " ");
                //flip the end and start position
                if (d.endAngle > 90 * Math.PI/180 && d.endAngle < 270 * Math.PI/180) {
                    let fullpath = /M(.*?)A(.*?)0 0 1 (.*?)$/;
                    if(newArc.match(fullpath)){
                        //Everything between the capital M and first capital A
                        let startLoc = /M(.*?)A/;
                        //Everything between the capital A and 0 0 1
                        let middleLoc = /A(.*?)0 0 1/;
                        //Everything between the 0 0 1 and the end of the string (denoted by $)
                        let endLoc = /0 0 1 (.*?)$/;
                        //Flip the direction of the arc by switching the start and end point
                        //and using a 0 (instead of 1) sweep flag
                        let newStart = endLoc.exec( newArc )[1];
                        let newEnd = startLoc.exec( newArc )[1];
                        let middleSec = middleLoc.exec( newArc )[1];

                        //Build up the new arc notation, set the sweep-flag to 0
                        newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
                    }
                }
                return newArc;
            });

        queryGroup.append("text")
            .attr("dy", function(d,i) {
                return (d.endAngle > 90 * Math.PI/180 && d.endAngle < 270 * Math.PI/180 ? 35 : -28);
            })
            .append("textPath")
            .attr("startOffset","50%")
            .style("text-anchor","middle")
            .attr("xlink:href",d => "#queryGroup" + d.index)
            .attr("class", "queryChrLabel")
            .text(d => d.data.chr);

        const queryGroupTick = queryGroup.append("g")
            .selectAll("g")
            .data(d => d.tickData)
            .join("g")
            .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`);

        queryGroupTick.append("line")
            .attr("stroke", "currentColor")
            .attr("x2", 4);

        queryGroupTick.append("text")
            .attr("x", 11)
            .attr("dy", "0.35em")
            .attr("transform", d => d.angle > Math.PI ? "rotate(180) translate(-16)" : null)
            .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
            .text(d => formatValue(d.value))
            .attr("font-size", "8")
            .attr("font-family", "sans-serif");

        const subjectGroup = svg.append("g")
            .attr("class", "macroSubjectArc")
            .attr("font-size", fontSize)
            .attr("font-family", "sans-serif")
            .selectAll("g")
            .data(subjectChrInfo)
            .join("g");

        subjectGroup.append("path")
            .attr("fill", d => colors[queryChrInfo.length + subjectChrInfo.length - d.index -1 ])
            .attr("d", arc)
            .attr("data-tippy-content", d => "Subject: " + d.data.chr)
            .on("mouseover", (e, d) => {
                ribbonEnterTime = new Date().getTime();
                d3.selectAll(".to_" + d.data.chr)
                    .transition()
                    .delay(tooltipDelay)
                    .duration(50)
                    .style("fill", "red");
                d3.select(".macroRibbons")
                    .selectAll("path")
                    .filter(":not(.to_" + d.data.chr + ")")
                    .transition()
                    .delay(tooltipDelay)
                    .duration(50)
                    .attr("opacity", 0.1);
            })
            .on("mouseout", (e, d) => {
                ribbonOutTime = new Date().getTime();
                if(ribbonOutTime-ribbonEnterTime<=8000){
                    d3.selectAll(".to_" + d.data.chr)
                        .transition()
                        .duration(50)
                        .style("fill", macroRibbonColor);
                }
                d3.select(".macroRibbons")
                    .selectAll("path")
                    .filter(":not(.to_" + d.data.chr + ")")
                    .transition()
                    .duration(50)
                    .attr("opacity", 0.6);
            });
        // subjectGroup.append("title")
        //     .text(d => d.data.chr);

        // Add labels for group2
        subjectGroup.append("path")
            .attr("id", d => "subjectGroup" + d.index)
            .attr("fill", "none")
            .attr("d", (d) => {
                let pathRegex = /(^.+?)L/;
                let newArc = pathRegex.exec( arc(d) )[1];
                //console.log(newArc);
                //Replace all the commas so that IE can handle it
                newArc = newArc.replace(/,/g , " ");
                //flip the end and start position
                if (d.startAngle > 90 * Math.PI/180 && d.startAngle < 270 * Math.PI/180) {
                    // first check whether the Arc string is complete
                    let fullpath = /M(.*?)A(.*?)0 0 1 (.*?)$/;
                    if(newArc.match(fullpath)){
                        //Everything between the capital M and first capital A
                        let startLoc = /M(.*?)A/;
                        //Everything between the capital A and 0 0 1
                        let middleLoc = /A(.*?)0 0 1/;
                        //Everything between the 0 0 1 and the end of the string (denoted by $)
                        let endLoc = /0 0 1 (.*?)$/;
                        //Flip the direction of the arc by switching the start and end point
                        //and using a 0 (instead of 1) sweep flag
                        let newStart = endLoc.exec( newArc )[1];
                        let newEnd = startLoc.exec( newArc )[1];
                        let middleSec = middleLoc.exec( newArc )[1];

                        //Build up the new arc notation, set the sweep-flag to 0
                        newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
                    }
                }
                return newArc;
            });

        subjectGroup.append("text")
            .attr("dy", function(d, i){
                return (d.startAngle > 90 * Math.PI/180 && d.startAngle < 270 * Math.PI/180 ? 35 : -28);
            })
            .append("textPath")
            .attr("startOffset","50%")
            .style("text-anchor","middle")
            .attr("xlink:href",d => "#subjectGroup" + d.index)
            .attr("class", "subjectChrLabel")
            .text(d => d.data.chr);

        const subjectGroupTick = subjectGroup.append("g")
            .selectAll("g")
            .data(d => d.tickData)
            .join("g")
            .attr("transform", d => `rotate(${d.angle * 180 / Math.PI - 90}) translate(${outerRadius},0)`);

        subjectGroupTick.append("line")
            .attr("stroke", "currentColor")
            .attr("x2", 4);

        subjectGroupTick.append("text")
            .attr("x", 5)
            .attr("dy", "0.35em")
            .attr("transform", d => d.angle > Math.PI ? "rotate(180) translate(-16)" : null)
            .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
            .text(d => formatValue(d.value))
            .attr("font-size", "8")
            .attr("font-family", "sans-serif");

        const ribbons = svg.append("g")
              .attr("class", "macroRibbons")
              .selectAll("g")
              .data(ribbonData)
              .join("g");

        ribbons.append("path")
            .attr("fill", macroRibbonColor)
            .attr("opacity", 0.6)
            .attr("d", d => ribbon(d.ribbonAngle, innerRadius))
            .attr("class", d => "from_" + d.queryChr + " to_" + d.subjectChr)
            .attr("data-tippy-content", d => {
                return "<b>Query:</b> " + d.q_startGene + " : " + d.q_endGene +
                    "&#8594" +
                    "<b>Subject:</b> " + d.s_startGene + " : " + d.s_endGene;
            })  // Add tippy data attr
            .on("mouseover", function(){
                ribbonEnterTime = new Date().getTime();
                d3.select(this)
                    .transition()
                    .delay(tooltipDelay)
                    .duration(50)
                    .style("fill", "red");
            })
            .on("mouseout", function(){
                ribbonOutTime = new Date().getTime();
                if(ribbonOutTime-ribbonEnterTime<=8000){
                d3.select(this)
                    .transition()
                    .duration(50)
                    .style("fill", macroRibbonColor);
                }
            })
            .on("click", function(){
                const data = d3.select(this)
                      .data();
                const macroQueryChr = data[0].queryChr;
                const macroQueryStart = data[0].queryStart;
                const macroQueryEnd = data[0].queryEnd;
                const macroSubjectChr = data[0].subjectChr;
                const macroSubjectStart = data[0].subjectStart;
                const macroSubjectEnd = data[0].subjectEnd;
                Shiny.setInputValue("selected_macroRegion",
                                    {
                                        "macroQueryChr": macroQueryChr,
                                        "macroQueryStart": macroQueryStart,
                                        "macroQueryEnd": macroQueryEnd,
                                        "macroSubjectChr": macroSubjectChr,
                                        "macroSubjectStart": macroSubjectStart,
                                        "macroSubjectEnd": macroSubjectEnd
                                    }
                                   );
            });

        const querySyntenyLabel = svg.append("text")
          .attr("class", "querySyntenyLabel")
          .attr("font-size", 18)
          .attr("font-family", "sans-serif")
          .attr("font-weight", "bold")
          .text(querySpecies)
          .attr("transform", `translate(${-width / 2+10}, ${40-height / 2})`);

        const subjectSyntenyLabel = svg.append("text")
          .attr("class", "subjectSyntenyLabel")
          .attr("font-size", 18)
          .attr("font-family", "sans-serif")
          .attr("font-weight", "bold")
          .text(subjectSpecies)
          .attr("text-anchor", "end")
          .attr("transform", `translate(${width / 2-10}, ${40-height / 2})`);

    }else if(macroSyntenyData.plotMode === "parallel"){
        // remove old svgs
        d3.select("#macroSyntenyBlock")
            .select("svg").remove(); // remove svg first
        d3.select("#geneDensityBlock")
            .select("svg").remove(); // remove geneDensity plot
        d3.select("#microSyntenyBlock")
            .select("svg").remove(); // remove microSynteny also

        // define macro synteny plot dimension
        let width =  800;
        let height = 400; // macroSynteny height
        let innerPadding = 10;
        let outterPadding = 20;
        let chrRectHeight = 15;
        let chrRectRy = 5;
        let topPadding = 10;
        let bottomPadding = 20;
        let leftPadding = 10;
        let rightPadding = 10;
        // create svg viewBox
        const svg = d3.select("#macroSyntenyBlock")
              .append("svg")
              .attr("viewBox", [0, 0, width, height]);

        // define innerPadding xscale
        const innerScale = d3.scaleLinear()
              .domain([0,1])
              .range([
                  0,
                  width - leftPadding - rightPadding - 2 * outterPadding
              ]);
        // calc accumulate chr length
        queryChrInfo = calc_accumulate_len(queryChrInfo, innerScale, innerPadding);
        subjectChrInfo = calc_accumulate_len(subjectChrInfo, innerScale, innerPadding);

        // plot query chrs
        const queryGroup = svg.append("g")
              .attr("class", "macroQueryGroup");

        const subjectGroup = svg.append("g")
              .attr("class", "macroSubjectGroup");

        const queryScale = d3
              .scaleLinear()
              .domain([
                  queryChrInfo[0].accumulate_start,
                  queryChrInfo[queryChrInfo.length - 1].accumulate_end
              ])
              .range([
                  0 + leftPadding + outterPadding,
                  width - rightPadding - outterPadding
              ]);
        const subjectScale = d3
              .scaleLinear()
              .domain([
                  subjectChrInfo[0].accumulate_start,
                  subjectChrInfo[subjectChrInfo.length - 1].accumulate_end
              ])
              .range([
                  0 + leftPadding + outterPadding,
                  width - rightPadding - outterPadding
              ]);

        // add main label for query chrs
        queryGroup.append("text")
            .text(querySpecies)
            .attr("id", "queryMainLabel")
            .attr("x", 0+leftPadding)
            .attr("y", topPadding + d3.select("#queryMainLabel").node().getBBox().height)
            .attr("font-weight", "bold")
            .attr("font-size", "1.2rem")
            .attr("font-family", "sans-serif");

        // add query chr labels
        queryGroup
            .selectAll("text")
            .filter(":not(#queryMainLabel)")
            .data(queryChrInfo)
            .join("text")
            .text((d) => d.chr)
            .attr("text-anchor", "middle")
            .attr("x", (d) => d3.mean([queryScale(d.accumulate_end), queryScale(d.accumulate_start)]))
            .attr("y", function(){
                return Number(d3.select("#queryMainLabel").attr("y")) + Number(5) + Number(d3.select(this).node().getBBox().height);
            })
            .attr("font-weight", "bold")
            .attr("font-size", "1rem")
            .attr("font-family", "sans-serif")
            .attr("class", "queryChrLabel");

        // add rect for query chrs
        queryGroup
            .selectAll("rect")
            .data(queryChrInfo)
            .join("rect")
            .attr("class", "queryChrShape")
            .attr("id", (d) => "queryChr_" + d.idx)
            .attr("x", (d) => queryScale(d.accumulate_start))
            .attr("y", topPadding + d3.select("#queryMainLabel").node().getBBox().height + 5 + d3.selectAll(".macroQueryGroup text").filter(":not(#queryMainLabel)").node().getBBox().height + 5)
            .attr(
                "width",
                (d) => queryScale(d.accumulate_end) - queryScale(d.accumulate_start)
            )
            .attr("height", chrRectHeight)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("opacity", 0.8)
            .attr("fill", queryChrColor)
            .attr("ry", chrRectRy)
            .attr("data-tippy-content", (d) => "Query: " + d.chr)
            .on("mouseover", (e, d) => {
                ribbonEnterTime = new Date().getTime();
                d3.selectAll(".from_" + d.chr)
                    .transition()
                    .delay(tooltipDelay)
                    .duration(50)
                    .style("fill", "red");
                d3.select(".macroRibbons")
                    .selectAll("path")
                    .filter(":not(.from_" + d.chr + ")")
                    .transition()
                    .delay(tooltipDelay)
                    .duration(50)
                    .attr("opacity", 0.1);
            })
            .on("mouseout", (e, d) => {
                ribbonOutTime = new Date().getTime();
                if(ribbonOutTime-ribbonEnterTime<=8000){
                    d3.selectAll(".from_" + d.chr)
                        .transition()
                        .duration(50)
                        .style("fill", macroRibbonColor);
                }
                d3.select(".macroRibbons")
                    .selectAll("path")
                    .filter(":not(.from_" + d.chr + ")")
                    .transition()
                    .duration(50)
                    .attr("opacity", 0.6);
            });

        // add main label for subject chrs
        subjectGroup.append("text")
            .text(subjectSpecies)
            .attr("id", "subjectMainLabel")
            .attr("x", 0+leftPadding)
            .attr("y", height - bottomPadding)
            .attr("font-weight", "bold")
            .attr("font-size", "1.2rem")
            .attr("font-family", "sans-serif");

        // add subject chr labels
        subjectGroup
            .selectAll("text")
            .filter(":not(#subjectMainLabel)")
            .data(subjectChrInfo)
            .join("text")
            .text((d) => d.chr)
            .attr("text-anchor", "middle")
            .attr("x", (d) => d3.mean([subjectScale(d.accumulate_end), subjectScale(d.accumulate_start)]))
            .attr("y", d3.select("#subjectMainLabel").attr("y") - d3.select("#subjectMainLabel").node().getBBox().height - 5)
            .attr("font-weight", "bold")
            .attr("font-size", "1rem")
            .attr("font-family", "sans-serif")
            .attr("class", "subjectChrLabel");

        // plot subject chrs
        subjectGroup
            .selectAll("rect")
            .data(subjectChrInfo)
            .join("rect")
            .attr("id", (d) => "subjectChr_" + d.idx)
            .attr("x", (d) => subjectScale(d.accumulate_start))
            .attr("y", height - bottomPadding - d3.select("#subjectMainLabel").node().getBBox().height - 5 - d3.selectAll(".macroSubjectGroup text").filter(":not(#subjectMainLabel)").node().getBBox().height - 5 - chrRectHeight)
            .attr(
                "width",
                (d) => subjectScale(d.accumulate_end) - subjectScale(d.accumulate_start)
            )
            .attr("height", chrRectHeight)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("opacity", 0.8)
            .attr("fill", subjectChrColor)
            .attr("ry", chrRectRy)
            .attr("data-tippy-content", (d) => "Subject: " + d.chr)
            .on("mouseover", (e, d) => {
                ribbonEnterTime = new Date().getTime();
                d3.selectAll(".to_" + d.chr)
                    .transition()
                    .delay(tooltipDelay)
                    .duration(50)
                    .style("fill", "red");
                d3.select(".macroRibbons")
                    .selectAll("path")
                    .filter(":not(.to_" + d.chr + ")")
                    .transition()
                    .delay(tooltipDelay)
                    .duration(50)
                    .attr("opacity", 0.1);
            })
            .on("mouseout", (e, d) => {
                ribbonOutTime = new Date().getTime();
                if(ribbonOutTime-ribbonEnterTime<=8000){
                    d3.selectAll(".to_" + d.chr)
                        .transition()
                        .duration(50)
                        .style("fill", macroRibbonColor);
                }
                d3.select(".macroRibbons")
                    .selectAll("path")
                    .filter(":not(.to_" + d.chr + ")")
                    .transition()
                    .duration(50)
                    .attr("opacity", 0.6);
            });


        // prepare ribbon data
        ribbonData.forEach((d) => {
            let queryChr = queryChrInfo.find(e => e.chr === d.queryChr);
            let subjectChr = subjectChrInfo.find(e => e.chr === d.subjectChr);
            let queryAccumulateStart = queryChr.accumulate_start + d.queryStart - queryChr.start + 1;
            let queryAccumulateEnd = queryChr.accumulate_start + d.queryEnd - queryChr.start + 1;
            let subjectAccumulateStart = subjectChr.accumulate_start + d.subjectStart - subjectChr.start + 1;
            let subjectAccumulateEnd = subjectChr.accumulate_start + d.subjectEnd - subjectChr.start + 1;
            if(d.orientation === "+"){
                d.ribbonPosition = {
                    source: {
                        x: queryScale(queryAccumulateStart),
                        x1: queryScale(queryAccumulateEnd),
                        y: topPadding + d3.select("#queryMainLabel").node().getBBox().height + 5 + d3.selectAll(".macroQueryGroup text").filter(":not(#queryMainLabel)").node().getBBox().height + 5 + chrRectHeight,
                        y1: topPadding + d3.select("#queryMainLabel").node().getBBox().height + 5 + d3.selectAll(".macroQueryGroup text").filter(":not(#queryMainLabel)").node().getBBox().height + 5 + chrRectHeight
                    },
                    target: {
                        x: subjectScale(subjectAccumulateStart),
                        x1: subjectScale(subjectAccumulateEnd),
                        y: height - bottomPadding - d3.select("#subjectMainLabel").node().getBBox().height - 5 - d3.selectAll(".macroSubjectGroup text").filter(":not(#subjectMainLabel)").node().getBBox().height - 5 - chrRectHeight,
                        y1: height - bottomPadding - d3.select("#subjectMainLabel").node().getBBox().height - 5 - d3.selectAll(".macroSubjectGroup text").filter(":not(#subjectMainLabel)").node().getBBox().height - 5 - chrRectHeight
                    }
                };
            }else{
                d.ribbonPosition = {
                    source: {
                        x: queryScale(queryAccumulateStart),
                        x1: queryScale(queryAccumulateEnd),
                        y: topPadding + d3.select("#queryMainLabel").node().getBBox().height + 5 + d3.selectAll(".macroQueryGroup text").filter(":not(#queryMainLabel)").node().getBBox().height + 5 + chrRectHeight,
                        y1: topPadding + d3.select("#queryMainLabel").node().getBBox().height + 5 + d3.selectAll(".macroQueryGroup text").filter(":not(#queryMainLabel)").node().getBBox().height + 5 + chrRectHeight
                    },
                    target: {
                        x: subjectScale(subjectAccumulateEnd),
                        x1: subjectScale(subjectAccumulateStart),
                        y: height - bottomPadding - d3.select("#subjectMainLabel").node().getBBox().height - 5 - d3.selectAll(".macroSubjectGroup text").filter(":not(#subjectMainLabel)").node().getBBox().height - 5 - chrRectHeight,
                        y1: height - bottomPadding - d3.select("#subjectMainLabel").node().getBBox().height - 5 - d3.selectAll(".macroSubjectGroup text").filter(":not(#subjectMainLabel)").node().getBBox().height - 5 - chrRectHeight
                    }
                };
            };
        });

        const ribbonGroup = svg.append("g")
              .attr("class", "macroRibbons")
              .selectAll("path")
              .data(ribbonData)
              .join("path")
              .attr("d", d => createLinkPolygonPath(d.ribbonPosition))
              .attr("class", d => "from_" + d.queryChr + " to_" + d.subjectChr)
              .attr("fill", macroRibbonColor)
              .attr("opacity", 0.6)
              .attr("data-tippy-content", d => {
                  return "<b>Query:</b> " + d.q_startGene + " : " + d.q_endGene +
                      "&#8594" +
                      "<b>Subject:</b> " + d.s_startGene + " : " + d.s_endGene;
              })  // Add tippy data attr
              .on("mouseover", function(){
                  ribbonEnterTime = new Date().getTime();
                  d3.select(this)
                      .transition()
                      .delay(tooltipDelay)
                      .duration(50)
                      .style("fill", "red");
              })
              .on("mouseout", function(){
                  ribbonOutTime = new Date().getTime();
                  if(ribbonOutTime-ribbonEnterTime<=8000){
                      d3.select(this)
                          .transition()
                          .duration(50)
                          .style("fill", macroRibbonColor);
                  }
              })
              .on("click", function(){
                  const data = d3.select(this)
                        .data();
                  const macroQueryChr = data[0].queryChr;
                  const macroQueryStart = data[0].queryStart;
                  const macroQueryEnd = data[0].queryEnd;
                  const macroSubjectChr = data[0].subjectChr;
                  const macroSubjectStart = data[0].subjectStart;
                  const macroSubjectEnd = data[0].subjectEnd;
                  Shiny.setInputValue("selected_macroRegion",
                                    {
                                        "macroQueryChr": macroQueryChr,
                                        "macroQueryStart": macroQueryStart,
                                        "macroQueryEnd": macroQueryEnd,
                                        "macroSubjectChr": macroSubjectChr,
                                        "macroSubjectStart": macroSubjectStart,
                                        "macroSubjectEnd": macroSubjectEnd
                                    }
                                   );
              });
    }


    // Activate tooltips
    tippy(".macroQueryArc path", {trigger: "mouseenter", followCursor: "initial", delay: [tooltipDelay, null]});
    tippy(".macroSubjectArc path", {trigger: "mouseenter", followCursor: "initial",  delay: [tooltipDelay, null]});
    tippy(".macroQueryGroup rect", {trigger: "mouseenter", followCursor: "initial",  delay: [tooltipDelay, null]});
    tippy(".macroSubjectGroup rect", {trigger: "mouseenter", followCursor: "initial",  delay: [tooltipDelay, null]});
    tippy(".macroRibbons path", {trigger: "mouseenter", followCursor: "initial", allowHTML: true, delay: [tooltipDelay, null]});
    // update svg download link
    downloadSVG("marcoSynteny_download", "macroSyntenyBlock");
    downloadSVGwithForeign("dotView_download", "dotView");
}

// use d3.pie() to calculate angles for all the arcs
function calc_circular_angle(inputChrInfo, startAngle, endAngle, padAngle){
    const arcs = d3.pie()
          .sort(null)
          .sortValues(null)
          .startAngle(startAngle)
          .endAngle(endAngle)
          .padAngle(padAngle)
          .value(d => d.chrLength)
          (inputChrInfo);
    return arcs;
}

// calculate accumulate length for parallel chr plot
function calc_accumulate_len(inputChrInfo, innerPadding_xScale, innerPadding){
    let acc_len = 0;
    let total_chr_len = d3.sum(inputChrInfo.map(e => e.chrLength));
    let ratio = innerPadding_xScale.invert(innerPadding);
    inputChrInfo.forEach((e, i) => {
        e.idx = i;
        e.accumulate_start = acc_len + 1;
        e.accumulate_end = e.accumulate_start + e.chrLength - 1;
        acc_len = e.accumulate_end + total_chr_len * ratio;
    });
    return inputChrInfo;
}

// Covert shiny transferred data to desired format
function convertShinyData(inObj){
    const properties = Object.keys(inObj);

    let outArray = [];
    for(let i=0; i< inObj[properties[0]].length; i++){
        outArray[i] = {};
        for(let j=0; j<properties.length; j++){
            outArray[i][properties[j]] = inObj[properties[j]][i];
        }
    }
    return outArray;
}


function ribbon(d, innerRadius){
  let pString = ribbonCustom(d, innerRadius - 1, 1 / innerRadius);
  return pString;
}

function ribbonCustom(d, radius, padAngle) {
  // code copied from d3.ribbon(), but with support for anticlockwise target arc
  let source = d.source,
      target = d.target,
      sourceRadius = radius,
      targetRadius = radius;


  let p = d3.path();
  let halfPi = Math.PI/2;
  let s = source,
      t = target,
      ap = padAngle/ 2,
      sr = +sourceRadius,
      sa0 = d.source.startAngle - halfPi,
      sa1 = d.source.endAngle - halfPi,
      tr = +targetRadius,
      ta0 = d.target.startAngle - halfPi,
      ta1 = d.target.endAngle - halfPi;
  // add pading
  if (ap > Math.epsilon) {
    if (Math.abs(sa1 - sa0) > ap * 2 + Math.epsilon) sa1 > sa0 ? (sa0 += ap, sa1 -= ap) : (sa0 -= ap, sa1 += ap);
    else sa0 = sa1 = (sa0 + sa1) / 2;
    if (Math.abs(ta1 - ta0) > ap * 2 + Math.epsilon) ta1 > ta0 ? (ta0 += ap, ta1 -= ap) : (ta0 -= ap, ta1 += ap);
    else ta0 = ta1 = (ta0 + ta1) / 2;
  }

  p.moveTo(sr * Math.cos(sa0), sr * Math.sin(sa0));
  p.arc(0, 0, sr, sa0, sa1);
  if (sa0 !== ta0 || sa1 !== ta1) {
    p.quadraticCurveTo(0, 0, tr * Math.cos(ta0), tr * Math.sin(ta0));
    if(ta0 < ta1){
      p.arc(0, 0, tr, ta0, ta1);
    }else{
      p.arc(0, 0, tr, ta0, ta1, true);
    }
  }
  p.quadraticCurveTo(0, 0, sr * Math.cos(sa0), sr * Math.sin(sa0));
  p.closePath();

  return p._;
}

Shiny.addCustomMessageHandler("plotSelectedMicroSynteny", plotSelectedMicroSynteny);

// regionData stores all the information for micro synteny
var regionData = null;
// bed data will be used by center queryGene function
var micro_queryBed = null;
var micro_subjectBed = null;
// color setup of micro synteny
var forwardColor = null;
var reverseColor = null;
var microRibbonColor = null;
// brush and hScale needs to be accessed by center micro synteny function
var brush = null;
var hScale = null;

function plotSelectedMicroSynteny(microSyntenyData){

    forwardColor = microSyntenyData.microForwardColor;
    reverseColor = microSyntenyData.microReverseColor;
    microRibbonColor = microSyntenyData.microRibbonColor;

    micro_queryBed = convertShinyData(microSyntenyData.microQueryRegion);
    // Add elementID for query data
    micro_queryBed.forEach((e,i) => e.elementID = "queryGene_" + i);

    micro_subjectBed = convertShinyData(microSyntenyData.microSubjectRegion);
    // Add elementID for subject data
    micro_subjectBed.forEach((e,i) => e.elementID = "subjectGene_" + i);

    var micro_anchors = convertShinyData(microSyntenyData.microAnchors);

    let regionStart = micro_queryBed[0].start;
    let regionEnd = micro_queryBed[micro_queryBed.length-1].end;
    let regionLength = regionEnd - regionStart + 1;
    hScale = d3.scaleLinear().domain([regionStart, regionEnd]).range([0, width]);

    // regionData will be used outside of this function
    // by center_microSynteny code
    // declared outside of the function
    // empty each time plotSelecedMicroSynteny
    regionData = [];
    let chunkSize = null;
    if(micro_queryBed.length > 1000){
        chunkSize = Math.ceil(regionLength / 100);
    }else if(micro_queryBed.length > 100){
        chunkSize = Math.ceil(regionLength / 50);
    }else if(micro_queryBed.length > 50){
        chunkSize = Math.ceil(regionLength / 10);
    }else {
        chunkSize = Math.ceil(regionLength / 5);
    }

    // Init regionData object
    for (let i=regionStart; i<= regionEnd; i+=chunkSize ){
        regionData.push(
            {
                start: i,
                end: d3.min([regionEnd, i+chunkSize-1]),
                queryGenes: [],
                anchors: [],
                pathData: [],
                // subject Genes have to be generated dynamically
            }
        );
    }
    // populate data into regionData
    regionData.forEach(d => {
        micro_queryBed.forEach((e,i) => {
            if(e.start >= d.start && e.start <= d.end){
                // Add elementID
                //e.elementID = e.gene.replace(/\./g, "_");
                //e.elementID = "queryGene_" + i;
                d.queryGenes.push(e);
            }
        });
        micro_anchors.forEach(e => {
            if(e.q_GeneStart >= d.start &&
               e.q_GeneStart <= d.end &&
               e.s_Gene != "." &&
               micro_subjectBed.map(d => d.gene).includes(e.s_Gene)){
                   d.anchors.push(e);
                   d.pathData.push({
                       from: e.q_Gene,
                       to: e.s_Gene,
                       sourceElementID: "queryGene_" + micro_queryBed.findIndex(element => element.gene === e.q_Gene),
                       targetElementID: "subjectGene_" + micro_subjectBed.findIndex(element => element.gene === e.s_Gene),
                       sourceStrand: e.q_GeneStrand,
                       targetStrand: e.s_GeneStrand
                   });
            }
        });
    });
    console.log(regionData);

    // If too few genes, then no heatmap will be drawn, only genes
    var queryGeneNum = d3.sum(regionData.map(e => e.queryGenes.length));
    // push selectedRegionData out of heatmap code
    if(queryGeneNum < 100){
        var selectedRegionData = regionData;
    }else{
        var selectedRegionData = regionData.slice(regionData.length - 4, regionData.length);
    }
    // Codes below is for generating heatmap with brushX
    let colorScale = d3.scaleSequential(d3.interpolatePurples)
        .domain([0, d3.max(regionData.map(d => d.queryGenes.length))]);

    // First part of brushing code was modified from https://observablehq.com/@d3/brush-snapping-transitions?collection=@d3/d3-brush
    const heatmapSVG = d3.create("svg")
          .attr("viewBox", [0, 0, width, heatmapMargin.top+heatmapHeight+heatmapMargin.bottom]);
    // Add heatmap rects
    heatmapSVG.append("g")
        .attr("class", "geneDensity")
        .selectAll("rect")
        .data(regionData)
        .join("rect")
        .attr("x", d => hScale(d.start))
        .attr("y", 0 + heatmapMargin.top)
        .attr('width', d => hScale(d.end) - hScale(d.start))
        .attr('height', heatmapHeight)
        .style("fill", d => colorScale(d.queryGenes.length));

    brush = d3.brushX()
        .extent([[heatmapMargin.left, heatmapMargin.top - 5], [width - heatmapMargin.right, heatmapHeight+heatmapMargin.top+5]])
        .on("end", brushended);

    const heatmapAxisHorizental = heatmapSVG.append("g")
          .call(xAxis, hScale);

    // define defaultSelection for brush
    let defaultSelection = [hScale(regionData[regionData.length-5].start), hScale.range()[1]];

    const gb = heatmapSVG.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, defaultSelection);


    function brushended(event) {
        const selection = event.selection;

        let selectedDataIdx = [];

        if (!event.sourceEvent || !selection) return;
        // Snapping selection and populate data
        let x0 = null,
            x1 = null;
        const selectedWidth = hScale.invert(selection[1])-hScale.invert(selection[0]);

        if(selection[0] < hScale.range()[0]){
            //x0 = hScale.range()[0];
            selection[0] = hScale.range()[0];
        }
        if(selection[1] > hScale.range()[1]){
            //x1 = hScale.range()[1];
            selection[1] = hScale.range()[1];
        }
        regionData.forEach((e,i) => {
            if(hScale.invert(selection[0]) >= e.start && hScale.invert(selection[0]) <= e.end){
                if(hScale.invert(selection[0]) >= (e.start + (e.end - e.start)/2)){
                    x0 = e.end + 1;
                }else{
                    x0 = e.start;
                    selectedDataIdx.push(i);
                }
                // selectedDataIdx.push(i);
            }
            if(hScale.invert(selection[0]) < e.start && hScale.invert(selection[1]) > e.end){
                selectedDataIdx.push(i);
            }
            if(hScale.invert(selection[1]) >= e.start && hScale.invert(selection[1]) <= e.end){
                if(hScale.invert(selection[1]) >= (e.start + (e.end - e.start)/2)){
                    x1 = e.end;
                    selectedDataIdx.push(i);
                }else{
                    x1 = e.start - 1;
                }
                // selectedDataIdx.push(i);
            }
        });

        // Limit selected region length to 5x rect width

        if(selectedWidth > (regionData[0].end -regionData[0].start +1)*5){
            x1 = x0 + (regionData[0].end -regionData[0].start +1)*5;
        }
        d3.select(this).transition().call(brush.move, x1 > x0 ? [x0, x1].map(hScale) : null);

        if(selectedDataIdx.length > 5){
            selectedDataIdx = selectedDataIdx.slice(0,5);
        }

        // remove rects first
        d3.select("#microSyntenyBlock")
            .select("svg").remove();
        selectedRegionData = selectedDataIdx.map(d => regionData[d]);

        const microSVG = generate_microSytenySVG(selectedRegionData, micro_subjectBed,
                                                 querySpecies, subjectSpecies,
                                                 forwardColor, reverseColor, microRibbonColor,
                                                 microSyntenyHeight, microSyntenyMargin,
                                                 "microQueryGroup",
                                                 "microSubjectGroup",
                                                 "microRibbons");
        d3.select("#microSyntenyBlock")
            .select("svg").remove();
        d3.select("#microSyntenyBlock")
            .append(() => microSVG.node());
        // Activate tippy tooltips
        tippy(".microQueryGroup rect",  {trigger: "mouseenter", followCursor: "initial",  delay: [tooltipDelay, null]});
        tippy(".microSubjectGroup rect",  {trigger: "mouseenter", followCursor: "initial",  delay: [tooltipDelay, null]});
        tippy(".microRibbons path",  {trigger: "mouseenter", allowHTML: true, followCursor: "initial",  delay: [tooltipDelay, null]});
        // update svg download link
        //downloadSVG("microSynteny_download", "microSyntenyBlock");
    }


    d3.select("#geneDensityBlock")
        .select("svg").remove(); // remove svg first
    d3.select("#microSyntenyBlock")
        .select("svg").remove();

    console.log(selectedRegionData);
    console.log(micro_subjectBed);
    const microSVG = generate_microSytenySVG(selectedRegionData, micro_subjectBed,
                                             querySpecies, subjectSpecies,
                                             forwardColor, reverseColor, microRibbonColor,
                                             microSyntenyHeight, microSyntenyMargin,
                                             "microQueryGroup",
                                             "microSubjectGroup",
                                             "microRibbons");
    // if too few genes in the selected region, don't draw heatmap
    if(queryGeneNum>100){
        d3.select("#geneDensityBlock")
            .append(() => heatmapSVG.node());
    }
    d3.select("#microSyntenyBlock")
        .append(() => microSVG.node());
    downloadSVG("microSynteny_download", "microSyntenyBlock");
    // Add tooltips
    tippy(".microQueryGroup rect",  {trigger: "mouseenter", followCursor: "initial",  delay: [tooltipDelay, null]});
    tippy(".microSubjectGroup rect",  {trigger: "mouseenter", followCursor: "initial",  delay: [tooltipDelay, null]});
    tippy(".microRibbons path",  {trigger: "mouseenter", allowHTML: true, followCursor: "initial",  delay: [tooltipDelay, null]});
}


function plot_microSyntenyGenes(svg, myData, xScale, yaxis,
                                forwardColor, reverseColor, groupClass){
    //svg: d3 selected svg object
    //xScale: d3 scale of x axis
    //yaxis: y position of the plot in the svg object
    // this function is used to generate either query or subject gene plot
    const g = svg.append("g")
            .attr("class", groupClass);

    g.append('line')
        .attr('x1', 0)
        .attr('y1', yaxis)
        .attr('x2', width)
        .attr('y2', yaxis)
        .style('stroke', 'grey')
        .style('stroke-width', '5');

    g.selectAll('rect')
        .data(myData)
        .join('rect')
        .attr('id', d => d.elementID)
        .attr('x', d => xScale(d.start))
        .attr('y', yaxis-10)
        .attr('width', function(d){
            return xScale(d.end) - xScale(d.start);
        })
        .attr('height', 20)
        .style('fill', d => d.strand === '+' ? forwardColor : reverseColor)
        .attr("data-tippy-content", d => d.gene);
        // .append('title')
    // .text(d => d.id);

    g.selectAll('rect')
        .on("mouseover", function(){
            d3.select(this).transition()
                .duration(50)
                .delay(tooltipDelay)
                .style("stroke-width", "2")
                .style("stroke", "black");
        })
        .on("mouseout", function(){
            d3.select(this)
                .transition()
                .duration(50)
                .style("stroke-width", null)
                .style("stroke", null);
        });
    return g.node();
}

function createLinkLinePath(d){
  // convert input data to points array
  let pathInput = [
    [d.source.x, d.source.y],
    [d.target.x, d.target.y],
    [d.target.x1, d.target.y1],
    [d.source.x1, d.source.y1]
  ];
  // create lineGenerator
  let lineGenerator = d3.line();
  //.curve(d3.curveCardinal.tension(0.5));
  return lineGenerator(pathInput);
}

function createPath(svg, pathData, ribbonColor, pathClass = "ribbons"){
  // used after creating rectangles
  // popular pathInput data
  const pathInput = [];

  pathData.forEach(function(d, i){
    if (d.to != "."){
        pathInput.push(
            extractRectPointData(
                svg,
                d.from, d.to,
                d.sourceElementID, d.targetElementID,
                d.sourceStrand, d.targetStrand
            ));
    }
  });
  console.log(pathInput);
  // draw band path
  const pathGroup = svg.append("g")
  .attr("class", pathClass);

  pathGroup.selectAll("path")
    .data(pathInput)
    .join("path")
    .attr("d", function(d, i){
      return createLinkPolygonPath(d);
    })
    .attr("fill", ribbonColor)
    .style("mix-blend-mode", "multiply")
        .style("fill-opacity", 0.6)
        .attr("data-tippy-content", d => d.pathTitle);
    //.append("title")
    //.text(d => d.pathTitle);

  pathGroup.selectAll("path")
        .on("mouseover", function(){
            d3.select(this).transition()
                .delay(tooltipDelay)
                .duration(50)
                .style("fill-opacity", 0.86);
            let sourceRectID = this.__data__.source.id;
            let targetRectID = this.__data__.target.id;
            d3.select("#" + sourceRectID)
                .transition()
                .delay(tooltipDelay)
                .duration(50)
                .style("stroke-width", "2")
                .style("stroke", "black");
            d3.select("#" + targetRectID)
                .transition()
                .delay(tooltipDelay)
                .duration(50)
                .style("stroke-width", "2")
                .style("stroke", "black");
        })
        // .on("click", function(){
        //     const title = d3.select(this).select("title").text();
        //     d3.select(this).attr("data-tippy-content", title);
        //     const tooltip = tippy(this, {trigger: "click", allowHTML: true, followCursor: true, theme: "material"});
        //     tooltip.show();
        // })
        .on("mouseout", function(){
            d3.select(this)
                .transition()
                .duration(50)
                .style("fill-opacity", 0.6);
            let sourceRectID = this.__data__.source.id;
            let targetRectID = this.__data__.target.id;
            d3.select("#" + sourceRectID)
                .transition()
                .duration(50)
                .style("stroke-width", null)
                .style("stroke", null);
            d3.select("#" + targetRectID)
                .transition()
                .duration(50)
                .style("stroke-width", null)
                .style("stroke", null);

            // tippy(this).hide();
            // tippy(this).destroy();
        });
    return pathGroup.node();
}

function extractRectPointData(svg,
                              sourceGeneID, targetGeneID,
                              sourceRectID, targetRectID,
                              sourceGeneStrand, targetGeneStrand){
  const sourceRect = svg.select("#" + sourceRectID);
  const targetRect = svg.select("#" + targetRectID);
  let x1 = Number(sourceRect.attr("x"));
  let y1 = Number(sourceRect.attr("y"));
  let height1 = Number(sourceRect.attr('height'));
  let width1 = Number(sourceRect.attr('width'));
  let x2 = Number(targetRect.attr('x'));
  let y2 = Number(targetRect.attr('y'));
  let height2 = Number(targetRect.attr('height'));
  let width2 = Number(targetRect.attr('width'));

  // format input data
  if (sourceGeneStrand === targetGeneStrand){
    var pointData = {
      source: {x: x1, y: y1 + height1, x1: x1 + width1, y1: y1 + height1, id: sourceRectID},
      target: {x: x2, y: y2, x1: x2 + width2, y1: y2, id: targetRectID},
      pathTitle: sourceGeneID + "(" + sourceGeneStrand + ") " + "&#8594" + targetGeneID + "("+ targetGeneStrand +")"
    };
  } else {
    var pointData = {
      source: {x: x1, y: y1 + height1, x1: x1 + width1, y1: y1 + height1, id: sourceRectID},
      target: {x: x2 +  width2, y: y2, x1: x2, y1: y2, id: targetRectID},
      pathTitle: sourceGeneID + "(" + sourceGeneStrand + ") " + "&#8594" + targetGeneID + "("+ targetGeneStrand +")"
    };
  }
  return pointData;
}

// create custom band generator
// code sourced from synvisio: https://github.com/kiranbandi/synvisio/blob/master/src/components/MultiGenomeView/Links.jsx
function createLinkPolygonPath(d) {

  let curvature = 0.45;
  // code block sourced from d3-sankey https://github.com/d3/d3-sankey for drawing curved blocks
  let x = d.source.x,
    x1 = d.target.x,
    y = d.source.y,
    y1 = d.target.y,
    yi = d3.interpolateNumber(y, y1),
    y2 = yi(curvature),
    y3 = yi(1 - curvature),
    p0 = d.target.x1,
    p1 = d.source.x1,
    qi = d3.interpolateNumber(y1, y),
    q2 = qi(curvature),
    q3 = qi(1 - curvature);

    return "M" + x + "," + y + // svg start point
      "C" + x + "," + y2 + // 1st curve point 1
      " " + x1 + "," + y3 + // 1st curve point 2
      " " + x1 + "," + y1 + // 1st curve end point
      "L" + p0 + "," + y1 + // bottom line
      "C" + p0 + "," + q2 + // 2nd curve point 1
      " " + p1 + "," + q3 + // 2nd curve point 2
        " " + p1 + "," + y; // end point and move back to start
}

function getRegionBoundary(inputData){
  let geneStarts = inputData.map(d => d.start).sort((a,b) => a-b);
  let geneEnds = inputData.map(d => d.end).sort((a,b) => a-b);
  let regionStart = geneStarts[0];
  let regionEnd = geneEnds[geneEnds.length - 1];
  return [regionStart, regionEnd];
}

// microSynteny scales

let xAxis = (g, xScale) => g
    .attr("transform", `translate(0,${heatmapMargin.top + heatmapHeight})`)
    .call(g => g.append("g")
        .call(d3.axisBottom(xScale)
            .ticks(width/50, ",.3~s")
            .tickSize(4)
            .tickPadding(2))
        .attr("text-anchor", "end")
        .call(g => g.select(".domain").remove())
          .call(g => g.selectAll("text").attr("x", 6)));

function queryAxis(g, xScale){
  g.call(g => g.call(d3.axisTop(xScale)
               .ticks(width/60, ",.3~s")
               .tickSize(4)
               .tickPadding(2))
         .attr("text-anchor", "end")
         .call(g => g.select(".domain").remove())
         .call(g => g.selectAll("text").attr("x", 6)));
}

function subjectAxis(g, xScale){
  g.call(g => g.call(d3.axisBottom(xScale)
               .ticks(width/60, ",.3~s")
               .tickSize(4)
               .tickPadding(2))
         .attr("text-anchor", "end")
         .call(g => g.select(".domain").remove())
         .call(g => g.selectAll("text").attr("x", 6)));
}

function generate_microSytenySVG(inputRegionData, inputSubjectBedData,
                                 querySpecies, subjectSpecies,
                                 forwardColor, reverseColor, ribbonColor,
                                 plotHeight, margin,
                                 queryGroupClass = "queryGroup",
                                 subjectGroupClass = "subjectGroup",
                                 ribbonClass = "ribbons"){
    // queryData:
    // [
    //     {
    //       gene: "Glyma.02G025600.1.Wm82.a2.v1",
    //       chr: "Chr02"
    //       start: 2290726,
    //       end: 2293596,
    //       strand: "-",
    //       elementID: "queryGene_{geneIndex}"
    //     },
    //     {...}
    // ]
    // subjectData with the same properties
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, plotHeight]);
    let queryData = inputRegionData.map(d => d.queryGenes).flat();
    console.log(queryData);
    let pathData = inputRegionData.map(d => d.pathData).flat();

    let queryScale = null;
    let subjectScale = null;
    let queryRegionStart = null;
    let queryRegionEnd = null;
    let queryRegionLength = null;
    let subjectRegionLength = null;

    let subjectRegionStart = d3.min(inputRegionData.map(e => e.anchors.map(d => d.s_GeneStart).flat()).flat());
    let subjectRegionEnd = d3.max(inputRegionData.map(e => e.anchors.map(d => d.s_GeneEnd).flat()).flat());
    // subjectData might contain empty entry (dot in the data)
    //subjectData = subjectData.filter(d => d.id != ".");
    let subjectData = [];
    console.log(inputSubjectBedData);
    inputSubjectBedData.forEach(d => {
        if(d.start >= subjectRegionStart && d.start <= subjectRegionEnd){
            subjectData.push({
                gene: d.gene,
                chr: d.chr,
                start: d.start,
                end: d.end,
                strand: d.strand,
                elementID: d.elementID
            });
        }
    });
    console.log(subjectData);
    let queryY = margin.top + 40 + 10;
    let subjectY = plotHeight - margin.bottom - 50;
    // Add chr label
    const queryChrLabel = svg.append("text")
        .attr("class", "queryChrLabel")
        .attr("font-size", 12)
        .attr("font-family", "sans-serif")
        .attr("font-weight", "bold")
        .attr("transform", `translate(0, ${margin.top + 10})`);

    const subjectChrLabel = svg.append("text")
        .attr("class", "queryChrLabel")
        .attr("font-size", 12)
        .attr("font-family", "sans-serif")
        .attr("font-weight", "bold")
        .attr("transform", `translate(0, ${subjectY + 50})`);

    // Add synteny axises
    const axisQuery = svg.append("g")
          .attr("class", "queryAxis")
          .attr("transform", `translate(0, ${queryY-20})`);

    const axisSubject = svg.append("g")
          .attr("class", "subjectAxis")
          .attr("transform", `translate(0, ${subjectY+20})`);

    queryChrLabel.text(querySpecies + ": " + queryData[0].chr);

    [queryRegionStart, queryRegionEnd] = getRegionBoundary(queryData);
    queryRegionLength = queryRegionEnd - queryRegionStart + 1;
    queryScale = d3.scaleLinear()
        .domain([queryRegionStart-queryRegionLength*0.025, queryRegionEnd+queryRegionLength*0.025])
        .range([0, width]);
    svg.append(() => plot_microSyntenyGenes(svg, queryData,
        queryScale,
        queryY,
        forwardColor, reverseColor,
        queryGroupClass));

    // subjectData might contain empty entry (dot in the data)
    subjectChrLabel.text(subjectSpecies + ": " + subjectData[0].chr);

    [subjectRegionStart, subjectRegionEnd] = getRegionBoundary(subjectData);
    subjectRegionLength = subjectRegionEnd - subjectRegionStart + 1;
    subjectScale = d3.scaleLinear()
        .domain([subjectRegionStart-subjectRegionLength*0.025, subjectRegionEnd+subjectRegionLength*0.025])
        .range([0, width]);

    svg.append(() => plot_microSyntenyGenes(svg, subjectData,
        subjectScale,
        subjectY,
        forwardColor, reverseColor,
        subjectGroupClass));

    // create path polygon
    svg.append(() => createPath(svg, pathData, ribbonColor, ribbonClass));
    // Add axises
    axisQuery.call(queryAxis, queryScale);
    axisSubject.call(subjectAxis, subjectScale);

    // zoom() has to be added to the whole svg object
    // otherwise user will not be able to zoom with "white space"
    const zoom = d3.zoom()
        .extent([
            [0, 0],
            [width, plotHeight]
        ])
        .scaleExtent([1, 10])
        .translateExtent([[0, -Infinity], [width, Infinity]])
        .on("zoom", zoomed)
        .on("end", function(){
            tippy("." + ribbonClass + " path",  {trigger: "mouseenter", allowHTML: true, followCursor: "initial",  delay: [tooltipDelay, null]});
        });

    svg.call(zoom);

    function zoomed(event) {
        const queryXZ = event.transform.rescaleX(queryScale);
        const subjectXZ = event.transform.rescaleX(subjectScale);
        svg.select("." + queryGroupClass)
            .selectAll("rect")
            .attr("x", d => queryXZ(d.start))
            .attr('width', function(d){
                return queryXZ(d.end) - queryXZ(d.start);
            });
        svg.select("." + subjectGroupClass)
            .selectAll("rect")
            .attr("x", d => subjectXZ(d.start))
            .attr('width', function(d){
                return subjectXZ(d.end) - subjectXZ(d.start);
            });

        svg.select("." + ribbonClass).remove();
        svg.append(() => createPath(svg, pathData, ribbonColor, ribbonClass));

        //zoom synteny axises
        axisQuery.call(queryAxis, queryXZ);
        axisSubject.call(subjectAxis, subjectXZ);
    }

    return svg;
}

// SVG download support

// serialize function is forked from https://observablehq.com/@mbostock/saving-svg
function serialize(svg) {
  const xmlns = "http://www.w3.org/2000/xmlns/";
  const xlinkns = "http://www.w3.org/1999/xlink";
  const svgns = "http://www.w3.org/2000/svg";
  svg = svg.cloneNode(true);
  const fragment = window.location.href + "#";
    const walker = document.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      for (const attr of walker.currentNode.attributes) {
        if (attr.value.includes(fragment)) {
          attr.value = attr.value.replace(fragment, "#");
        }
      }
    }
  svg.setAttributeNS(xmlns, "xmlns", svgns);
  svg.setAttributeNS(xmlns, "xmlns:xlink", xlinkns);
  const serializer = new window.XMLSerializer();
  const string = serializer.serializeToString(svg);
  return new Blob([string], { type: "image/svg+xml" });
}

function downloadSVG(downloadButtonID, svgDivID){
    // Add event listener to the button
    // since some button are generated dynamically
    // need to be called each time the button was generated
    d3.select("#" + downloadButtonID)
    .on("click", function(e){
        const chart = d3.select("#" + svgDivID)
            .select("svg").node();
        const url = URL.createObjectURL(serialize(chart));
        d3.select(this)
            .attr("download", "output.svg")
            .attr("href", url);
    });
}

// forked from https://observablehq.com/@mootari/embed-canvas-into-svg
// Converts embedded canvas elements to images.
function createSvgSnapshot(source) {
  const target = source.cloneNode(true);
  const scList = Array.from(source.querySelectorAll('canvas'));
  const tcList = Array.from(target.querySelectorAll('canvas'));
  if(scList.length !== tcList.length) throw Error('Canvas mismatch');
  scList.map((c,i) => {
      //const img = html`<img>`;
      const img = document.createElement("img");
      for(let k of ['width', 'height']) img.setAttribute(k, c.getAttribute(k));
      img.src = c.toDataURL();
      tcList[i].replaceWith(img);
  });
    //return serialize(target);
    serializeString(target);
}

// Forked from https://observablehq.com/@mbostock/saving-svg
// refer some codes to https://observablehq.com/@bumbeishvili/foreignobject-exporting-issue
function serializeString(svg) {
    const xmlns = 'http://www.w3.org/2000/xmlns/';
    const xlinkns = 'http://www.w3.org/1999/xlink';
    const svgns = 'http://www.w3.org/2000/svg';
    svg = svg.cloneNode(true);
    const fragment = window.location.href + '#';
    const walker = document.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT, null, false);
    while (walker.nextNode()) {
      for (const attr of walker.currentNode.attributes) {
        if (attr.value.includes(fragment)) {
          attr.value = attr.value.replace(fragment, '#');
        }
      }
    }
    svg.setAttributeNS(xmlns, 'xmlns', svgns);
    svg.setAttributeNS(xmlns, 'xmlns:xlink', xlinkns);
    const serializer = new XMLSerializer();
    const string = serializer.serializeToString(svg);
    return string;
}

//function rasterize(svg) {
//    const scList = Array.from(svg.querySelectorAll('canvas'));
//
//    const url = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(serializeString(svg));
//
//    const quality = 4;
//    const image = new Image;
//
//    const svgBlob = new Blob([svg], {type: "image/svg+xml"});
//    let resolve, reject;
//    const promise = new Promise((y, n) => (resolve = y, reject = n));
//    image.onload = () => {
//        const canvas = document.createElement("canvas");
//        const rect = svg.getBoundingClientRect();
//        canvas.width = rect.width * quality;
//        canvas.height = rect.height * quality;
//        const context = canvas.getContext("2d");
//        context.fillStyle = '#FAFAFA';
//        context.fillRect(0, 0, rect.width * quality, rect.height * quality);
//        context.drawImage(image, 0, 0, rect.width * quality, rect.height * quality);
//        scList.map((c,i) => {
//            //const img = html`<img>`;
//            context.drawImage(c, 0, 0, rect.width * quality, rect.height * quality);
//        });
//        context.canvas.toBlob(resolve);
//        //const datalink = canvas.toDataURL('image/png');
//        //console.log(datalink);
//    };
//    image.src = url;
//    //console.log(image);
//    //return canvas;
//    //console.log(datalink);
//    //return datalink;
//    return promise;
//}

// https://observablehq.com/@bumbeishvili/foreignobject-exporting-issue
function saveAs(uri, filename) {
    // create link
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.appendChild(link); // Firefox requires the link to be in the body
        link.download = filename;
        link.href = uri;
        link.click();
        document.body.removeChild(link); // remove the link when done
    } else {
        location.replace(uri);
    }
}

function downloadSVGwithForeign(downloadButtonID, svgDivID){
    // Add event listener to the button
    // since some button are generated dynamically
    // need to be called each time the button was generated
    d3.select("#" + downloadButtonID)
    .on("click", function(e){
        const chart = d3.select("#" + svgDivID)
              .select("svg").node();

        const scList = Array.from(chart.querySelectorAll('canvas'));

        const url = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(serializeString(chart));

        const quality = 4;
        const image = new Image;

        image.onload = () => {
            const canvas = document.createElement("canvas");
            const rect = chart.getBoundingClientRect();
            canvas.width = rect.width * quality;
            canvas.height = rect.height * quality;
            const context = canvas.getContext("2d");
            context.fillStyle = '#FAFAFA';
            context.fillRect(0, 0, rect.width * quality, rect.height * quality);
            context.drawImage(image, 0, 0, rect.width * quality, rect.height * quality);
            scList.map((c,i) => {
                //const img = html`<img>`;
                context.drawImage(c, 0, 0, rect.width * quality, rect.height * quality);
            });
            //context.canvas.toBlob(resolve);
            //alert ("The image has loaded!");
            let datalink = canvas.toDataURL('image/png');
            saveAs(datalink, 'dotView.png');
            //d3.select(this)
            //    .attr("download", "output.png")
            //    .attr("href", datalink);
            //console.log(datalink);
        };
        image.src = url;

    });
}

Shiny.addCustomMessageHandler("center_microSynteny", function(selectedQueryGene){
    //var selectedQueryGene = selectedQueryGene;
    console.log(selectedQueryGene);
    let selectedRegionDataIdx = null;
    let selectedIdxAll = [];
    regionData.forEach((e,i) => {
        if(e.queryGenes.some((d) => d.gene === selectedQueryGene)){
            selectedRegionDataIdx = i;
        }
    });
    //console.log(selectedRegionDataIdx);
    if(regionData.length<=5){
        regionData.map((e,i) => selectedIdxAll.push(i));
    }else if(selectedRegionDataIdx >= 3 && selectedRegionDataIdx <= regionData.length-3){
        selectedIdxAll.push(selectedRegionDataIdx-2);
        selectedIdxAll.push(selectedRegionDataIdx-1);
        selectedIdxAll.push(selectedRegionDataIdx);
        selectedIdxAll.push(selectedRegionDataIdx+1);
        selectedIdxAll.push(selectedRegionDataIdx+2);
    }else if(selectedRegionDataIdx < 3){
        selectedIdxAll = [0,1,2,3,4];
    }else if(selectedRegionDataIdx > regionData.length-3){
        selectedIdxAll = [regionData.length-5,regionData.length-4,
                          regionData.length-3,regionData.length-2,
                          regionData.length-1];
    }
    //console.log(selectedIdxAll);
    //declare to be used in this function
    let selectedRegionData = selectedIdxAll.map(d => regionData[d]);
    const microSVG = generate_microSytenySVG(selectedRegionData, micro_subjectBed,
                                             querySpecies, subjectSpecies,
                                             forwardColor, reverseColor, microRibbonColor,
                                             microSyntenyHeight, microSyntenyMargin,
                                             "microQueryGroup",
                                             "microSubjectGroup",
                                             "microRibbons");
    d3.select("#microSyntenyBlock")
        .select("svg").remove();
    d3.select("#microSyntenyBlock")
        .append(() => microSVG.node());
    // Add tooltips
    tippy(".microQueryGroup rect",  {trigger: "mouseenter", followCursor: "initial",  delay: [tooltipDelay, null]});
    tippy(".microSubjectGroup rect",  {trigger: "mouseenter", followCursor: "initial",  delay: [tooltipDelay, null]});
    tippy(".microRibbons path",  {trigger: "mouseenter", allowHTML: true, followCursor: "initial",  delay: [tooltipDelay, null]});

    // Move brush
    d3.select("#geneDensityBlock")
        .select("svg")
        .select(".brush")
        .transition()
        .call(brush.move,
              [regionData[selectedIdxAll[0]].start,
               regionData[selectedIdxAll[selectedIdxAll.length-1]].end].map(hScale));

    // Highlight selected gene
    d3.select("#" + "queryGene_" + micro_queryBed.findIndex(element => element.gene === selectedQueryGene))
        .style("fill", "#FF5733");
});


Shiny.addCustomMessageHandler("plotDotView", plotDotView);

function plotDotView(dotViewData){

    var queryChrInfo = convertShinyData(dotViewData.queryChrInfo);
    var subjectChrInfo = convertShinyData(dotViewData.subjectChrInfo);
    var anchorSeed = convertShinyData(dotViewData.anchorSeed);
    var querySpecies = dotViewData.querySpecies;
    var subjectSpecies = dotViewData.subjectSpecies;

    console.log(queryChrInfo);
    console.log(subjectChrInfo);
    console.log(anchorSeed);

    // Init anchors table
    let selectedAnchors_formatted = formatAnchorData(anchorSeed);
    Shiny.setInputValue("selected_anchors", selectedAnchors_formatted);

    // define macro synteny plot dimension
    let width =  660;
    let height = 660; // macroSynteny height
    let innerPadding = 0;
    let outterPadding = 20;
    let topPadding = 10;
    let bottomPadding = 50;
    let leftPadding = 50;
    let rightPadding = 10;

    // define innerPadding xscale
    const innerScale = d3.scaleLinear()
          .domain([0,1])
          .range([
              0,
              width - leftPadding - rightPadding - 2 * outterPadding
          ]);
    // calc accumulate chr length
    queryChrInfo = calc_accumulate_len(queryChrInfo, innerScale, innerPadding);
    subjectChrInfo = calc_accumulate_len(subjectChrInfo, innerScale, innerPadding);
    anchorSeed.forEach(e => {
        let queryChr = queryChrInfo.find(d => d.chr === e.chr_query);
        let subjectChr = subjectChrInfo.find(d => d.chr === e.chr_subject);
        let queryScale = d3.scaleLinear()
            .domain([
                queryChr.start,
                queryChr.end
            ])
            .range([
                queryChr.accumulate_start,
                queryChr.accumulate_end
            ]);
        let subjectScale = d3.scaleLinear()
            .domain([
                subjectChr.start,
                subjectChr.end
            ])
            .range([
                subjectChr.accumulate_start,
                subjectChr.accumulate_end
            ]);
        e.accumulate_x = queryScale(e.start_query);
        e.accumulate_y = subjectScale(e.start_subject);
    });

    console.log(queryChrInfo);
    console.log(subjectChrInfo);
    console.log(anchorSeed);

    // remove old svgs
    d3.select("#dotView")
        .select("svg").remove(); // remove svg first
    // setup origin domain of x, y scale
    let xDomain = [
        queryChrInfo[0].accumulate_start,
        queryChrInfo[queryChrInfo.length -1].accumulate_end
    ];

    let yDomain = [
        subjectChrInfo[0].accumulate_start,
        subjectChrInfo[subjectChrInfo.length -1].accumulate_end
    ];

    const xScale = d3.scaleLinear()
          .domain(xDomain)
          .range([leftPadding, width - rightPadding]);
    // remember to flip the y
    const yScale = d3.scaleLinear()
          .domain(yDomain)
          .range([height - bottomPadding, topPadding]);

    const xAxis = d3.axisBottom(xScale)
          .tickValues(queryChrInfo.map(e => e.accumulate_end).slice(0,-1));
    const yAxis = d3.axisLeft(yScale)
          .tickValues(subjectChrInfo.map(e => e.accumulate_end).slice(0,-1));

    // init canvas
    const canvas = d3
          .create("canvas")
          .attr("width", width)
          .attr("height", height); // same size as svg, so the scales could be shared


    const context = canvas.node().getContext('2d');

    function drawPoint(point_x, point_y, pointColor) {
        context.beginPath();
        context.fillStyle = pointColor;
        const px = point_x;
        const py = point_y;

        context.arc(px, py, 1.2, 0, 2 * Math.PI,true);
        context.fill();
    }
    // loop dataset to add points
    anchorSeed.forEach(e => {
        drawPoint(xScale(e.accumulate_x),
                  yScale(e.accumulate_y),
                  "black");
    });

    //console.log(dataURL);

    // create svg viewBox
    const svg = d3.select("#dotView")
          .append("svg")
          .attr("viewBox", [0, 0, width, height]);

    // canvas was embeded as foreignObject in svg
    // https://observablehq.com/@mootari/embed-canvas-into-svg
    svg.append("foreignObject")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", "100%")
        .attr("height", "100%")
        .append(() => canvas.node());

    // add x axis
    svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0,${height - bottomPadding})`)
        .call(xAxis)
        .call(g => g.selectAll(".tick text").remove())
        .call(g => g.selectAll(".tick line").clone() // add grid line
              .attr("y2", topPadding + bottomPadding - height)
              .attr("stroke-dasharray", "4 1")
              .attr("stroke-opacity", 0.5)
             );

    // add y axis;
    svg.append("g")
        .attr("class", "axis axis--y")
        .attr("transform", `translate(${leftPadding}, 0)`)
        .call(yAxis)
        .call(g => g.selectAll(".tick text").remove())
        .call(g => g.selectAll(".tick line").clone() // add grid line
              .attr("x2", width - leftPadding - rightPadding)
              .attr("stroke-dasharray", "4 1")
              .attr("stroke-opacity", 0.5)
             );

    // add top and right border
    svg.append("g")
        .append("line")
        .attr("transform", `translate(${leftPadding}, ${topPadding})`)
        .attr("x2", width - leftPadding - rightPadding)
        .attr("stroke", "currentColor") // currentColor
        .attr("stroke-opacity", 1);
    svg.append("g")
        .append("line")
        .attr("transform", `translate(${width - rightPadding}, ${topPadding})`)
        .attr("y2", height - topPadding - bottomPadding)
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 1);

    // add text labels on axises
    svg.append("g")
        .attr("class", "xLabel")
        .selectAll("text")
        .data(queryChrInfo)
        .join("text")
        .attr("x", d => {
            return xScale(d3.mean([d.accumulate_start, d.accumulate_end]));
        })
        .attr("y", height - bottomPadding + 20)
        .attr("font-size", "0.8rem")
        .text(d => d.chr)
        .attr("text-anchor", "middle");

    svg.append("g")
        .attr("class", "yLabel")
        .attr("transform", `translate(${leftPadding}, ${topPadding})`)
        .selectAll("g")
        //.selectAll("text")
        .data(subjectChrInfo)
        //.join("text")
        .join("g")
        .attr("transform", d => `translate(-15 ${yScale(d3.mean([d.accumulate_start, d.accumulate_end]))})`)
        //.attr("x", leftPadding - 15)
        //.attr("y", topPadding)
        //.attr("dy", d => {
        //    return yScale(d3.mean([d.accumulate_start, d.accumulate_end]));
        //})
    //.attr("x", leftPadding - 15)
        .append("text")
        .attr("font-size", "0.8rem")
        .text(d => d.chr)
        .attr("text-anchor", "middle")
        .attr("transform", function(){
            //return `rotate(-90, ${d3.select(this).attr("x")}, ${d3.select(this).attr("y")})`;
            return `rotate(-90)`;
        });

    // Add title for x and y
    svg.append("g")
        .attr("class", "xTitle")
        .append("text")
        .attr("x", d3.mean([leftPadding, width-rightPadding]))
        .attr("y", height - bottomPadding + 40)
        .attr("text-anchor", "middle")
        .attr("font-size", "1rem")
        .attr("font-weight", "bold")
        .text(querySpecies);

    svg.append("g")
        .attr("class","yTitle")
        .append("text")
        .attr("y", d3.mean([topPadding, height-bottomPadding]))
        .attr("x", leftPadding - 35)
        .attr("text-anchor", "middle")
        .attr("font-size", "1rem")
        .attr("font-weight", "bold")
        .attr("transform", function(){
            return `rotate(-90, ${d3.select(this).attr("x")}, ${d3.select(this).attr("y")})`;
        })
        .text(subjectSpecies);

    // The browser couldn't afford so many svg dots
    // switch to canvas for scatter plot
    // The implementation of canvas could be referred to
    // https://github.com/xoor-io/d3-canvas-example
    // https://stackoverflow.com/questions/4643309/creating-a-canvas-on-top-of-an-svg-or-other-image?rq=1

    // reuse the brush code for canvas
    // brush and zoom function
    // code modified from Mike Bostock's example
    // https://bl.ocks.org/mbostock/f48fcdb929a620ed97877e4678ab15e6
    let brush = d3.brush()
        .extent([
            [leftPadding, topPadding],
            [width - rightPadding, height - bottomPadding]
        ])
        .on("end", brushended),
        idleTimeout,
        idleDelay = 350;

    // brushended function
    function brushended({selection}) {
        let s = selection;
        //console.log(s[0][0]);
        if (!s) {
            if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
            xScale.domain(xDomain);
            yScale.domain(yDomain);
        } else {
            // renew scales
            xScale.domain([s[0][0], s[1][0]].map(xScale.invert, xScale));
            yScale.domain([s[1][1], s[0][1]].map(yScale.invert, yScale));
            svg.select(".brush").call(brush.move, null);
        }
        zoom();
    }

    function idled() {
        idleTimeout = null;
    }

    function formatAnchorData(selectedAnchors){
        let selectedAnchors_formatted = {
            queryGene: [],
            chr_query: [],
            start_query: [],
            end_query: [],
            strand_query: [],
            subjectGene: [],
            chr_subject: [],
            start_subject: [],
            end_subject: [],
            strand_subject: [],
            mcscan_score: []
        };
        selectedAnchors.forEach( e => {
            selectedAnchors_formatted.queryGene.push(e.queryGene);
            selectedAnchors_formatted.chr_query.push(e.chr_query);
            selectedAnchors_formatted.start_query.push(e.start_query);
            selectedAnchors_formatted.end_query.push(e.end_query);
            selectedAnchors_formatted.strand_query.push(e.strand_query);
            selectedAnchors_formatted.subjectGene.push(e.subjectGene);
            selectedAnchors_formatted.chr_subject.push(e.chr_subject);
            selectedAnchors_formatted.start_subject.push(e.start_subject);
            selectedAnchors_formatted.end_subject.push(e.end_subject);
            selectedAnchors_formatted.strand_subject.push(e.strand_subject);
            selectedAnchors_formatted.mcscan_score.push(e.mcscan_score);
        });
        return selectedAnchors_formatted;
    }

    function zoom() {
        var t = svg.transition().duration(750);
        // update axises
        svg.select(".axis--x").transition(t).call(xAxis);
        svg.select(".axis--y").transition(t).call(yAxis);
        // update axises labels
        svg.select(".xLabel")
            .selectAll("text")
            .transition(t)
            .attr("x", d => {
                if(d.accumulate_start < xScale.domain()[0] &&
                   d.accumulate_end > xScale.domain()[0] &&
                   d.accumulate_end < xScale.domain()[1]){
                    // shift right
                    return xScale(d3.mean([xScale.domain()[0], d.accumulate_end]));
                }else if(d.accumulate_start < xScale.domain()[1] &&
                         d.accumulate_start > xScale.domain()[0] &&
                         d.accumulate_end > xScale.domain()[1]){
                    // shift left
                    return xScale(d3.mean([d.accumulate_start, xScale.domain()[1]]));
                }else if(d.accumulate_start < xScale.domain()[0] &&
                         d.accumulate_end > xScale.domain()[1]){
                    return d3.mean([xScale.range()[0], xScale.range()[1]]);
                }else{
                    return xScale(d3.mean([d.accumulate_start, d.accumulate_end]));
                };
            });
        svg.select(".yLabel")
            .selectAll("g")
            .transition(t)
            .attr("transform", d => {
                let k;
                if(d.accumulate_start < yScale.domain()[0] &&
                   d.accumulate_end > yScale.domain()[0] &&
                   d.accumulate_end < yScale.domain()[1]){
                    // shift down
                    k = yScale(d3.mean([yScale.domain()[0], d.accumulate_end]));
                }else if(d.accumulate_start < yScale.domain()[1] &&
                         d.accumulate_start > yScale.domain()[0] &&
                         d.accumulate_end > yScale.domain()[1]){
                    // shift up
                    k = yScale(d3.mean([d.accumulate_start, yScale.domain()[1]]));
                }else if(d.accumulate_start < yScale.domain()[0] &&
                         d.accumulate_end > yScale.domain()[1]){
                    k = d3.mean([yScale.range()[0], yScale.range()[1]]);
                }else{
                    k = yScale(d3.mean([d.accumulate_start, d.accumulate_end]));
                };
                return `translate(-15 ${k})`;
            });

        // update canvas
        let selectedAnchors = [];
        context.save();
        context.clearRect(0, 0, width, height);
        anchorSeed.forEach(e => {
            if(e.accumulate_x >= xScale.domain()[0] &&
               e.accumulate_x <= xScale.domain()[1] &&
               e.accumulate_y >= yScale.domain()[0] &&
               e.accumulate_y <= yScale.domain()[1]){
               drawPoint(xScale(e.accumulate_x),
                         yScale(e.accumulate_y),
                         "black");
               selectedAnchors.push(e);
            }
        });
        context.restore();
        // send selected anchors to shiny
        console.log(selectedAnchors);
        // data needs to be reformatted before transfer
        let selectedAnchors_formatted = formatAnchorData(selectedAnchors);
        Shiny.setInputValue("selected_anchors", selectedAnchors_formatted);

    }

    // added brush elements
    svg.append("g")
    .attr("class", "brush")
    .call(brush);
}


Shiny.addCustomMessageHandler("updateChrFontSize", updateChrFontSize);

function updateChrFontSize(fontSize){
    console.log(fontSize);
    d3.selectAll("text.queryChrLabel,textPath.queryChrLabel")
        .transition()
        .attr("font-size", fontSize);
    d3.selectAll("text.subjectChrLabel,textPath.subjectChrLabel")
        .transition()
        .attr("font-size", fontSize);
}
