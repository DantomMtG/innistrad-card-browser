import http.client
import socket
import tempfile
import threading
import unittest
from pathlib import Path

import run_app


class BrowserServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = run_app.create_server(port=0)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.port = cls.server.server_address[1]

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def request(self, method, path):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        connection.request(method, path)
        response = connection.getresponse()
        body = response.read()
        headers = dict(response.getheaders())
        connection.close()
        return response.status, headers, body

    def test_root_serves_the_app_page(self):
        status, headers, body = self.request("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn("text/html", headers["Content-Type"])
        self.assertIn(b"Innistrad Card &amp; Combo Browser", body)

    def test_card_data_is_served_with_json_content_type_and_complete_length(self):
        status, headers, body = self.request("GET", f"/{run_app.CARD_DATA}")
        self.assertEqual(status, 200)
        self.assertIn("application/json", headers["Content-Type"])
        self.assertEqual(len(body), int(headers["Content-Length"]))
        self.assertTrue(body.startswith(b'{"metadata":'))

    def test_favicon_does_not_return_a_missing_file_error(self):
        status, headers, body = self.request("GET", "/favicon.ico")
        self.assertEqual(status, 204)
        self.assertEqual(headers["Content-Length"], "0")
        self.assertEqual(body, b"")

    def test_unlisted_paths_are_not_exposed(self):
        status, _, _ = self.request("GET", "/README.md")
        self.assertEqual(status, 404)

    def test_head_returns_headers_without_a_body(self):
        status, headers, body = self.request("HEAD", "/")
        self.assertEqual(status, 200)
        self.assertIn("text/html", headers["Content-Type"])
        self.assertEqual(body, b"")

    def test_busy_preferred_port_falls_back_to_an_available_port(self):
        with socket.socket() as occupied:
            occupied.bind(("127.0.0.1", 0))
            occupied.listen()
            preferred_port = occupied.getsockname()[1]
            fallback = run_app.create_server(port=preferred_port)
            try:
                self.assertNotEqual(fallback.server_address[1], preferred_port)
                self.assertEqual(fallback.server_address[0], "127.0.0.1")
            finally:
                fallback.server_close()

    def test_missing_app_file_is_reported_before_startup(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            Path(temporary_directory, run_app.APP_PAGE).write_text("<html></html>", encoding="utf-8")
            with self.assertRaisesRegex(FileNotFoundError, run_app.CARD_DATA):
                run_app.create_server(app_directory=temporary_directory, port=0)


if __name__ == "__main__":
    unittest.main()
