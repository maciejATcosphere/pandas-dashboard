// define([], function() {
(function() {
    var Area = function (dashboard_id, column, target_id) {
        this.dashboard_id = dashboard_id;
        this.column = column;

        this.margin = {top: 20, right: 20, bottom: 30, left: 50};
        this.width = 500 - this.margin.left - this.margin.right;
        this.height = 250 - this.margin.top - this.margin.bottom;

        this.x = d3.scale.linear()
            .range([0, this.width]);

        this.y = d3.scale.linear()
            .range([this.height, 0]);

        this.xAxis = d3.svg.axis()
            .scale(this.x)
            .orient("bottom");

        this.yAxis = d3.svg.axis()
            .scale(this.y)
            .orient("left");

        var that = this;
        this.area = d3.svg.area()
            .x(function(d) { return that.x(d[0]); })
            .y0(this.height)
            .y1(function(d) { return that.y(d[1]); });

        this.svg = d3.select("#" + target_id)
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
                .attr("transform", "translate({x}, {y})"
                    .replace('{x}', this.margin.left)
                    .replace('{y}', this.margin.top));

        this.svg.append("text")
                .attr("x", (this.width / 2))
                .attr("y", 0)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .text(column);

        this.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + this.height + ")");

        this.svg.append("g")
            .attr("class", "y-axis axis")
            // .call(yAxis)
            .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end");

        this.path = this.svg
            .append("path")
            .attr('class', 'area');

        this.svg.append("g")
              .attr("class", "x-brush brush");
    };

    Area.prototype.draw = function (data) {
        var that = this;

        function brushed() {
            var filter = 'filter' + that.dashboard_id;
            window[filter][that.column] = {
                "type": "range", "criteria": that.brush.extent()};
        }

        this.x.domain(d3.extent(data, function(d) { return d[0]; }));
        this.y.domain([0, d3.max(data, function(d) { return d[1]; })]);

        this.path
            .datum(data)
            .transition().duration(750)
            .attr("d", this.area);

        this.brush = d3.svg.brush()
            .x(that.x)
            .on("brush", brushed);

        this.svg.select("g.x-axis").call(this.xAxis);
        this.svg.select("g.y-axis").call(this.yAxis);
        this.svg.select("g.x-brush").call(this.brush)
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", this.height + 7);

        return this;
    };

    window.Area = Area;
    return {
        Area: Area
    };
})();
