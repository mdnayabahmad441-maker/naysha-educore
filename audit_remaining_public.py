import requests, json

_env_path = r"c:\naysha-educore\naysha-educore\.env.local"
_env = {}
with open(_env_path, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, _, v = line.partition('=')
            _env[k.strip()] = v.strip()

svc_key = _env.get("SUPABASE_SERVICE_ROLE_KEY", "")
base_url = _env.get("NEXT_PUBLIC_SUPABASE_URL", "")
h = {"apikey": svc_key, "Authorization": f"Bearer {svc_key}"}

policies = requests.post(f"{base_url}/rest/v1/rpc/get_table_policies", headers=h).json()

print(f"Total live policies: {len(policies)}")

unconditional = []
for p in policies:
    roles = p.get("roles") or []
    qual = p.get("qual")
    with_check = p.get("with_check")
    cmd = p.get("cmd")
    
    # Check if role contains public or anon
    is_public_role = "public" in roles or "anon" in roles
    is_true_qual = qual == "true" or qual is True or (cmd in ["INSERT"] and (with_check == "true" or with_check is True))
    
    if is_public_role and is_true_qual:
        unconditional.append(p)

print(f"\nRemaining public unconditional policies: {len(unconditional)}")
for p in unconditional:
    print(f"Table: {p['tablename']} | Policy: {p['policyname']} | Cmd: {p['cmd']} | Qual: {p['qual']} | Check: {p['with_check']} | Roles: {p['roles']}")

# Dump detailed list
with open(r"c:\naysha-educore\naysha-educore\remaining_public_policies.json", "w", encoding="utf-8") as f:
    json.dump(unconditional, f, indent=2)
