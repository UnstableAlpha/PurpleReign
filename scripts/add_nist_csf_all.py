"""
Adds NIST CSF 2.0 mappings to ALL test cases across all 12 tactics in purplereign.json.
Run from the purplereign-app directory:  python scripts/add_nist_csf_all.py

Strategy:
  1. Technique-specific override (exact ID match)
  2. Parent-technique inheritance (T1027.001 inherits T1027 if no specific override)
  3. Tactic-level default fallback
"""
import json
from pathlib import Path

DATA_PATH = Path(__file__).parent.parent / "src" / "data" / "purplereign.json"

# ── NIST CSF 2.0 subcategory reference ───────────────────────────────────────
SC = {
    "DE.CM-01": {"function": "Detect",   "category": "Continuous Monitoring",
                 "subcategory": "DE.CM-01",
                 "description": "Networks and network services are monitored to detect potential adverse events"},
    "DE.CM-03": {"function": "Detect",   "category": "Continuous Monitoring",
                 "subcategory": "DE.CM-03",
                 "description": "Computing hardware and software, runtime environments, and their data are monitored to find potentially adverse events"},
    "DE.CM-06": {"function": "Detect",   "category": "Continuous Monitoring",
                 "subcategory": "DE.CM-06",
                 "description": "External service provider activities and services are monitored to find potentially adverse events"},
    "DE.AE-02": {"function": "Detect",   "category": "Adverse Event Analysis",
                 "subcategory": "DE.AE-02",
                 "description": "Potentially adverse events are analyzed to better understand associated activities"},
    "DE.AE-03": {"function": "Detect",   "category": "Adverse Event Analysis",
                 "subcategory": "DE.AE-03",
                 "description": "Information is correlated from multiple sources to achieve integrated identification and understanding of adverse events"},
    "ID.AM-02": {"function": "Identify", "category": "Asset Management",
                 "subcategory": "ID.AM-02",
                 "description": "Inventories of software, services, and systems are maintained"},
    "PR.AA-01": {"function": "Protect",  "category": "Identity Management, Authentication, and Access Control",
                 "subcategory": "PR.AA-01",
                 "description": "Identities and credentials for authorized users, services, and hardware are managed by the organization"},
    "PR.AA-03": {"function": "Protect",  "category": "Identity Management, Authentication, and Access Control",
                 "subcategory": "PR.AA-03",
                 "description": "Users, services, and hardware are authenticated"},
    "PR.AA-04": {"function": "Protect",  "category": "Identity Management, Authentication, and Access Control",
                 "subcategory": "PR.AA-04",
                 "description": "Identity assertions are protected, conveyed, and verified"},
    "PR.AA-05": {"function": "Protect",  "category": "Identity Management, Authentication, and Access Control",
                 "subcategory": "PR.AA-05",
                 "description": "Access permissions, entitlements, and authorizations are defined in a policy, managed, enforced, and reviewed"},
    "PR.AT-01": {"function": "Protect",  "category": "Awareness and Training",
                 "subcategory": "PR.AT-01",
                 "description": "Awareness and training for the workforce are provided so that they can perform their cybersecurity-related tasks"},
    "PR.DS-01": {"function": "Protect",  "category": "Data Security",
                 "subcategory": "PR.DS-01",
                 "description": "The confidentiality, integrity, and availability of data-at-rest are protected"},
    "PR.DS-02": {"function": "Protect",  "category": "Data Security",
                 "subcategory": "PR.DS-02",
                 "description": "The confidentiality, integrity, and availability of data-in-transit are protected"},
    "PR.DS-10": {"function": "Protect",  "category": "Data Security",
                 "subcategory": "PR.DS-10",
                 "description": "The confidentiality, integrity, and availability of data-in-use are protected"},
    "PR.IR-01": {"function": "Protect",  "category": "Technology Infrastructure Resilience",
                 "subcategory": "PR.IR-01",
                 "description": "Networks and environments are protected from unauthorized logical access and usage"},
    "PR.PS-01": {"function": "Protect",  "category": "Platform Security",
                 "subcategory": "PR.PS-01",
                 "description": "Configuration management practices are established and applied"},
    "PR.PS-02": {"function": "Protect",  "category": "Platform Security",
                 "subcategory": "PR.PS-02",
                 "description": "Software is maintained, replaced, and removed commensurate with risk"},
    "PR.PS-03": {"function": "Protect",  "category": "Platform Security",
                 "subcategory": "PR.PS-03",
                 "description": "Hardware is maintained, replaced, and removed commensurate with risk"},
    "PR.PS-04": {"function": "Protect",  "category": "Platform Security",
                 "subcategory": "PR.PS-04",
                 "description": "Log records are generated and made available for continuous monitoring"},
    "PR.PS-05": {"function": "Protect",  "category": "Platform Security",
                 "subcategory": "PR.PS-05",
                 "description": "Installation and execution of unauthorized software are prevented"},
    "RS.AN-03": {"function": "Respond",  "category": "Incident Analysis",
                 "subcategory": "RS.AN-03",
                 "description": "Analysis is performed to establish what has taken place during an incident and the root cause of the incident"},
    "RS.AN-06": {"function": "Respond",  "category": "Incident Analysis",
                 "subcategory": "RS.AN-06",
                 "description": "Actions performed during an investigation are recorded, and the records' integrity and provenance are verified"},
    "RS.MI-02": {"function": "Respond",  "category": "Incident Mitigation",
                 "subcategory": "RS.MI-02",
                 "description": "Incidents are contained"},
}

