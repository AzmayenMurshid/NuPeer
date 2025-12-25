@echo off
REM Transcript Parser - Windows Batch Script
cd /d %~dp0
python transcript_parser.py %*

