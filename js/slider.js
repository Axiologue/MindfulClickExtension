function scoreSlider(options) {

    var settings = $.extend({
        'svg': 'svg', // id of the svg that holds the slider
        'width': 480,
        'margin': 20,
        'showRange': false,
        'score': 0,
        'showPointer': true
    },options),
        height = settings.width/6,
        svg = d3.select('#' + settings.svg),
        x = d3.scale.linear().domain([-5,5]).range([settings.margin+5,settings.width-settings.margin-5]);
    
    // set overall slider size
    svg.attr('height',height).attr('width',settings.width);

    // add central line
    var base = svg.append('g').attr('class','slider-base');
    base.append('line')
      .attr('x1',settings.margin)
      .attr('y1',height/2)
      .attr('x2',settings.width/2)
      .attr('y2',height/2)
      .attr('stroke-width',5)
      .attr('class','negative');
    base.append('line')
      .attr('x1',settings.width/2)
      .attr('y1',height/2)
      .attr('x2',settings.width-settings.margin)
      .attr('y2',height/2)
      .attr('stroke-width',5)
      .attr('class','positive');
    base.append('line')
      .attr('x1',settings.width/2)
      .attr('y1',height/2 - 10)
      .attr('x2',settings.width/2)
      .attr('y2',height/2 + 10)
      .attr('stroke-width',1)
      .attr('stroke','black');
      
     
    // construct the endpoints
    if (settings.showRange) {
      base.append('circle')
        .attr('cx',settings.margin)
        .attr('cy',height/2)
        .attr('r',12)
        .attr('stroke-width',2)
        .attr('class','negative range');
      base.append('text')
        .attr('x',settings.margin)
        .attr('y',height/2)
        .attr('dy','.35em')
        .attr('dx','-.1em')
        .attr('text-anchor','middle')
        .attr('class','negative')
        .text('-5');
      base.append('circle')
        .attr('cx',settings.width-settings.margin)
        .attr('cy',height/2)
        .attr('r',12)
        .attr('stroke-width',2)
        .attr('class','positive range');
      base.append('text')
        .attr('x',settings.width-settings.margin)
        .attr('y',height/2)
        .attr('dy','.35em')
        .attr('text-anchor','middle')
        .attr('class','positive')
        .text('5');
    } else {
      base.append('circle')
        .attr('cx',settings.margin)
        .attr('cy',height/2)
        .attr('r',5)
        .attr('stroke-width',2)
        .attr('class','negative');
      base.append('circle')
        .attr('cx',settings.width-settings.margin)
        .attr('cy',height/2)
        .attr('r',5)
        .attr('stroke-width',2)
        .attr('class','positive');
    }

    // add the score slider
    var score = base.append('g')
      .attr('class','score')
      .attr('transform','translate(' + settings.width/2 + ',0)');
    if (settings.showPointer) {
      score.append("svg:image")
        .attr('x',-height/2)
        .attr('y',0)
        .attr('height',height)
        .attr('width',height)
        .attr('xlink:href','../img/flower.png')
      score.append('text')
        .attr('x',0)
        .attr('y',height/2)
        .attr('dy','.35em')
        .attr('dx',function () {
          return settings.score < 0 ? '-.1em' : 0;
        })
        .attr('text-anchor','middle')
        .attr('class', scoreClass(settings.score) + ' large')
        .text(0);
    } else {
      score.append("circle")
        .attr('cx',0)
        .attr('cy',height/2)
        .attr('r',14)
          //return settings.showPointer ? 38 : 14;  
        .attr('class',scoreClass(settings.score) + ' range')
        .attr('stroke-width',2);
      score.append('text')
        .attr('x',0)
        .attr('y',height/2)
        .attr('dy','.35em')
        .attr('dx',function () {
          return settings.score < 0 ? '-.1em' : 0;
        })
        .attr('text-anchor','middle')
        .attr('class',scoreClass(settings.score)) 
        .text(0);
    }

    // Animate the score
    score.transition()
      .duration(1000)
      .ease('cubic-out')
      .attr('transform','translate(' + x(settings.score) + ',0)')
      .select('text')
      .tween('text', function (d) {
          var i = d3.interpolate(this.textContent, settings.score);
          return function (t) { this.textContent = (+i(t)).toFixed(1) }
      });
}
