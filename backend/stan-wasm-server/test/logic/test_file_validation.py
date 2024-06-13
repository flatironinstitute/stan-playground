from src.app.logic.file_validation.compilation_files import download_filename_is_valid


def test_invalid_file() -> None:
    assert not download_filename_is_valid("invalid_file.txt")
