import json
import subprocess
from pathlib import Path, PurePath
from dataset_updater.dataset_types import *
from datetime import datetime
from dataset_updater.item_parsing import MDFile
from glob import glob
from os import path

# Git commands
CLONE_COMMAND = "git clone {0} {1}"
PULL_COMMAND = "git -C {0} pull"


def update_index(attack_updated: bool, counter_updated: bool, index_path: Path, attack_data_path: Path):
    """Update the index.json file based on changes made"""
    print("Updating index.json.")
    if (attack_updated or counter_updated):
        index_dict = {"datasets": {}}
        index_dict["last_updated"] = datetime.now().isoformat()
        # Get the lists of files
        # Datasets/Counter
        index_dict["datasets"]["coun7er"] = ["latest"]
        # ATT&CK
        index_dict["attack_enterprise"] = [PurePath(x).stem for x in glob(
            str(attack_data_path / "enterprise" / "*.json"))]
        index_dict["attack_mobile"] = [PurePath(x).stem for x in glob(
            str(attack_data_path / "mobile" / "*.json"))]
        index_dict["attack_ics"] = [PurePath(x).stem for x in glob(
            str(attack_data_path / "ics" / "*.json"))]
        # Write the updated file
        with open(index_path, "w", encoding="utf-8") as index_file:
            json.dump(index_dict, index_file, indent=4)
        print(f"  [+] Wrote to {index_path}")
    else:
        print("  [-] No ATT&CK or COUN7ER updates found. Index.json was not changed.")


def load_attack_github(attack_url: str, attack_repo_path: Path) -> str:
    """Fetch the ATT&CK files from GitHub"""
    stdout = ""
    if not path.isdir(attack_repo_path):
        print("\nCloning ATT&CK repo.")
        stdout = subprocess.check_output(CLONE_COMMAND.format(
            attack_url, attack_repo_path), shell=True, encoding="utf-8")
    else:
        print("\nUpdating ATT&CK repo.")
        stdout = subprocess.check_output(PULL_COMMAND.format(
            attack_repo_path), shell=True, encoding="utf-8")
    return stdout


def load_counter_github(counter_url: str, counter_repo_path: Path) -> str:
    """Fetch the COUN7ER files from GitHub"""
    stdout = ""
    # Check to see if the local copies of the COUN7ER repo exist
    if not path.isdir(counter_repo_path):
        print("\nCloning COUN7ER repo.")
        stdout = subprocess.check_output(CLONE_COMMAND.format(
            counter_url, counter_repo_path), shell=True, encoding="utf-8")
    else:
        print("\nUpdating COUN7ER repo.")
        stdout = subprocess.check_output(PULL_COMMAND.format(
            counter_repo_path), shell=True, encoding="utf-8")
    return stdout


def load_index(index_path: Path) -> dict:
    """Get and return the index.json data"""
    index_file = open(index_path, "r", encoding="utf-8")
    index_json = json.load(index_file)
    index_file.close()
    return index_json


def format_timestamp(text: str) -> str:
    return datetime.strptime(text, "%d %B %Y").isoformat(timespec="milliseconds") + "Z"


def load_item(path: Path) -> Item | None:
    try:
        md = MDFile(path)
        created_ts = format_timestamp(md.created)
        modified_ts = format_timestamp(md.modified)
        sc = md.section_content

        item = Item(
            id=md.id,
            name=md.name,
            subtype=md.type,
            url=None,
            content="",
            version=md.version,
            created=created_ts,
            modified=modified_ts,
            contributors=[],
            technologies=[],
            platforms=[],
            revoked=None,
            deprecated=None,
            ids_before_this=[],
            ids_after_this=[],
            is_baseline=False,
            related_ids=[],
            automatable="unspecified",
            references=md.references,
            techniques=[],
        )

        item.content = "\n\n".join([
            "## Details",
            sc.pre,
            "## Intended Outcome",
            sc.intended_outcome,
            "## Introduction",
            sc.introduction,
            "## Preparation",
            sc.preparation,
            "## Risks",
            sc.risks,
            "## Guidance",
            sc.guidance,
            "## References",
            sc.references,
        ])

        item.related_ids = md.assoc_item_ids

        item.techniques = [MappedTech(
            tech_id=tech_id,
            content=None,
            details=None,
        ) for tech_id in md.assoc_tech_ids]

        if len(item.techniques) == 0:
            print(f"\n  - {item.id} No Technique Mappings")

        invisible_hrefs = md.url_hrefs_not_visible()
        if invisible_hrefs:
            print(f"\n  - {item.id} Invisible hrefs:")
            for href in invisible_hrefs:
                print(f"    - {href}")
        # Handle the deprecated/revoked sub-fields (Reason, By ID)
        if md.status == "Revoked":
            revoked = ItemRevoked(reason=md.reason, by_id=md.by_id)
            item.revoked = revoked
        elif md.status == "Deprecated":
            deprecated = ItemDeprecated(reason=md.reason)
            item.deprecated = deprecated
        return item
    except Exception as ex:
        print(f"  - Item Skipped ({path}) Due To ({ex})")
        return None


def load_template(path: Path) -> Template | None:
    try:
        with open(path) as file:
            data = json.load(file)

        link = data["link"]

        template = Template(
            id=data["id"],
            name=data["name"],
            featured=data["featured"],
            iconSrc=data["iconSrc"],
            link=None if (link is None) else TemplateLink(
                link["url"], link["text"]),
            description=data["description"],
            tech_to_items=data["tech_to_items"],
            ignored_items=data["ignored_items"],
        )

        return template
    except Exception as ex:
        print(f"Template Skipped ({path}) Due To ({ex})")
        return None
