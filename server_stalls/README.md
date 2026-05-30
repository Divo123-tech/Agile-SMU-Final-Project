# server_stalls

TypeScript + Node.js (Express) API for creating stalls, backed by PostgreSQL with **AWS S3** file uploads.

## Endpoint

`POST /stalls` — creates a stall (multipart form data).

| Field | Type | Required |
| ----- | ---- | -------- |
| `name` | string | yes |
| `description` | string | yes |
| `address` | string | yes |
| `photo` | file (image) | yes |
| `proofOfOwnership` | file (image or PDF) | yes |

Response (`201`):

```json
{
  "id": 1,
  "name": "The Golden Wok",
  "description": "Authentic Chinese cuisine",
  "address": "Food Court Level 2, Booth 12",
  "image": "https://your-bucket.s3.ap-southeast-1.amazonaws.com/stalls/photos/123.jpg",
  "proofOfOwnership": "https://your-bucket.s3.ap-southeast-1.amazonaws.com/stalls/proofs/456.pdf"
}
```

Files are stored in S3 under:

- `stalls/photos/`
- `stalls/proofs/`

### `GET /stall/:id`

Public stall menu: stall header (name, description, image, address) plus dishes grouped by category. Same response shape previously served by `server_dishes`.

Response (`200`):

```json
{
  "stall": {
    "name": "The Golden Wok",
    "description": "Authentic Chinese cuisine",
    "image": "https://...",
    "address": "Food Court Level 2, Booth 12"
  },
  "categories": [
    {
      "category": "Main Course",
      "dishes": [
        {
          "id": "1",
          "name": "Pad Thai",
          "description": "...",
          "allergens": ["peanuts", "soy"]
        }
      ]
    }
  ]
}
```

### `GET /my-stalls/:userId`

Returns all stalls owned by the given account id (`owner` column).

Response (`200`):

```json
{
  "userId": 42,
  "count": 1,
  "stalls": [
    {
      "id": 1,
      "name": "The Golden Wok",
      "owner": 42,
      "description": "Authentic Chinese cuisine",
      "address": "Food Court Level 2, Booth 12",
      "image": "https://your-bucket.s3.ap-southeast-2.amazonaws.com/stalls/photos/123.jpg",
      "proofOfOwnership": "https://your-bucket.s3.ap-southeast-2.amazonaws.com/stalls/proofs/456.pdf"
    }
  ]
}
```

There is also `GET /health` for a liveness check.

## AWS S3 setup

### What you need from AWS

1. **S3 bucket** — create one (e.g. `agile-smu-stalls`)
2. **IAM user** (or role) with permission to `PutObject` on that bucket
3. **Access key + secret** for that IAM user
4. **Region** where the bucket lives (e.g. `ap-southeast-1`)

### Required `.env` variables

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-1
S3_BUCKET=your-bucket-name
```

### Optional `.env` variables

| Variable | When to use |
| -------- | ----------- |
| `AWS_SESSION_TOKEN` | Temporary credentials (STS) |
| `S3_PUBLIC_BASE_URL` | CloudFront or custom domain, e.g. `https://cdn.example.com` |
| `S3_ENDPOINT` | MinIO / LocalStack, e.g. `http://localhost:9000` |
| `S3_FORCE_PATH_STYLE=true` | Required for some S3-compatible endpoints |

### IAM policy (minimum)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/stalls/*"
    }
  ]
}
```

### Stall photos in the browser (fix `AccessDenied`)

Uploaded files are **private by default**. Opening the raw S3 URL in a browser returns `AccessDenied`.

**Default (recommended):** APIs return **presigned URLs** for `stalls/photos/*` (valid 24 hours). Your IAM user needs:

```json
{
  "Effect": "Allow",
  "Action": ["s3:PutObject", "s3:GetObject"],
  "Resource": "arn:aws:s3:::your-bucket-name/stalls/*"
}
```

Restart `server_stalls` after updating `.env` (AWS credentials are required for stall photo uploads and presigned menu images).

**Alternative:** Make photos public with a bucket policy (then set `S3_USE_PRESIGNED_URLS=false` in `.env`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadPhotos",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/stalls/photos/*"
    }
  ]
}
```

In S3 → bucket → **Permissions**, you may need to edit **Block public access** to allow bucket policies for public read.

Proof-of-ownership files stay private (not shown in `<img>` tags).

## Setup

1. Copy `.env.example` to `.env` and fill in database + S3 values.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Ensure the `stalls` table exists:

   ```sql
   ALTER TABLE stalls
     ADD COLUMN IF NOT EXISTS proof_of_ownership_url TEXT;
   ```

## Scripts

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start in watch mode with `tsx` (TS, auto-reload) |
| `npm run build`     | Compile TS to `dist/`                            |
| `npm start`         | Run the compiled JS (`dist/index.js`)            |
| `npm run typecheck` | Type-check without emitting                      |
| `npm test`          | Run unit and integration tests                   |

## Example request

```bash
curl -X POST http://localhost:4002/stalls \
  -F "name=The Golden Wok" \
  -F "description=Authentic Chinese cuisine" \
  -F "address=Food Court Level 2, Booth 12" \
  -F "photo=@./stall.jpg" \
  -F "proofOfOwnership=@./proof.pdf"
```
