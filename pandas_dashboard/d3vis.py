# -*- coding: utf-8 -*-
import json
from time import time
import sys

from pandas import Series
from IPython.display import HTML


class Dashboard(object):

    CHARTS_CONF = {
        'bar': {
            "threshold": 10,
            "width_unit": 1,
        },
        'pie': {
            "threshold": 5,
            "width_unit": 1,
        },
        'area': {
            "threshold": 10 ** 6,
            "width_unit": 2,
        }
    }

    def __init__(self, df):
        self._id = '{timestamp}'.format(timestamp=time()).replace('.', '_')
        self.buttons = """
            <div class="btn-group" id="btn-save-{id}">
                <button class="btn" title="Save dashboard">
                    <i class="icon-save"></i>
                </button>
            </div>
            <div class="btn-group">
                <button class="btn" title="Go to fullscreen view">
                    <i class="icon-fullscreen"></i>
                </button>
            </div>
            <div class="btn-group" id="btn-apply-{id}">
                <button class="btn" title="Apply filters">
                    <i class="icon-play"></i>
                </button>
            </div>
            <!--<div class="btn-group">
                <button class="btn" title="Remove chart">
                    <i class="icon-remove"></i>
                </button>
            </div>-->
        """.format(id=self._id)
        self.df = df
        self._filter = {}
        self.target = 'target{id}'.format(id=self._id)
        # register target for the comm that will be initiated at the frontend
        get_ipython().comm_manager.register_target(self.target, self._comm_open)

        self.comm_js = """
            var CommBroker{id} = function () {{
                console.log(this);
                this.comm = new IPython.Comm(IPython.utils.uuid());
                this.comm.target_name = '{target}';
                this.comm.on_msg($.proxy(this.handler, this));
                this.dashboard_id = "{id}";

                IPython.notebook.kernel.comm_manager.register_comm(this.comm);
                this.comm.open();
            }};

            CommBroker{id}.prototype.handler = function (msg) {{
                var chart_id = msg.content.data.chart_id,
                    chart_data = msg.content.data.data,
                    chart_map = 'charts_map' + this.dashboard_id;

                window[chart_map][chart_id].draw(JSON.parse(chart_data));
            }}

            var cb = new CommBroker{id}();
            $('#btn-apply-{id}').bind('click', function (e) {{
                console.log('button apply clicked');
                cb.comm.send(window['filter{id}']);
            }});
        """.format(target=self.target, id=self._id)

    def _comm_open(self, comm, *args):
        comm.on_msg(self._comm_on_msg)
        self.comm = comm
        print >> sys.__stderr__, "---------------_comm_open---------------"
        print >> sys.__stderr__, comm
        print >> sys.__stderr__, args

    def _comm_on_msg(self, *args, **kwargs):
        print >> sys.__stderr__, "-------------_comm_on_msg-------------"
        print >> sys.__stderr__, self.comm
        print >> sys.__stderr__, args
        self._filter = args[0]['content']['data']
        self._filter_df()
        self._update_charts()

    def _filter_df(self):
        mask = self._parse_criteria()
        self.df = self.df[mask]

    def _update_charts(self):
        for chart_conf in self.charts_map:
            chart_id = chart_conf['chart_id']
            chart_type = chart_conf['type']
            column = chart_conf['column']
            chart_data = self._get_data_for_series_js(
                self._prepare_series(column, chart_type))

            self.comm.send(dict(chart_id=chart_id, data=chart_data))

    def _parse_criteria(self):
        mask = Series([True] * self.df.index.size, index=self.df.index)

        for column, criteria in self._filter.items():
            type_ = criteria['type']

            if type_ == 'in':
                subset = map(lambda x: x[0], filter(
                    lambda x: x[1], criteria['criteria'].items()))
                mask = mask & (self.df[column].isin(subset))

            elif type_ == 'range':
                min_, max_ = criteria['criteria']
                mask = mask & (
                    (self.df[column] >= min_) & (self.df[column] <= max_))

        return mask

    def dataframe(self):
        return self.df

    def _repr_html_(self):
        charts_types = self._type_to_chart()
        js, svg = self._prepare_html(charts_types)
        return """
            <div id='btns-{id}'>{buttons}</div>
            <div>{svg}</div>
            <script>
                window.filter{id}={{}};
                window.charts_map{id}={{ {js} }};
                {comm_js}
            </script>
        """.format(buttons=self.buttons, svg=svg,
            id=self._id, comm_js=self.comm_js, js=js)

    def _type_to_chart(self):
        charts = {}
        for column, type_ in self.df.dtypes.iteritems():
            unique_count = len(self.df[column].unique())
            charts[column] = self._map_type(unique_count, type_)

        return charts

    def _map_type(self, unique_count, type_):
        if unique_count <= self.CHARTS_CONF['pie']['threshold']:
            return 'pie'
        elif unique_count <= self.CHARTS_CONF['bar']['threshold']:
            return 'bar'
        else:
            return 'area'

    def _prepare_html(self, chart_types):
        js = []
        svg = []
        i = 0

        # TODO: probably this does not belong here
        self.charts_map = []

        for column, chart_type in chart_types.items():
            id_='{chart}_{num}_{timestamp}'.format(
                chart=chart_type, num=i, timestamp=time()).replace('.', '-')
            data_js = self._get_data_for_series_js(
                self._prepare_series(column, chart_type))

            self.charts_map.append({'chart_id': id_, 'type': chart_type, 'column': column})

            js_class = chart_type[0].upper() + chart_type[1:]
            js.append(('"{id}": (new {js_class}("{dashboard_id}", "{column}", "{id}")).draw({data})').format(
                    dashboard_id=self._id, js_class=js_class, data=data_js, id=id_, column=column))

            svg.append('<svg id="{id}"></svg>'.format(id=id_))
            i += 1

        js = ','.join(js)
        svg = ''.join(svg)

        return js, svg

    def _prepare_series(self, column, chart_type):
        if chart_type in ('pie', 'bar'):
            data = list(
                self.df.groupby(column).count().ix[:, 0].iteritems())
            data = sorted(data, key=lambda x: -x[1])

        elif chart_type == 'area':
            data = list(self.df[column].iteritems())

        return data

    def _get_data_for_series_js(self, data):
        return json.dumps(data)

    def publish(self, filename):
        charts_types = self._type_to_chart()
        js, svg = self._prepare_html(charts_types)
        content = """
            <div>{svg}</div>
            <script>
                window.charts_map{id}={{ {js} }};
            </script>
        """.format(buttons=self.buttons, svg=svg,
            id=self._id, comm_js=self.comm_js, js=js)

        site = '''
            <html>
                <head>
                    <link rel="stylesheet" href="custom/custom.css" type="text/css" />
                    <script src="d3.js" type="text/javascript"></script>
                    <script src="pie.js" type="text/javascript"></script>
                    <script src="bar.js" type="text/javascript"></script>
                    <script src="area.js" type="text/javascript"></script>
                </head>
                <body>
                    {content}
                </body>
            </html>
        '''.format(content=content)

        with open('../profile/static/' + filename + '.html', 'w') as f:
            f.write(site)

        return HTML('<a href="http://127.0.0.1:8080/{0}" target="_blank">'
            'click here to see you dashboard</a>'.format(filename))

