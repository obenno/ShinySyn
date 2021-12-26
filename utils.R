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

summarizeChrInfo <- function(inputBed){
    ## summarize input bed tibble to generate
    ## chr start, end and length
    summarizedBed <- inputBed %>%
        group_by(chr) %>%
        summarise(start = min(start),
                  end = max(end)) %>%
        mutate(chrLength = end - start + 1)
    return(summarizedBed)
}
