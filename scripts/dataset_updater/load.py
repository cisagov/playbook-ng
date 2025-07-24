from glob import glob
from dataset_updater.dataset_types import *
from dataset_updater.util import load_item, load_template


def load_dataset(counter_repo_path) -> Dataset:
    TEMPLATE_JSONS = list(
        glob(str(counter_repo_path / "**/TMPL*.json"), recursive=True))
    ITEM_MARKDOWNS = list(
        glob(str(counter_repo_path / "**/CM*.md"), recursive=True))
    BASELINE_ITEMS = {}

    # Dataset
    dataset = Dataset(
        id="coun7er",
        version="latest",
        name="CISA COUN7ER",
        url=None,
        spec_version="1.0.0",
        item_type="Countermeasure",
        items=[],
        templates=[],
    )

    # Dataset.Items
    for path in ITEM_MARKDOWNS:
        item = load_item(path)
        if item is not None:
            if item.id in BASELINE_ITEMS:
                item.is_baseline = True
            dataset.items.append(item)

    # Dataset.Templates
    for path in TEMPLATE_JSONS:
        template = load_template(path)
        if template is not None:
            dataset.templates.append(template)

    # ID-ascending order
    dataset.items.sort(key=lambda i: i.id)
    dataset.templates.sort(key=lambda t: t.id)

    return dataset
