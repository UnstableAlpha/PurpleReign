"""
Adds NIST CSF 2.0 mappings to the Execution tactic test cases in purplereign.json.
Run once from the purplereign-app directory:  python scripts/add_nist_csf.py
"""
import json
from pathlib import Path

DATA_PATH = Path(__file__).parent.parent / "src" / "data" / "purplereign.json"

# NIST CSF 2.0 subcategory reference
SUBCATEGORIES = {
    "DE.CM-01": {
        "function": "Detect",
        "category": "Continuous Monitoring",
        "subcategory": "DE.CM-01",
        "description": "Networks and network services are monitored to detect potential adverse events",
    },
    "DE.CM-03": {
        "function": "Detect",
        "category": "Continuous Monitoring",
        "subcategory": "DE.CM-03",
        "description": "Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events",
    },
    "DE.AE-02": {
        "function": "Detect",
        "category": "Adverse Event Analysis",
        "subcategory": "DE.AE-02",
        "description": "Potentially adverse events are analyzed to better understand associated activities",
    },
    "PR.AA-01": {
        "function": "Protect",
        "category": "Identity Management, Authentication, and Access Control",
        "subcategory": "PR.AA-01",
        "description": "Identities and credentials for authorized users, services, and hardware are managed by the organization",
    },
    "PR.AA-05": {
        "function": "Protect",
        "category": "Identity Management, Authentication, and Access Control",
        "subcategory": "PR.AA-05",
        "description": "Access permissions, entitlements, and authorizations are defined in a policy, managed, enforced, and reviewed",
    },
    "PR.AT-01": {
        "function": "Protect",
        "category": "Awareness and Training",
        "subcategory": "PR.AT-01",
        "description": "Awareness and training for the workforce are provided so that they can perform their cybersecurity-related tasks",
    },
    "PR.PS-01": {
        "function": "Protect",
        "category": "Platform Security",
        "subcategory": "PR.PS-01",
        "description": "Configuration management practices are established and applied",
    },
    "PR.PS-02": {
        "function": "Protect",
        "category": "Platform Security",
        "subcategory": "PR.PS-02",
        "description": "Software is maintained, replaced, and removed commensurate with risk",
    },
    "PR.PS-04": {
        "function": "Protect",
        "category": "Platform Security",
        "subcategory": "PR.PS-04",
        "description": "Log records are generated and made available for continuous monitoring",
    },
    "RS.AN-03": {
        "function": "Respond",
        "category": "Incident Analysis",
        "subcategory": "RS.AN-03",
        "description": "Analysis is performed to establish what has taken place during an incident and the root cause of the incident",
    },
}


def m(*ids):
    return [SUBCATEGORIES[i] for i in ids]


EXECUTION_NIST = {
    "T1059":    m("DE.CM-03", "DE.AE-02", "PR.PS-01"),
    "T1059.001": m("DE.CM-03", "PR.PS-01", "PR.PS-04"),
    "T1059.003": m("DE.CM-03", "PR.PS-01"),
    "T1059.005": m("DE.CM-03", "PR.PS-01", "PR.PS-02"),
    "T1059.006": m("DE.CM-03", "PR.PS-02", "PR.AA-05"),
    "T1059.007": m("DE.CM-03", "PR.PS-01", "PR.PS-02"),
    "T1059.010": m("DE.CM-03", "PR.PS-02", "PR.PS-01"),
    "T1059.011": m("DE.CM-03", "PR.PS-02"),
    "T1203":    m("DE.CM-01", "DE.CM-03", "PR.PS-02"),
    "T1674":    m("DE.CM-03", "PR.PS-01"),
    "T1559":    m("DE.CM-03", "DE.AE-02", "PR.PS-01"),
    "T1559.001": m("DE.CM-03", "PR.AA-05", "PR.PS-01"),
    "T1559.002": m("DE.CM-03", "PR.PS-01", "PR.PS-02"),
    "T1106":    m("DE.CM-03", "DE.AE-02", "PR.PS-01"),
    "T1053":    m("DE.CM-03", "PR.AA-05", "RS.AN-03"),
    "T1053.002": m("DE.CM-03", "PR.AA-05", "PR.PS-01"),
    "T1053.005": m("DE.CM-03", "PR.AA-05", "PR.PS-01"),
    "T1129":    m("DE.CM-03", "PR.PS-01", "PR.PS-02"),
    "T1072":    m("DE.CM-03", "PR.AA-01", "PR.PS-01"),
    "T1569":    m("DE.CM-03", "PR.PS-01", "PR.AA-05"),
    "T1569.002": m("DE.CM-03", "PR.AA-05", "PR.PS-01"),
    "T1204":    m("DE.CM-03", "PR.AT-01", "DE.AE-02"),
    "T1204.001": m("DE.CM-01", "DE.CM-03", "PR.AT-01"),
    "T1204.002": m("DE.CM-03", "PR.PS-02", "PR.AT-01"),
    "T1204.004": m("DE.CM-03", "PR.AT-01", "PR.PS-01"),
    "T1204.005": m("DE.CM-03", "PR.PS-01", "PR.PS-02"),
    "T1047":    m("DE.CM-03", "PR.AA-05", "RS.AN-03"),
}


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))

    updated = 0
    for tactic in data["tactics"]:
        if tactic["name"] != "Execution":
            continue
        for tc in tactic["testCases"]:
            if tc["id"] in EXECUTION_NIST:
                tc["nistCsf"] = EXECUTION_NIST[tc["id"]]
                updated += 1

    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {updated} Execution test cases with NIST CSF 2.0 mappings.")
    print(f"Written to {DATA_PATH}")


if __name__ == "__main__":
    main()
