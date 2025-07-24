# ATT&CK Updater
# Updates the ATT&CK JSON (STIX format) files used by Playbook-NG
import json
from functools import partial
from shutil import copyfile
from pathlib import Path

# Partial open func for utf-8
open_utf8 = partial(open, encoding="utf-8")


def get_technique_ids(file_path: Path) -> list:
    """Get the technique IDs for a particular domain."""
    # Read the file as a text blob
    attack_json = ""
    with open_utf8(file_path, "r") as attack_file:
        attack_json = json.load(attack_file)
    # Find all of the unique Technique IDs in the file
    attack_objects = attack_json["objects"]
    technique_ids = [item["external_references"][0]["external_id"]
                     for item in attack_objects
                     if item["type"] == "attack-pattern"]
    return technique_ids


def get_attack_version(file_path: Path) -> str:
    """Get the version of a particular ATT&CK JSON file"""
    attack_json = ""
    with open_utf8(file_path, "r") as attack_file:
        attack_json = json.load(attack_file)
    return attack_json["objects"][0]["x_mitre_version"]


def get_domains_to_load(mitigated_techniques: set, enterprise_file_path: Path, mobile_file_path: Path, ics_file_path: Path) -> dict:
    """Determine which ATT&CK domains should be loaded based on the mitigated techniques and templates techniques."""
    domains_to_load = {"enterprise": False, "mobile": False, "ics": False}
    # Get the technique IDs for each domain
    enterprise_ids = get_technique_ids(enterprise_file_path)
    mobile_ids = get_technique_ids(mobile_file_path)
    ics_ids = get_technique_ids(ics_file_path)
    # Iterate over the ATT&CK IDs extracted from the countermeasures to determine
    # which domain they belong to
    for tech_id in mitigated_techniques:
        if tech_id in enterprise_ids:
            if not domains_to_load["enterprise"]:
                domains_to_load["enterprise"] = True
        elif tech_id in mobile_ids:
            if not domains_to_load["mobile"]:
                domains_to_load["mobile"] = True
        elif tech_id in ics_ids:
            if not domains_to_load["ics"]:
                domains_to_load["ics"] = True
        else:
            print(
                f"  *** WARNING: Unable to determine ATT&CK domain for {tech_id}.")
    return domains_to_load


def update_attack_domain(attack_updated: bool, domain: str, git_version: str, git_file_path: Path, index_json: dict, attack_data_path: Path) -> None:
    """Attempt to update a specific ATT&CK domain JSON file with a new version from GitHub"""
    index_key = "attack_" + domain
    # Compare the version already in the app to the git version we downloaded
    # If we don't have it, add it (it should always be a newer version)
    if git_version not in index_json[index_key]:
        print(f"     [+] Updating ATT&CK {domain} to {git_version}.")
        git_version_filename = git_version + ".json"
        # Copy the new version over to the app
        new_file_path = attack_data_path / domain / git_version_filename
        copyfile(git_file_path, new_file_path)
        # Set the Boolean to state that we updated ATT&CK
        attack_updated = True
    else:
        print(
            f"     [-] ATT&CK {domain} v{git_version} already exists locally, nothing to update.")


def update_attack(index_json: dict, mitigated_techniques: set, attack_repo_path: Path, attack_data_path: Path) -> bool:
    """Update the ATT&CK data. Copy over any new versions that align with the COUN7ER mappings."""
    print("\nUpdating ATT&CK data using latest GitHub data.")
    # ATT&CK File Paths
    ENTERPRISE_FILE_PATH = attack_repo_path / \
        "enterprise-attack/enterprise-attack.json"
    MOBILE_FILE_PATH = attack_repo_path / "mobile-attack/mobile-attack.json"
    ICS_FILE_PATH = attack_repo_path / "ics-attack/ics-attack.json"
    # Boolean indicating whether ATT&CK was updated
    attack_updated = False
    # Get the versions of the domains that were downloaded
    enterprise_version = get_attack_version(ENTERPRISE_FILE_PATH)
    mobile_version = get_attack_version(MOBILE_FILE_PATH)
    ics_version = get_attack_version(ICS_FILE_PATH)
    # Determine which ATT&CK domains we need to load based on the mitigated techniques
    domains_to_load = get_domains_to_load(
        mitigated_techniques, ENTERPRISE_FILE_PATH, MOBILE_FILE_PATH, ICS_FILE_PATH)
    print("Discovered ATT&CK domains: ")
    # Update the ATT&CK domains based on those discovered
    if domains_to_load["enterprise"]:
        print("  [+] Enterprise")
        update_attack_domain(attack_updated, "enterprise", enterprise_version,
                             ENTERPRISE_FILE_PATH, index_json, attack_data_path)
    if domains_to_load["mobile"]:
        print("  [+] Mobile")
        update_attack_domain(attack_updated, "mobile", mobile_version,
                             MOBILE_FILE_PATH, index_json, attack_data_path)
    if domains_to_load["ics"]:
        print("  [+] ICS")
        update_attack_domain(attack_updated, "ics", ics_version,
                             ICS_FILE_PATH, index_json, attack_data_path)
    return attack_updated
