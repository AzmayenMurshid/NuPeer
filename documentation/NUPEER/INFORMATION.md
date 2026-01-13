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

**How to Deploy the NuPeer Software with AWS**

Deploying NuPeer on AWS involves hosting both the backend (FastAPI, database, storage) and the frontend (Next.js). The following steps outline a typical production-grade AWS deployment workflow:

---

### 1. **Infrastructure Overview**

- **Frontend:** Next.js app (Node.js), deployed on [AWS Amplify](https://aws.amazon.com/amplify/), [S3 + CloudFront](https://aws.amazon.com/cloudfront/), or [Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/) for SSR/SPA.
- **Backend:** FastAPI application, deployed via [Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/), [ECS](https://aws.amazon.com/ecs/) with Docker, or EC2.
- **Database:** [Amazon RDS](https://aws.amazon.com/rds/) (PostgreSQL recommended).
- **Object Storage:** [Amazon S3](https://aws.amazon.com/s3/) for transcript files.
- **Secrets & Env Vars:** [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) or [SSM Parameter Store](https://aws.amazon.com/systems-manager/) for sensitive config.
- **Authentication (Optional):** [Amazon Cognito](https://aws.amazon.com/cognito/) or your own database (as implemented).
- **Domain & SSL:** Configure using [AWS Route 53](https://aws.amazon.com/route53/) and AWS Certificate Manager.

---

### 2. **Deployment Steps (Backend + Frontend)**

#### **A. Prepare Environment Variables**
- Gather secrets such as:
  - `DATABASE_URL` (Amazon RDS endpoint/user/pass)
  - `SECRET_KEY` for FastAPI
  - S3 bucket credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME, etc.)
- Store them in AWS Secrets Manager or as Elastic Beanstalk/Amplify Environment Variables.

#### **B. Deploy the Backend (e.g., FastAPI)**
1. **Containerize (Recommended)**
   - Write a `Dockerfile` for your backend:
     ```Dockerfile
     FROM python:3.11
     WORKDIR /app
     COPY . .
     RUN pip install -r requirements.txt
     CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
     ```
2. **Choose Deployment Service**
   - **Elastic Beanstalk:** Easiest for most users. Create a new Python (or Docker) app and upload code or container.
   - **ECS (Fargate):** For production Docker deployments.
   - **EC2:** Manual server setup.

3. **Set Environment Variables**
   - In AWS Console, configure env vars/secrets for DB, S3, etc.

4. **RDS Setup**
   - Launch RDS PostgreSQL, allow security group access from backend app. Copy its endpoint as `DATABASE_URL`.

5. **S3 Bucket**
   - Create a bucket, configure CORS, and IAM permissions for your backend service.

---

#### **C. Deploy the Frontend (Next.js)**
1. **Via AWS Amplify (Recommended)**
   - Connect your GitHub repo.
   - Amplify builds and deploys static or SSR apps.
   - Set environment variables (API base URL, etc.).
2. **Via S3 + CloudFront**
   - Build with `next build && next export` for static export.
   - Upload the `out/` directory to S3.
   - Set up CloudFront as CDN.
3. **Via Elastic Beanstalk or ECS (for SSR)**
   - Use a Docker container for Node.js SSR hosting.

---

#### **D. Domain Setup & HTTPS**
- Use Route 53 to point your domain to your app.
- Issue SSL certificates via AWS Certificate Manager.
- Attach SSL to CloudFront, ELB, or Amplify as appropriate.

---

### 3. **Post-Deployment Tasks**
- Test transcript upload and analysis end-to-end.
- Set up monitoring and logs (CloudWatch).
- Periodically back up database and S3.
- Harden IAM permissions.

### 4. **Sample AWS Diagram**
```
[User]
   |
[CloudFront/CDN] -- [S3 (Frontend Static) OR Amplify]
   |
[ALB/ELB]
   |
[FastAPI Backend (Beanstalk/ECS/EC2)]
   |
[RDS (PostgreSQL)]    [S3 (Transcript Files)]
```

---

**For more technical detail on backend settings, Dockerization or networking, see the deployment docs in the source repository or ask your developer team.**

*Tip:* For rapid initial deployment (testing/prototype), start with Elastic Beanstalk for backend and Amplify for frontend, and move to ECS/EKS as complexity grows.

### **Step-by-Step: Deploying NuPeer on AWS (Manual Walkthrough)**

#### **A. Deploy the Backend (FastAPI) with PostgreSQL**

1. **Provision PostgreSQL (RDS):**
   - Go to [AWS Console](https://console.aws.amazon.com/) and search for **RDS**.
   - Click **Create database**.
   - Select **PostgreSQL** engine, choose **Standard Create**.
   - Pick Free Tier/Test instance type or production-appropriate size.
   - Set **DB instance identifier** (e.g., `nupeer-db`), master username, and password.
   - In **Connectivity**, choose your VPC, enable/disable public access as needed.
   - Allow inbound traffic on port 5432 from where your backend runs (set via Security Group).
   - Finish creation and note down **endpoint**, username, password.

2. **Deploy FastAPI Backend (Elastic Beanstalk, EC2, or ECS):**
   - Go to **Elastic Beanstalk** (easiest) in AWS Console.
   - Click **Create application**.
   - Set **Application name** ("nupeer-backend").
   - For **Platform**, choose **Docker**.
   - Upload a ZIP of your backend code including the **Dockerfile** (see repo).
   - In **Configuration** > **Software**, add Environment Variables:
     - `DATABASE_URL=postgresql://<USER>:<PASS>@<RDS-ENDPOINT>:5432/<DB>`
     - Set S3 and Redis environment variables if needed.
   - In **Configuration** > **Networking**, ensure the instance can reach RDS (same VPC/subnet or VPC Peering).
   - **Deploy** and wait for the environment to become healthy.
   - Find your backend API endpoint on the Beanstalk dashboard.

   *(Alternatively, use ECS for containers: provision a Cluster, Task Definition, add a Service, attach/expose ports, and set env vars. For more control, use EC2 with Docker, but this requires more manual steps.)*

3. **Set up S3 Bucket for Transcripts:**
   - Go to **S3** in AWS Console.
   - Click **Create bucket**, name it (e.g., `nupeer-transcripts`), pick region.
   - Leave defaults for private access, enable versioning if you wish.
   - After creation, go to **Permissions** → **CORS** configuration and add a policy if needed for client/console uploads.
   - Set up **Bucket Policy** and **IAM Role/User** for your backend service, granting only required permissions.

4. **(Optional) Redis for Celery**
   - Simplest: use [Amazon ElastiCache for Redis](https://console.aws.amazon.com/elasticache/).
   - Launch a Redis cluster, allow backend security group to connect on port 6379.
   - Set `REDIS_URL=redis://<ElastiCache-endpoint>:6379/0` in backend env.

---

#### **B. Deploy the Frontend (Next.js with Amplify or S3/CloudFront)**

**Option 1: AWS Amplify (Recommended for ease)**
1. Go to **AWS Amplify** in AWS Console.
2. Click **Get Started** for 'Host web app'.
3. Connect your **GitHub** (or other git provider) and select the NuPeer repo.
4. Amplify will auto-detect Next.js; confirm build settings.
5. In Amplify app **Environment Variables**, set variables like:
   - `NEXT_PUBLIC_API_URL=https://<your-backend-endpoint>`
6. Click **Save and Deploy**. Amplify builds and deploys your site, provides a live URL.

**Option 2: S3 + CloudFront (for static export)**
1. Build frontend locally: `next build && next export` (output will be in `out/`).
2. Go to **S3**, create a new bucket (e.g., `nupeer-frontend`).
3. Upload the contents of `out/` to the bucket.
4. In S3 bucket **Properties**, enable **Static Website Hosting**.
5. Go to **CloudFront**, create a new distribution, set S3 Origin to your bucket.
6. In **Cache Behaviors**, set `/api/*` to forward to your backend if you wish to support backend proxying.
7. Note CDN URL; set up your domain and SSL as below.

---

#### **C. Connect Domain and SSL**

1. Go to **Route 53** and create a **hosted zone** for your domain.
2. Update your domain registrar’s nameservers to AWS provided ones.
3. In **CloudFront** or **Amplify**, add your custom domain.
4. In **AWS Certificate Manager (ACM)**, request a certificate for your domain (e.g., `www.yourdomain.com`), validate via DNS.
5. Attach the SSL cert to CloudFront or Amplify.

---

#### **D. Monitor, Test, and Maintain**

- Test your full upload → process → match workflow.
- Set up **CloudWatch Logs & Alarms** for backend monitoring.
- Schedule RDS and S3 backups.
- Use IAM Least Privilege: Limit backend's S3/Redis permissions.
- Periodically update dependencies and review security groups.

---

## **Quick links:**
- [AWS Console Homepage](https://console.aws.amazon.com/)
- [Elastic Beanstalk Docs](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/)
- [Amplify Hosting Docs](https://docs.aws.amazon.com/amplify/latest/userguide/hosting.html)
- [PostgreSQL RDS Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html)

**Need help?** See infra examples in `/deployment/` folder, or ping your dev team!
