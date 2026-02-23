# Backend Tests

This directory contains all test and analysis scripts for the NuPeer backend.

## Test Files

### `test_cumulative_gpa.py`
Tests the cumulative GPA calculation logic. Verifies that cumulative GPA is calculated correctly from term GPAs.

**Usage:**
```powershell
python tests/test_cumulative_gpa.py
```

### `test_transcript_parsing.py`
Tests the transcript parsing functionality to ensure courses are extracted correctly from PDF transcripts.

**Usage:**
```powershell
python tests/test_transcript_parsing.py
```

### `test_gpa_extraction.py`
Tests GPA extraction from transcripts, including term GPA and cumulative GPA extraction.

**Usage:**
```powershell
python tests/test_gpa_extraction.py
```

### `test_updated_parser.py`
Tests the updated PDF parser with new regex patterns and course structure handling.

**Usage:**
```powershell
python tests/test_updated_parser.py
```

### `test_config.py`
Tests the backend configuration, environment variables, and settings.

**Usage:**
```powershell
python tests/test_config.py
```

## Analysis Scripts

### `analyze_transcript_structure.py`
Analyzes the structure of transcript PDFs to identify patterns for parsing.

**Usage:**
```powershell
python tests/analyze_transcript_structure.py <path_to_pdf>
```

### `check_tables.py`
Utility script to check database table structure and verify migrations.

**Usage:**
```powershell
python tests/check_tables.py
```

## Running All Tests

To run all tests, you can use:

```powershell
cd backend
python -m pytest tests/  # If using pytest
```

Or run individual test files:

```powershell
cd backend
python tests/test_cumulative_gpa.py
```

## Notes

- All test files are standalone scripts that can be run independently
- Some tests may require database connection or specific environment variables
- Check individual test files for specific requirements

