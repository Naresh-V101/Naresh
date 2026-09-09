import json
import os
import re
import smtplib
from email.message import EmailMessage
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs

HOST = "127.0.0.1"
PORT = int(os.getenv("PORT", "8000"))
RECIPIENT = "naresh56722@gmail.com"
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class PortfolioHandler(SimpleHTTPRequestHandler):
    def _json(self, status, message):
        payload = json.dumps({"message": message}).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path != "/send-signal":
            self._json(404, "This endpoint does not exist.")
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length > 20_000:
            self._json(413, "Your signal is too large.")
            return

        fields = parse_qs(self.rfile.read(content_length).decode("utf-8"), keep_blank_values=True)
        name = fields.get("name", [""])[0].strip()
        sender = fields.get("email", [""])[0].strip()
        message = fields.get("message", [""])[0].strip()

        if not name or not message or not EMAIL_PATTERN.fullmatch(sender):
            self._json(400, "Enter a valid email address and complete all fields.")
            return

        smtp_user = os.getenv("SMTP_USER", RECIPIENT)
        smtp_password = os.getenv("SMTP_APP_PASSWORD")
        if not smtp_password:
            self._json(503, "Email delivery is not configured on the server yet.")
            return

        email = EmailMessage()
        email["Subject"] = f"Portfolio signal from {name}"
        email["From"] = smtp_user
        email["To"] = RECIPIENT
        email["Reply-To"] = sender
        email.set_content(f"Name: {name}\nEmail: {sender}\n\n{message}")

        try:
            with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as smtp:
                smtp.login(smtp_user, smtp_password)
                smtp.send_message(email)
        except (OSError, smtplib.SMTPException):
            self._json(502, "The signal could not be delivered. Please try again later.")
            return

        self._json(200, "Signal sent successfully.")


if __name__ == "__main__":
    print(f"Portfolio running at http://{HOST}:{PORT}")
    ThreadingHTTPServer((HOST, PORT), PortfolioHandler).serve_forever()
