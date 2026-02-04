# Transcript Storage in PostgreSQL

## Overview
Transcripts are now stored directly in PostgreSQL using the BYTEA column type, eliminating the need for external object storage (MINIO/S3) for transcript files.

## Changes Made

### 1. Database Model (`backend/app/models/transcript.py`)
- Added `pdf_content` column of type `BYTEA` to store PDF file content
- Column is nullable to support existing transcripts

### 2. Upload Endpoint (`backend/app/api/v1/transcripts.py`)
- PDF content is now saved to the database during upload
- `pdf_content` field is populated with the uploaded file bytes

### 3. Processing Function (`backend/app/tasks/process_transcript.py`)
- Updated to read PDF content from the database instead of memory
- Falls back to reading from `transcript.pdf_content` if not provided as parameter
- Maintains backward compatibility with optional `pdf_content` parameter

### 4. Database Migration
- Created migration `add_pdf_content_to_transcripts.py`
- Adds `pdf_content BYTEA` column to `transcripts` table

## Benefits

✅ **No External Storage Required** - All data in one place (PostgreSQL)
✅ **Simplified Architecture** - No MINIO/S3 dependency for transcripts
✅ **Transactional Consistency** - PDF and metadata stored together
✅ **Easier Backups** - Database backups include transcript files
✅ **Better Data Integrity** - Foreign key constraints ensure data consistency

## Database Schema

```sql
ALTER TABLE transcripts 
ADD COLUMN pdf_content BYTEA;
```

## Storage Considerations

### File Size Limits
- PostgreSQL BYTEA can store up to 1GB per field
- Current upload limit: 10MB (configurable via `MAX_UPLOAD_SIZE`)
- Typical transcript PDFs: 100KB - 2MB

### Performance
- BYTEA storage is efficient for files up to ~10MB
- For larger files, consider:
  - Increasing `work_mem` PostgreSQL setting
  - Using TOAST (automatic for large values)
  - Compression before storage

### Backup Implications
- Database backups will include transcript PDFs
- Backup size will increase proportionally
- Consider separate backup strategy for very large databases

## Migration Steps

1. **Run the migration:**
   ```bash
   cd backend
   python -m alembic upgrade head
   ```

2. **Verify the column was added:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'transcripts' AND column_name = 'pdf_content';
   ```

3. **Test upload:**
   - Upload a transcript PDF
   - Verify `pdf_content` is populated
   - Verify processing still works

## Rollback

If needed, you can rollback the migration:
```bash
python -m alembic downgrade -1
```

**Note:** This will remove the `pdf_content` column and any stored PDFs will be lost.

## Future Considerations

- **Compression**: Consider compressing PDFs before storage
- **Cleanup**: Old transcripts can be deleted to free space
- **Archiving**: Move old transcripts to archive table if needed
- **Retrieval**: Add endpoint to download stored transcripts if needed

