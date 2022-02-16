#! /bin/bash --login

## entrypoint.sh is modified from https://pythonspeed.com/articles/activate-conda-dockerfile/

# The --login ensures the bash configuration is loaded,
# enabling Conda.

# Enable strict mode.
set -euo pipefail
# ... Run whatever commands ...

# Temporarily disable strict mode and activate conda:
set +euo pipefail
conda activate shinysyn

# Re-enable strict mode:
set -euo pipefail

# exec the final command:
exec Rscript -e "options(shiny.port = 3838, shiny.host = '0.0.0.0', sass.cache = FALSE); shiny::runApp()"
