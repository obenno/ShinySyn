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

##RUN mamba create -n shinysyn -y -c bioconda -c conda-forge jcvi last r-shiny r-bslib r-shinyjs r-dt r-shinywidgets r-shinyalert r-colourpicker r-waiter r-tidyverse r-vroom r-markdown gffread more-itertools
## upgrade jcvi via pip
##RUN pip install -U jcvi

## Setup workdir
WORKDIR /app

## download app source
## bind to specific tag
RUN git clone -b v0.1.4 https://github.com/obenno/ShinySyn.git ./shinysyn
WORKDIR /app/shinysyn
## create conda env with app env file
RUN mamba env create -f shinysyn_env.yml

## Follow Dockstore's guide
## switch back to the ubuntu user so this tool (and the files written) are not owned by root
RUN groupadd -r -g 1000 ubuntu && useradd -m -r -g ubuntu -u 1000 ubuntu
RUN chown -R ubuntu: /app/shinysyn
USER ubuntu

## expose 3838 port
EXPOSE 3838

# Setup bashrc file for the ubuntu user
RUN echo ". /opt/conda/etc/profile.d/conda.sh" >> ~/.bashrc
RUN echo "conda activate shinysyn" >> ~/.bashrc
##SHELL ["/bin/bash", "--login", "-c"]

## setup default cmd
##CMD ["Rscript", "-e", "options(shiny.port = 3838, shiny.host = '0.0.0.0', sass.cache = FALSE); shiny::runApp()"]
RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