def m(*ids):
    return [SC[i] for i in ids]


# ── Tactic-level defaults ─────────────────────────────────────────────────────
TACTIC_DEFAULTS = {
    "Initial Access":        m("DE.CM-01", "DE.CM-03", "PR.AA-05"),
    "Execution":             m("DE.CM-03", "DE.AE-02", "PR.PS-01"),
    "Persistence":           m("DE.CM-03", "PR.PS-01", "PR.AA-05"),
    "Privilege Escalation":  m("DE.CM-03", "PR.AA-05", "PR.PS-01"),
    "Defense Evasion":       m("DE.CM-03", "PR.PS-01", "PR.PS-04"),
    "Credential Access":     m("DE.CM-03", "PR.AA-03", "PR.DS-01"),
    "Discovery":             m("DE.CM-03", "PR.AA-05", "PR.PS-01"),
    "Lateral Movement":      m("DE.CM-03", "PR.AA-05", "PR.IR-01"),
    "Collection":            m("DE.CM-03", "PR.DS-01", "PR.AA-05"),
    "Command and Control":   m("DE.CM-01", "DE.CM-03", "PR.IR-01"),
    "Exfiltration":          m("DE.CM-01", "DE.CM-03", "PR.DS-02"),
    "Impact":                m("DE.CM-03", "RS.AN-03", "RS.MI-02"),
}

