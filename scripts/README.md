# Playbook-NG Updater Utility

Playbook-NG includes a Python 3 utility (`update_datasets.py`) to update the versions of ATT&CK and COUN7ER that it is running.

## Requirements

- Python 3.x
- A local Git client (needed to perform git clone/pull operations)
- Internet connectivity (needed to clone/update the COUN7ER and ATT&CK GitHub repositories)

## Usage

The most basic usage is to simply run: `python3 update_datasets.py`. This will:

1. Clone a local copy of the COUN7ER GitHub repository.
    1. If this copy already exists, it will be updated via `git pull`.
2. Clone a local copy of the ATT&CK STIX GitHub repository.
    1. if this copy already exists, it will be updated via `git pull`.
3. Determine the domains and versions of ATT&CK to load based on the Countermeasures available in COUN7ER. For example, if a new Countermeasure is found that references a technique in the Mobile domain, this utility will make sure that the Mobile ATT&CK JSON file is loaded and updated into Playbook-NG.
4. Load the latest COUN7ER countermeasures from the COUN7ER GitHub dataset.
5. Update the index.json file which lets Playbook-NG know the datasets that are available for loading. 

## Parameters (optional)

There are two optional command-line parameters for `update_datasets.py`:

1. `-b`: this allows the specification of a comma-separated list of Countermeasure IDs to be used as baseline items in Playbook-NG.
    1. Example: `python3 update_datasets.py -b CM0003,CM0007,CM0125`
2. `-r`: this forces an update of the COUN7ER data in Playbook-NG, using the data from the GitHub repository.
    1. Example: `python3 update_datasets.py -r`