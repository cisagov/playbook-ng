Config File Format
------------------

See shared/src/app/runtime-config/types.ts for info:
  - .dev  applies in debug mode
  - .prod applies in production builds



Loading Logic
-------------

There exist 2 config files representing the same thing:

  - default.json
    > Included in Git/VCS
    > Gives some defaults for Playbook-NG to work at all

  - user.json
    > .gitignored (must be created by the user)
    > Allows for user customization without accidental addition into VCS

If both exist and are valid - user.json will load instead of default.json.
If neither exist or are valid - an error is thrown on load.
