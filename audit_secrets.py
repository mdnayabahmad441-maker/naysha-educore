import os, re

repo_dir = r"c:\naysha-educore\naysha-educore"

patterns = {
    "Private Key": re.compile(r"-----BEGIN (RSA |EC )?PRIVATE KEY-----"),
    "Resend Key": re.compile(r"re_[a-zA-Z0-9]{20,}"),
    "Twilio Token": re.compile(r"AC[a-f0-9]{32}"),
    "Anthropic Key": re.compile(r"sk-ant-[a-zA-Z0-9_-]{20,}"),
    "Hardcoded Secret": re.compile(r"(service_role_key|jwt_secret|app_secret)\s*[:=]\s*['\"][^'\"]{10,}['\"]", re.IGNORECASE)
}

leaks = []

for root, dirs, files in os.walk(repo_dir):
    for skip in ["node_modules", ".next", ".git", "android", ".vercel"]:
        if skip in dirs: dirs.remove(skip)
    for f in files:
        if f in [".env.local", "package-lock.json", "policy_inventory.json", "post_cleanup_verification_results.json", "tsconfig.tsbuildinfo"]:
            continue
        if not f.endswith((".ts", ".tsx", ".js", ".jsx", ".json", ".sql", ".env")):
            continue
        p = os.path.join(root, f)
        rel = os.path.relpath(p, repo_dir)
        try:
            with open(p, encoding="utf-8", errors="ignore") as fl:
                for idx, line in enumerate(fl):
                    for name, pat in patterns.items():
                        if pat.search(line):
                            if "process.env" in line or "placeholder" in line or "example" in line:
                                continue
                            leaks.append({
                                "file": rel,
                                "line": idx + 1,
                                "type": name
                            })
        except Exception:
            pass

print(f"Total potential secret leaks detected: {len(leaks)}")
for l in leaks:
    print(f"  {l['file']}:{l['line']} -> {l['type']}")
