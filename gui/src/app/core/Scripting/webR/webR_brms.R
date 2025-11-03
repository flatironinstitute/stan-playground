.overwrite_function <- function(pkg, fun, newfun) {
  env <- asNamespace(pkg)
  unlockBinding(fun, env)
  assign(fun, newfun, envir = env)
  lockBinding(fun, env)
}

# brms currently only actually imports rstan to check the version
# so we need to shim that to avoid an error
.overwrite_packageVersion <- function() {
  orig <- utils::packageVersion

  .overwrite_function("utils", "packageVersion", function(pkg, ...) {
    if (pkg == "rstan" || pkg == "StanHeaders") {
      return(as.package_version("2.37.999"))
    }
    else {
      return(orig(pkg, ...))
    }
  })
}

.brm_shimmed <- FALSE

# shim brms::brm to save the generated stan code and data to the global environment
# and force empty=TRUE to avoid trying to compile or fit the model
.shim_brm <- function() {
  if (.brm_shimmed) {
    return()
  }
  .overwrite_packageVersion()

  options(brms.parse_stancode = FALSE, brms.backend = "mock")
  orig_brm <- brms::brm

  .overwrite_function("brms", "brm", function(..., empty=TRUE) {
    if (!empty) {
      warning("Forcing empty=TRUE to avoid compilation in webR")
    }
    fit <- orig_brm(..., empty=TRUE)
    assign(".SP_CODE", brms::stancode(fit), envir = .GlobalEnv)
    assign("data", brms::standata(fit), envir = .GlobalEnv)
    # TODO We could also check for .SP_DATA_IN and create a stanfit object
    # to get a full brmsfit object in the analysis area.
    return(fit)
  })
}

.shim_brm()
.brm_shimmed <- TRUE
