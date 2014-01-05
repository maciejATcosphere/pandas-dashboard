## -*- coding: utf-8 -*-
import os
import tornado.ioloop
import tornado.web
from tornado import httpclient

root = os.path.dirname(__file__)

def render_template(filename):
    if not filename.endswith('.js') and not filename.endswith('.css'):
        filename = '%s.html' % filename

    return open(filename, 'r').read()

class MainHandler(tornado.web.RequestHandler):
    def get(self, filename):
         self.write(render_template(filename))

application = tornado.web.Application([
    (r'^/(.*)$', MainHandler),
], debug=True, static_path=os.path.join(root, 'static'))

if __name__ == '__main__':
    application.listen(8080)
    tornado.ioloop.IOLoop.instance().start()
