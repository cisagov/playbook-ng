import css from "./ExportModal.module.css";
import {
  useAppSelector,
  useAppDispatch,
} from "@playbook-ng/shared-web/src/store/hooks";
import { addAlert } from "@playbook-ng/shared-web/src/store/alertSlice";
import {
  Modal,
  Button,
  CloseButton,
  Row,
  Col,
  Tab,
  Nav,
} from "react-bootstrap";
import { useCallback, useContext, useMemo } from "react";
import { ExportTemplate } from "./ExportTemplate/ExportTemplate";
import {
  BsFiletypeJson,
  BsFiletypeMd,
  BsFiletypeDocx,
  BsFiletypeXlsx,
  BsDownload,
} from "react-icons/bs";
import { DEFAULT_PLAYBOOK_TITLE } from "@playbook-ng/shared/src/playbook/constants";
import { Playbook } from "@playbook-ng/shared/src/playbook/types";
import { exportDocx } from "@playbook-ng/shared/src/playbook/utils/export/docx";
import { exportJson } from "@playbook-ng/shared/src/playbook/utils/export/json";
import { exportMd } from "@playbook-ng/shared/src/playbook/utils/export/md";
import { exportXlsx } from "@playbook-ng/shared/src/playbook/utils/export/xlsx";
import { saveAs } from "file-saver";
import { getUsedTemplateInfo } from "@playbook-ng/shared/src/playbook/utils/template-info";
import { DataLUTsContext } from "@/contexts/DataLUTsContext";
import {
  ttiItemIDs,
  ttiTechIDs,
} from "@playbook-ng/shared/src/playbook/helpers";
import { ModalDialogTrapFocus } from "@playbook-ng/shared-web/src/components/TrapFocus/TrapFocus";
import { ExportNotice } from "./ExportNotice/ExportNotice";
import { useLogExport } from "@/hooks/logging/useLogExport";

