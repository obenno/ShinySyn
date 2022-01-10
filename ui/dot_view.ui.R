dotView_ui <- tabPanel(
    "Dot View",
    fluidRow(
        column(
            6,
            div(id="dotView")
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
