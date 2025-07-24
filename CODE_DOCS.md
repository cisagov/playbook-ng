# Code Documentation (External)

**Last Updated**: 3/25/2025

This provides high-level information on the organization of the codebase.  
In-code doc-strings still exist for low-level details of a given func etc.

## NPM Workspaces / General Organization

There are 6 package.json files.  
1 root, 5 workspaces.  
3 shared, 3 build targets.  
\+ 1 optional Golang build target.

### Workspaces

#### Shared

##### root

- Holds the 5 workspaces
- Holds common tooling dependencies
  - **Formatting**: Prettier
  - **Linting**: ESLint + plugins
  - **Compiling**: TypeScript, Sass
  - **Pre-Commit Hooks**: Husky

##### shared

- Holds shared data
  - **Data**: MITRE ATT&amp;CK&reg; jsons, CISA COUN7ER json (`Dataset`), Index of these jsons
  - **Web assets**: SourceSans3 font, logo images
  - **Config**: default.json, user.json
- Holds shared code
  - **ATT&amp;CK**: Types, loader, util funcs
  - **Dataset**: Types, schemas, loader, util funcs
  - **Playbook(State/File)**: Types, schemas, loader, util funcs, export as file funcs
  - **MD &rarr; DOCX Conversion**: Modified copy of remark-docx
  - **General**: MD rendering, versioning, set, date helpers
  - **App**: Medium(disk, network)-agnostic loading facilities, framework-agnostic reducers for state management
- Holds common dependencies
  - **Playbook Exports**: docx, exceljs, remark/unified + plugins
  - **MD Rendering**: marked, dompurify
  - **Schema Validation**: ajv
  - **UUIDs**: uuid

##### shared-web

- Builds atop **shared**
- Holds shared web code
  - **Utils**: fetch wrapper, DOM-based rendering helpers, network-based loader
  - **Components**: MD renderer, Enhanced button, Scroll to top, Skip to main
  - **Hooks**: Exiting app warning, Non-gov site link warning
  - **Store**: All Redux stores
- Holds common web dependencies
  - **File I/O**: FileSaver, use-file-picker
  - **Build / Dev Server**: vite
  - **Search / Highlight**: minisearch, react-highlight-words
  - **UI Function**: react, react-dom, react-router-dom
  - **UI Icons**: bootstrap-icons, react-icons
  - **UI CSS**: bootstrap
  - **State Management**: Redux Toolkit, react-redux

#### Build Targets

##### website

- Builds atop **shared-web** + **shared**
- No additional dependencies
- **This is The Playbook-NG Web-App**: allows making playbooks
  - Entirely standalone
  - Statically-hostable frontend-only React single-page application

##### editor

- Builds atop **shared-web** + **shared**
- No additional dependencies
- **This is The Countermeasure Editor**: allows making new countermeasures
  - Entirely standalone
  - Statically-hostable frontend-only React single-page application

##### api

- Builds atop **shared**
- Has additional dependencies
  - **Web Framework**: express
  - **In-API Docs**: swagger-ui-express
- **This is Playbook-NG as an API**: allows making playbooks via REST
  - Entirely standalone
  - Database-less Backend-only express API

##### metrics

- A standalone dependency-free Golang program for recording IDs present in exported Playbooks
- Accepts POSTs from the Website
  - Sends the POST bodies to a specified remote syslog server

### Diagram Showing how Workspaces Build atop One Another

```
┌──────┐ ┌─────────┐
│ root │ │ metrics │
└──────┘ └─────────┘
┌────────┐   ┌────────────┐   ┌──────────┐
│ shared ├─┬─► shared-web ├─┬─► website  │
└────────┘ │ └────────────┘ │ └──────────┘
           │                │
           │        ┌─────┐ │ ┌────────┐
           └────────► api │ └─► editor │
                    └─────┘   └────────┘
```

### Accessing Shared Data

`shared/data/` is common data across all build targets.

- Websites symlink this in their `public/` folders
  - And access it via `fetch()`
- API symlinks this in its root folder
  - And accesses it via `readFileSync()`

#### App Loading

More specifically, `loadAppResources()` inside of **shared** takes a `FileGetter` and returns loaded resources (COUN7ER, ATT&amp;CK, config).

The Website and Editor pass a `URLFileGetter` - this loads data using `fetch()` requests and caches resources with localForage.  
The API passes a `PathFileGetter` - this loads data from the local filesystem.

### .husky/pre-commit Explained

Husky helps with pre-commit hooks for formatting / linting.

Lint-staged was used with Husky originally.  
However, it breaks on symlinks - so it was removed.

A basic recreation of lint-staged now lives in the pre-commit file.
