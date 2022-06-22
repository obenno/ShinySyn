#! /usr/bin/env Rscript

library(shiny)
library(bslib)
library(shinyWidgets)
library(shinyjs)
library(DT)
library(shinyalert)
library(waiter)
library(tidyverse)
library(vroom)
library(colourpicker)
library(fs)

## change upload file size limit to 5GB
options(shiny.maxRequestSize=5000*1024^2)

## load custom settings and functions
source(file = "utils.R", local = T, encoding = "UTF-8")
## load ui pages
source(file = "ui/main_view.ui.R", local = T, encoding = "UTF-8")
source(file = "ui/dot_view.ui.R", local = T, encoding = "UTF-8")
source(file = "ui/pipeline.ui.R", local = T, encoding = "UTF-8")
source(file = "ui/help.ui.R", local = T, encoding = "UTF-8")

jsCode <- '
shinyjs.hideSetting = function() {
  d3.select("#settingPanel")
    .attr("hidden", "");
  d3.select("#mainPanel")
    .attr("class", "col-sm-12");
}
shinyjs.showSetting = function () {
  d3.select("#settingPanel")
    .attr("hidden", null);
  d3.select("#mainPanel")
    .attr("class", "col-sm-9");
}'

ui <- tagList(
    tags$head(
        tags$link(rel = "stylesheet", type = "text/css", href = "custom.css")
        ),
    useShinyjs(),
    extendShinyjs(text = jsCode, functions = c("hideSetting", "showSetting")),
    useShinyalert(),
    useWaiter(),
    useWaitress(),
    navbarPage(
        theme = bs_theme(version = 5,bootswatch = "flatly"),
        title = "ShinySyn",
        mainView_ui,
        dotView_ui,
        pipeline_ui,
        help_ui
    ),
    ##tags$script(src="https://unpkg.com/@popperjs/core@2"),
    ##tags$script(src="https://unpkg.com/tippy.js@6"),
    tags$script(src = "js/popper.v2.11.5.min.js"),
    tags$script(src = "js/tippy-bundle.umd.v6.3.7.min.js"),
    tags$script(src = "js/d3.min.js"),
    tags$script(src = "js/synteny.min.js"),
    tags$script("tippy('[data-tippy-content]');")
)


server <- function(input, output, session){

    ## Added main view section
    source(file = "server/main_view.server.R", local = T, encoding = "UTF-8")

    ## Added mcscan pipeline codes
    source(file = "server/pipeline.server.R", local = T, encoding = "UTF-8")
}

shinyApp(ui, server)
