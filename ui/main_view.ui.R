tab1_ui <- tabPanel(
    "Main View",
    fluidRow(
        column(
            width = 3,
            div(class = "boxLike",
                style="background-color: #FAF9F6;",
                h4("Settings"),
                colourInput(
                    inputId = "ribbonColor",
                    label = "Ribbon Color",
                    value = "grey"
                )
            )
        ),
        column(
            width = 9,
            div(class="boxLike",
                fluidRow(
                    column(
                        12,
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
                )
                ),
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
