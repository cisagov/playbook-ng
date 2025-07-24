from dataclasses import dataclass
from typing import Dict, Any, List, Literal


@dataclass
class Reference:
    source_name: str
    description: None | str
    url: None | str


@dataclass
class MappedTech:
    tech_id: str
    content: None | str
    details: None | Dict[str, Any]


@dataclass
class ItemDeprecated:
    reason: str


@dataclass
class ItemRevoked:
    reason: str
    by_id: str


@dataclass
class Item:
    id: str
    name: str
    subtype: None | str
    url: None | str
    content: str
    version: str
    created: str
    modified: str
    contributors: List[str]
    technologies: List[str]
    platforms: List[str]
    revoked: None | ItemRevoked
    deprecated: None | ItemDeprecated
    ids_before_this: List[str]
    ids_after_this: List[str]
    is_baseline: bool
    related_ids: List[str]
    automatable: Literal["unspecified", "none", "partial", "full"]
    references: List[Reference]
    techniques: List[MappedTech]


@dataclass
class TemplateLink:
    url: str
    text: str


@dataclass
class Template:
    id: str
    name: str
    featured: bool
    iconSrc: None | str
    link: None | TemplateLink
    description: str
    tech_to_items: dict
    ignored_items: List[str]


@dataclass
class Dataset:
    id: str
    version: str
    name: str
    url: None | str
    spec_version: Literal["1.0.0"]
    item_type: str
    items: List[Item]
    templates: List[Template]