# target = 'rpc29'
# class RPC(object):
#     def __init__(self, comm, *args, **kwargs):
#         comm.on_msg(self.handler)
#         self.comm = comm
#         print >> sys.__stderr__, "---------------INIT---------------"
#         print >> sys.__stderr__, comm
#         print >> sys.__stderr__, args

#     def handler(self, *args, **kwargs):
#         print >> sys.__stderr__, "-------------HANDLER-------------"
#         print >> sys.__stderr__, self.comm
#         print >> sys.__stderr__, args
#         self.comm.send(dict(hello='World'))

# get_ipython().comm_manager.register_target(target, RPC)

# from IPython.core.display import *
# HTML('<div id="comm-' + target + '">test</div>')

# %%javascript
# // var RPCProxy = function () {
# //     console.log(this);
# //     this.comm = new IPython.Comm(IPython.utils.uuid());
# //     this.comm.target_name = 'rpc29';
# //     this.comm.on_msg($.proxy(this.handler, this));

# //     IPython.notebook.kernel.comm_manager.register_comm(this.comm);
# //     this.comm.open();
# // };

# // RPCProxy.prototype.handler = function (msg) {
# //     console.log('rpc', msg.content.data);
# //     $('#comm-rpc29').append(JSON.stringify(msg.content.data));
# // }
# // RPCProxy.prototype.add = function (a,b) {
# //     this.comm.send({method : 'add', args : [a,b]});
# // }
# // RPCProxy.prototype.mul = function (a,b) {
# //     this.comm.send({method : 'mul', args : [a,b]});
# // }
# // RPCProxy.prototype.get_ec = function () {
# //     this.comm.send({method : 'get_execution_count'});
# // }

# // var rpc = new RPCProxy();
# // rpc.add(5,3);
# // setTimeout(function () { rpc.get_ec(); }, 2000);
# // setTimeout(function () { rpc.mul(6,6); }, 4000);