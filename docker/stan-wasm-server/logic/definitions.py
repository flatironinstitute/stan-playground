from enum import Enum

# TODO: Change to EnumStr when we upgrade past python 3.10
class CompilationStatus(Enum):
    INITIATED = "initiated"
    RUNNING   = "running"
    COMPLETED = "completed"
    FAILED    = "failed"
