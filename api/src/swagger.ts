export const SWAGGER_JSON = {
  openapi: "3.1.0",
  info: {
    title: "Playbook-NG as an API",
    description:
      "Allows generating Playbooks from Technique IDs.\n\nThis is intentionally kept simple.  \nShould you have issues loading the API - try running the website and check for errors.",
    version: "1.0.0",
  },
  servers: [{ url: "/" }],
  schemes: ["http"],
  paths: {
    "/load-info": {
      get: {
        summary: "Info about what content the API has loaded",
        description:
          "Returns JSON describing:\n\n- What ATT&amp;CK&reg; Enterprise, Mobile, and ICS versions are loaded\n- What Dataset ID and Version is loaded\n- How Items in the Dataset had their Technique mappings adjusted to account for deprecations/revocations/...\n- How Templates had their mappings adjusted (can be ignored as Templates aren't used in the API)",
        responses: {
          "200": {
            description: "OK.",
          },
        },
      },
    },
    "/tech-report": {
      get: {
        summary: "Reports adjustments made to passed Techniques",
        description:
          "When using /playbook/\\{format\\}, the Techniques you pass may be:\n\n- Deprecated\n- Revoked\n- Unknown (Don't exist / Malformed ID / Domain isn't loaded)\n\nThis route reports when it encounters these situations. This is useful for debug alongside a Playbook.",
        parameters: [
          {
            in: "query",
            name: "id",
            schema: {
              type: "array",
              items: {
                type: "string",
              },
            },
            description: "Technique IDs",
          },
        ],
        responses: {
          "200": {
            description: "OK.",
          },
        },
      },
    },
    "/playbook/{format}": {
      get: {
        summary: "Creates a Playbook from Techniques",
        description: "",
        parameters: [
          {
            in: "path",
            name: "format",
            schema: {
              type: "string",
              enum: [
                "markdown",
                "word",
                "excel",
                "app-usable-json",
                "full-content-json",
              ],
            },
            required: true,
            description: "Format / file-type of Playbook to be produced",
          },
          {
            in: "query",
            name: "id",
            schema: {
              type: "array",
              items: {
                type: "string",
              },
            },
            description: "Technique IDs",
          },
        ],
        responses: {
          "200": {
            description:
              "Success.\n\nPlaybook is returned in the specified `format`.",
          },
          "400": {
            description:
              'Bad Request.\n\n**Example:** _Specified format "xyz" doesn\'t exist within ["markdown","word","excel","app-usable-json","full-content-json"]._',
          },
        },
      },
    },
  },
};
