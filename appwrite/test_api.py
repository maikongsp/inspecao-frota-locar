import urllib.request
import json

KEY = "standard_42844ac64c388f99293bdd461bcb5fa7cc3cc8afe7680c8037c4c611faade0526e32ef824c4077531c8efa628e19cde6576acaf9cd7b3c6721f3557fd08ec3ae0b49d8b558410d14b160c3466e83a10273396420b8a5744c710d73ab746f3185967d67dd445923268fd83a22dbf40fc5389fc1f9e51345b88beb393eee384bb1"
PROJ = "6aaf35a1003b73ac8b04"
DB_ID = "locar_betim_db"
ENDPOINT = "https://nyc.cloud.appwrite.io/v1"

def api(url, method="GET", payload=None):
    headers = {
        "User-Agent": "Mozilla/5.0",
        "X-Appwrite-Project": PROJ,
        "X-Appwrite-Key": KEY,
        "Content-Type": "application/json"
    }
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        err = getattr(e, "read", lambda: b"")()
        print(f"[{method}] {url} -> {e} | {err.decode('utf-8')[:200]}")
        return None

# Testa listagem de coleções no endpoint do novo Appwrite
print("Testando documentsdb:")
print(api(f"{ENDPOINT}/databases/{DB_ID}/collections"))

print("\nTestando tables:")
print(api(f"{ENDPOINT}/databases/{DB_ID}/tables"))
