import os, re, json

api_dir = r"c:\naysha-educore\naysha-educore\app\api"
routes_categorized = []

for root, dirs, files in os.walk(api_dir):
    for f in files:
        if f in ["route.ts", "route.js"]:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, api_dir)
            endpoint = "/api/" + os.path.dirname(rel_path).replace("\\", "/")
            
            with open(full_path, encoding="utf-8", errors="ignore") as fl:
                code = fl.read()

            uses_api_auth = "requireAuthorizedProfile" in code or "requireAdminProfile" in code or "requireTeacherProfile" in code
            uses_supabase_auth = "auth.getUser" in code or "auth.getSession" in code or "createClient" in code
            is_webhook = "webhook" in endpoint or "whatsapp/webhook" in endpoint
            is_public_flow = any(p in endpoint for p in ["admission-enquiry", "auth/parent-otp", "auth/request-otp", "auth/send-parent-otp", "auth/setup-account"])
            
            # Check what DB client is used
            uses_admin = "supabaseAdmin" in code or "SUPABASE_SERVICE_ROLE_KEY" in code

            routes_categorized.append({
                "endpoint": endpoint,
                "file": rel_path,
                "uses_api_auth": uses_api_auth,
                "uses_supabase_auth": uses_supabase_auth,
                "is_webhook": is_webhook,
                "is_public_flow": is_public_flow,
                "uses_admin": uses_admin
            })

print(f"Total API routes: {len(routes_categorized)}")
no_auth_routes = []
for r in routes_categorized:
    if not r["uses_api_auth"] and not r["uses_supabase_auth"] and not r["is_webhook"] and not r["is_public_flow"]:
        no_auth_routes.append(r)

print(f"\nRoutes using standard api-auth helper: {sum(1 for r in routes_categorized if r['uses_api_auth'])}")
print(f"Routes using custom supabase auth: {sum(1 for r in routes_categorized if r['uses_supabase_auth'])}")
print(f"Public / Webhook routes: {sum(1 for r in routes_categorized if r['is_public_flow'] or r['is_webhook'])}")
print(f"Routes with potential missing auth check: {len(no_auth_routes)}")

print("\n--- Detailed list of routes with potential missing auth check ---")
for r in no_auth_routes:
    print(f"  {r['endpoint']} (uses_admin={r['uses_admin']}) -> {r['file']}")
