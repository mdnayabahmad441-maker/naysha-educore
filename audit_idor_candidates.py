import os, re, json

api_dir = r"c:\naysha-educore\naysha-educore\app\api"
findings = []

for root, dirs, files in os.walk(api_dir):
    for f in files:
        if f.endswith((".ts", ".js")):
            p = os.path.join(root, f)
            rel = os.path.relpath(p, api_dir)
            with open(p, encoding="utf-8", errors="ignore") as fl:
                code = fl.read()

            # Check if route handles an ID parameter
            has_id_param = "params" in code or "searchParams.get(" in code or "body.id" in code or "body?.id" in code or "[id]" in rel

            if has_id_param and "supabaseAdmin" in code:
                # Check if query on table has eq("school_id", ...)
                queries = re.findall(r"supabaseAdmin\s*\.from\(['\"]([a-zA-Z0-9_]+)['\"]\)(.*?)(?=\.single\(\)|\.maybeSingle\(\)|\.then\(|await|const|let|return|;|\n\s*\n)", code, re.DOTALL)
                for table, query in queries:
                    if table in ["schools", "users", "profiles"]:
                        continue
                    has_school_check = "school_id" in query or "schoolId" in query
                    findings.append({
                        "file": rel,
                        "table": table,
                        "has_school_id_filter": has_school_check,
                        "query_snippet": query.strip().replace("\n", " ")[:120]
                    })

print(f"Total parameterized supabaseAdmin queries: {len(findings)}")
potential_idor = [f for f in findings if not f["has_school_id_filter"]]
print(f"Potential IDOR queries without school_id filter: {len(potential_idor)}")

for p in potential_idor:
    print(f"  File: {p['file']} | Table: {p['table']} | Query: {p['query_snippet']}")
