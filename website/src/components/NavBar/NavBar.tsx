import { Link } from "react-router-dom";
import css from "./NavBar.module.css";
import { Container, Navbar, Nav } from "react-bootstrap";
import { APP_URL } from "@/code/buildtime-config";

const DOCS_URL = new URL("docs/user_guide/user_guide.html", APP_URL);

function TopBar() {
  return (
    <Navbar className={css.top_bar}>
      <Container>
        <Nav className={css.top_bar_nav}>
          <Navbar.Brand as={Link} to="/" className={css.text_nav_brand}>
            Playbook-NG
          </Navbar.Brand>
          <Navbar.Brand>
            <a
              className={css.icon_nav_brand_link}
              target="_blank"
              rel="noreferrer"
              href="https://www.cisa.gov/"
            >
              <img
                className={css.nav_brand_image}
                src="data/images/logos/cisa-logo-white.svg"
                alt="CISA"
              />
            </a>
          </Navbar.Brand>
        </Nav>
      </Container>
    </Navbar>
  );
}

function BottomBar() {
  return (
    <Navbar className={css.bottom_bar}>
      <Container>
        <Nav>
          <Nav.Link as={Link} to="/about" className={css.nav_item}>
            About
          </Nav.Link>
          <Nav.Link
            href={DOCS_URL.href}
            target="_blank"
            rel="noreferrer"
            className={css.nav_item}
          >
            User Guide
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}

export function NavBar() {
  return (
    <>
      <TopBar />
      <BottomBar />
    </>
  );
}

{
  /* <NavDropdown
title="Build a Playbook"
id="playbook-ng-navbar-nav-dropdown"
className={css.nav_item}
>
  {playbookOpen ? (
    <>
      <NavDropdown.ItemText>
        <span className={css.dropdown_disabled_msg}>
          These menu options are disabled as a Playbook is already
          open.
        </span>
      </NavDropdown.ItemText>
      <NavDropdown.Divider />
    </>
  ) : null}
  <NavDropdown.Item
    as={Button}
    disabled={playbookOpen}
    className={css.dropdown_nav_item}
    onClick={startNewPlaybook}
  >
    start from scratch
  </NavDropdown.Item>
  <NavDropdown.Divider />
  <NavDropdown.Item
    as={Button}
    disabled={playbookOpen}
    className={css.dropdown_nav_item}
    onClick={gotoTemplatesPage}
  >
    create from a template
  </NavDropdown.Item>
  <NavDropdown.Divider />
  <NavDropdown.Item
    as={Button}
    disabled={playbookOpen}
    className={css.dropdown_nav_item}
    onClick={importBtnOnClick}
  >
    import existing
  </NavDropdown.Item>
</NavDropdown> */
}
