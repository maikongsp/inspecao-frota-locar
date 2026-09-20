import re
from collections import Counter

with open('js/data/fleetData.js', 'r', encoding='utf-8') as f:
    content = f.read()

types = re.findall(r'"type":\s*"([^"]+)"', content)
statuses = re.findall(r'"status":\s*"([^"]+)"', content)

pairs = list(zip(types, statuses))
print("Total pares:", len(pairs))

for cat in ['pta', 'guindaste', 'empilhadeira']:
    cat_items = [s for t, s in pairs if t == cat]
    c = Counter(cat_items)
    print(f"{cat.upper()} (Total: {len(cat_items)}): Disponivel={c.get('disponivel', 0)} | Locada={c.get('locada', 0)} | Manutencao={c.get('manutencao', 0)} | Bloqueado={c.get('bloqueado', 0)}")
