pipeline_ui <- tabPanel(
    "MCscan Pipeline",
    fluidRow(
        column(
            12,
            h2(class="title",
               "MCscan Pipeline")
        )
    ),
    fluidRow(
        column(3,
               div(class = "boxLike",
                   style="background-color: #FAF9F6;",
                   h4(icon("cog"), "Settings"),
                   numericInput(
                       inputId = "cscore",
                       label = "Input cscore cut-off",
                       value = 0.7, ## mcscan default cscore is 0.7
                       min = 0,
                       max = 1,
                       step = 0.1,
                       width = "100%"
                   )
                   )
               ),
        column(9,
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
                                 ".fa.gz",
                                 ".gz") ## Added .gz for OS X support
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
                                 ".gff3.gz",
                                 ".gz") ## Added .gz for OS X support
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
                                 ".fa.gz",
                                 ".gz") ## Added .gz for OS X support
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
                                 ".gff3.gz",
                                 ".gz") ## Added .gz for OS X support
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
        ),
        fluidRow(
            column(
                12,
                h6("Please refer to the documentation of MCscan pipeline for details:"),
                p(a(href="https://github.com/tanghaibao/jcvi/wiki/MCscan-%28Python-version%29",
                    "https://github.com/tanghaibao/jcvi/wiki/MCscan-%28Python-version%29")),
                h6("If you use the MCscan pipeline, please also cite its original paper:"),
                p("Tang, H., Bowers, J. E., Wang, X., Ming, R., Alam, M., & Paterson, A. H. (2008). Synteny and collinearity in plant genomes. Science, 320(5875), 486-488."),
                h6("And the paper of last:"),
                p("Kiełbasa, S. M., Wan, R., Sato, K., Horton, P., & Frith, M. C. (2011). Adaptive seeds tame genomic sequence comparison. Genome research, 21(3), 487-493.")
            )
        )
        )
    )),
    value = "pipeline",
    icon = icon("mouse")
)
