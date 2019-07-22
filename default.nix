{ver ? "10"}:
let
  pkgs = import <nixpkgs> {};

  /* start example */
  envPkgs = with pkgs;
    [
      # Custom
      nodejs

      # NixPkgs
      git
      xsel
    ];
    /* end example */

  # Create a project relative config directory for storing all external program information
  configPath = builtins.toPath (builtins.getEnv "PWD") + "/.nixconfig";
  nodejs = pkgs."nodejs-${ver}_x";

in
  if pkgs.lib.inNixShell
  then pkgs.mkShell
    { buildInputs = envPkgs;
      shellHook = ''
        xxh=${pkgs.xxHash}/bin/xxhsum
        tree=${pkgs.tree}/bin/tree
        # using layout node in direnv as it ensures the unload of path when switching directories
        # export PATH="$PWD/node_modules/.bin/:$PATH"
        if [ -f package.json ]; then
          if  [ "$NODE_ENV" != "ci" ]; then
            # Validate hashes
            if [ ! -f .hash-shell ] || [ ! -f .hash-modules ] || [ $(eval $xxh -c .hash-shell | grep -c "FAILED") -gt 0 ] || [ $(eval $tree -D node_modules | eval $xxh | cut -d' ' -f1) != $(cat .hash-modules) ]; then
              # Failed to validate, re-install
              npm install >&2
              npm prune >&2
              npm audit fix >&2
              npm dedupe >&2
              eval $xxh package-lock.json > .hash-shell
              eval $tree -D node_modules | eval $xxh | cut -d' ' -f1 > .hash-modules
            fi
          else
            npm ci
          fi
        fi
      '';
    }
  else envPkgs

