dotView_ui <- tabPanel(
    "Dot View",
    fluidRow(
        column(
            6,
            fluidRow(
                column(
                    12,
                    div(id="dotView")
                )
            ),
            fluidRow(
                class = "justify-content-end",
                div(class = "col-sm-auto",
                    style = "padding-bottom: 7.5px;",
                    shinyjs::hidden(
                                 actionButton(
                                     inputId = "dotView_download",
                                     status = "secondary",
                                     icon = icon("download"),
                                     label = "Dot View PNG"
                                 )
                                 ##downloadButton_custom(
                                 ##    "dotView_download",
                                 ##    status = "secondary",
                                 ##    icon = icon("download"),
                                 ##    label = "Dot View SVG"
                                 ##)
                             )
                    )
            )
        ),
        column(
            6,
            div(id="dotView_geneTable",
                class = "table-responsive",
                ## div(id="dotView_tableHeader",
                ##     h4("Anchor Genes:"),
                ##     p(style="color: gray;",
                ##       "Please selected your region of interest from the dot plot on the left panel, the table below will be updated automatically.")
                ## ),
                ## DTOutput("selected_anchors"))
                uiOutput("dotviewTable"))
        )
    ),
    icon = icon("microscope")
)
