#! /usr/bin/env Rscript

library(shiny)
library(bslib)
library(shinyWidgets)
library(shinyjs)
library(waiter)
library(tidyverse)

## change upload file size limit to 5GB
options(shiny.maxRequestSize=5000*1024^2)

source(file = "utils.R", local = T, encoding = "UTF-8")

tab1_ui <- tabPanel(
    "Main View",
    div(class="boxLike",
    fluidRow(
        column(12,
               h3("Input")
               )
    ),
    fluidRow(
        column(
            12,
            h5("Switch On to Use the Result From MCScan Pipeline Tab")
        )
    ),
    fluidRow(
        column(
            12,
            materialSwitch(
                inputId = "use_mcscan",
                label = "",
                value = FALSE,
                right = TRUE,
                status = "primary",
                width = NULL
            )
        )
    ),
    fluidRow(
        column(
            12,
            h5("Or use your own uploaded files")
        )
    ),
    fluidRow(
        column(6,
               fileInput("queryBED",
                         "Upload Query GTF file:",
                         multiple = FALSE,
                         width = "100%",
                         accept = c("text/plain",
                                    ".tsv",
                                    ".bed")
                         )
               ),
        column(6,
               fileInput("subjectBED",
                         "Upload Subject GTF file:",
                         multiple = FALSE,
                         width = "100%",
                         accept = c("text/plain",
                                    ".tsv",
                                    ".bed")
                         )
               )
    ),
    fluidRow(style="padding-bottom: 15px;",
        column(
            6,
            div(class="float-left",
            actionButton(
                inputId = "marcoSynteny",
                status = "secondary",
                icon = icon("pagelines"),
                label = "View Macro Synteny"
            ))
            ),
        column(
            6,
            div(class="float-right",
            downloadButton_custom(
                "marcoSynteny_download",
                status = "secondary",
                icon = icon("download"),
                label = "Macro Synteny SVG"
            ))
        )
    )),
    icon = icon("binoculars")
)

tab2_ui <- tabPanel("Micro Synteny", icon = icon("microscope"))

tab3_ui <- tabPanel(
    "MCScan Pipeline",
    fluidRow(
        column(
            12,
            h2(class="title",
               "MCScan Pipeline")
        )
    ),
    div(class="boxLike",
    fluidRow(
        column(
            12,
            h4("Query Species")
        )
    ),
    fluidRow(
        column(
            4,
            textInput("query_species",
                      "Input Query Species",
                      value = "",
                      width = "100%",
                      placeholder = "grape"
                      )
        ),
        column(
            4,
            fileInput("queryGenome",
                      HTML("Upload Query Genome <b>Fasta</b> File:"),
                      multiple = FALSE,
                      width = "100%",
                      accept = c(".fasta",
                                 ".fa",
                                 ".fasta.gz",
                                 ".fa.gz")
                      )
        ),
        column(
            4,
            fileInput("queryGFF",
                      HTML("Upload Query Genome <b>GFF/GTF</b> file:"),
                      multiple = FALSE,
                      width = "100%",
                      accept = c(".gff",
                                 ".gff3",
                                 ".gff.gz",
                                 ".gff3.gz")
                      )
        )
    )),
    div(class="boxLike", style="background-color: #EADBAB;",
    fluidRow(
        column(
            12,
            h4("Subject Species")
        )
    ),
    fluidRow(
        column(
            4,
            textInput("subject_species",
                      "Input Subject Species",
                      value = "",
                      width = "100%",
                      placeholder = "peach"
                      )
        ),
        column(
            4,
            fileInput("subjectGenome",
                      HTML("Upload Subject Genome <b>Fasta</b> File:"),
                      multiple = FALSE,
                      width = "100%",
                      accept = c(".fasta",
                                 ".fa",
                                 ".fasta.gz",
                                 ".fa.gz")
                      )
        ),
        column(
            4,
            fileInput("subjectGFF",
                      HTML("Upload Subject Genome <b>GFF/GTF</b> file:"),
                      multiple = FALSE,
                      width = "100%",
                      accept = c(".gff",
                                 ".gff3",
                                 ".gff.gz",
                                 ".gff3.gz")
                      )
        )
    )),
    div(class="boxMargin",
        fluidRow(
            class = "justify-content-end",
            style="padding-bottom: 15px;",
            column(
                6,
                div(class="float-left",
                    actionButton(
                        inputId="mcscan_go",
                        "Run Pipeline",
                        width = "150px",
                        icon = icon("running"),
                        status = "secondary"
                    )
                    )
                ),
            column(
                6,
                div(class="float-right",
                    downloadButton(
                        outputId="mcscan_download",
                        label = "Download Result",
                        width = "150px",
                        icon = icon("download"),
                        status = "secondary"
                    )
                    )
            )
    )),
    value = "pipeline",
    icon = icon("mouse")
)

tab4_ui <- tabPanel(
    "Settings",
    fluidRow(
        column(
            12,
            h3(class="title",
               "Settings")
        )
    ),
    icon = icon("cog")
)

ui <- tagList(
    tags$head(
        tags$link(rel = "stylesheet", type = "text/css", href = "custom.css")
        ),
    useShinyjs(),
    useWaitress(),
    navbarPage(
        theme = bs_theme(version = 5,bootswatch = "flatly"),
        title = "ShinySyn",
        tab1_ui,
        tab2_ui,
        tab3_ui,
        tab4_ui
    )
)

