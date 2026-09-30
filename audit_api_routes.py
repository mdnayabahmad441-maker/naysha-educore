import os, re, json

api_dir = r"c:\naysha-educore\naysha-educore\app\api"
routes_info = []

for root, dirs, files in os.walk(api_dir):
    for f in files:
        if f in ["route.ts", "route.js"]:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, api_dir)
            endpoint = "/api/" + os.path.dirname(rel_path).replace("\\", "/")
            
            with open(full_path, encoding="utf-8", errors="ignore") as fl:
                code = fl.read()

            # Methods supported
            methods = []
            for m in ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]:
                if re.search(r"export\s+async\s+function\s+" + m + r"\b", code) or re.search(r"export\s+const\s+" + m + r"\b", code):
                    methods.append(m)

            # Check client usage
            uses_admin = "supabaseAdmin" in code or "SUPABASE_SERVICE_ROLE_KEY" in code or "createAdminClient" in code
            uses_client = "createClient" in code or "supabase" in code
            
            # Check auth verification
            has_auth_check = any(term in code for term in [
                "auth.getUser", "auth.getSession", "getSession", "getUser", "verifyAuth", "authHeader", "Bearer", "jwt", "session"
            ])
            
            # Check school_id parameter handling
            extracts_school_id = any(term in code for term in [
                "school_id", "schoolId", "tenant"
            ])
            
            # Check rate limiting
            has_rate_limit = "rateLimit" in code or "ratelimit" in code or "checkRateLimit" in code

            routes_info.append({
                "endpoint": endpoint,
                "file": rel_path,
                "methods": methods,
                "uses_supabase_admin": uses_admin,
                "has_auth_check": has_auth_check,
                "handles_school_id": extracts_school_id,
                "has_rate_limit": has_rate_limit,
                "code_len": len(code)
            })

print(f"Total API routes analyzed: {len(routes_info)}")
print(f"Routes using supabaseAdmin (Bypasses RLS): {sum(1 for r in routes_info if r['uses_supabase_admin'])}")
print(f"Routes with auth checks: {sum(1 for r in routes_info if r['has_auth_check'])}")
print(f"Routes with rate limiting: {sum(1 for r in routes_info if r['has_rate_limit'])}")

with open(r"c:\naysha-educore\naysha-educore\api_routes_audit.json", "w", encoding="utf-8") as out:
    json.dump(routes_info, out, indent=2)

print("\n--- Potentially Critical: Routes using supabaseAdmin without explicit auth.getUser check ---")
for r in routes_info:
    if r["uses_supabase_admin"] and not r["has_auth_check"]:
        print(f"  {r['endpoint']} ({', '.join(r['methods'])}) -> {r['file']}")
