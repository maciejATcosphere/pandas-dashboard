define([], function() {

    function bar(dashboard_id, column, data, target_id) {
console.log(column);

        var margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = 500 - margin.left - margin.right,
            height = 250 - margin.top - margin.bottom;

        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var svg = d3.select("#" + target_id)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x.domain(data.map(function(d) { return d[0]; }));
        y.domain([0, d3.max(data, function(d) { return d[1]; })]);

        svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis);

        svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end");
          // .text("Frequency");

        svg.append("text")
                .attr("x", (width / 2))
                .attr("y", 0)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .text(column);

        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return x(d[0]); })
                .attr("width", x.rangeBand())
                .attr("y", function(d) { return y(d[1]); })
                .attr("height", function(d) { return height - y(d[1]); })
                .on('click', function (d, i) {
                    var clicked = d3.select(this),
                        selected = clicked.attr('data-selected'),
                        prev_color,
                        selected_color = '';

                    if (!window['filter' + dashboard_id].hasOwnProperty(column)) {
                        window['filter' + dashboard_id][column] = {};
                    }
                    window['filter' + dashboard_id][column][d[0]] = !selected;

                    if (selected === 'true') {
                        prev_color = clicked.attr('data-prev-bgcolor');
                        clicked.style("fill", prev_color);
                        clicked.attr('data-selected', false);
                    } else {
                        clicked.attr('data-prev-bgcolor', clicked.style('fill'));
                        clicked.style("fill", "#FBEF99");
                        clicked.attr('data-selected', true);
                    }
                });
    }

    window.bar = bar;
    return {
        bar: bar
    };
});
