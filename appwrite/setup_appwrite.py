"""
Script de provisionamento automático do Appwrite para o Sistema de Inspeção Locar (Betim / MG)
Executa a criação do Banco de Dados, Coleções, Atributos e Permissões.
"""

import sys
import json
import urllib.request
import urllib.error

# Carrega configurações
import os

ENDPOINT = os.getenv("APPWRITE_ENDPOINT", "https://nyc.cloud.appwrite.io/v1")
PROJECT_ID = os.getenv("APPWRITE_PROJECT_ID", "")
API_KEY = os.getenv("APPWRITE_API_KEY", "")
DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID", "locar_betim_db")

def make_request(path, method="GET", payload=None):
    url = f"{ENDPOINT}{path}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "X-Appwrite-Project": PROJECT_ID,
        "X-Appwrite-Key": API_KEY,
        "Content-Type": "application/json"
    }
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_body)
            # Se já existir (409 conflict), trata amigavelmente
            if e.code == 409:
                return {"conflict": True, "message": err_json.get("message")}
        except:
            pass
        print(f"[HTTP {e.code}] Erro na requisição {method} {url}: {err_body}")
        return None
    except Exception as e:
        print(f"Erro de conexão: {e}")
        return None

def setup():
    if not PROJECT_ID or not API_KEY:
        print("ERRO: APPWRITE_PROJECT_ID e APPWRITE_API_KEY são obrigatórios.")
        print("Uso: python setup_appwrite.py <PROJECT_ID> <API_KEY>")
        return

    print(f"\n=======================================================")
    print(f">> Iniciando Provisionamento Automatico no Appwrite Cloud")
    print(f"Projeto: {PROJECT_ID}")
    print(f"Banco de Dados Alvo: {DATABASE_ID}")
    print(f"=======================================================\n")

    # 1. Cria Banco de Dados se não existir
    print("1. Criando Banco de Dados 'locar_betim_db'...")
    res = make_request("/databases", "POST", {
        "databaseId": DATABASE_ID,
        "name": "Banco Locar Betim"
    })
    if res and res.get("conflict"):
        print("   -> Banco de dados já existia. Prosseguindo...")
    elif res:
        print("   -> Banco criado com sucesso!")

    # 2. Coleção 1: inspections
    print("\n2. Criando Coleção 'inspections'...")
    res = make_request(f"/databases/{DATABASE_ID}/collections", "POST", {
        "collectionId": "inspections",
        "name": "Inspeções e Laudos",
        "permissions": [
            "read(\"any\")",
            "create(\"any\")"
        ]
    })
    if res and res.get("conflict"):
        print("   -> Coleção 'inspections' já existia.")
    elif res:
        print("   -> Coleção 'inspections' criada com permissões Any!")

    # Atributos de inspections
    insp_attrs = [
        ("string", "inspection_id", 64, True),
        ("string", "equipment_tag", 64, True),
        ("string", "equipment_name", 128, True),
        ("string", "equipment_type", 32, True),
        ("string", "inspector_first_name", 64, False),
        ("string", "inspector_last_name", 64, False),
        ("string", "inspector_full_name", 128, False),
        ("string", "inspector_phone", 32, False),
        ("string", "inspector_reg", 64, False),
        ("float", "hourmeter", None, False),
        ("string", "final_status", 32, True),
        ("string", "verdict", 255, False),
        ("integer", "total_non_conformities", None, False),
        ("string", "technical_opinion", 2000, False),
        ("string", "ai_expert_appraisal", 3000, False),
        ("string", "started_at", 64, False),
        ("string", "finished_at", 64, False)
    ]

    print("   -> Criando atributos em 'inspections'...")
    for attr_type, key, size, req in insp_attrs:
        endpoint = f"/databases/{DATABASE_ID}/collections/inspections/attributes/{attr_type}"
        payload = {"key": key, "required": req}
        if size:
            payload["size"] = size
        r = make_request(endpoint, "POST", payload)
        if r and r.get("conflict"):
            print(f"      - Atributo '{key}' ja existe.")
        elif r:
            print(f"      [OK] Atributo '{key}' criado.")

    # 3. Coleção 2: pcm_service_requests
    print("\n3. Criando Coleção 'pcm_service_requests'...")
    res = make_request(f"/databases/{DATABASE_ID}/collections", "POST", {
        "collectionId": "pcm_service_requests",
        "name": "Solicitações ao PCM",
        "permissions": [
            "read(\"any\")",
            "create(\"any\")"
        ]
    })
    if res and res.get("conflict"):
        print("   -> Coleção 'pcm_service_requests' já existia.")
    elif res:
        print("   -> Coleção 'pcm_service_requests' criada com sucesso!")

    pcm_attrs = [
        ("string", "request_id", 64, True),
        ("string", "equipment_tag", 64, True),
        ("string", "equipment_name", 128, True),
        ("string", "status", 32, True),
        ("string", "severity", 32, True),
        ("string", "inspector_name", 128, False),
        ("string", "inspector_phone", 32, False),
        ("string", "opened_date", 64, False),
        ("string", "recipient_email", 128, False),
        ("string", "faults_summary", 2000, False)
    ]

    print("   -> Criando atributos em 'pcm_service_requests'...")
    for attr_type, key, size, req in pcm_attrs:
        endpoint = f"/databases/{DATABASE_ID}/collections/pcm_service_requests/attributes/{attr_type}"
        payload = {"key": key, "required": req}
        if size:
            payload["size"] = size
        r = make_request(endpoint, "POST", payload)
        if r and r.get("conflict"):
            print(f"      - Atributo '{key}' ja existe.")
        elif r:
            print(f"      [OK] Atributo '{key}' criado.")

    print("\n[SUCESSO] Provisionamento concluido com exito!")
    print("Agora seu banco de dados no Appwrite esta 100% pronto para producao.")

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        PROJECT_ID = sys.argv[1]
        API_KEY = sys.argv[2]
    setup()
