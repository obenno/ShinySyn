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
        column(
            6,
            textInput("query_species_main",
                      "Input Query Species",
                      value = "",
                      width = "100%",
                      placeholder = "grape")
        ),
        column(
            6,
            textInput("subject_species_main",
                      "Input Subject Species",
                      value = "",
                      width = "100%",
                      placeholder = "peach")
        )
    ),
    fluidRow(
        column(
            6,
            fileInput("queryBED",
                      "Upload Query Genome Gene BED File:",
                      multiple = FALSE,
                      width = "100%",
                      accept = c("text/plain",
                                 ".tsv",
                                 ".bed")
                      )
        ),
        column(
            6,
            fileInput("subjectBED",
                      "Upload Subject Genome Gene BED File:",
                      multiple = FALSE,
                      width = "100%",
                      accept = c("text/plain",
                                 ".tsv",
                                 ".bed")
                      )
        )
    ),
    fluidRow(
        column(6,
               fileInput("anchorFile",
                         "Upload Anchor File:",
                         multiple = FALSE,
                         width = "100%",
                         accept = c("text/plain", ".anchors")
                         )
               ),
        column(6,
               fileInput("anchorLiftedFile",
                         "Upload Anchor Lifted File:",
                         multiple = FALSE,
                         width = "100%",
                         accept = c("text/plain", ".lifted.anchors")
                         )
               )
    )),
    div(class="boxLike", style="background-color: #EADBAB;",
    fluidRow(
        column(
            12,
            h4("Choose Chromosomes:")
            )
    ),
    fluidRow(
        column(
            6,
            selectInput(
                inputId = "synteny_query_chr",
                label = "Choose Query Chromosomes",
                choices = NULL,
                selected = NULL,
                multiple = TRUE,
                selectize = TRUE,
                width = "100%",
                size = NULL
            )
        ),
        column(
            6,
            selectInput(
                inputId = "synteny_subject_chr",
                label = "Choose Subject Chromosomes",
                choices = NULL,
                selected = NULL,
                multiple = TRUE,
                selectize = TRUE,
                width = "100%",
                size = NULL
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
    div(class="boxMargin",
    fluidRow(
        column(
            width = 12,
            div(id = "macroSyntenyBlock")
        )
    ),
    fluidRow(
        column(
            width = 12,
            div(id = "geneDensityBlock"),
            div(id = "microSyntenyBlock")
        )
    ),
    fluidRow(
        column(
            width = 12,
            tags$div(id = "microSyntenyTable",
                     class = "table-responsive",
                     DT::dataTableOutput("microAnchor_out"))

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
    useShinyalert(),
    useWaitress(),
    navbarPage(
        theme = bs_theme(version = 5,bootswatch = "flatly"),
        title = "ShinySyn",
        tab1_ui,
        tab2_ui,
        tab3_ui,
        tab4_ui
    ),
    tags$script(src="https://unpkg.com/@popperjs/core@2"),
    tags$script(src="https://unpkg.com/tippy.js@6"),
    tags$script(src = "js/d3.min.js"),
    tags$script(src = "js/synteny.js"),
    tags$script("tippy('[data-tippy-content]');")
)

server <- function(input, output, session){

    ## Init synteny data as reactiveValues
    synteny <- reactiveValues()

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

    observe({
        if(input$use_mcscan){
            if(!file.exists(paste0(tempdir(), "/", input$query_species, ".bed")) ||
               !file.exists(paste0(tempdir(), "/", input$subject_species, ".bed")) ||
               !file.exists(paste0(tempdir(), "/", input$query_species, ".", input$subject_species, ".anchors")) ||
               !file.exists(paste0(tempdir(), "/", input$query_species, ".", input$subject_species, ".lifted.anchors"))){
                shinyalert("Oops!", "Please run pipeline first, then switch this on", type = "error")
                updateMaterialSwitch(session, "use_mcscan", value = FALSE)
            }
        }
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

    ## Added main view section

    ## Setup file path
    ## query BED file path
    queryBedFile <- reactive({
        if(input$use_mcscan){
            paste0(tempdir(), "/", input$query_species, ".bed")
        }else{
            input$queryBED$datapath
        }
    })
    ## subject BED file path
    subjectBedFile <- reactive({
        if(input$use_mcscan){
            paste0(tempdir(), "/", input$subject_species, ".bed")
        }else{
            input$subjectBED$datapath
        }
    })
    ## anchor file path
    anchorFile <- reactive({
        if(input$use_mcscan){
            paste0(tempdir(), "/", input$query_species, ".", input$subject_species, ".anchors")
        }else{
            input$anchorFile$datapath
        }
    })
    ## anchor lifted file path
    anchorLiftedFile <- reactive({
        if(input$use_mcscan){
            paste0(tempdir(), "/",input$query_species, ".", input$subject_species, ".lifted.anchors")
        }else{
            input$anchorLiftedFile$datapath
        }
    })

    queryBed <- reactive({
        req(queryBedFile())
        if(file.exists(queryBedFile())){
            vroom(queryBedFile(),
                  col_names = c("chr", "start","end","gene", "score", "strand"))
        }else{
            NULL
        }
    })

    subjectBed <- reactive({
        req(subjectBedFile())
        if(file.exists(subjectBedFile())){
            vroom(subjectBedFile(),
                  col_names = c("chr", "start","end","gene", "score", "strand"))
        }else{
           NULL
        }
    })

    observe({
        if(is.null(queryBed())){
            x <- NULL
        }else{
            x <- queryBed() %>% pull(chr) %>% unique()
        }
        ## Can also set the label and select items
        updateSelectInput(session, "synteny_query_chr",
                          choices = x)
    })

    observe({
        if(is.null(subjectBed())){
            x <- NULL
        }else{
            x <- subjectBed() %>% pull(chr) %>% unique()
        }

        updateSelectInput(session, "synteny_subject_chr",
                           choices = x)
    })

    observeEvent(input$marcoSynteny, {

        if(is.null(queryBed()) || is.null(subjectBed())){
            shinyalert("Oops!", "query or subject BED file doesn't exist, please use MCscan pipeline first or upload your own BED file", type = "error")
        }else if(is.null(anchorFile()) || !file.exists(anchorFile())){
            shinyalert("Oops!", "Anchor file doesn't exist, please use MCscan pipeline first or upload your own anchor file", type = "error")
        }else if(is.null(anchorLiftedFile()) || !file.exists(anchorLiftedFile())){
            shinyalert("Oops!", "Anchor lifted file  doesn't exist, please use MCscan pipeline first or upload your own anchor lifted file", type = "error")
        }else{
            ## generate anchor simple
            anchorFile_new <- tempfile()
            system(paste0("python -m jcvi.compara.synteny screen ", anchorFile(), " ", anchorFile_new, " --minspan=30 --simple --qbed=", queryBedFile(), " --sbed=", subjectBedFile()))
            anchorFile_simple <- paste0(tempdir(), "/", basename(anchorFile_new), ".simple")

            ## generate i1 file
            i1File <- tempfile()
            system(paste0("python -m jcvi.compara.synteny mcscan ", queryBedFile(), " ", anchorLiftedFile(), " --iter=1 -o ", i1File))

            ## Read data
            anchor_simple <- vroom(
                anchorFile_simple,
                col_names = c("q_startGene","q_endGene",
                              "s_startGene","s_endGene",
                              "score","orientation")
            )

            ## Process anchor_simple
            anchor_simple <- anchor_simple %>%
                inner_join(queryBed(),
                           by = c("q_startGene" = "gene"),
                           suffix = c(".anchor", ".bed")) %>%
                select(q_startGene, q_endGene,
                       s_startGene, s_endGene,
                       score.anchor, orientation,
                       chr, start) %>%
                dplyr::rename(score = score.anchor,
                       queryChr = chr,
                       queryStart = start)

            anchor_simple <- anchor_simple %>%
                inner_join(queryBed(),
                           by = c("q_endGene" = "gene"),
                           suffix = c(".anchor", ".bed")) %>%
                select(q_startGene, q_endGene,
                       s_startGene, s_endGene,
                       score.anchor, orientation,
                       queryChr, queryStart, end) %>%
                dplyr::rename(score = score.anchor,
                       queryEnd = end)

            anchor_simple <- anchor_simple %>%
                inner_join(subjectBed(),
                           by = c("s_startGene" = "gene"),
                           suffix = c(".anchor", ".bed")) %>%
                select(q_startGene, q_endGene,
                       s_startGene, s_endGene,
                       score.anchor, orientation,
                       queryChr, queryStart, queryEnd,
                       chr, start) %>%
                dplyr::rename(score = score.anchor,
                       subjectChr = chr,
                       subjectStart = start)

            anchor_simple <- anchor_simple %>%
                inner_join(subjectBed(),
                           by = c("s_endGene" = "gene"),
                           suffix = c(".anchor", ".bed")) %>%
                select(q_startGene, q_endGene,
                       s_startGene, s_endGene,
                       score.anchor, orientation,
                       queryChr, queryStart, queryEnd,
                       subjectChr, subjectStart,
                       end) %>%
                dplyr::rename(score = score.anchor,
                       subjectEnd = end)

            ## Process anchor_full (i1block file)
            anchor_full <- vroom(
                i1File,
                col_names = c("q_Gene","s_Gene")
            )

            anchor_full <- anchor_full %>%
                inner_join(queryBed(),
                           by = c("q_Gene" = "gene"),
                           suffix = c(".anchor", ".bed")) %>%
                select(q_Gene,
                       chr, start, end, strand,
                       s_Gene) %>%
                dplyr::rename(q_GeneChr = chr,
                       q_GeneStart = start,
                       q_GeneEnd = end,
                       q_GeneStrand = strand)

            anchor_full <- anchor_full %>%
                left_join(subjectBed(),
                          by = c("s_Gene" = "gene"),
                          suffix = c(".anchor", ".bed")) %>%
                select(q_Gene,
                       q_GeneChr, q_GeneStart, q_GeneEnd, q_GeneStrand,
                       s_Gene,
                       chr, start, end, strand) %>%
                dplyr::rename(s_GeneChr = chr,
                       s_GeneStart = start,
                       s_GeneEnd = end,
                       s_GeneStrand = strand)

            synteny$queryBed <- queryBed() %>%
                filter(chr %in% input$synteny_query_chr) %>%
                arrange(chr, start)

            synteny$subjectBed <- subjectBed() %>%
                filter(chr %in% input$synteny_subject_chr) %>%
                arrange(chr, start)

            anchor_simple <- anchor_simple %>%
                filter(queryChr %in% input$synteny_query_chr & subjectChr %in% input$synteny_subject_chr)

            ## Filter and order anchor_full
            synteny$anchor_full <- anchor_full %>%
                filter(q_GeneChr %in% input$synteny_query_chr) %>%
                arrange(q_GeneChr, q_GeneStart)

            queryBedSummarized <- summarizeBed(synteny$queryBed)
            subjectBedSummarized <- summarizeBed(synteny$subjectBed)

            session$sendCustomMessage(type = "queryBedData", queryBedSummarized)
            session$sendCustomMessage(type = "subjectBedData", subjectBedSummarized)
            session$sendCustomMessage(type = "ribbonData", anchor_simple)
            session$sendCustomMessage(type = "plotSynteny", "")
            ##macroSynteny_waiter$hide()
        }
    })

    observeEvent(input$selectedRegion_queryStartGene, {

        idx1 <- rownames(synteny$queryBed)[ synteny$queryBed$gene == input$selectedRegion_queryStartGene] %>%
            as.numeric()
        idx2 <- rownames(synteny$queryBed)[ synteny$queryBed$gene == input$selectedRegion_queryEndGene] %>%
            as.numeric()
        synteny$selectedQueryRegion <- synteny$queryBed %>% slice(idx1: idx2)

        idx1 <- rownames(synteny$anchor_full)[ synteny$anchor_full$q_Gene == input$selectedRegion_queryStartGene] %>%
            as.numeric()
        idx2 <- rownames(synteny$anchor_full)[ synteny$anchor_full$q_Gene == input$selectedRegion_queryEndGene] %>%
            as.numeric()
        synteny$selectedAnchors <- synteny$anchor_full %>% slice(idx1: idx2)

        idx1 <- rownames(synteny$subjectBed)[ synteny$subjectBed$gene == input$selectedRegion_subjectStartGene] %>%
            as.numeric()
        idx2 <- rownames(synteny$subjectBed)[ synteny$subjectBed$gene == input$selectedRegion_subjectEndGene] %>%
            as.numeric()
        synteny$selectedSubjectRegion <- synteny$subjectBed %>% slice(idx1: idx2) %>%
            arrange(chr, start)
        ## Put all anchor infor into result table
        ## including genes without subject hits
        output$microAnchor_out <- DT::renderDataTable({
            synteny$selectedAnchors
        }, selection="single", rownames = FALSE, server = FALSE)
        ## Filter anchor infor to discard records with
        ## subject genes not in the selected subject macro-synteny region
        ##synteny$selectedAnchors_filtered <- synteny$selectedAnchors %>%
        ##    filter(s_Gene %in% synteny$selectedSubjectRegion$gene)

        session$sendCustomMessage(type = "selectedQueryRegion", synteny$selectedQueryRegion)
        session$sendCustomMessage(type = "selectedSubjectRegion", synteny$selectedSubjectRegion)
        session$sendCustomMessage(type = "microAnchors", synteny$selectedAnchors)
        session$sendCustomMessage(type = "plotSelecedMicroSynteny", "")

        ##shinyjs::show("microSynteny_download")

    })

    observeEvent(input$microAnchor_out_rows_selected, {
        selectedQueryGene <- synteny$selectedAnchors[input$microAnchor_out_rows_selected,] %>%
            select(q_Gene) %>% pull()
        session$sendCustomMessage(type = "center_microSynteny", selectedQueryGene)
    })
}

shinyApp(ui, server)
