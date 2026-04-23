import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/test":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            payload = {"service": "service3"}
            self.wfile.write(json.dumps(payload).encode("utf-8"))
            return

        self.send_response(404)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": "not found"}).encode("utf-8"))


def main():
    port = int(os.environ.get("PORT", "8082"))
    httpd = HTTPServer(("", port), Handler)
    print(f"service3 listening on {port}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()

