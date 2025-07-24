# Eviction Strategies Tool - Playbook-NG

The next generation of cyber incident response (IR) playbooks, Playbook-NG, is a stateless web-based application used to match incident findings with countermeasures for adversary containment and eviction. The interface ingests MITRE ATT&CK™ TTP IDs or free text describes threat actor activities on compromised assets and provides a corresponding list of recommended response actions. Users then can export the results in numerous formats such as JSON, Microsoft Word and Excel, and markdown. The application does not save information about the users or their inputs; work is cleared when the user browses off or clears the playbook. When users export a JSON file playbook, they can later upload it back into the application to view, modify and update. This allows Playbook-NG to update any countermeasures that have changed since their last visit while allowing defenders the ability to update plans with new findings in minutes. 

Playbook-NG also allows users to start with an incident template that is created and curated by CISA. These templates describe specific collections of TTPs in a campaign or event that may be used as is or customized quickly. Templates can be referenced in CISA publications, replacing the ad hoc remediation text per publication with an agile set of guidance that follows a “write once, share many” model of defensive strategies. 

In addition to providing a plan in a live crisis, Playbook-NG is ideal for generating realistic plans for tabletop scenarios. It is trivial to use Playbook-NG’s text extract functionality to paste in a report with TTP IDs and generate a playbook to use in an exercise discussion. 

A live instance of this tool is hosted by CISA at https://www.cisa.gov/eviction-strategies-tool and you may contact the maintainers of this project by emailing playbook-ng ATAT mail.cisa.dhs.gov

## Overview

### Playbook-NG

Located in /website.  
The web-app - allows building incident response playbooks based off of an existing Template, or from scratch by seleting observed Techniques and Countermeasures of interest.

This project is MIT Licensed.  
This project makes use of MITRE ATT&CK® - [ATT&CK Terms of Use](https://attack.mitre.org/resources/legal-and-branding/terms-of-use/).

#### Development

`npm run dev -w website -- --host`

- binds to all interfaces (remove `-- --host` to just use locally)
- hot-reloads on edit

#### Building

`npm run build -w website`

- builds to website/dist
- is 100% frontend-only and can be statically served

#### Docker

- `website/docker/build_and_run.sh`
- `website/docker/stop_and_remove.sh`

### Countermeasure Editor

Located in /editor.  
Allows editing the fields of a Countermeasure in a structured manner - versus using Markdown, which currently does not cover all possible fields.

#### Development

`npm run dev -w editor -- --host`

- binds to all interfaces (remove `-- --host` to just use locally)
- hot-reloads on edit

#### Building

`npm run build -w editor`

- builds to editor/dist
- is 100% frontend-only and can be statically served

#### Docker

- `editor/docker/build_and_run.sh`
- `editor/docker/stop_and_remove.sh`

### API

Located in /api.  
Playbook-NG as an API - a minimal server that takes in a list of observed Techniques, and returns a playbook of Countermeasures in various formats.

#### Development

`npm run dev -w api`

- binds to all interfaces
- does **not** hot-reload on edit

#### Building

`npm run build -w api`

- builds to api/dist

#### Docker

- `api/docker/build_and_run.sh`
- `api/docker/stop_and_remove.sh`

### Metrics

Located in /metrics.  
An optional information collection add-on to the website. Records IDs present in exported playbooks by accepting POSTs and sending their body content to a specified remote syslog server.

#### Development

`go run metrics/metrics.go`

- binds to all interfaces
- does **not** hot-reload on edit

#### Building

`go build -o metrics/metrics metrics/metrics.go`

- builds to single executable: metrics/metrics

#### Docker

- `metrics/docker/build_and_run.sh`
- `metrics/docker/stop_and_remove.sh`

### Formatting &amp; Linting

- `npm run format`
- `npm run lint`
- These only handle JS/TS/CSS/HTML, no Golang, Bash, etc

## Acknowledgements

CISA would like to sincerely thank members of the following departments and agencies for their valuable participation and feedback during testing of this project:
- Cyber National Mission Forces
- Indian Health Service
- Job Corps, Department of Labor
- Department of Labor
- Millennium Challenge Corporation
- National Institute of Standards and Technology (NIST)
- National Science Foundation (NSF)
- Department of Energy
- Department of State
- US Army Corps of Engineers

### COUN7ER Disclaimer

COUN7ER, including any associated information, playbook, strategies, countermeasures, apparatus, process, product, guidance or any other content, is provided “as is” and for general informational purposes only. Neither CISA nor the United States Government, nor any of their employees, make any warranty, express or implied, or assume any legal liability or responsibility for the accuracy, completeness, suitability, or efficacy of any output or content from COUN7ER. Users hereby acknowledge that using COUN7ER may require expert knowledge and advanced technical capabilities beyond what is typical for members of the public; and that the use or reliance upon the countermeasures, content, or any other information obtained from COUN7ER may cause adverse consequences, including potential device or system failure.

Users assume all risks from the use of COUN7ER, and without limiting the foregoing, users are responsible for any actions they take on systems and devices. In no event shall the United States Government, its employees, or its contractors or subcontractors be liable for any damages including, but not limited to, direct, indirect, special or consequential damages, arising out of, resulting from, or in any way connected with COUN7ER or its use; whether or not based upon warranty, contract, tort, or otherwise; whether or not arising out of negligence; and whether or not injury was sustained from, or arose out of the results of, or reliance upon COUN7ER.

References to any specific entity, commercial product, process, data format or service by trade name, trademark, manufacturer, or otherwise, do not constitute or imply an endorsement, recommendation, or favoring by CISA or the United States Government. All trademarks are the property of their respective owners. Users acknowledge that information within COUN7ER may not constitute the most up-to-date guidance or technical information and COUN7ER is not intended to, and does not constitute advice for compliance, regulatory, or legal purposes. Users should confer with their respective advisors and subject matter experts to obtain advice based on their individual circumstances.




