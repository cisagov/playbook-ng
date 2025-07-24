import { TemplateCard } from "@/components/Template/TemplateCard/TemplateCard";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useAppSelector } from "@playbook-ng/shared-web/src/store/hooks";
import { Button, Form, InputGroup, Stack, Tab, Tabs } from "react-bootstrap";
import { BsDownload } from "react-icons/bs";
import saveAs from "file-saver";
import { Template } from "@playbook-ng/shared/src/dataset/types";
import { TemplateModalContent } from "@/components/Template/TemplateModal/TemplateModalContent";
import css from "./ExportTemplate.module.css";
import { ExportNotice } from "../ExportNotice/ExportNotice";
import { useLogExport } from "@/hooks/logging/useLogExport";

export function ExportTemplate() {
  const playbook = useAppSelector((s) => s.playbook);

  const logExport = useLogExport();

  // ID Default: highest template ID + 1
  const templates = useAppSelector((s) => s.appdata.dataset.templates);
  const [id, setId] = useState<string>(() => {
    const maxIdNum = Math.max(
      ...templates.map((t) => parseInt(t.id.replace("TMPL", ""), 10))
    );
    return `TMPL${String(maxIdNum + 1).padStart(4, "0")}`;
  });
  const updateId = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setId(e.target.value),
    []
  );

  const [name, setName] = useState<string>(playbook.title);
  const updateName = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value),
    []
  );

  const [featured, setFeatured] = useState<boolean>(false);
  const updateFeatured = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setFeatured(e.target.checked),
    []
  );

  // Icon src: Debounce to prevent network spam for URL-based icons
  //
  // iconSrcUI --debounce-> iconSrc
  const [iconSrc, setIconSrc] = useState<null | string>(null);
  const [iconSrcUI, setIconSrcUI] = useState<null | string>(null);
  useEffect(() => {
    // not using icon -> immediate disable
    if (iconSrcUI === null) {
      setIconSrc(null);
    }
    // using icon -> delay update
    else {
      const timeoutId = setTimeout(() => {
        setIconSrc(iconSrcUI);
      }, 250);

      return () => clearTimeout(timeoutId);
    }
  }, [iconSrcUI]);
  const checkboxUseIconSrcUI = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setIconSrcUI(e.target.checked ? "" : null),
    []
  );
  const updateIconSrcUI = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setIconSrcUI(e.target.value),
    []
  );

  const [link, setLink] = useState<null | { url: string; text: string }>(null);
  const checkboxUseLink = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setLink(e.target.checked ? { url: "", text: "" } : null),
    []
  );
  const updateLinkUrl = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (link !== null) setLink({ ...link, url: e.target.value });
    },
    [link]
  );
  const updateLinkText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (link !== null) setLink({ ...link, text: e.target.value });
    },
    [link]
  );

  const [description, setDescription] = useState<string>("");
  const updateDescription = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value),
    []
  );

  const { tech_to_items, ignored_items } = playbook;

  const template: Template = useMemo(
    () => ({
      id: id.trim() || "TMPL0000",
      name: name.trim() || "Untitled",
      featured,
      iconSrc,
      link,
      description: description.trim() || "No description.",
      tech_to_items,
      ignored_items,
    }),
    [
      id,
      name,
      featured,
      iconSrc,
      link,
      description,
      tech_to_items,
      ignored_items,
    ]
  );

  const exportTemplateFile = useCallback(() => {
    logExport("Template");
    const blob = new Blob([JSON.stringify(template, null, 4)], {
      type: "text/plain;charset=utf-8",
    });
    saveAs(blob, `${template.id}.json`);
  }, [template, logExport]);

  const domIds = {
    id_label: useId(),
    id_desc: useId(),
    name_label: useId(),
    featured_label: useId(),
    addIcon_label: useId(),
    iconSrc_label: useId(),
    iconSrc_desc: useId(),
    addLink_label: useId(),
    linkText_label: useId(),
    linkUrl_label: useId(),
    link_desc: useId(),
    description_label: useId(),
  };

  return (
    <div>
      <Form>
        {/* ID */}
        <InputGroup className="mt-3">
          <InputGroup.Text id={domIds.id_label}>ID</InputGroup.Text>
          <Form.Control
            aria-labelledby={domIds.id_label}
            aria-describedby={domIds.id_desc}
            value={id}
            onChange={updateId}
            placeholder="TMPLwxyz"
          />
        </InputGroup>
        <Form.Text id={domIds.id_desc}>
          This ID was auto-set to the next available number. Best left unchanged
          when making a new template.
        </Form.Text>

        {/* Name */}
        <InputGroup className="mt-3">
          <InputGroup.Text id={domIds.name_label}>Name</InputGroup.Text>
          <Form.Control
            aria-labelledby={domIds.name_label}
            value={name}
            onChange={updateName}
            placeholder="Ransomware..."
          />
        </InputGroup>

        {/* Featured */}
        <Form.Check
          className="mt-3"
          id={domIds.featured_label}
          label="Featured"
          type="switch"
          checked={featured}
          onChange={updateFeatured}
        />

        {/* Icon */}
        <Form.Check
          className="mt-3"
          id={domIds.addIcon_label}
          label="Add Icon"
          type="switch"
          checked={iconSrcUI !== null}
          onChange={checkboxUseIconSrcUI}
        />

        {iconSrcUI !== null ? (
          <>
            <InputGroup>
              <InputGroup.Text id={domIds.iconSrc_label}>
                Icon src
              </InputGroup.Text>
              <Form.Control
                aria-labelledby={domIds.iconSrc_label}
                aria-describedby={domIds.iconSrc_desc}
                value={iconSrcUI ?? ""}
                onChange={updateIconSrcUI}
                placeholder="URL / Base64 Encoded Image"
              />
            </InputGroup>
            <Form.Text id={domIds.iconSrc_desc}>
              Please verify that your icon appears in the Template Preview
              below.
            </Form.Text>
          </>
        ) : null}

        <Form.Check
          className="mt-3"
          id={domIds.addLink_label}
          label="Add Link"
          type="switch"
          checked={link !== null}
          onChange={checkboxUseLink}
        />

        {/* Link */}
        {link !== null ? (
          <>
            <InputGroup className="mb-2">
              <InputGroup.Text id={domIds.linkText_label}>
                Link Text
              </InputGroup.Text>
              <Form.Control
                aria-labelledby={domIds.linkText_label}
                aria-describedby={domIds.link_desc}
                value={link.text}
                onChange={updateLinkText}
                placeholder="CISA"
              />
            </InputGroup>
            <InputGroup>
              <InputGroup.Text id={domIds.linkUrl_label}>
                Link URL
              </InputGroup.Text>
              <Form.Control
                aria-labelledby={domIds.linkUrl_label}
                aria-describedby={domIds.link_desc}
                value={link.url}
                onChange={updateLinkUrl}
                placeholder="https://www.cisa.gov/"
              />
            </InputGroup>
            <Form.Text id={domIds.link_desc}>
              Please verify that your link appears and functions in the Template
              Preview below.
            </Form.Text>
          </>
        ) : null}

        {/* Description */}
        <InputGroup className="mt-3">
          <InputGroup.Text id={domIds.description_label}>
            Description
          </InputGroup.Text>
          <Form.Control
            as="textarea"
            aria-labelledby={domIds.description_label}
            value={description}
            onChange={updateDescription}
            placeholder="Template purpose / guidance goes here (Markdown)"
          />
        </InputGroup>
      </Form>

      {/* Preview Card / Modal */}
      <Stack direction="vertical">
        <div className="mt-3 mb-3">
          <h3 className="mb-2 d-block fs-5">Template Preview</h3>
          <Tabs defaultActiveKey="card">
            <Tab eventKey="card" title="Card">
              <TemplateCard
                titleLevel={4}
                template={template}
                disableSelectBtn
                disableMoreInfo
              />
            </Tab>

            <Tab eventKey="popup" title="Pop-Up">
              <div className={css.wrap_modal_content}>
                <TemplateModalContent template={template} disableSelectBtn />
              </div>
            </Tab>
          </Tabs>
        </div>
        <ExportNotice />
        <Button
          variant="outline-primary"
          onClick={exportTemplateFile}
          aria-label="export populated template"
          style={{ width: "fit-content" }}
          className={css.export_btn}
        >
          <BsDownload className={`bs-svg`} aria-hidden="true" /> Export Template
        </Button>
      </Stack>
    </div>
  );
}
