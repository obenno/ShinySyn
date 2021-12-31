// Define plots parameters
var width =  800;
var height = width; // macroSynteny height
var fontSize = 10;
var outerRadius = Math.min(width, height) * 0.5 - 60;
var innerRadius = outerRadius - 10;
var padAngle = 5 / innerRadius;
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

function plotMacroSynteny(macroSyntenyData){

    var queryChrInfo = convertShinyData(macroSyntenyData.queryChrInfo);
    var subjectChrInfo = convertShinyData(macroSyntenyData.subjectChrInfo);
    var ribbonData = convertShinyData(macroSyntenyData.ribbon);

    //console.log(queryChrInfo);
    //console.log(subjectChrInfo);
    //console.log(ribbonData);

    // create svg node
    const svg = d3.create("svg");
        //.attr("viewBox", [-width / 2, -height / 2, width, height]);

    // Define colors
    var colors = d3.quantize(d3.interpolateRgb.gamma(2.2)("#ca0020", "#0571b0"),
                             queryChrInfo.length + subjectChrInfo.length);

    if(macroSyntenyData.plotMode === "circular"){
        // cirular plot codes

        // prepare necessary data
        queryChrInfo = calc_circular_angle(queryChrInfo, Math.PI, 2*Math.PI);
        console.log(queryChrInfo);
        // prepare query tick data
        var queryTickStep = d3.tickStep(0, d3.sum(queryChrInfo.map(e => e.value)), 40);
        queryChrInfo.forEach((e) => {
            const k = (e.endAngle - e.startAngle - e.padAngle) / e.value;
            e.tickData = d3.range(0, e.value, queryTickStep).map(d => {
                return {value: d, angle: d * k + e.startAngle + e.padAngle/2};
            });
        });

        subjectChrInfo = calc_circular_angle(subjectChrInfo, 0, Math.PI);
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

        // create viewBox of svg
        svg.attr("viewBox", [-width / 2, -height / 2, width, height]);

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
            .attr("data-tippy-content", d => "Query: " + d.data.chr);
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
            .attr("data-tippy-content", d => "Subject: " + d.data.chr);
        // subjectGroup.append("title")
        //     .text(d => d.data.chr);

        // Add labels for group2
        subjectGroup.append("path")
            .attr("id", d => "subjectGroup" + d.index)
            .attr("fill", "none")
            .attr("d", (d) => {
                let pathRegex = /(^.+?)L/;
                let newArc = pathRegex.exec( arc(d) )[1];
                //Replace all the commas so that IE can handle it
                newArc = newArc.replace(/,/g , " ");
                //flip the end and start position
                if (d.endAngle > 90 * Math.PI/180 && d.endAngle < 270 * Math.PI/180) {
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
                return newArc;
            });

        subjectGroup.append("text")
            .attr("dy", function(d, i){
                return (d.endAngle > 90 * Math.PI/180 && d.endAngle < 270 * Math.PI/180 ? 35 : -28);
            })
            .append("textPath")
            .attr("startOffset","50%")
            .style("text-anchor","middle")
            .attr("xlink:href",d => "#subjectGroup" + d.index)
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
            .attr("fill", "grey")
            .attr("opacity", 0.6)
            .attr("d", d => ribbon(d.ribbonAngle))
            .attr("data-tippy-content", d => {
                return "<b>Query:</b> " + d.q_startGene + " : " + d.q_endGene +
                    "&#8594" +
                    "<b>Subject:</b> " + d.s_startGene + " : " + d.s_endGene;
            })  // Add tippy data attr
            .on("mouseover", function(){
                d3.select(this)
                    .transition()
                    .delay(tooltipDelay)
                    .duration(50)
                    .style("fill", "red");
            })
            .on("mouseout", function(){
                d3.select(this)
                    .transition()
                    .duration(50)
                    .style("fill", "grey");
            })
            .on("click", function(){
                const data = d3.select(this)
                      .data();
                const q_startGene = data[0].q_startGene;
                const q_endGene = data[0].q_endGene;
                const s_startGene = data[0].s_startGene;
                const s_endGene = data[0].s_endGene;
                Shiny.setInputValue("selected_macroRegion",
                                    {
                                        "q_startGene": q_startGene,
                                        "q_endGene": q_endGene,
                                        "s_startGene": s_startGene,
                                        "s_endGene": s_endGene
                                    }
                                   );
                //Shiny.setInputValue("selectedRegion_queryEndGene", q_endGene);
                //Shiny.setInputValue("selectedRegion_subjectStartGene", s_startGene);
                //Shiny.setInputValue("selectedRegion_subjectEndGene", s_endGene);
            });

    }else if(macroSyntenyData.plotMode === "parallel"){
        
    }

    d3.select("#macroSyntenyBlock")
        .select("svg").remove(); // remove svg first
    d3.select("#geneDensityBlock")
        .select("svg").remove(); // remove geneDensity plot
    d3.select("#microSyntenyBlock")
        .select("svg").remove(); // remove microSynteny also
    d3.select("#macroSyntenyBlock")
        .append(() => svg.node());

    // Add labels, and adjust their position
    if(macroSyntenyData.plotMode === "circular"){
        const querySyntenyLabel = svg.append("text")
          .attr("class", "querySyntenyLabel")
          .attr("font-size", 18)
          .attr("font-family", "sans-serif")
          //.attr("font-weight", "bold")
          .text("Query")
          .attr("transform", `translate(${-width / 2}, ${40-height / 2})`);

        const subjectSyntenyLabel = svg.append("text")
          .attr("class", "subjectSyntenyLabel")
          .attr("font-size", 18)
          .attr("font-family", "sans-serif")
          //.attr("font-weight", "bold")
          .text("Subject");
        let subjetLabelWidth = svg.select(".subjectSyntenyLabel").node()
            .getComputedTextLength();

        subjectSyntenyLabel
            .attr("transform", `translate(${width / 2-subjetLabelWidth}, ${40-height / 2})`);
    }

    // Activate tooltips
    tippy(".macroQueryArc path", {trigger: "mouseenter", followCursor: "initial", delay: [tooltipDelay, null]});
    tippy(".macroSubjectArc path", {trigger: "mouseenter", followCursor: "initial",  delay: [tooltipDelay, null]});
    tippy(".macroRibbons path", {trigger: "mouseenter", followCursor: "initial", allowHTML: true, delay: [tooltipDelay, null]});
    // update svg download link
    downloadSVG("marcoSynteny_download", "macroSyntenyBlock"); 
}

// use d3.pie() to calculate angles for all the arcs
function calc_circular_angle(inputChrInfo, startAngle, endAngle){
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

// parallel marco synteny plot
function plot_parallel_macroSynteny(){
    let colors = d3.quantize(d3.interpolateRgb.gamma(2.2)("#ca0020", "#0571b0"),
                             queryBedSummarized.length + subjectBedSummarized.length);

    //create svg
    const svg = d3.create("svg")
        .attr("viewBox", [-width / 2, -height / 2, width, height]);
}

function ribbon(d){
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
// brush and hScale needs to be accessed by center micro synteny function
var brush = null;
var hScale = null;

function plotSelectedMicroSynteny(microSyntenyData){

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
    var querGeneNum = d3.sum(regionData.map(e => e.queryGenes.length));
    // push selectedRegionData out of heatmap code
    var selectedRegionData = regionData.slice(regionData.length - 4, regionData.length);

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
                                             microSyntenyHeight, microSyntenyMargin,
                                             "microQueryGroup",
                                             "microSubjectGroup",
                                             "microRibbons");
    // if two few genes in the selected region, don't draw heatmap
    if(querGeneNum>100){
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
                                microRegionStart, microRegionEnd, groupClass){
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
        .style('fill', d => d.strand === '+' ? '#af8dc3' : '#7fbf7b')
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

function createPath(svg, pathData, pathClass = "ribbons"){
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
  //console.log(pathInput);
  // draw band path
  const pathGroup = svg.append("g")
  .attr("class", pathClass);

  pathGroup.selectAll("path")
    .data(pathInput)
    .join("path")
    .attr("d", function(d, i){
      return createLinkPolygonPath(d);
    })
    .attr("fill", "#10218b")
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

    queryChrLabel.text("Query: " + queryData[0].chr);

    [queryRegionStart, queryRegionEnd] = getRegionBoundary(queryData);
    queryRegionLength = queryRegionEnd - queryRegionStart + 1;
    queryScale = d3.scaleLinear()
        .domain([queryRegionStart-queryRegionLength*0.025, queryRegionEnd+queryRegionLength*0.025])
        .range([0, width]);
    svg.append(() => plot_microSyntenyGenes(svg, queryData,
        queryScale,
        queryY,
        queryRegionStart, queryRegionEnd,
        queryGroupClass));

    // subjectData might contain empty entry (dot in the data)
    subjectChrLabel.text("Subject: " + subjectData[0].chr);

    [subjectRegionStart, subjectRegionEnd] = getRegionBoundary(subjectData);
    subjectRegionLength = subjectRegionEnd - subjectRegionStart + 1;
    subjectScale = d3.scaleLinear()
        .domain([subjectRegionStart-subjectRegionLength*0.025, subjectRegionEnd+subjectRegionLength*0.025])
        .range([0, width]);

    svg.append(() => plot_microSyntenyGenes(svg, subjectData,
        subjectScale,
        subjectY,
        subjectRegionStart, subjectRegionEnd,
        subjectGroupClass));
    // create path polygon
    svg.append(() => createPath(svg, pathData, ribbonClass));
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
        svg.append(() => createPath(svg, pathData, ribbonClass));

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