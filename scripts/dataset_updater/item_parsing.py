from pathlib import Path
from typing import List, Union
from collections import OrderedDict
from dataclasses import dataclass
from dataset_updater.dataset_types import *
import string
import re

# DOM-esque facilities for Reference parsing
from markdown import markdown
from bs4 import BeautifulSoup, Tag
from urllib.parse import urlparse

FAIL_ON_MISSING_HEADINGS = True

# Remediation ID
MITI_ID_P = re.compile(r"CM[0-9]{4}(?:\.[0-9]{3})?")
# ATT&CK technique/sub ID
TECH_ID_P = re.compile(r"T[0-9]{4}(?:\.[0-9]{3})?")
# Remediation version
VERSION_P = re.compile(r"\*\*Version(?:\*\*:|:\*\*)\s+(v?[0-9]+\.[0-9]+)\s*\n")
# Created timestamp
CREATED_P = re.compile(
    r"\*\*Created(?:\*\*:|:\*\*)\s+(\d{1,2}\s+\w+\s+\d{4})\s*\n")
# Modified timestamp
MODIFIED_P = re.compile(
    r"\*\*Modified(?:\*\*:|:\*\*)\s+(\d{1,2}\s+\w+\s+\d{4})\s*\n")
# Remediation type
TYPE_P = re.compile(r"\*\*Type(?:\*\*:|:\*\*)\s+([\w|,|\s]+)\s*")
# CM status
STATUS_P = re.compile(r"\*\*Status(?:\*\*:|:\*\*)\s+(.*)")
# Revoked status sub-fields
REASON_P = re.compile(r"\*\*Reason(?:\*\*:|:\*\*)\s+(.*)")
BY_ID_P = re.compile(r"\*\*By ID(?:\*\*:|:\*\*)\s+(.*)")

# Class for extracting text from each markdown section


@dataclass
class SectionContent:
    pre: str = ""
    intended_outcome: str = ""
    introduction: str = ""
    preparation: str = ""
    risks: str = ""
    guidance: str = ""
    associated_techniques: str = ""
    related_countermeasures: str = ""
    references: str = ""


# Section content with the appropriate regexes for each section
HEADING_REGEXES = SectionContent(
    pre=r"# .*",
    intended_outcome=r"## intended\s+outcomes?[^a-z0-9]*",
    introduction=r"## introduction[^a-z0-9]*",
    preparation=r"## preparation[^a-z0-9]*",
    risks=r"## risks[^a-z0-9]*",
    guidance=r"## guidance[^a-z0-9]*",
    associated_techniques=r"## associated\s+techniques[^a-z0-9]*",
    related_countermeasures=r"## related\s+countermeasures[^a-z0-9]*",
    references=r"## references[^a-z0-9]*",
)


def is_which_heading(line: str) -> Union[str, None]:
    for h_name, h_pattern in HEADING_REGEXES.__dict__.items():
        if re.fullmatch(h_pattern, line, flags=re.I):
            return h_name
    return None


