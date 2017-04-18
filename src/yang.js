
function bubbleChart() {
  var width = 940;
  var height = 600;


  var center = { x: width / 2, y: height / 2 };
  var tooltip = floatingTooltip('gates_tooltip', 240);

 
  var forceStrength = 0.02;

  var svg = null;
  var bubbles = null;
  var nodes = [];

  
  function charge(d) {
    return -Math.pow(d.radius, 2.0) * forceStrength;
  }

  
  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(forceStrength).x(center.x))
    .force('y', d3.forceY().strength(forceStrength).y(center.y))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  simulation.stop();

  
  var fillColor = d3.scaleOrdinal()
    .domain(['earthquake', 'volcano', 'others'])
    .range(['#EF4581', '#F1F1F2', '#F27C21']);

  function causeDescription(cause_code) {
    var cause_description = '';
    
    if (cause_code == 1) {
        cause_description = 'earthquake';
    } else if (cause_code == 6) {
        cause_description = 'volcano';
    } else {
        cause_description = 'others';
    }
    
    return cause_description
  }
  
  function createNodes(rawData) {
    var maxAmount = d3.max(rawData, function (d) { return +d.DEATHS; });

    // Sizes bubbles based on area.
    var radiusScale = d3.scalePow()
      .exponent(0.2)
      .range([2, 85])
      .domain([0, maxAmount]);

    // working with data.
    var myNodes = rawData.map(function (d) {
      return {
        id: d.ID,
        radius: radiusScale(+d.DEATHS),
        death: +d.DEATHS,
        value: +d.DAMAGE_MILLIONS_DOLLARS,
        name: d.COUNTRY,
        group: causeDescription(+d.CAUSE_CODE),
        year: d.YEAR,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });

    myNodes.sort(function (a, b) { return b.value - a.value; });

    return myNodes;
  }



  
  var chart = function chart(selector, rawData) {
    // convert raw data into nodes data
    nodes = createNodes(rawData);

    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { return d.id; });

   
    var bubblesE = bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) { return fillColor(d.group); })
      .attr('stroke', function (d) { return d3.rgb(fillColor(d.group)).darker(); })
      // .attr('stroke', "#eee")
      .attr('stroke-width', 2)
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail)
      .on("click", function (d) {
                    console.log(d);
                });
    bubbles = bubbles.merge(bubblesE);

    
    bubbles.transition()
      .duration(2000)
      .attr('r', function (d) { return d.radius; });

    simulation.nodes(nodes);

    groupBubbles();
  };



  
  function ticked() {
    bubbles
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });
  }

  
  function nodeYearPos(d) {
    return yearCenters[d.year].x;
  }


 
  function groupBubbles() {
    hideYearTitles();

    //Reset the 'x' 
    simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));

    simulation.alpha(1).restart();
  }


  
  function splitBubbles() {
    showYearTitles();

    simulation.force('x', d3.forceX().strength(forceStrength).x(nodeYearPos));

    simulation.alpha(1).restart();
  }

  
  function hideYearTitles() {
    svg.selectAll('.year').remove();
  }

  
  function showYearTitles() {
    var yearsData = d3.keys(yearsTitleX);
    var years = svg.selectAll('.year')
      .data(yearsData);

    years.enter().append('text')
      .attr('class', 'year')
      .attr('x', function (d) { return yearsTitleX[d]; })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d; });
  }


  
  function showDetail(d) {
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');

    var content = '<span class="name">Country name: </span><span class="value">' +
                  d.name +
                  '</span><br/>' +
                  '<span class="name">Life Loss (persons): </span><span class="value">' +
                  d.death +
                  '</span><br/>' +
                  '<span class="name">Economy Loss ($M): </span><span class="value">$' +
                  addCommas(d.value) +
                  '</span><br/>' +
                  '<span class="name">Year: </span><span class="value">' +
                  d.year +
                  '</span>';

    tooltip.showTooltip(content, d3.event);
  }

  
  function hideDetail(d) {
    // reset outline
    d3.select(this)
      .attr('stroke', d3.rgb(fillColor(d.group)).darker());


    tooltip.hideTooltip();
  }

  
  chart.toggleDisplay = function (displayName) {
    if (displayName === 'year') {
      splitBubbles();
    } else {
      groupBubbles();
    }
  };


  // return the chart function from closure.
  return chart;
}



var myBubbleChart = bubbleChart();


function display(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}


function setupButtons() {
  d3.select('#toolbar')
    .selectAll('.button')
    .on('click', function () {
      // Remove active class from all buttons
      d3.selectAll('.button').classed('active', false);
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as the active button
      button.classed('active', true);

      // Get the id of the button
      var buttonId = button.attr('id');

      myBubbleChart.toggleDisplay(buttonId);
    });
}


function addCommas(nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  return x1 + x2;
}

// Load the data.
d3.csv('data/loss_datasets/loss_tsunamis_100.csv', display);

// setup the buttons.
setupButtons();
