import { useTitle } from "@/hooks/useTitle";
import css from "./About.module.css";
import { Row, Col } from "react-bootstrap";
import { Header } from "@/components/Header/Header";

function IntendedAudience() {
  return (
    <section className={css.section}>
      <h2>Intended Audience</h2>
      <p>
        The intended audience for Playbook-NG is centered around cybersecurity
        professionals, such as defensive cyber operations (DCO) engineers, who
        have some familiarity with the MITRE ATT&amp;CK framework along with
        countermeasures and mitigations.
      </p>
    </section>
  );
}

function MitreAttack() {
  return (
    <section className={css.section}>
      <h2>MITRE ATT&amp;CK&reg;</h2>
      <p>
        <em>
          © 2024 The MITRE Corporation. This work is reproduced and distributed
          with the permission of The MITRE Corporation.
        </em>
        <br />
        <br />
        The MTIRE ATT&amp;CK framework is used in PlaybookNG as a means of
        stating the adversarial techniques (e.g., LSASS Memory dumping) that an
        organization wishes to defend against. These techniques may come from
        cyber threat intelligence (CTI) or other sources such as analyst
        knowledge. For more information on getting started with ATT&amp;CK,
        please refer to the{" "}
        <a
          href="https://attack.mitre.org/resources/"
          target="_blank"
          rel="noreferrer"
        >
          official documentation
        </a>{" "}
        and{" "}
        <a
          href="https://attack.mitre.org/resources/legal-and-branding/terms-of-use/"
          target="_blank"
          rel="noreferrer"
        >
          ATT&amp;CK terms of use
        </a>
        .
      </p>
      <Row>
        <Col xs={12} md={6} lg={4}>
          <a target="_blank" rel="noreferrer" href="https://www.mitre.org/">
            <img
              src="data/images/logos/mitre-logo-black.svg"
              className={css.logo}
              alt="MITRE"
            />
          </a>
        </Col>

        <Col xs={12} md={6} lg={4}>
          <a target="_blank" rel="noreferrer" href="https://attack.mitre.org/">
            <img
              src="data/images/logos/attack-logo-orange.png"
              className={css.logo}
              alt="MITRE ATTACK"
            />
          </a>
        </Col>
      </Row>
    </section>
  );
}

function CisaCoun7er() {
  return (
    <section className={css.section}>
      <h2>CISA COUN7ER</h2>
      <p>
        The CISA COUN7ER project is focused on creating an open-source catalog
        of cybersecurity countermeasures. PlaybookNG leverages the COUN7ER
        dataset as its primary source of countermeasures, and includes
        capabilities to pull and update the latest set of COUN7ER
        countermeasures from their GitHub repository.
      </p>
      <Row>
        <Col xs={12} md={6} lg={4}>
          <a target="_blank" rel="noreferrer" href="https://www.cisa.gov/">
            <img
              src="data/images/logos/cisa-logo-blue.svg"
              className={css.logo}
              alt="CISA"
            />
          </a>
        </Col>
      </Row>
      <section className={css.section}>
        <h3>Contact CISA</h3>
        <p>
          Contact CISA Central at 1-844-Say-CISA or{" "}
          <a href="mailto:SayCISA@cisa.dhs.gov">SayCISA@cisa.dhs.gov</a> for
          questions about the tool.
          <br />
          Visit the{" "}
          <a
            href="https://myservices.cisa.gov/irf"
            target="_blank"
            rel="noreferrer"
          >
            CISA Incident Reporting System
          </a>{" "}
          to securely report cyber incidents to CISA.
        </p>
      </section>
      <section className={css.section}>
        <h3>COUN7ER Disclaimer</h3>
        <p>
          COUN7ER, including any associated information, playbook, strategies,
          countermeasures, apparatus, process, product, guidance or any other
          content, is provided “as is” and for general informational purposes
          only. Neither CISA nor the United States Government, nor any of their
          employees, make any warranty, express or implied, or assume any legal
          liability or responsibility for the accuracy, completeness,
          suitability, or efficacy of any output or content from COUN7ER. Users
          hereby acknowledge that using COUN7ER may require expert knowledge and
          advanced technical capabilities beyond what is typical for members of
          the public; and that the use or reliance upon the countermeasures,
          content, or any other information obtained from COUN7ER may cause
          adverse consequences, including potential device or system failure.
        </p>
        <p>
          Users assume all risks from the use of COUN7ER, and without limiting
          the foregoing, users are responsible for any actions they take on
          systems and devices. In no event shall the United States Government,
          its employees, or its contractors or subcontractors be liable for any
          damages including, but not limited to, direct, indirect, special or
          consequential damages, arising out of, resulting from, or in any way
          connected with COUN7ER or its use; whether or not based upon warranty,
          contract, tort, or otherwise; whether or not arising out of
          negligence; and whether or not injury was sustained from, or arose out
          of the results of, or reliance upon COUN7ER.
        </p>
        <p>
          References to any specific entity, commercial product, process, data
          format or service by trade name, trademark, manufacturer, or
          otherwise, do not constitute or imply an endorsement, recommendation,
          or favoring by CISA or the United States Government. All trademarks
          are the property of their respective owners. Users acknowledge that
          information within COUN7ER may not constitute the most up-to-date
          guidance or technical information and COUN7ER is not intended to, and
          does not constitute advice for compliance, regulatory, or legal
          purposes. Users should confer with their respective advisors and
          subject matter experts to obtain advice based on their individual
          circumstances.
        </p>
      </section>
    </section>
  );
}

/**
 * About Playbook-NG Page
 *
 * - Give details about who this app is for
 * - Mention MITRE ATT&CK
 * - Mention CISA COUN7ER
 * - Link resources
 */
export function About() {
  useTitle("About");

  return (
    <>
      <Header title="About Playbook-NG" />
      <IntendedAudience />
      <MitreAttack />
      <CisaCoun7er />
    </>
  );
}
