# set up install.packages to use webR's repository
webr::shim_install()
# enable the canvas backend for plotting
webr::canvas()

sp_brm <- function(...){
  assign(".SP_CODE", brms::make_stancode(...), envir = .GlobalEnv)
  assign("data", brms::make_standata(...), envir = .GlobalEnv)
}
