from flask import Flask, send_file, abort, jsonify, Response
import threading
import os
import uuid

app = Flask(__name__)

# Set up upload folder
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

download_status = {}
lock = threading.Lock()
CHUNK_SIZE = 8192  # 8 KB

def get_file_path(filename):
    return os.path.join(UPLOAD_FOLDER, filename)

@app.route("/generate_link", methods=["GET"])
def generate_link():
    # For demo: use a static file named 'sample.txt'
    filename = "sample.txt"
    file_id = str(uuid.uuid4())
    with lock:
        download_status[file_id] = {
            "filename": filename,
            "downloaded": False
        }
    download_url = f"http://localhost:5000/download/{file_id}"
    return jsonify({"download_link": download_url})

@app.route("/download/<file_id>", methods=["GET"])
def download(file_id):
    with lock:
        meta = download_status.get(file_id)
        if not meta:
            return abort(404, "Invalid or expired file link.")
        if meta["downloaded"]:
            return "File has already been downloaded or expired.", 403
        # Mark as downloaded immediately
        meta["downloaded"] = True

    filename = meta["filename"]
    file_path = get_file_path(filename)
    if not os.path.exists(file_path):
        return abort(404, "File not found on server.")

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache"
    }

    def generate():
        with open(file_path, "rb") as f:
            while True:
                chunk = f.read(CHUNK_SIZE)
                if not chunk:
                    break
                yield chunk

    response = Response(generate(), mimetype="application/octet-stream", headers=headers)
    # Optional: delete file after download
    # os.remove(file_path)
    return response

if __name__ == "__main__":
    app.run(debug=True, port=5000)