export function ExportModal(args: {
  open: boolean;
  handle_close_modal: () => void;
}) {
  const dispatch = useAppDispatch();

  const playbook = useAppSelector((s) => s.playbook);
  const dataset = useAppSelector((s) => s.appdata.dataset);
  const itemType = useMemo(() => dataset.item_type, [dataset.item_type]);

  const exportMarks = useAppSelector((s) => s.config!.export_marks);
  const logExport = useLogExport();

  const numTechs = ttiTechIDs(playbook.tech_to_items).length;
  const numItems = ttiItemIDs(playbook.tech_to_items).length;

  const { techLUT, itemLUT } = useContext(DataLUTsContext);

  const templateInfo = useMemo(
    () => getUsedTemplateInfo({ playbook, dataset }),
    [playbook, dataset]
  );

  const playbookExportAlert = useCallback(
    (playbook: Playbook) => {
      const warnings: string[] = [];

      if (playbook.title.startsWith(DEFAULT_PLAYBOOK_TITLE))
        warnings.push(`Playbook title not changed from the default.`);

      if (numTechs === 0) warnings.push("Playbook contains no Techniques.");

      if (numItems === 0) warnings.push(`Playbook contains no ${itemType}s.`);

      if (warnings.length > 0) {
        dispatch(
          addAlert({
            type: "info",
            message: `Warning: ${warnings.join(" ")} Still exporting though!`,
          })
        );
      } else {
        dispatch(
          addAlert({
            type: "success",
            message: "Playbook exported!",
          })
        );
      }
    },
    [dispatch, itemType, numTechs, numItems]
  );

  const handleExportMd = useCallback(() => {
    logExport("Markdown");
    const f = exportMd(
      playbook,
      techLUT,
      itemLUT,
      itemType,
      exportMarks,
      templateInfo
    );
    saveAs(f.data, f.filename);
    playbookExportAlert(playbook);
  }, [
    itemType,
    playbook,
    playbookExportAlert,
    itemLUT,
    techLUT,
    exportMarks,
    templateInfo,
    logExport,
  ]);

  const handleExportDocx = useCallback(async () => {
    logExport("Word Doc");
    const f = await exportDocx(
      playbook,
      techLUT,
      itemLUT,
      itemType,
      exportMarks,
      templateInfo
    );
    saveAs(f.data, f.filename);
    playbookExportAlert(playbook);
  }, [
    itemType,
    playbook,
    playbookExportAlert,
    itemLUT,
    techLUT,
    exportMarks,
    templateInfo,
    logExport,
  ]);

  const handleExportJson = useCallback(() => {
    logExport("JSON");
    const f = exportJson(playbook);
    saveAs(f.data, f.filename);
    playbookExportAlert(playbook);
  }, [playbook, playbookExportAlert, logExport]);

  const handleExportXlsx = useCallback(async () => {
    logExport("Excel Book");
    const f = await exportXlsx(
      playbook,
      techLUT,
      itemLUT,
      itemType,
      exportMarks,
      templateInfo
    );
    saveAs(f.data, f.filename);
    playbookExportAlert(playbook);
  }, [
    itemType,
    playbook,
    playbookExportAlert,
    itemLUT,
    techLUT,
    exportMarks,
    templateInfo,
    logExport,
  ]);

  return (
    <Modal
      dialogAs={ModalDialogTrapFocus}
      show={args.open}
      size="lg"
      onHide={args.handle_close_modal}
    >
      <Modal.Header className={css.modal_header}>
        <h2>Export Playbook</h2>
        <CloseButton onClick={args.handle_close_modal} variant="white" />
      </Modal.Header>

      <Modal.Body className={css.export_modal_body}>
        <Tab.Container defaultActiveKey="json_export">
          <Row>
            <Col xs={12} lg={4} className={css.tabs_col}>
              <Nav variant="pills" className={css.export_tabs}>
                <h3 className={css.tabs_header}>File format to export:</h3>
                <Nav.Item>
                  <Nav.Link eventKey="json_export">JSON</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="md_export">Markdown</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="docx_export">Word Document</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="xlsx_export">Excel Spreadsheet</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="template_export">
                    Playbook Template
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
            <Col xs={12} lg={8}>
              <Tab.Content>
                <Tab.Pane
                  eventKey="json_export"
                  transition={false}
                  mountOnEnter={true}
                  unmountOnExit={true}
                >
                  <div className={css.export_body}>
                    <p className={css.body_header}>
                      <BsFiletypeJson
                        className={`${css.body_header_icon} bs-svg`}
                        aria-hidden="true"
                      />{" "}
                      Playbook-NG JSON
                    </p>
                    <p className={css.body_text}>
                      This option will export your current Playbook as a{" "}
                      <strong>JSON</strong> that can later be{" "}
                      <strong>imported back into the Playbook-NG tool</strong>{" "}
                      in the future.
                    </p>
                    <ExportNotice />
                    <Button
                      className={css.export_btn}
                      variant="outline-primary"
                      onClick={handleExportJson}
                    >
                      <BsDownload className={`bs-svg`} aria-hidden="true" />{" "}
                      Export JSON
                    </Button>
                  </div>
                </Tab.Pane>
                <Tab.Pane
                  eventKey="md_export"
                  transition={false}
                  mountOnEnter={true}
                  unmountOnExit={true}
                >
                  <div className={css.export_body}>
                    <p className={css.body_header}>
                      <BsFiletypeMd
                        className={`${css.body_header_icon} bs-svg`}
                        aria-hidden="true"
                      />{" "}
                      Markdown File
                    </p>
                    <p className={css.body_text}>
                      This option will export your current Playbook as a
                      human-readable <strong>Markdown (.md)</strong> file that
                      can be edited in any <strong>.md</strong> compatible
                      document editor.
                    </p>
                    <ExportNotice />
                    <Button
                      className={css.export_btn}
                      variant="outline-primary"
                      onClick={handleExportMd}
                    >
                      <BsDownload className={`bs-svg`} aria-hidden="true" />{" "}
                      Export MD
                    </Button>
                  </div>
                </Tab.Pane>
                <Tab.Pane
                  eventKey="docx_export"
                  transition={false}
                  mountOnEnter={true}
                  unmountOnExit={true}
                >
                  <div className={css.export_body}>
                    <p className={css.body_header}>
                      <BsFiletypeDocx
                        className={`${css.body_header_icon} bs-svg`}
                        aria-hidden="true"
                      />{" "}
                      Word Document
                    </p>
                    <p className={css.body_text}>
                      This option will export your current Playbook as a
                      human-readable <strong>Word Document (.docx)</strong> that
                      can be edited in any <strong>.docx</strong> compatible
                      document editor.
                    </p>
                    <ExportNotice />
                    <Button
                      className={css.export_btn}
                      variant="outline-primary"
                      onClick={handleExportDocx}
                    >
                      <BsDownload className={`bs-svg`} aria-hidden="true" />{" "}
                      Export DOCX
                    </Button>
                  </div>
                </Tab.Pane>
                <Tab.Pane
                  eventKey="xlsx_export"
                  transition={false}
                  mountOnEnter={true}
                  unmountOnExit={true}
                >
                  <div className={css.export_body}>
                    <p className={css.body_header}>
                      <BsFiletypeXlsx
                        className={`${css.body_header_icon} bs-svg`}
                        aria-hidden="true"
                      />{" "}
                      Excel Spreadsheet
                    </p>
                    <p className={css.body_text}>
                      This option will export your current Playbook as an{" "}
                      <strong>Excel Spreadsheet (.xlsx)</strong> that can be
                      edited in any <strong>.xlsx</strong> compatible
                      spreadsheet editor.
                    </p>
                    <ExportNotice />
                    <Button
                      className={css.export_btn}
                      variant="outline-primary"
                      onClick={handleExportXlsx}
                    >
                      <BsDownload className={`bs-svg`} aria-hidden="true" />{" "}
                      Export XLSX
                    </Button>
                  </div>
                </Tab.Pane>
                <Tab.Pane
                  eventKey="template_export"
                  transition={false}
                  mountOnEnter={true}
                  unmountOnExit={true}
                >
                  <div className={css.export_body}>
                    <p className={css.body_header}>
                      <BsFiletypeJson
                        className={`${css.body_header_icon} bs-svg`}
                        aria-hidden="true"
                      />{" "}
                      Template JSON
                    </p>
                    <p className={css.body_text}>
                      Allows content managers to create a new template based
                      upon a playbook&apos;s content. The exported{" "}
                      <strong>.json</strong> must be added to the{" "}
                      <code>&quot;templates&quot;</code> field of the dataset.
                    </p>
                    <ExportTemplate />
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Modal.Body>
    </Modal>
  );
}
