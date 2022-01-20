# ShinySyn

`ShinySyn` is a shiny application to help user investigate synteny blocks identified by `mcscan`,
which is a part of `jcvi` (https://github.com/tanghaibao/jcvi) library 
developed by [@tanghaibao](https://github.com/tanghaibao),
and provide a intuitive connection between macrosynteny and microsynteny (genes).

If you use the `mcscan` pipeline in `ShinySyn`, please also remember to cite its orignal paper:

Tang, H., Bowers, J. E., Wang, X., Ming, R., Alam, M., & Paterson, A. H. (2008). Synteny and collinearity in plant genomes. Science, 320(5875), 486-488.

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

- jcvi/mcscan [https://github.com/tanghaibao/jcvi/wiki/MCscan-%28Python-version%29](https://github.com/tanghaibao/jcvi/wiki/MCscan-%28Python-version%29)

- LASTAL [https://gitlab.com/mcfrith/last](https://gitlab.com/mcfrith/last)

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

### Install packages from bioconda

- create conda env

```
conda create -n shinysyn -c bioconda -c conda-forge jcvi last r-shiny r-bslib r-shinyjs r-dt r-shinywidgets r-shinyalert r-colourpicker r-waiter r-tidyverse r-vroom
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
