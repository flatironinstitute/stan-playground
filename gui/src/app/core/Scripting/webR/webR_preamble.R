# set up install.packages to use webR's repository
webr::shim_install()
# enable the canvas backend for plotting
webr::canvas()

# cleanliness -- brms shim modifies persistent environment, clean that up
if (exists(".SP_CODE")) {
  remove(".SP_CODE", "data", envir = .GlobalEnv)
}
