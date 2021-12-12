downloadButton_custom <- function (outputId, label = "Download", class = NULL, status = "primary",
                                   ...,
                                   icon = shiny::icon("download"))
{
    aTag <- tags$a(id = outputId,
                   class = paste(paste0("btn btn-", status, " shiny-download-link"),
                                 class),
                   href = "", target = "_blank", download = NA,
                   icon, label, ...)
}

