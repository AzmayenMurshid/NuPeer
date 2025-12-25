# NuPeer Service Tools

Standalone Python CLI tools for NuPeer services.

## Tools

- **servsearch.py** - Database user search tool
- **transcript_parser.py** - Transcript PDF parser tool

---

## Database User Search Tool

A standalone Python CLI tool to search user information from the NuPeer database.

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Basic Search Commands

**Search by email:**
```bash
python servsearch.py --email john@example.com
```

**Search by name:**
```bash
python servsearch.py --name "John"
python servsearch.py --name "Smith"
```

**Search by Major**
```bash
python servsearch.py --major "Computer Science"
```

**Search by pledge class:**
```bash
python servsearch.py --pledge-class "Alpha"
```

**Search by graduation year:**
```bash
python servsearch.py --year 2024
```

**Search by user ID:**
```bash
python servsearch.py --id "1a4c07d8-d132-4062-9b74-79593355e7bf"
```

**List all users (limited to 50):**
```bash
python servsearch.py --list-all
```

**List all users with custom limit:**
```bash
python servsearch.py --list-all --limit 100
```

**Show database statistics:**
```bash
python servsearch.py --stats
```

### Custom Database Connection

If your database is not on the default connection, specify it:

```bash
python servsearch.py --db-url "postgresql://user:password@host:port/database" --email test@example.com
```

Default database URL: `postgresql://nupeer:nupeer@localhost:5433/nupeer`

## Features

- ✅ Search by email (partial match, case-insensitive)
- ✅ Search by name (first or last name, partial match)
- ✅ Search by pledge class
- ✅ Search by graduation year
- ✅ Search by user ID (UUID)
- ✅ List all users with pagination
- ✅ Database statistics (total users, by year, by pledge class)
- ✅ Standalone - doesn't require backend app structure
- ✅ Safe - only reads data, never modifies

## Output Format

The tool displays user information in a readable format:

```
ID: 1a4c07d8-d132-4062-9b74-79593355e7bf
Email: john.doe@example.com
Name: John Doe
Pledge Class: Alpha
Graduation Year: 2024
Created: 2024-01-15 10:30:00
Updated: 2024-01-20 14:22:00
```

## Examples

**Find all users with "gmail" in their email:**
```bash
python servsearch.py --email gmail
```

**Find all users named "John":**
```bash
python servsearch.py --name John
```

**Find all users graduating in 2024:**
```bash
python servsearch.py --year 2024
```

**Get overview of database:**
```bash
python servsearch.py --stats
```

## Notes

- All searches are case-insensitive
- Email and name searches use partial matching (LIKE queries)
- The tool is read-only and safe to use
- Default database port is 5433 to avoid conflicts with local PostgreSQL

---

## Transcript Parser Tool

A standalone Python CLI tool to parse transcript PDFs and extract course information.

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

### Usage

**Basic usage (table format):**
```bash
python transcript_parser.py transcript.pdf
```

**JSON output:**
```bash
python transcript_parser.py transcript.pdf --format json
```

**Summary output:**
```bash
python transcript_parser.py transcript.pdf --format summary
```

**Save to file:**
```bash
python transcript_parser.py transcript.pdf --output courses.txt
```

**Using wrapper scripts:**

Windows:
```bash
transcript_parser.bat transcript.pdf
```

Linux/Mac:
```bash
chmod +x transcript_parser.sh
./transcript_parser.sh transcript.pdf
```

### Output Formats

- **table** (default): Human-readable table with course codes, names, grades, credits, semester, and year
- **json**: JSON format for programmatic use
- **summary**: Summary statistics including total courses, credits, GPA, and grade distribution

### Examples

**Parse a transcript and display in table format:**
```bash
python transcript_parser.py my_transcript.pdf
```

**Get JSON output for processing:**
```bash
python transcript_parser.py my_transcript.pdf --format json > courses.json
```

**Get a quick summary:**
```bash
python transcript_parser.py my_transcript.pdf --format summary
```

### Features

- Extracts course codes, names, grades, credit hours, semester, and year
- Handles multiple transcript formats
- Calculates GPA from extracted grades
- Shows grade distribution
- Removes duplicate courses
- Supports various grade formats (letter grades, numeric grades, pass/fail)

### Troubleshooting

**"pdfplumber is not installed" error:**
```bash
pip install pdfplumber
```

**"No courses found" message:**
- The transcript format might not be supported
- Check that the PDF contains readable text (not just images)
- Try a different transcript format if available

**Parsing errors:**
- Some transcript formats may not be fully supported
- The tool uses pattern matching and may miss courses in non-standard formats
- Check the extracted text if needed for debugging