class MDFile:
    def __init__(self, path: str | Path) -> None:
        self.path = path
        with open(self.path, "rt") as file:
            text = file.read()

        # fancy unicode -> ASCII
        # \u00e4 ä (can keep)
        for char, repl in [
            ["\u2018", "'"],  # left single quote
            ["\u2019", "'"],  # right single quote
            ["\u201c", '"'],  # left double quote
            ["\u201d", '"'],  # right double quote
            ["\u00ad", "-"],  # soft hyphen
            ["\u2013", "-"],  # en dash (short)
            ["\u2014", "--"],  # em dash (long)
            ["\u2026", "..."],  # elipses ...
            ["\u00a0", " "],  # non-breaking space
        ]:
            text = text.replace(char, repl)

        # remove underline from links (HTML provides it anyways)
        text = re.sub(r"</?u>", "", text)

        # correct ids: RM -> CM
        text = re.sub(r"RM([0-9]{4}(?:\.[0-9]{3})?)", r"CM\1", text)

        self.text: str = text
        self.section_content = self.__get_section_content()

    @property
    def version(self) -> str:
        match = re.search(VERSION_P, self.section_content.pre)
        if match:
            return match.group(1)
        else:
            raise Exception("no version found")

    @property
    def type(self) -> str | None:
        match = re.search(TYPE_P, self.section_content.pre)
        if match:
            return match.group(1).strip()
        else:
            return None

    @property
    def id(self) -> str:
        match = re.search(MITI_ID_P, self.section_content.pre)
        if match:
            return match.group(0)
        else:
            raise Exception("no ID found")

    @property
    def created(self) -> str:
        match = re.search(CREATED_P, self.section_content.pre)
        if match:
            return match.group(1)
        else:
            raise Exception("no created timestamp found")

    @property
    def modified(self) -> str:
        match = re.search(MODIFIED_P, self.section_content.pre)
        if match:
            return match.group(1)
        else:
            raise Exception("no modified timestamp found")

    @property
    def status(self) -> str:
        match = re.search(STATUS_P, self.section_content.pre)
        if match:
            return match.group(1).strip()
        else:
            raise Exception("no status value found")

    # Revoked/deprecated sub-fields
    @property
    def reason(self) -> str:
        match = re.search(REASON_P, self.section_content.pre)
        if match:
            return match.group(1).strip()
        else:
            # Reason is only valid for revoked and deprecated CMs
            return None

    @property
    def by_id(self) -> str:
        match = re.search(BY_ID_P, self.section_content.pre)
        if match:
            return match.group(1).strip()
        else:
            # By ID is only valid for revoked CMs
            return None

    @property
    def references(self) -> List[Reference]:
        """
        Python port of playbook-ng/editor/src/code/item/editable-view.ts : parseReferences()
        """

        html = markdown(self.section_content.references)
        soup = BeautifulSoup(html, 'html.parser')

        refs: List[Reference] = []

        # for all <li>s
        lis: List[Tag] = soup.find_all("li")
        for li in lis:

            # ensure only 1 <a> present, get it
            links = li.find_all("a", href=True)
            if len(links) != 1:
                continue
            link = links[0]

            # read from link then cull from DOM
            href = link['href']
            url = urlparse(href)
            source_name = url.netloc
            link.decompose()

            # get desc without URL text hampering, strip |
            description = re.sub(
                r"[\s|]+$", "", li.get_text(strip=True, separator=" "))

            # add ref
            refs.append(Reference(
                source_name=source_name,
                description=description,
                url=href,
            ))

        return refs

    @property
    def lines(self) -> List[str]:
        return self.text.split("\n")

    @property
    def name(self) -> str:
        gen = (ln for ln in self.lines if ln.strip())
        name = next(gen, None)

        if name is None:
            raise Exception(f"{self.path} is blank")

        return name.lstrip(string.whitespace + "#")

    @property
    def assoc_tech_ids(self) -> List[str]:
        html = markdown(self.section_content.associated_techniques)
        soup = BeautifulSoup(html, 'html.parser')
        text = soup.get_text(strip=True, separator=" ")
        ids = set(re.findall(TECH_ID_P, text))
        return sorted(list(ids))

    @property
    def assoc_item_ids(self) -> List[str]:
        html = markdown(self.section_content.related_countermeasures)
        soup = BeautifulSoup(html, 'html.parser')
        text = soup.get_text(strip=True, separator=" ")
        ids = set(re.findall(MITI_ID_P, text))
        return sorted(list(ids))

    def __get_section_content(self) -> SectionContent:
        lines = self.lines
        ind_to_head = OrderedDict()

        for ind, line in enumerate(lines):
            heading = is_which_heading(line)
            if heading:
                ind_to_head[ind] = heading

        all_heads = set(HEADING_REGEXES.__dict__.keys())
        found_heads = set(ind_to_head.values())

        missing_heads = all_heads - found_heads
        if missing_heads and FAIL_ON_MISSING_HEADINGS:
            raise Exception(f"missing header(s): [{', '.join(missing_heads)}]")

        sc = SectionContent()

        entries = list(ind_to_head.items())

        for entry_ind, (start_ind, header_name) in enumerate(entries):

            # last section
            if entry_ind == len(entries)-1:
                section_lines = lines[start_ind+1:]

            # non-last section, set end as next section
            else:
                end_ind = entries[entry_ind + 1][0]
                section_lines = lines[start_ind+1:end_ind]

            content = "\n".join(section_lines).strip()
            sc.__dict__[header_name] = content

        return sc

    def url_hrefs_not_visible(self) -> List[str]:
        """
        Returns list of strings of anchor href's not visible
        - These wouldn't be accessible when printed
        - These should be added to references
        - Technique IDs are skipped as they're specific
        """
        hrefs: List[str] = []

        html = markdown(self.text)
        soup = BeautifulSoup(html, 'html.parser')
        displayed = soup.get_text(strip=True, separator=" ")

        a_tags: List[Tag] = soup.find_all("a")
        for a_tag in a_tags:
            href: str = a_tag.get("href", "").strip()

            if href in displayed:
                continue

            if href.startswith("https://attack.mitre.org/techniques/"):
                continue

            hrefs.append(href)

        return hrefs
