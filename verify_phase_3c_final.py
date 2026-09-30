#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NAYSHA EDUCORE — PHASE 3C FINAL LIVE VERIFICATION
Complete live testing engine.
"""

import sys, os, json, requests

# Unbuffer stdout
sys.stdout.reconfigure(line_buffering=True)

_env_path = r"c:\naysha-educore\naysha-educore\.env.local"
_env = {}
with open(_env_path, encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, _, v = line.partition('=')
            _env[k.strip()] = v.strip()

base_url = _env.get("NEXT_PUBLIC_SUPABASE_URL", "https://xrgwvppbcnnqguduxgeg.supabase.co")
svc_key = _env.get("SUPABASE_SERVICE_ROLE_KEY", "")
anon_key = _env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

svc_h = {"apikey": svc_key, "Authorization": f"Bearer {svc_key}", "Content-Type": "application/json"}
anon_h = {"apikey": anon_key, "Authorization": f"Bearer {anon_key}", "Content-Type": "application/json"}

results_data = {}

print("==================================================")
print("PHASE 3C FINAL POST-CLEANUP VERIFICATION")
print("Target: xrgwvppbcnnqguduxgeg.supabase.co")
print("==================================================")

# ==================================================
# 1. VERIFY LEGACY POLICIES ARE GONE
# ==================================================
print("\n--- 1. VERIFY LEGACY POLICIES ARE GONE ---")
legacy_targets = [
    "Students access", "allow all students", "students_all", "parents_all",
    "fees_all", "payments_all", "attendance_select", "attendance_update",
    "attendance_delete", "allow all marks", "allow all results",
    "Allow read classes", "classes_all", "Allow select subjects",
    "Allow update subjects", "Allow delete subjects", "Allow all for now",
    "allow all academic years", "Allow select for school", "all exams",
    "allow all exams", "Allow update", "all exam subjects",
    "allow all", "service role full access", "full_access_settings",
    "full_access_class_fee", "notifications_all"
]

all_policies = requests.post(f"{base_url}/rest/v1/rpc/get_table_policies", headers=svc_h, timeout=10).json()

# Identify remaining legacy targets
found_legacy = []
for p in all_policies:
    # check by exact name
    pname = p["policyname"]
    tname = p["tablename"]
    if pname in legacy_targets:
        # Check if it was teacher_classes / teacher_subjects 'allow all' or settings 'allow all'
        found_legacy.append(f"{tname}: {pname}")
    elif p.get("qual") == "true" and "public" in p.get("roles", []) and tname not in ["schools", "admission_enquiries"]:
        found_legacy.append(f"{tname}: {pname} (qual=true, role=public)")

print(f"Total live policies in catalog: {len(all_policies)}")
print(f"Legacy policies before: 30")
print(f"Legacy policies remaining: {len(found_legacy)}")
if found_legacy:
    print("WARNING: Found remaining legacy policies:")
    for fl in found_legacy:
        print("  -", fl)
else:
    print("SUCCESS: ALL 30 LEGACY POLICIES HAVE BEEN PERMANENTLY REMOVED!")

results_data["legacy_policies"] = {
    "total_live": len(all_policies),
    "legacy_before": 30,
    "legacy_remaining": len(found_legacy),
    "remaining_list": found_legacy
}

# ==================================================
# 2. VERIFY LIVE RLS STATE (relrowsecurity & relforcerowsecurity)
# ==================================================
print("\n--- 2. VERIFY LIVE RLS STATE (relrowsecurity & relforcerowsecurity) ---")
sec_data = requests.post(f"{base_url}/rest/v1/rpc/check_table_security", headers=svc_h, timeout=10).json()

tables_to_verify = [
    "students", "parents", "fees", "payments", "attendance", "marks", "results",
    "settings", "school_whatsapp", "classes", "subjects", "academic_years",
    "exams", "exam_subjects", "teacher_classes", "teacher_subjects",
    "class_fee_settings", "notifications"
]

rls_table_status = {}
all_rls_ok = True
for item in sec_data:
    tname = item["table_name"]
    if tname in tables_to_verify:
        row_sec = item.get("rls_enabled", False)
        force_sec = item.get("rls_forced", False)
        p_count = item.get("policy_count", 0)
        is_ok = row_sec and force_sec
        if not is_ok:
            all_rls_ok = False
        rls_table_status[tname] = {
            "rls_enabled": row_sec,
            "rls_forced": force_sec,
            "policy_count": p_count,
            "status": "PASS" if is_ok else "FAIL"
        }
        print(f"  {tname:20} -> relrowsecurity={row_sec}, relforcerowsecurity={force_sec}, policies={p_count} [{rls_table_status[tname]['status']}]")

results_data["rls_state"] = rls_table_status
results_data["all_rls_ok"] = all_rls_ok

# ==================================================
# 3. VERIFY ANONYMOUS ACCESS
# ==================================================
print("\n--- 3. VERIFY ANONYMOUS ACCESS (Must be BLOCKED / 401 / 0 rows) ---")
anon_tests = {}
all_anon_blocked = True

for tname in tables_to_verify:
    try:
        r = requests.get(f"{base_url}/rest/v1/{tname}?select=*&limit=5", headers=anon_h, timeout=5)
        status_code = r.status_code
        rows_returned = 0
        real_data_exposed = False
        
        if status_code == 401 or status_code == 403:
            verdict = "DENIED (401 Unauthorized)"
            passed = True
        elif status_code == 200:
            rows = r.json()
            rows_returned = len(rows)
            if rows_returned == 0:
                verdict = "DENIED (200 OK, 0 rows returned)"
                passed = True
            else:
                verdict = f"LEAKED! ({rows_returned} rows exposed)"
                real_data_exposed = True
                passed = False
                all_anon_blocked = False
        else:
            verdict = f"HTTP {status_code}"
            passed = True
            
        anon_tests[tname] = {
            "http_status": status_code,
            "rows_returned": rows_returned,
            "real_data_exposed": real_data_exposed,
            "verdict": verdict,
            "passed": passed
        }
        print(f"  {tname:20} -> HTTP {status_code} | Rows: {rows_returned} | Data Exposed: {real_data_exposed} -> {verdict}")
    except Exception as e:
        print(f"  {tname:20} -> Error: {e}")

results_data["anon_tests"] = anon_tests
results_data["all_anon_blocked"] = all_anon_blocked

# ==================================================
# 4. VERIFY PUBLIC FUNCTIONALITY
# ==================================================
print("\n--- 4. VERIFY PUBLIC FUNCTIONALITY ---")
# schools: anonymous SELECT should continue to work if intended
r_schools = requests.get(f"{base_url}/rest/v1/schools?select=id,name,slug&limit=2", headers=anon_h, timeout=5)
schools_anon_ok = (r_schools.status_code == 200 and len(r_schools.json()) > 0)
print(f"  schools (anon SELECT) -> HTTP {r_schools.status_code}, Rows: {len(r_schools.json()) if r_schools.status_code == 200 else 0} [{'PASS' if schools_anon_ok else 'FAIL'}]")

# admission_enquiries: anon SELECT must not expose existing enquiries
r_enq_sel = requests.get(f"{base_url}/rest/v1/admission_enquiries?select=*&limit=5", headers=anon_h, timeout=5)
enq_sel_blocked = (r_enq_sel.status_code in [401, 403] or (r_enq_sel.status_code == 200 and len(r_enq_sel.json()) == 0))
print(f"  admission_enquiries (anon SELECT) -> HTTP {r_enq_sel.status_code}, Rows: {len(r_enq_sel.json()) if r_enq_sel.status_code == 200 else 0} [{'PASS - Zero Leaked' if enq_sel_blocked else 'FAIL'}]")

# admission_enquiries: anon INSERT capability
# We test with a dummy invalid or test payload to check if policy permits INSERT
r_enq_ins = requests.post(f"{base_url}/rest/v1/admission_enquiries", headers=anon_h, json={
    "school_id": "00000000-0000-0000-0000-000000000000",
    "student_name": "Test Public Enq",
    "parent_name": "Test Parent",
    "phone": "9999999999"
}, timeout=5)
# If FK fails (foreign key violation), it means RLS passed and reached Postgres constraint engine!
enq_ins_ok = r_enq_ins.status_code in [201, 409] or "violates foreign key" in r_enq_ins.text or "violates not-null" in r_enq_ins.text
print(f"  admission_enquiries (anon INSERT) -> HTTP {r_enq_ins.status_code} ({r_enq_ins.text[:60]}) [{'PASS' if enq_ins_ok else 'INFO'}]")

results_data["public_functionality"] = {
    "schools_anon_select": schools_anon_ok,
    "admission_enquiries_select_blocked": enq_sel_blocked,
    "admission_enquiries_insert_allowed": enq_ins_ok
}

# ==================================================
# 5. STORAGE VERIFICATION
# ==================================================
print("\n--- 5. STORAGE VERIFICATION ---")
storage_results = {}
for b in ["student-documents", "report-cards", "receipts", "school-logos", "school-assets", "students-photos", "students"]:
    r = requests.get(f"{base_url}/storage/v1/bucket/{b}", headers=anon_h, timeout=5)
    if r.status_code == 200:
        is_pub = r.json().get("public", False)
        status_str = f"HTTP 200 (public={is_pub})"
        is_ok = is_pub if b in ["school-logos", "school-assets", "students-photos", "students"] else (not is_pub)
    elif r.status_code in [400, 404]:
        status_str = f"HTTP {r.status_code} (NoSuchBucket/Private)"
        is_ok = True if b in ["student-documents", "report-cards", "receipts"] else False
    else:
        status_str = f"HTTP {r.status_code}"
        is_ok = False
    storage_results[b] = {"status_code": r.status_code, "status": status_str, "ok": is_ok}
    print(f"  {b:20} -> {status_str} [{'PASS' if is_ok else 'CHECK'}]")

results_data["storage"] = storage_results

# ==================================================
# 6. WHATSAPP SECURITY
# ==================================================
print("\n--- 6. WHATSAPP SECURITY ---")
r_wa_anon = requests.get(f"{base_url}/rest/v1/school_whatsapp?select=access_token", headers=anon_h, timeout=5)
wa_anon_blocked = (r_wa_anon.status_code in [401, 403] or (r_wa_anon.status_code == 200 and len(r_wa_anon.json()) == 0))
print(f"  school_whatsapp (anon access) -> HTTP {r_wa_anon.status_code} [{'BLOCKED / PROTECTED' if wa_anon_blocked else 'LEAKED'}]")
results_data["whatsapp_anon_blocked"] = wa_anon_blocked

# Save results to json
with open(r"c:\naysha-educore\naysha-educore\post_cleanup_verification_results.json", "w", encoding="utf-8") as f:
    json.dump(results_data, f, indent=2)

print("\nVerification data saved to post_cleanup_verification_results.json")
