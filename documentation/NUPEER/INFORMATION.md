**What does "pending" status mean in my transcript list?**

A "pending" status for a transcript in your list means that your uploaded transcript is still being processed and has not yet been fully reviewed or analyzed by the system. While in pending status, the transcript's data (such as grades, courses, or credits) might not be available for display or analytics. Once the transcript processing is complete and validated, the status will be updated (e.g., to "completed" or "approved"), and its information will appear in your academic analytics or transcript viewer.

Common reasons a transcript may remain "pending":
- The file is still being scanned or parsed by our system.
- Manual review by an administrator may be required (for example, if the text extraction encountered issues).
- There is a backlog of processing requests.

If your transcript stays in "pending" status longer than expected, you may want to:
- Refresh the page after a few minutes.
- Make sure the file you uploaded is in the correct and supported format.
- Contact support if the issue remains unresolved.

**How to fix this?**

If your transcript remains in "pending" status and you are unsure how to resolve it, follow these steps:

1. **Wait a Few Minutes and Refresh:** Processing may take some time, especially if there is a high server load. Wait several minutes, then refresh your transcript page.
2. **Check File Format:** Ensure your uploaded transcript is in a supported and readable format (typically PDF or image files listed in the upload instructions). Unsupported or corrupt files may not process correctly.
3. **Re-upload the Transcript:** Delete (if possible) and re-upload your transcript to trigger a fresh processing attempt.
4. **Clear Browser Cache and Cookies:** Occasionally, your browser's cached data can cause stale status information to appear.
5. **Try a Different Browser or Device:** This can help rule out device-specific issues.
6. **Contact Support:** If the status does not change after trying the above steps, reach out to support with details (file type, date/time of upload, and any error messages).

**Note:** For issues related to system maintenance or outages, check for any site-wide announcements regarding delays in transcript processing.

**Are the academic analysis and recommendation in the analysis page customized for every user's need? If so, how?**

Yes, both academic analysis and tutor recommendations are personalized for each user in the analysis page.

- **Academic Analysis Customization:**  
  When you upload a transcript, the system extracts your courses and grades, then performs analytics (such as GPA calculation, credit analysis, and course distribution) specifically on your own academic record. All charts and statistics shown in your analysis page reflect only your data.

- **Personalized Recommendations:**  
  Tutor recommendations are also customized for your individual needs. When you create a help request for a course, the system matches you with other users (tutors) who have previously taken that same course, prioritizing those with the best grades and most recent experience (as described in the [Tutor Search Optimization](../ARCHITECTURE/TUTOR_SEARCH_OPTIMIZATION.md) document). The matching process excludes you from the results and uses your requested course as the primary filter, so each recommendation list is tailored to your help requests and academic situation.

In summary, both analytics and recommendations are generated from your own data and current needs, ensuring you see information and suggestions relevant to you.

**How is the analysis and recommendation generated?**

- **Analysis Generation:**  
  When you upload a transcript, our system parses the document to extract your individual course records, grades, and credits. It then stores this structured data securely in your account. Analytics—such as GPA calculation, earned credit totals, grade distributions, and major-specific progress—are calculated directly from this data. These calculations are performed using precise formulas (for example, overall GPA is computed as the weighted average of your grades by credit hours). All analytics reflect only your data and update automatically when new transcripts are processed.

- **Recommendation Generation:**  
  When you request help (through a help request) for a specific course, the system searches for other users ("tutors") who have previously completed the same course. The recommendation engine sorts these matches to prioritize tutors who earned higher grades and who have taken the course more recently. The matching also ensures you are excluded from the results, and a set of recommended tutors (typically up to 10) is presented to you. This is achieved through an optimized database query that leverages indexes—so recommendations appear quickly even as the platform grows. For more technical details, see [Tutor Search Optimization](../ARCHITECTURE/TUTOR_SEARCH_OPTIMIZATION.md).

In summary, both your academic analysis and recommendations are created in real time from your uploaded and requested data, using secure algorithms and database operations to ensure the most relevant and accurate results.



