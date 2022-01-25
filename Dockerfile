#############################################################
# Dockerfile to build a sample tool container for shinysyn
#############################################################

## From conda docker
FROM continuumio/miniconda3

## Maintainer
MAINTAINER oben <obennoname@gmail.com>

## Setup conda env
USER root
RUN apt update && apt install git
## use mamba instead of conda command
RUN conda install mamba -n base -c conda-forge
RUN mamba create -n shinysyn -y -c bioconda -c conda-forge jcvi last r-shiny r-bslib r-shinyjs r-dt r-shinywidgets r-shinyalert r-colourpicker r-waiter r-tidyverse r-vroom r-markdown

## Setup workdir
WORKDIR /app

## download app source
RUN git clone https://github.com/obenno/ShinySyn.git ./shinysyn
WORKDIR ./shinysyn

## Activate codna env
RUN ln -s /opt/conda/envs/shinysyn/bin/* /usr/local/bin/

## Follow Dockstore's guide
## switch back to the ubuntu user so this tool (and the files written) are not owned by root
RUN groupadd -r -g 1000 ubuntu && useradd -r -g ubuntu -u 1000 ubuntu
RUN chown -R ubuntu: /app/shinysyn
USER ubuntu

## expose 3838 port
EXPOSE 3838

## setup default cmd
CMD ["Rscript", "-e", "options(shiny.port = 3838, shiny.host = '0.0.0.0', sass.cache = FALSE); shiny::runApp()"]
