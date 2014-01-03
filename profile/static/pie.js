define([], function() {

    function pie(dashboard_id, column, data, target_id) {

        var width = 250,
            height = 250,
            radius = Math.min(width, height) / 2;

        var color = d3.scale.ordinal()
            .range(["#3A543A", "#4F724F", "#649064", "#90D590", "#B5E3B5",
                "#EDF8ED", "#3A4754", "#4F6072", "#4D6680", "#647A90",
                "#90B2D5", "#B5CCE3", "#EDF2F8"]);

        var arc = d3.svg.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) { return d[1]; });

        var svg = d3.select("#" + target_id)
            .attr("width", width)
            .attr("height", height)
            .append("g")
                .attr("transform",
                    "translate(" + width / 2 + "," + height / 2 + ")");

        var g = svg.selectAll(".arc")
            .data(pie(data))
            .enter().append("g")
                .attr("class", "arc");

        g.append("path")
            .attr("d", arc)
            .style("fill", function(d) { return color(d.data[0]); });

        g.append("text")
            .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
            .attr("dy", ".35em")
            .style("text-anchor", "middle")
            .text(function(d) { return d.data[0]; });

        svg.append("text")
                .attr("x", (width / 2))
                .attr("y", 0 - (10))
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .text(column);

        svg.selectAll('.arc').selectAll('path').on('click', function (d, i) {
            var clicked = d3.select(this),
                selected = clicked.attr('data-selected'),
                prev_color,
                selected_color = '',
                value = d3.select(clicked.node().nextSibling).text();

            if (!window['filter' + dashboard_id].hasOwnProperty(column)) {
                window['filter' + dashboard_id][column] = {};
            }
            window['filter' + dashboard_id][column][value] = !selected;

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

    window.pie = pie;
    return {
        pie: pie
    };
});


