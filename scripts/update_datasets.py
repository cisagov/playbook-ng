import json
import argparse
import subprocess
import sys
from pathlib import Path
from dataset_updater.load import load_dataset
from dataset_updater.util import load_attack_github, load_counter_github, load_index, update_index
from dataset_updater.update_attack import update_attack

# GitHub URLs
ATTACK_URL = "https://github.com/mitre-attack/attack-stix-data.git"
COUNTER_URL = "https://github.com/cisagov/coun7er.git"

# Set for tracking mitigated ATT&CK techniques
# Applies to countermeasures and templates
# This tells us which ATT&CK domains to load
mitigated_techniques = set()


def parse_counter_dataset(dataset):
    """Parse the GitHub COUN7ER dataset"""
    # Parse countermeasures
    for cm in dataset.items:
        for tech in cm.techniques:
            mitigated_techniques.add(tech.tech_id)
    # Parse templates
    for tmpl in dataset.templates:
        for tech_id in tmpl.tech_to_items.keys():
            # Exclude the unmapped items
            if "unmapped" not in tech_id:
                mitigated_techniques.add(tech_id)


def main():
    print("**** Playbook-NG Dataset Updater Utility ****")
    # Argparser setup
    parser = argparse.ArgumentParser(prog='update_datasets.py',
                                     description='This utility updates the ATT&CK and COUN7ER data in PlaybookNG (from GitHub) and writes a new index.json file. Requirements: python3, git.')
    parser.add_argument('-b', '--baseline', type=str,
                        help=f"A comma-separated list of CMs to add as baseline items in the generated COUN7ER latest.json.")
    parser.add_argument(
        '-r', '--remake', help=f"Grab and remake the COUN7ER dataset using the latest data from GitHub. NOTE: this will overwrite any existing datasets.", action="store_true")
    args = parser.parse_args()

    # Try a test Git command to make sure it is installed
    try:
        subprocess.check_output('git --version', shell=True)
    except subprocess.CalledProcessError as e:
        print("Git test command failed. Please make sure that git is installed. Exiting.")
        sys.exit(0)

    # File paths; this assumes that the script is run from the Playbook-NG scripts/ directory
    PROCESS_DIR = Path(__file__).parent
    ROOT_DIR = PROCESS_DIR.parent
    DATA_DIR = ROOT_DIR / "shared/data/"

    # GitHub repo file paths
    # Base directory for storing the data from GitHub
    REPO_DIR = "github"
    # ATT&CK/COUN7ER GitHub repo paths (for cloning)
    REPO_PATH = ROOT_DIR / REPO_DIR
    ATTACK_REPO_PATH = REPO_PATH / "attack"
    COUNTER_REPO_PATH = REPO_PATH / "coun7er"
    # Index.json path
    INDEX_PATH = DATA_DIR / "index.json"
    # App data paths
    ATTACK_DATA_PATH = DATA_DIR / "attack"
    COUNTER_DATA_PATH = DATA_DIR / "datasets/coun7er/latest.json"

    print("Cloning/updating ATT&CK and COUN7ER GitHub repositories.")
    # Fetch/update the latest COUN7ER data from the GitHub repo
    counter_stdout = load_counter_github(COUNTER_URL, COUNTER_REPO_PATH)
    # Fetch/update the latest ATT&CK data from the GitHub repo
    attack_stdout = load_attack_github(ATTACK_URL, ATTACK_REPO_PATH)
    # Load the current index.json
    index_json = load_index(INDEX_PATH)
    # Load the fetched dataset
    print("\nLoading the GitHub COUN7ER dataset.")
    dataset = load_dataset(COUNTER_REPO_PATH)
    # Parse the fetched dataset
    parse_counter_dataset(dataset)

    # State variables for tracking updates
    attack_updated = False
    counter_updated = False

    # Update ATT&CK first
    if "Already up to date." not in attack_stdout:
        # Update the ATT&CK files, if necessary
        attack_updated = update_attack(
            index_json, mitigated_techniques, ATTACK_REPO_PATH, ATTACK_DATA_PATH)
    # Update the dataset with any specified baseline items
    if args.baseline:
        baseline_ids = [s.strip() for s in args.baseline.split(",")]
        # Update the is_baseline on any specified CMs
        for cm in dataset.items:
            if cm.id in baseline_ids:
                cm.is_baseline = True
    # Update COUN7ER
    if "Already up to date." not in counter_stdout or args.remake:
        print("\nUpdating COUN7ER latest.json using latest GitHub data.")
        if args.remake:
            print("  [i] Remake specified, remaking dataset from scratch.")
        if args.baseline:
            print("  [i] Including specified baseline CMs.")
        # Dataset -> coun7er/latest.json
        with open(COUNTER_DATA_PATH, "wt") as file:
            json.dump(dataset, file, indent=4, default=lambda o: o.__dict__)
        print(f"  [+] Wrote to {COUNTER_DATA_PATH}")
        counter_updated = True
    else:
        # Update the baseline items even if there's no new data
        if args.baseline:
            print("Updating COUN7ER latest.json with specified baseline CMs.")
            # Dataset -> coun7er/latest.json
            with open(COUNTER_DATA_PATH, "wt") as file:
                json.dump(dataset, file, indent=4,
                          default=lambda o: o.__dict__)
            print(f"  [+] Wrote to {COUNTER_DATA_PATH}")
            counter_updated = True
    # Update index.json
    update_index(attack_updated, counter_updated, INDEX_PATH, ATTACK_DATA_PATH)
    print("**** Updates Complete ****")


if __name__ == "__main__":
    main()