server <- function(input, output, session){

    observe({
        toggleState(id = "mcscan_go",
                    condition = isTruthy(input$query_species) &&
                        isTruthy(input$queryGenome) &&
                        isTruthy(input$queryGFF) &&
                        isTruthy(input$subject_species) &&
                        isTruthy(input$subjectGenome) &&
                        isTruthy(input$subjectGFF)
                    )
    })

    observe({
        toggleState(id = "mcscan_download",
                    file.exists(paste0(tempdir(), "/", input$query_species, ".bed")) &&
                    file.exists(paste0(tempdir(), "/", input$subject_species, ".bed")) &&
                    file.exists(paste0(tempdir(), "/", input$query_species, ".", input$subject_species, ".anchors")) &&
                    file.exists(paste0(tempdir(), "/", input$query_species, ".", input$subject_species, ".lifted.anchors"))
                    )
    })

    ## Init loading bars for mcscan pipeline
    waitress <- Waitress$new(theme = "overlay-percent")
    observeEvent(input$mcscan_go, {
        ## mcscan pipeline needs user to upload valid files\
        req(input$query_species)
        req(input$subject_species)
        req(input$queryGenome)
        req(input$subjectGenome)
        req(input$queryGFF)
        req(input$subjectGFF)

        waitress$start()
        ## user uploaded files
        ## genome files
        message("Preparing genome files...")
        query_genome <- input$queryGenome$datapath
        subject_genome <- input$subjectGenome$datapath
        if(str_detect(query_genome, ".gz$")){
            query_genome_uncompressed <- tempfile(pattern=paste0(input$query_species, "."), fileext=".fa")
            system(paste0("gunzip -c ", query_genome, " > ", query_genome_uncompressed))
            query_genome <- query_genome_uncompressed
        }
        if(str_detect(subject_genome, ".gz$")){
            subject_genome_uncompressed <- tempfile(pattern=paste0(input$subject_species, "."), fileext=".fa")
            system(paste0("gunzip -c ", subject_genome, " > ", subject_genome_uncompressed))
            subject_genome <- subject_genome_uncompressed
        }

        waitress$set(10)
        ## GFF files
        query_gff <- input$queryGFF$datapath
        subject_gff <- input$subjectGFF$datapath

        waitress$set(20)
        ## pipeline start
        ## prepare bed
        message("Generating bed files...")
        query_bed <- tempfile(pattern=paste0(input$query_species, "."), fileext=".bed")
        subject_bed <- tempfile(pattern=paste0(input$subject_species, "."), fileext=".bed")
        query_bed_cmd <- paste0("python -m jcvi.formats.gff bed --type=mRNA --key=ID --primary_only ", query_gff, " -o ", query_bed)
        subject_bed_cmd <- paste0("python -m jcvi.formats.gff bed --type=mRNA --key=ID --primary_only ", subject_gff, " -o ", subject_bed)
        system(query_bed_cmd)
        system(subject_bed_cmd)

        waitress$set(30)
        ## prepare cds
        message("Generating CDS files...")
        query_cds <- tempfile(pattern=paste0(input$query_species, "."), fileext=".cds")
        subject_cds <- tempfile(pattern=paste0(input$subject_species, "."), fileext=".cds")
        if(str_detect(query_gff, ".gz$")){
            query_cds_cmd <- paste0("zcat ", query_gff, " | gffread -x ", query_cds, " -g ", query_genome)
        }else{
            query_cds_cmd <- paste0("gffread -x ", query_cds, " -g ", query_genome, " ", query_gff)
        }
        if(str_detect(subject_gff, ".gz$")){
            subject_cds_cmd <- paste0("zcat ", subject_gff, " | gffread -x ", subject_cds, " -g ", subject_genome)
        }else{
            subject_cds_cmd <- paste0("gffread -x ", subject_cds, " -g ", subject_genome, " ", subject_gff)
        }
        system(query_cds_cmd)
        system(subject_cds_cmd)

        waitress$set(40)
        ## mcscan
        ## create link file for all input bed and cds files, since mcscan has some input file name limitations
        system(paste0("ln -s -f ", query_bed, " ", tempdir(), "/", input$query_species, ".bed"))
        system(paste0("ln -s -f ", subject_bed, " ", tempdir(), "/", input$subject_species, ".bed"))
        system(paste0("ln -s -f ", query_cds, " ", tempdir(), "/", input$query_species, ".cds"))
        system(paste0("ln -s -f ", subject_cds, " ", tempdir(), "/", input$subject_species, ".cds"))
        mcscan_cmd <- paste0("python -m jcvi.compara.catalog ortholog ", input$query_species, " ", input$subject_species, " --no_strip_names")
        ## Perform compare command
        system(paste0("cd ", tempdir(), ";", mcscan_cmd, " 2>&1"))
        waitress$close()

        message("ttt: ", file.exists(paste0(tempdir(), "/", input$query_species, ".bed")))

    })



    ## Create download result
    output$mcscan_download <- downloadHandler(
        filename = function(){ paste0("mcscan_result.", Sys.Date(), ".tgz") },
        content =function(file){
            system(paste("tar cvzf", file,
                         "--dereference",
                         "-C",
                         tempdir(),
                         paste0(input$query_species, ".bed"),
                         paste0(input$subject_species, ".bed"),
                         paste0(input$query_species, ".", input$subject_species, ".anchors"),
                         paste0(input$query_species, ".", input$subject_species, ".lifted.anchors"),
                         sep=" "))
        }
    )
}

shinyApp(ui, server)
