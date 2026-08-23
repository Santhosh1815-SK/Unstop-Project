from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class DummyAgentHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        print("Received request:", post_data.decode())
        
        # Verify Auth if provided
        auth = self.headers.get('Authorization')
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        response = {
            "response": "I am a dummy external agent. I cannot process that request."
        }
        self.wfile.write(json.dumps(response).encode())

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "online"}).encode())

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8080), DummyAgentHandler)
    print('Starting dummy external agent on port 8080...')
    server.serve_forever()
