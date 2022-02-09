# ShinySyn

`ShinySyn` is a shiny application to help user investigate synteny blocks identified by `mcscan`,
which is a part of `jcvi` (https://github.com/tanghaibao/jcvi) library 
developed by [@tanghaibao](https://github.com/tanghaibao),
and provide a intuitive connection between macrosynteny and microsynteny (genes).

If you use the `mcscan` pipeline in `ShinySyn`, please also remember to cite its orignal paper:

Tang, H., Bowers, J. E., Wang, X., Ming, R., Alam, M., & Paterson, A. H. (2008). Synteny and collinearity in plant genomes. Science, 320(5875), 486-488.

and the paper of `last`:

Kiełbasa, S. M., Wan, R., Sato, K., Horton, P., & Frith, M. C. (2011). Adaptive seeds tame genomic sequence comparison. Genome research, 21(3), 487-493.


## Features

- Interactive visualization for both macro- and microsynteny

- Intuitive connection between macrosynteny and microsynteny

- Integration of [`mcscan`](https://github.com/tanghaibao/jcvi/wiki/MCscan-%28Python-version%29) pipeline

### Main Page View

![](/www/images/ShinySyn_main_view.png)

### Usage Demo

- Select macrosynteny block of interest and investigate gene pairs within

![](/www/images/main_view.gif)

- Select dots (gene pairs) from dot plot and get detail gene list

![](/www/images/dot_plot.gif)

## Installation

### Dependencies

- `jcvi/mcscan` ([https://github.com/tanghaibao/jcvi/wiki/MCscan-%28Python-version%29](https://github.com/tanghaibao/jcvi/wiki/MCscan-%28Python-version%29))

- `LASTAL` ([https://gitlab.com/mcfrith/last](https://gitlab.com/mcfrith/last))

- R packages
  - `{shiny}`
  - `{bslib}`
  - `{shinyjs}`
  - `{shinyWidgets}`
  - `{DT}`
  - `{shinyalert}`
  - `{colourpicker}`
  - `{waiter}`
  - `{tidyverse}`
  - `{vroom}`

We recommand to install the dependencies via [`conda`](https://docs.conda.io/en/latest/) 
or directly use the docker image if [`docker`](https://docs.docker.com/) was installed. 
Please follow their official document for installation:

- miniconda: https://docs.conda.io/en/latest/miniconda.html

- docker: https://docs.docker.com/get-docker/

### Install packages from conda

- create conda env

```
conda create -n shinysyn -c bioconda -c conda-forge jcvi last r-shiny r-bslib r-shinyjs r-dt r-shinywidgets r-shinyalert r-colourpicker r-waiter r-tidyverse r-vroom r-markdown
```

If conda is too slow, use [mamba](https://mamba.readthedocs.io/en/latest/index.html) instead

```
conda install mamba -n base -c conda-forge
mamba create -n shinysyn -c bioconda -c conda-forge jcvi last r-shiny r-bslib r-shinyjs r-dt r-shinywidgets r-shinyalert r-colourpicker r-waiter r-tidyverse r-vroom r-markdown
```

- activate env and run application

```
conda activate shinysyn
## clone app repo
git clone https://github.com/obenno/ShinySyn.git
## cd app directory and run shiny
cd ShinySyn
Rscript -e 'shiny::runApp()'
```

The application will be run locally at `http://127.0.0.1:<random_port>`,
user could open the address with google chrome or other modern browsers.

### Use docker image

We have prepared docker images for `ShinySyn`. With docker installed, user could simplely invoke
the app with:

```
docker run --rm -p 3838:3838 obenno/shinysyn
```

The application will be run locally at `http://0.0.0.0:3838`, user could open
the address with browsers.

Or just pull the pre-built image from [dockerhub](https://hub.docker.com/) with:

```
docker pull obenno/shinysyn
```

