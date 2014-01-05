define([], function() {

    var Pie = function (dashboard_id, column, target_id) {
        this.dashboard_id = dashboard_id;
        this.column = column;

        this.width = 250;
        this.height = 250;
        this.radius = Math.min(this.width, this.height) / 2;

        this.color = d3.scale.category10();

        this.arc = d3.svg.arc()
            .outerRadius(this.radius - 10)
            .innerRadius(0);

        this.pie = d3.layout.pie()
            .value(function(d) { return d[1]; });

        this.svg = d3.select("#" + target_id)
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g")
                .attr("transform", "translate({x}, {y})"
                    .replace('{x}', this.width / 2)
                    .replace('{y}', this.height / 2));

        this.svg.append("text")
                .attr("x", (this.width / 2))
                .attr("y", 0 - (10))
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .text(this.column);
    };

    Pie.prototype.draw = function (data) {
        var that = this;

        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) {
                return that.arc(i(t));
            };
        }

        this.paths = this.svg.selectAll("path").data(this.pie(data));
        this.paths.enter()
            .append("path")
                .attr("d", this.arc)
                .attr('data-label', function (d, i) { return data[i][0]; })
                .style("fill", function(d, i) { return that.color(i); })
                .each(function(d) { this._current = d; })
                .on('click', function (d, i) {
                    var clicked = d3.select(this),
                        selected = clicked.attr('data-selected'),
                        prev_color,
                        selected_color = '',
                        value = clicked.attr('data-label'),
                        column = that.column,
                        dashboard_id = that.dashboard_id,
                        filter = 'filter' + dashboard_id;

                    if (!window[filter].hasOwnProperty(column)) {
                        window[filter][column] = {
                            'type': 'in', 'criteria': {}};
                    }
                    window[filter][column]['criteria'][value] = !selected;

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

        this.labels = this.svg.selectAll("text.label").data(this.pie(data));
        this.labels.enter()
            .append("text")
                .attr("class", "label")
                .attr("transform", function(d) {
                    return "translate(" + that.arc.centroid(d) + ")"; })
                .attr("dy", ".35em")
                .style("text-anchor", "middle")
                .text(function(d) { return d.data[0]; });

        this.paths.exit().remove();
        this.labels.exit().remove();

        this.paths.transition().duration(750).attrTween("d", arcTween);
        this.labels.transition().duration(750).attr("transform", function(d) {
            d.innerRadius = 0;
            d.outerRadius = that.radius;
            return "translate(" + that.arc.centroid(d) + ")";
        });
    };

    // Pie.prototype.update = function (data) {
    //     this.data = data;

    //     var that = this, arcs;

    //     arcs = this.svg.selectAll(".arc").data(this.pie(this.data));

    //     arcs.exit().remove();

    //     arcs.selectAll('path')
    //         .attr("d", this.arc)
    //         .style("fill", function(d) { return that.color(d.data[0]); });

    //     // arcs.selectAll('.arc').selectAll("text")
    //     //             .attr("transform", function(d) {
    //     //                 return "translate(" + that.arc.centroid(d) + ")"; })
    //     //             .attr("dy", ".35em")
    //     //             .style("text-anchor", "middle")
    //     //             .text(function(d) { return d.data[0]; });

    //     arcs.enter().append("g")
    //             .attr("class", "arc")
    //             .append("path")
    //                 .attr("d", this.arc)
    //                 .style("fill", function(d) { return that.color(d.data[0]); })
    //             .append("text")
    //                 .attr("transform", function(d) {
    //                     return "translate(" + that.arc.centroid(d) + ")"; })
    //                 .attr("dy", ".35em")
    //                 .style("text-anchor", "middle")
    //                 .text(function(d) { return d.data[0]; });
    // };

    window.Pie = Pie;
    return {
        Pie: Pie
    };
});


