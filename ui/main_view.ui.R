mainView_ui <- tabPanel(
    "Main View",
    fluidRow(
        column(
            width = 3,
            div(class = "boxLike",
                style="background-color: #FAF9F6;",
                h4(icon("cog"), "Settings"),
                awesomeCheckbox(
                    inputId = "generateDotPlot",
                    label = "Generate Dot Plot",
                    value = TRUE,
                    status = "primary"
                ),
                hr(class = "setting"),
                h5("Macro Synteny"),
                shinyWidgets::radioGroupButtons(
                    inputId = "macroPlotMode",
                    label = "Choose macro synteny layout",
                    choices = c("Circular", "Parallel"),
                    selected = "Parallel",
                    width = "100%",
                    status = "primary"
                ),
                colourInput(
                    inputId = "macroQueryColor",
                    label = "Query Chr Color",
                    value = "#69a3b2"
                ),
                colourInput(
                    inputId = "macroSubjectColor",
                    label = "Subject Chr Color",
                    value = "#B27869"
                ),
                colourInput(
                    inputId = "macroRibbonColor",
                    label = "Macro Ribbon Color",
                    value = "#808080"
                ),
                sliderTextInput(
                    inputId = "macroChrFontSize",
                    label = "Chromosomes Label Size",
                    choices = paste0(seq(0.2, 2, by = 0.1),"rem"),
                    selected = "1rem"
                ),
                hr(class = "setting"),
                h5("Micro Synteny"),
                awesomeCheckbox(
                    inputId = "oneBestSubject",
                    label = HTML("Extract <strong>one best</strong> Subject"),
                    value = TRUE,
                    status = "primary"
                ),
                colourInput(
                    inputId = "forwardGeneColor",
                    label = "Forward Gene's Color ",
                    value = "#af8dc3"
                ),
                colourInput(
                    inputId = "reverseGeneColor",
                    label = "Reverse Gene's Color ",
                    value = "#7fbf7b"
                ),
                colourInput(
                    inputId = "microRibbonColor",
                    label = "Micro Ribbon Color",
                    value = "#10218b"
                )
            )
        ),
        column(
            width = 9,
            div(class="boxLike",
                fluidRow(
                    column(
                        12,
                        h3(icon("file-upload"), "Input")
                    )
                ),
                fluidRow(
                    column(
                        12,
                        h5("Switch On to Use the Result From MCscan Pipeline Tab")
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
                                     accept = c("text/plain", ".lifted.anchors", ".anchors")
                                     ## Added .anchors for OS X support, it only recognizes one suffix
                                     )
                           )
                )
                ),
            div(class="boxLike", style="background-color: #EADBAB;",
                fluidRow(
                    column(
                        12,
                        h4(icon("dna"), "Choose Chromosomes:")
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
                                     inputId = "macroSynteny",
                                     status = "secondary",
                                     icon = icon("pagelines"),
                                     label = "View Macro Synteny"
                                 )
                                 )
                         ),
                         column(
                             6,
                             div(class="float-right",
                                 downloadButton_custom(
                                     "marcoSynteny_download",
                                     status = "secondary",
                                     icon = icon("download"),
                                     label = "Macro Synteny SVG"
                                 )
                                 )
                         )
                         )
                ),
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
                    class = "justify-content-end",
                    div(class = "col-sm-auto",
                        style = "padding-bottom: 7.5px;",
                        shinyjs::hidden(
                                     downloadButton_custom(
                                         "microSynteny_download",
                                         status = "secondary",
                                         icon = icon("download"),
                                         label = "Micro Synteny SVG"
                                     )
                                 )
                        )
                ),
                fluidRow(
                    column(
                        width = 12,
                        tags$div(id = "microSyntenyTable",
                                 class = "table-responsive",
                                 DT::dataTableOutput("microAnchor_out")
                                 )
                    )
                )
                )
        )
    ),
    icon = icon("binoculars")
)
