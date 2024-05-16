# Stan's auto-detection isn't smart enough for em++
CXX_TYPE=clang
PRECOMPILED_HEADERS=true

# use our wasm-friendly TBB, not Stan's vendored version
TBB_INTERFACE_NEW=1
TBB_INC=/app/oneTBB/install/include/
TBB_LIB=/app/oneTBB/install/lib/
LDFLAGS_TBB ?= -Wl,-L,"$(TBB_LIB)"
LDLIBS_TBB ?= -ltbb

# could also uses -fexceptions which is more compatible, but slower
CXXFLAGS+=-fwasm-exceptions

LDFLAGS+=-sMODULARIZE -sEXPORT_NAME=createModule -sEXPORT_ES6 -sENVIRONMENT=web -sINCOMING_MODULE_JS_API=print,printErr
LDFLAGS+=-sEXIT_RUNTIME=1 -sALLOW_MEMORY_GROWTH=1
# Functions we want. Can add more, with a prepended _, from tinystan.h
EXPORTS=_malloc,_free,_tinystan_api_version,_tinystan_create_model,_tinystan_destroy_error,_tinystan_destroy_model,_tinystan_get_error_message,_tinystan_get_error_type,_tinystan_model_num_free_params,_tinystan_model_param_names,_tinystan_sample,_tinystan_pathfinder,_tinystan_separator_char,_tinystan_stan_version
LDFLAGS+=-sEXPORTED_FUNCTIONS=$(EXPORTS) -sEXPORTED_RUNTIME_METHODS=stringToUTF8,getValue,UTF8ToString,lengthBytesUTF8

