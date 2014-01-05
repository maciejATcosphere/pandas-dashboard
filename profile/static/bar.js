
// define([], function() {
(function () {
    var BASE = 1000;

    function norm(value) {
        return value;
        // return '{0}%'.replace('{0}',
        //     Math.round(100 * value / BASE));
    }

    var Bar = function (dashboard_id, column, target_id) {
        this.dashboard_id = dashboard_id;
        this.column = column;

        this.margin = {top: 20, right: 20, bottom: 30, left: 40};
        this.width = 500 - this.margin.left - this.margin.right;
        this.height = 250 - this.margin.top - this.margin.bottom;

        this.x = d3.scale.ordinal()
            .rangeRoundBands([0, this.width], 0.1);

        this.y = d3.scale.linear()
            .range([this.height, 0]);

        this.xAxis = d3.svg.axis()
            .scale(this.x)
            .orient("bottom");

        this.yAxis = d3.svg.axis()
            .scale(this.y)
            .orient("left");

        this.svg = d3.select("#" + target_id)
            .attr("width",
                norm(this.width + this.margin.left + this.margin.right))
            .attr("height",
                norm(this.height + this.margin.top + this.margin.bottom))
            .append("g")
                .attr("transform", "translate({x}, {y})"
                    .replace('{x}', norm(this.margin.left))
                    .replace('{y}', norm(this.margin.top)));

        this.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + this.height + ")");

        this.svg.append("g")
            .attr("class", "y-axis axis")
            // .call(this.yAxis)
            .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end");

        this.svg.append("text")
            .attr("x", (this.width / 2))
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(this.column);
    };

    Bar.prototype.draw = function (data) {
        var that = this, bars;

        // axis
        this.x.domain(data.map(function(d) { return d[0]; }));
        this.y.domain([0, d3.max(data, function(d) { return d[1]; })]);

        this.svg.select("g.x-axis").call(this.xAxis);
        this.svg.select("g.y-axis").call(this.yAxis);

        bars = this.svg.selectAll(".bar").data(data);

        // revert color to original and data attrs
        bars.style("fill", function (d, i) {
                var bar = d3.select(this),
                    prev_bgcolor = bar.attr('data-prev-bgcolor');

                if (prev_bgcolor) {
                    return prev_bgcolor;
                }
                return bar.style('fill');
            })
            .attr('data-selected', false);

        bars.enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return norm(that.x(d[0])); })
                .attr("width", norm(that.x.rangeBand()))
                .attr("y", function(d) { return norm(that.y(d[1])); })
                .attr("height", function(d) {
                    return norm(that.height - that.y(d[1])); })
                .on('click', function (d, i) {
                    var clicked = d3.select(this),
                        selected = clicked.attr('data-selected'),
                        prev_color,
                        selected_color = '',
                        column = that.column,
                        dashboard_id = that.dashboard_id,
                        value = d[0],
                        filter = 'filter' + dashboard_id;

                    if (!window[filter].hasOwnProperty(column)) {
                        window[filter][column] = {
                            'type': 'in', 'criteria': {}};
                    }
                    window[filter][column]['criteria'][value] = (
                        selected !== 'true');

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

        bars.exit().remove();

        bars.transition()
            .duration(750)
            .attr("x", function(d) { return norm(that.x(d[0])); })
            .attr("width", norm(that.x.rangeBand()))
            .attr("y", function(d) { return norm(that.y(d[1])); })
            .attr("height", function(d) {
                return norm(that.height - that.y(d[1])); });

        return this;
    };

//     Bar.prototype.update = function (data) {
//         this.data = data;

//         var that = this, bars;

//         // axis
//         this.x.domain(this.data.map(function(d) { return d[0]; }));
//         this.y.domain([0, d3.max(this.data, function(d) { return d[1]; })]);

//         this.svg.select("g.x-axis").call(this.xAxis);
//         this.svg.select("g.y-axis").call(this.yAxis);

//         // chart
//         bars = this.svg.selectAll(".bar").data(this.data);

//         bars.enter().append("rect")
//             .attr("class", "bar")
//             .attr("x", function(d) { return norm(that.x(d[0])); })
//             .attr("width", norm(that.x.rangeBand()))
//             .attr("y", function(d) { return norm(that.y(d[1])); })
//             .attr("height", function(d) {
//                 return norm(that.height - that.y(d[1])); })
//             .on('click', function (d, i) {
//                 var clicked = d3.select(this),
//                     selected = clicked.attr('data-selected'),
//                     prev_color,
//                     selected_color = '',
//                     column = that.column,
//                     dashboard_id = that.dashboard_id;
//                 if (!window['filter' + dashboard_id].hasOwnProperty(column)) {
//                     window['filter' + dashboard_id][column] = {};
//                 }
//                 window['filter' + dashboard_id][column][d[0]] = !selected;

//                 if (selected === 'true') {
//                     prev_color = clicked.attr('data-prev-bgcolor');
//                     clicked.style("fill", prev_color);
//                     clicked.attr('data-selected', false);
//                 } else {
//                     clicked.attr('data-prev-bgcolor', clicked.style('fill'));
//                     clicked.style("fill", "#FBEF99");
//                     clicked.attr('data-selected', true);
//                 }
//             });
//     };

    window.Bar = Bar;
    return {
        Bar: Bar
    };
})();