# ── Technique-specific mappings (exact ID → overrides default) ────────────────
TECHNIQUE_MAPPINGS = {

    # ── INITIAL ACCESS ────────────────────────────────────────────────────────
    "T1078":     m("DE.CM-03", "PR.AA-01", "PR.AA-03"),       # Valid Accounts
    "T1078.001": m("DE.CM-03", "PR.AA-01", "PR.AA-03"),
    "T1078.002": m("DE.CM-03", "PR.AA-01", "PR.AA-03"),
    "T1078.003": m("DE.CM-03", "PR.AA-01", "PR.AA-03"),
    "T1091":     m("DE.CM-03", "PR.PS-03", "PR.IR-01"),       # Removable Media
    "T1133":     m("DE.CM-01", "DE.CM-03", "PR.AA-05"),       # External Remote Services
    "T1189":     m("DE.CM-01", "DE.CM-03", "PR.PS-02"),       # Drive-by Compromise
    "T1190":     m("DE.CM-01", "DE.CM-03", "PR.PS-02"),       # Exploit Public-Facing App
    "T1195":     m("ID.AM-02", "DE.CM-03", "PR.PS-02"),       # Supply Chain Compromise
    "T1195.001": m("ID.AM-02", "DE.CM-03", "PR.PS-02"),
    "T1195.002": m("ID.AM-02", "DE.CM-03", "PR.PS-02"),
    "T1195.003": m("ID.AM-02", "DE.CM-03", "PR.PS-02"),
    "T1199":     m("DE.CM-03", "DE.CM-06", "PR.AA-05"),       # Trusted Relationship
    "T1200":     m("DE.CM-03", "PR.PS-03", "PR.IR-01"),       # Hardware Additions
    "T1566":     m("DE.CM-03", "DE.CM-01", "PR.AT-01"),       # Phishing
    "T1566.001": m("DE.CM-03", "DE.CM-01", "PR.AT-01"),
    "T1566.002": m("DE.CM-01", "DE.CM-03", "PR.AT-01"),
    "T1566.003": m("DE.CM-03", "PR.AT-01", "PR.PS-02"),
    "T1566.004": m("DE.CM-03", "PR.AT-01", "DE.AE-02"),
    "T1659":     m("DE.CM-01", "DE.CM-03", "PR.IR-01"),       # Content Injection
    "T1669":     m("DE.CM-01", "DE.CM-03", "PR.PS-02"),       # Watering Hole

    # ── PERSISTENCE ──────────────────────────────────────────────────────────
    "T1098":     m("DE.CM-03", "PR.AA-01", "PR.AA-05"),       # Account Manipulation
    "T1098.002": m("DE.CM-03", "PR.AA-01", "PR.AA-05"),
    "T1098.005": m("DE.CM-03", "PR.AA-01", "PR.AA-05"),
    "T1098.007": m("DE.CM-03", "PR.AA-01", "PR.AA-05"),
    "T1136":     m("DE.CM-03", "PR.AA-01", "PR.AA-05"),       # Create Account
    "T1136.001": m("DE.CM-03", "PR.AA-01", "PR.AA-05"),
    "T1136.002": m("DE.CM-03", "PR.AA-01", "PR.AA-05"),
    "T1197":     m("DE.CM-03", "PR.PS-01", "PR.PS-05"),       # BITS Jobs
    "T1505":     m("DE.CM-03", "PR.PS-01", "PR.PS-02"),       # Server Software Component
    "T1505.001": m("DE.CM-03", "PR.PS-01", "PR.PS-02"),
    "T1505.002": m("DE.CM-03", "PR.PS-01", "PR.PS-02"),
    "T1505.003": m("DE.CM-03", "PR.PS-01", "PR.PS-02"),
    "T1505.004": m("DE.CM-03", "PR.PS-01", "PR.PS-02"),
    "T1505.005": m("DE.CM-03", "PR.PS-01", "PR.PS-02"),
    "T1542":     m("DE.CM-03", "PR.PS-01", "PR.PS-03"),       # Pre-OS Boot
    "T1542.001": m("DE.CM-03", "PR.PS-01", "PR.PS-03"),
    "T1542.002": m("DE.CM-03", "PR.PS-01", "PR.PS-03"),
    "T1542.003": m("DE.CM-03", "PR.PS-01", "PR.PS-03"),
    "T1543":     m("DE.CM-03", "PR.PS-01", "PR.AA-05"),       # Create/Modify System Process
    "T1543.003": m("DE.CM-03", "PR.PS-01", "PR.AA-05"),
    "T1546":     m("DE.CM-03", "PR.PS-01", "DE.AE-02"),       # Event Triggered Execution
    "T1547":     m("DE.CM-03", "PR.PS-01", "DE.AE-02"),       # Boot/Logon Autostart
    "T1554":     m("DE.CM-03", "PR.PS-02", "ID.AM-02"),       # Compromise Client Software Binary
    "T1556":     m("DE.CM-03", "PR.AA-01", "PR.AA-03"),       # Modify Authentication Process
    "T1556.001": m("DE.CM-03", "PR.AA-01", "PR.AA-03"),
    "T1556.002": m("DE.CM-03", "PR.AA-01", "PR.AA-03"),
    "T1556.005": m("DE.CM-03", "PR.AA-01", "PR.AA-03"),
    "T1556.006": m("DE.CM-03", "PR.AA-01", "PR.AA-03"),
    "T1556.007": m("DE.CM-03", "PR.AA-01", "PR.AA-03"),
    "T1556.008": m("DE.CM-03", "PR.AA-01", "PR.AA-03"),
    "T1574":     m("DE.CM-03", "PR.PS-01", "PR.PS-02"),       # Hijack Execution Flow
    "T1653":     m("DE.CM-03", "PR.PS-01", "PR.AA-05"),       # Power Settings

    # ── PRIVILEGE ESCALATION ──────────────────────────────────────────────────
    "T1055":     m("DE.CM-03", "PR.PS-01", "DE.AE-02"),       # Process Injection
    "T1055.001": m("DE.CM-03", "PR.PS-01", "DE.AE-02"),
    "T1055.002": m("DE.CM-03", "PR.PS-01", "DE.AE-02"),
    "T1055.003": m("DE.CM-03", "PR.PS-01", "DE.AE-02"),
    "T1055.004": m("DE.CM-03", "PR.PS-01", "DE.AE-02"),
    "T1055.005": m("DE.CM-03", "PR.PS-01", "DE.AE-02"),
    "T1055.011": m("DE.CM-03", "PR.PS-01", "DE.AE-02"),
    "T1055.012": m("DE.CM-03", "PR.PS-01", "DE.AE-02"),
    "T1055.013": m("DE.CM-03", "PR.PS-01", "DE.AE-02"),
    "T1055.015": m("DE.CM-03", "PR.PS-01", "DE.AE-02"),
    "T1068":     m("DE.CM-03", "PR.PS-02", "PR.AA-05"),       # Exploit for Priv Esc
    "T1134":     m("DE.CM-03", "PR.AA-05", "DE.AE-02"),       # Access Token Manipulation
    "T1134.001": m("DE.CM-03", "PR.AA-05", "DE.AE-02"),
    "T1134.002": m("DE.CM-03", "PR.AA-05", "DE.AE-02"),
    "T1134.003": m("DE.CM-03", "PR.AA-05", "DE.AE-02"),
    "T1134.004": m("DE.CM-03", "PR.AA-05", "DE.AE-02"),
    "T1134.005": m("DE.CM-03", "PR.AA-05", "DE.AE-02"),
    "T1484":     m("DE.CM-03", "PR.AA-05", "PR.PS-01"),       # Domain Policy Modification
    "T1484.001": m("DE.CM-03", "PR.AA-05", "PR.PS-01"),
    "T1484.002": m("DE.CM-03", "PR.AA-05", "PR.PS-01"),
    "T1548":     m("DE.CM-03", "PR.AA-05", "PR.PS-01"),       # Abuse Elevation Control
    "T1548.002": m("DE.CM-03", "PR.AA-05", "PR.PS-01"),
    "T1611":     m("DE.CM-03", "PR.IR-01", "PR.AA-05"),       # Escape to Host

    # ── DEFENSE EVASION ───────────────────────────────────────────────────────
    "T1006":     m("DE.CM-03", "PR.PS-01", "PR.AA-05"),       # Direct Volume Access
    "T1014":     m("DE.CM-03", "PR.PS-01", "PR.PS-04"),       # Rootkit
    "T1027":     m("DE.CM-03", "DE.AE-02", "PR.PS-04"),       # Obfuscated Files
    "T1036":     m("DE.CM-03", "PR.PS-01", "DE.AE-02"),       # Masquerading
    "T1070":     m("DE.CM-03", "PR.PS-04", "RS.AN-06"),       # Indicator Removal
    "T1070.001": m("DE.CM-03", "PR.PS-04", "RS.AN-06"),
    "T1070.003": m("DE.CM-03", "PR.PS-04", "RS.AN-06"),
    "T1070.004": m("DE.CM-03", "PR.PS-04", "RS.AN-06"),
    "T1070.005": m("DE.CM-03", "PR.PS-04", "RS.AN-06"),
    "T1070.006": m("DE.CM-03", "PR.PS-04", "RS.AN-06"),
    "T1070.007": m("DE.CM-03", "PR.PS-04", "RS.AN-06"),
    "T1070.008": m("DE.CM-03", "PR.PS-04", "RS.AN-06"),
    "T1070.009": m("DE.CM-03", "PR.PS-04", "RS.AN-06"),
    "T1070.010": m("DE.CM-03", "PR.PS-04", "RS.AN-06"),
    "T1112":     m("DE.CM-03", "PR.PS-01", "PR.PS-04"),       # Modify Registry
    "T1140":     m("DE.CM-03", "DE.AE-02", "PR.PS-04"),       # Deobfuscate/Decode
    "T1202":     m("DE.CM-03", "PR.PS-01", "DE.AE-02"),       # Indirect Command Execution
    "T1207":     m("DE.CM-03", "PR.AA-05", "DE.AE-02"),       # Rogue Domain Controller
    "T1211":     m("DE.CM-03", "PR.PS-02", "PR.PS-01"),       # Exploitation for Defence Evasion
    "T1216":     m("DE.CM-03", "PR.PS-01", "PR.PS-05"),       # System Script Proxy Execution
    "T1218":     m("DE.CM-03", "PR.PS-01", "PR.PS-05"),       # System Binary Proxy Execution
    "T1220":     m("DE.CM-03", "PR.PS-01", "DE.AE-02"),       # XSL Script Processing
    "T1221":     m("DE.CM-03", "PR.PS-01", "DE.AE-02"),       # Template Injection
    "T1222":     m("DE.CM-03", "PR.AA-05", "PR.PS-01"),       # File/Dir Permissions Mod
    "T1480":     m("DE.CM-03", "DE.AE-02", "PR.PS-01"),       # Execution Guardrails
    "T1497":     m("DE.CM-03", "DE.AE-02", "PR.PS-04"),       # Virtualisation/Sandbox Evasion
    "T1550":     m("DE.CM-03", "PR.AA-03", "PR.AA-04"),       # Use Alternate Auth Material
    "T1553":     m("DE.CM-03", "PR.PS-01", "ID.AM-02"),       # Subvert Trust Controls
    "T1562":     m("DE.CM-03", "PR.PS-01", "PR.PS-04"),       # Impair Defenses
    "T1562.001": m("DE.CM-03", "PR.PS-01", "PR.PS-04"),
    "T1564":     m("DE.CM-03", "PR.PS-04", "DE.AE-02"),       # Hide Artifacts
    "T1574.001": m("DE.CM-03", "PR.PS-01", "PR.PS-02"),
    "T1620":     m("DE.CM-03", "DE.AE-02", "PR.PS-01"),       # Reflective Code Loading
    "T1622":     m("DE.CM-03", "DE.AE-02", "PR.PS-04"),       # Debugger Evasion
    "T1656":     m("DE.CM-03", "PR.AT-01", "DE.AE-02"),       # Impersonation
    "T1672":     m("DE.CM-03", "PR.PS-01", "PR.AA-05"),       # Domain Account Sync
    "T1678":     m("DE.CM-03", "PR.PS-01", "PR.AA-05"),       # Mark-of-the-Web Bypass
    "T1679":     m("DE.CM-03", "PR.PS-02", "PR.PS-01"),       # Drive-by Compromise (Evasion)

    # ── CREDENTIAL ACCESS ─────────────────────────────────────────────────────
    "T1003":     m("DE.CM-03", "PR.AA-01", "PR.DS-01"),       # OS Credential Dumping
    "T1003.001": m("DE.CM-03", "PR.AA-01", "PR.DS-10"),       # LSASS Memory
    "T1003.002": m("DE.CM-03", "PR.AA-01", "PR.DS-01"),       # SAM
    "T1003.003": m("DE.CM-03", "PR.AA-01", "PR.DS-01"),       # NTDS
    "T1003.004": m("DE.CM-03", "PR.AA-01", "PR.DS-01"),       # LSA Secrets
    "T1003.005": m("DE.CM-03", "PR.AA-01", "PR.DS-01"),       # Cached Domain Creds
    "T1003.006": m("DE.CM-03", "PR.AA-01", "PR.DS-01"),       # DCSync
    "T1040":     m("DE.CM-01", "DE.CM-03", "PR.DS-02"),       # Network Sniffing
    "T1056":     m("DE.CM-03", "PR.PS-01", "PR.DS-10"),       # Input Capture
    "T1056.001": m("DE.CM-03", "PR.PS-01", "PR.DS-10"),
    "T1056.002": m("DE.CM-03", "PR.PS-01", "PR.DS-10"),
    "T1056.003": m("DE.CM-03", "PR.PS-01", "PR.DS-10"),
    "T1056.004": m("DE.CM-03", "PR.PS-01", "PR.DS-10"),
    "T1110":     m("DE.CM-03", "PR.AA-03", "PR.AA-01"),       # Brute Force
    "T1110.001": m("DE.CM-03", "PR.AA-03", "PR.AA-01"),
    "T1110.002": m("DE.CM-03", "PR.AA-03", "PR.AA-01"),
    "T1110.003": m("DE.CM-03", "PR.AA-03", "PR.AA-01"),
    "T1110.004": m("DE.CM-03", "PR.AA-03", "PR.AA-01"),
    "T1111":     m("DE.CM-03", "PR.AA-03", "PR.DS-10"),       # MFA Interception
    "T1187":     m("DE.CM-03", "PR.AA-03", "PR.IR-01"),       # Forced Authentication
    "T1212":     m("DE.CM-03", "PR.PS-02", "PR.AA-03"),       # Exploitation for Cred Access
    "T1539":     m("DE.CM-03", "PR.AA-03", "PR.DS-01"),       # Steal Web Session Cookie
    "T1552":     m("DE.CM-03", "PR.DS-01", "PR.PS-01"),       # Unsecured Credentials
    "T1552.001": m("DE.CM-03", "PR.DS-01", "PR.PS-01"),
    "T1552.002": m("DE.CM-03", "PR.DS-01", "PR.PS-01"),
    "T1552.003": m("DE.CM-03", "PR.DS-01", "PR.PS-01"),
    "T1552.004": m("DE.CM-03", "PR.DS-01", "PR.PS-01"),
    "T1552.006": m("DE.CM-03", "PR.DS-01", "PR.PS-01"),
    "T1555":     m("DE.CM-03", "PR.DS-01", "PR.AA-01"),       # Creds from Password Stores
    "T1555.003": m("DE.CM-03", "PR.DS-01", "PR.AA-01"),
    "T1555.004": m("DE.CM-03", "PR.DS-01", "PR.AA-01"),
    "T1555.005": m("DE.CM-03", "PR.DS-01", "PR.AA-01"),
    "T1557":     m("DE.CM-01", "DE.CM-03", "PR.DS-02"),       # AitM
    "T1557.001": m("DE.CM-01", "DE.CM-03", "PR.DS-02"),
    "T1557.002": m("DE.CM-01", "DE.CM-03", "PR.DS-02"),
    "T1557.003": m("DE.CM-01", "DE.CM-03", "PR.DS-02"),
    "T1558":     m("DE.CM-03", "PR.AA-03", "PR.AA-04"),       # Steal/Forge Kerberos Tickets
    "T1558.001": m("DE.CM-03", "PR.AA-03", "PR.AA-04"),
    "T1558.002": m("DE.CM-03", "PR.AA-03", "PR.AA-04"),
    "T1558.003": m("DE.CM-03", "PR.AA-03", "PR.AA-04"),
    "T1558.004": m("DE.CM-03", "PR.AA-03", "PR.AA-04"),
    "T1606":     m("DE.CM-03", "PR.AA-03", "PR.AA-04"),       # Forge Web Credentials
    "T1606.001": m("DE.CM-03", "PR.AA-03", "PR.AA-04"),
    "T1606.002": m("DE.CM-03", "PR.AA-03", "PR.AA-04"),
    "T1621":     m("DE.CM-03", "PR.AA-03", "PR.AA-01"),       # MFA Request Generation
    "T1649":     m("DE.CM-03", "PR.AA-04", "PR.AA-03"),       # Steal/Forge Auth Certificates

    # ── DISCOVERY ─────────────────────────────────────────────────────────────
    "T1007":     m("DE.CM-03", "PR.PS-01", "PR.AA-05"),       # System Service Discovery
    "T1010":     m("DE.CM-03", "PR.PS-01", "DE.AE-02"),       # Application Window Discovery
    "T1012":     m("DE.CM-03", "PR.PS-01", "PR.AA-05"),       # Query Registry
    "T1016":     m("DE.CM-03", "PR.IR-01", "DE.AE-02"),       # System Network Config Discovery
    "T1018":     m("DE.CM-03", "DE.CM-01", "PR.IR-01"),       # Remote System Discovery
    "T1033":     m("DE.CM-03", "PR.AA-01", "DE.AE-02"),       # System Owner/User Discovery
    "T1040":     m("DE.CM-01", "DE.CM-03", "PR.DS-02"),       # Network Sniffing
    "T1046":     m("DE.CM-01", "DE.CM-03", "PR.IR-01"),       # Network Service Discovery
    "T1049":     m("DE.CM-03", "DE.CM-01", "PR.IR-01"),       # System Network Connections Discovery
    "T1057":     m("DE.CM-03", "DE.AE-02", "PR.PS-01"),       # Process Discovery
    "T1069":     m("DE.CM-03", "PR.AA-01", "PR.AA-05"),       # Permission Groups Discovery
    "T1069.001": m("DE.CM-03", "PR.AA-01", "PR.AA-05"),
    "T1069.002": m("DE.CM-03", "PR.AA-01", "PR.AA-05"),
    "T1082":     m("DE.CM-03", "PR.PS-01", "DE.AE-02"),       # System Info Discovery
    "T1083":     m("DE.CM-03", "PR.AA-05", "PR.DS-01"),       # File and Dir Discovery
    "T1087":     m("DE.CM-03", "PR.AA-01", "PR.AA-05"),       # Account Discovery
    "T1087.001": m("DE.CM-03", "PR.AA-01", "PR.AA-05"),
    "T1087.002": m("DE.CM-03", "PR.AA-01", "PR.AA-05"),
    "T1087.003": m("DE.CM-03", "PR.AA-01", "PR.AA-05"),
    "T1120":     m("DE.CM-03", "PR.PS-03", "PR.IR-01"),       # Peripheral Device Discovery
    "T1124":     m("DE.CM-03", "DE.AE-02", "PR.PS-01"),       # System Time Discovery
    "T1135":     m("DE.CM-03", "PR.AA-05", "PR.IR-01"),       # Network Share Discovery
    "T1201":     m("DE.CM-03", "PR.AA-01", "PR.PS-01"),       # Password Policy Discovery
    "T1217":     m("DE.CM-03", "PR.DS-01", "DE.AE-02"),       # Browser Information Discovery
    "T1482":     m("DE.CM-03", "DE.CM-01", "PR.AA-05"),       # Domain Trust Discovery
    "T1497":     m("DE.CM-03", "DE.AE-02", "PR.PS-04"),       # Virtualisation/Sandbox Evasion
    "T1518":     m("DE.CM-03", "ID.AM-02", "DE.AE-02"),       # Software Discovery
    "T1518.001": m("DE.CM-03", "ID.AM-02", "PR.PS-01"),
    "T1518.002": m("DE.CM-03", "ID.AM-02", "PR.PS-01"),
    "T1614":     m("DE.CM-03", "DE.AE-02", "PR.PS-01"),       # System Location Discovery
    "T1614.001": m("DE.CM-03", "DE.AE-02", "PR.PS-01"),
    "T1615":     m("DE.CM-03", "PR.PS-01", "PR.AA-05"),       # Group Policy Discovery
    "T1622":     m("DE.CM-03", "DE.AE-02", "PR.PS-04"),       # Debugger Evasion
    "T1652":     m("DE.CM-03", "DE.AE-02", "PR.PS-01"),       # Device Driver Discovery
    "T1654":     m("DE.CM-03", "PR.PS-04", "DE.AE-02"),       # Log Enumeration
    "T1673":     m("DE.CM-03", "DE.AE-02", "PR.PS-01"),       # Virtual Machine Discovery
    "T1680":     m("DE.CM-03", "DE.AE-02", "PR.PS-01"),       # Hypervisor Discovery

    # ── LATERAL MOVEMENT ──────────────────────────────────────────────────────
    "T1021":     m("DE.CM-03", "PR.AA-03", "PR.IR-01"),       # Remote Services
    "T1021.001": m("DE.CM-03", "PR.AA-03", "PR.IR-01"),       # RDP
    "T1021.002": m("DE.CM-03", "PR.AA-05", "PR.IR-01"),       # SMB/Windows Admin Shares
    "T1021.003": m("DE.CM-03", "PR.AA-05", "PR.IR-01"),       # DCOM
    "T1021.005": m("DE.CM-03", "PR.AA-03", "PR.IR-01"),       # VNC
    "T1021.006": m("DE.CM-03", "PR.AA-03", "PR.IR-01"),       # WinRM
    "T1072":     m("DE.CM-03", "PR.AA-01", "PR.PS-01"),       # Software Deployment Tools
    "T1080":     m("DE.CM-03", "PR.DS-01", "PR.AA-05"),       # Taint Shared Content
    "T1091":     m("DE.CM-03", "PR.PS-03", "PR.IR-01"),       # Replication via Removable Media
    "T1210":     m("DE.CM-03", "PR.PS-02", "PR.IR-01"),       # Exploitation of Remote Services
    "T1534":     m("DE.CM-03", "PR.AT-01", "DE.AE-02"),       # Internal Spearphishing
    "T1550":     m("DE.CM-03", "PR.AA-03", "PR.AA-04"),       # Use Alternate Auth Material
    "T1550.002": m("DE.CM-03", "PR.AA-03", "PR.AA-04"),       # Pass the Hash
    "T1550.003": m("DE.CM-03", "PR.AA-03", "PR.AA-04"),       # Pass the Ticket
    "T1563":     m("DE.CM-03", "PR.AA-03", "PR.IR-01"),       # Remote Service Session Hijacking
    "T1563.002": m("DE.CM-03", "PR.AA-03", "PR.IR-01"),
    "T1570":     m("DE.CM-03", "PR.DS-01", "PR.AA-05"),       # Lateral Tool Transfer

    # ── COLLECTION ────────────────────────────────────────────────────────────
    "T1005":     m("DE.CM-03", "PR.DS-01", "PR.AA-05"),       # Data from Local System
    "T1025":     m("DE.CM-03", "PR.PS-03", "PR.DS-01"),       # Data from Removable Media
    "T1039":     m("DE.CM-03", "PR.AA-05", "PR.DS-01"),       # Data from Network Shared Drive
    "T1056":     m("DE.CM-03", "PR.PS-01", "PR.DS-10"),       # Input Capture
    "T1074":     m("DE.CM-03", "PR.DS-01", "DE.AE-02"),       # Data Staged
    "T1074.001": m("DE.CM-03", "PR.DS-01", "DE.AE-02"),
    "T1074.002": m("DE.CM-03", "PR.DS-01", "DE.AE-02"),
    "T1113":     m("DE.CM-03", "PR.DS-10", "PR.PS-01"),       # Screen Capture
    "T1114":     m("DE.CM-03", "PR.AA-05", "PR.DS-01"),       # Email Collection
    "T1114.001": m("DE.CM-03", "PR.AA-05", "PR.DS-01"),
    "T1114.002": m("DE.CM-03", "PR.AA-05", "PR.DS-01"),
    "T1114.003": m("DE.CM-03", "PR.AA-05", "PR.DS-01"),
    "T1115":     m("DE.CM-03", "PR.DS-10", "PR.PS-01"),       # Clipboard Data
    "T1119":     m("DE.CM-03", "PR.DS-01", "DE.AE-02"),       # Automated Collection
    "T1123":     m("DE.CM-03", "PR.PS-01", "PR.DS-10"),       # Audio Capture
    "T1125":     m("DE.CM-03", "PR.PS-01", "PR.DS-10"),       # Video Capture
    "T1185":     m("DE.CM-03", "PR.AA-03", "PR.DS-02"),       # Browser Session Hijacking
    "T1213":     m("DE.CM-03", "PR.AA-05", "PR.DS-01"),       # Data from Info Repositories
    "T1213.002": m("DE.CM-03", "PR.AA-05", "PR.DS-01"),
    "T1213.006": m("DE.CM-03", "PR.AA-05", "PR.DS-01"),
    "T1560":     m("DE.CM-03", "PR.DS-01", "DE.AE-02"),       # Archive Collected Data
    "T1560.001": m("DE.CM-03", "PR.DS-01", "DE.AE-02"),
    "T1560.002": m("DE.CM-03", "PR.DS-01", "DE.AE-02"),
    "T1560.003": m("DE.CM-03", "PR.DS-01", "DE.AE-02"),

    # ── COMMAND AND CONTROL ───────────────────────────────────────────────────
    "T1001":     m("DE.CM-01", "DE.AE-03", "PR.IR-01"),       # Data Obfuscation
    "T1001.001": m("DE.CM-01", "DE.AE-03", "PR.IR-01"),
    "T1001.002": m("DE.CM-01", "DE.AE-03", "PR.IR-01"),
    "T1001.003": m("DE.CM-01", "DE.AE-03", "PR.IR-01"),
    "T1008":     m("DE.CM-01", "PR.IR-01", "DE.AE-03"),       # Fallback Channels
    "T1071":     m("DE.CM-01", "DE.AE-03", "PR.IR-01"),       # App Layer Protocol
    "T1090":     m("DE.CM-01", "PR.IR-01", "DE.AE-03"),       # Proxy
    "T1092":     m("DE.CM-03", "PR.PS-03", "PR.IR-01"),       # Comm Through Removable Media
    "T1095":     m("DE.CM-01", "PR.IR-01", "DE.AE-03"),       # Non-App Layer Protocol
    "T1102":     m("DE.CM-01", "PR.IR-01", "DE.AE-03"),       # Web Service
    "T1104":     m("DE.CM-01", "DE.AE-03", "PR.IR-01"),       # Multi-Stage Channels
    "T1105":     m("DE.CM-01", "DE.CM-03", "PR.IR-01"),       # Ingress Tool Transfer
    "T1132":     m("DE.CM-01", "DE.AE-03", "PR.IR-01"),       # Data Encoding
    "T1205":     m("DE.CM-01", "PR.IR-01", "DE.AE-03"),       # Traffic Signalling
    "T1219":     m("DE.CM-01", "DE.CM-03", "PR.AA-05"),       # Remote Access Software
    "T1568":     m("DE.CM-01", "DE.AE-03", "PR.IR-01"),       # Dynamic Resolution
    "T1571":     m("DE.CM-01", "PR.IR-01", "DE.AE-03"),       # Non-Standard Port
    "T1572":     m("DE.CM-01", "PR.IR-01", "DE.AE-03"),       # Protocol Tunnelling
    "T1573":     m("DE.CM-01", "DE.AE-03", "PR.DS-02"),       # Encrypted Channel
    "T1573.001": m("DE.CM-01", "DE.AE-03", "PR.DS-02"),
    "T1573.002": m("DE.CM-01", "DE.AE-03", "PR.DS-02"),
    "T1659":     m("DE.CM-01", "PR.IR-01", "DE.AE-03"),       # Content Injection
    "T1665":     m("DE.CM-01", "PR.IR-01", "DE.AE-03"),       # Hide Infrastructure

    # ── EXFILTRATION ──────────────────────────────────────────────────────────
    "T1011":     m("DE.CM-01", "DE.CM-03", "PR.IR-01"),       # Exfil Over Other Network
    "T1011.001": m("DE.CM-01", "DE.CM-03", "PR.IR-01"),
    "T1020":     m("DE.CM-01", "DE.CM-03", "PR.DS-02"),       # Automated Exfiltration
    "T1029":     m("DE.CM-01", "DE.CM-03", "PR.DS-02"),       # Scheduled Transfer
    "T1030":     m("DE.CM-01", "DE.CM-03", "PR.DS-02"),       # Data Transfer Size Limits
    "T1041":     m("DE.CM-01", "DE.CM-03", "PR.DS-02"),       # Exfil Over C2 Channel
    "T1048":     m("DE.CM-01", "PR.DS-02", "PR.IR-01"),       # Exfil Over Alt Protocol
    "T1048.001": m("DE.CM-01", "PR.DS-02", "PR.IR-01"),
    "T1048.002": m("DE.CM-01", "PR.DS-02", "PR.IR-01"),
    "T1048.003": m("DE.CM-01", "PR.DS-02", "PR.IR-01"),
    "T1052":     m("DE.CM-03", "PR.PS-03", "PR.DS-01"),       # Exfil Over Physical Medium
    "T1052.001": m("DE.CM-03", "PR.PS-03", "PR.DS-01"),
    "T1567":     m("DE.CM-01", "DE.CM-03", "PR.DS-02"),       # Exfil Over Web Service
    "T1567.001": m("DE.CM-01", "DE.CM-03", "PR.DS-02"),
    "T1567.002": m("DE.CM-01", "DE.CM-03", "PR.DS-02"),
    "T1567.003": m("DE.CM-01", "DE.CM-03", "PR.DS-02"),
    "T1567.004": m("DE.CM-01", "DE.CM-03", "PR.DS-02"),

    # ── IMPACT ────────────────────────────────────────────────────────────────
    "T1485":     m("DE.CM-03", "PR.DS-01", "RS.MI-02"),       # Data Destruction
    "T1486":     m("DE.CM-03", "PR.DS-01", "RS.MI-02"),       # Data Encrypted for Impact
    "T1489":     m("DE.CM-03", "PR.IR-01", "RS.MI-02"),       # Service Stop
    "T1490":     m("DE.CM-03", "PR.IR-01", "RS.MI-02"),       # Inhibit System Recovery
    "T1491":     m("DE.CM-03", "PR.DS-01", "RS.MI-02"),       # Defacement
    "T1491.001": m("DE.CM-03", "PR.DS-01", "RS.MI-02"),
    "T1491.002": m("DE.CM-01", "DE.CM-03", "RS.MI-02"),
    "T1495":     m("DE.CM-03", "PR.PS-03", "RS.MI-02"),       # Firmware Corruption
    "T1496":     m("DE.CM-03", "DE.CM-01", "RS.MI-02"),       # Resource Hijacking
    "T1496.001": m("DE.CM-03", "DE.CM-01", "RS.MI-02"),
    "T1496.002": m("DE.CM-03", "DE.CM-01", "RS.MI-02"),
    "T1498":     m("DE.CM-01", "PR.IR-01", "RS.MI-02"),       # Network DoS
    "T1498.001": m("DE.CM-01", "PR.IR-01", "RS.MI-02"),
    "T1498.002": m("DE.CM-01", "PR.IR-01", "RS.MI-02"),
    "T1499":     m("DE.CM-03", "PR.IR-01", "RS.MI-02"),       # Endpoint DoS
    "T1499.001": m("DE.CM-03", "PR.IR-01", "RS.MI-02"),
    "T1499.002": m("DE.CM-03", "PR.IR-01", "RS.MI-02"),
    "T1499.003": m("DE.CM-03", "PR.IR-01", "RS.MI-02"),
    "T1499.004": m("DE.CM-03", "PR.IR-01", "RS.MI-02"),
    "T1529":     m("DE.CM-03", "PR.IR-01", "RS.MI-02"),       # System Shutdown/Reboot
    "T1531":     m("DE.CM-03", "PR.AA-01", "RS.MI-02"),       # Account Access Removal
    "T1561":     m("DE.CM-03", "PR.DS-01", "RS.MI-02"),       # Disk Wipe
    "T1561.001": m("DE.CM-03", "PR.DS-01", "RS.MI-02"),
    "T1561.002": m("DE.CM-03", "PR.DS-01", "RS.MI-02"),
    "T1565":     m("DE.CM-03", "PR.DS-01", "RS.MI-02"),       # Data Manipulation
    "T1565.001": m("DE.CM-03", "PR.DS-01", "RS.MI-02"),
    "T1565.002": m("DE.CM-03", "PR.DS-01", "RS.MI-02"),
    "T1565.003": m("DE.CM-03", "PR.DS-01", "RS.MI-02"),
    "T1657":     m("DE.CM-01", "DE.CM-03", "RS.AN-03"),       # Financial Theft
    "T1667":     m("DE.CM-03", "PR.DS-01", "RS.MI-02"),       # Data Wiping
}


def resolve(tc_id, tactic_name):
    if tc_id in TECHNIQUE_MAPPINGS:
        return TECHNIQUE_MAPPINGS[tc_id]
    # Inherit from parent technique (e.g. T1027.001 → T1027)
    parent = tc_id.split('.')[0]
    if parent in TECHNIQUE_MAPPINGS:
        return TECHNIQUE_MAPPINGS[parent]
    return TACTIC_DEFAULTS.get(tactic_name, m("DE.CM-03"))


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    updated = 0
    skipped = 0

    for tactic in data["tactics"]:
        for tc in tactic["testCases"]:
            if tc.get("nistCsf"):  # already set (Execution cases)
                skipped += 1
                continue
            tc["nistCsf"] = resolve(tc["id"], tactic["name"])
            updated += 1

    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {updated} test cases, skipped {skipped} already-mapped cases.")
    print(f"Written to {DATA_PATH}")


if __name__ == "__main__":
    main()
