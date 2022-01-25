help_ui <- tabPanel(
    "Help",
    fluidRow(
        column(
            9,
            includeMarkdown("www/content/help.md")
        ),
        column(3)
    ),
    icon = icon("question")
)
