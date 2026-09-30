import json

with open(r'c:\naysha-educore\naysha-educore\policy_inventory.json', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total legacy targets: {len(data['legacy_targets'])}")
for p in data['legacy_targets']:
    print(f"- {p['tablename']}: \"{p['policyname']}\" ({p['cmd']}) qual={p.get('qual')} roles={p.get('roles')}")
