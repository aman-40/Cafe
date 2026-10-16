# Cron Job Setup for Notifications

The application supports automated reservation reminders and other scheduled tasks via an API route. Since Next.js does not natively provide a background cron scheduler out of the box in a standalone build, you will need to trigger this API endpoint using an external cron scheduler.

## Endpoint

```
GET /api/cron/reminders
```

## Security

To prevent unauthorized execution of your cron jobs, set the following environment variable in your `.env` file:

```
CRON_SECRET=your_secure_random_string
```

Then, pass this secret in the `Authorization` header when making the request:

```
Authorization: Bearer your_secure_random_string
```

## Setup Options

### 1. Vercel Cron Jobs (If deployed to Vercel)
Create a `vercel.json` file in the root of your project:
```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```
Vercel will automatically trigger the endpoint at 8:00 AM UTC every day. You must also set the `CRON_SECRET` environment variable in the Vercel dashboard. Vercel automatically passes this secret via the Authorization header.

### 2. Linux Cron Job (Self-Hosted)
If you are hosting the application on a Linux server, you can use `crontab` to trigger the API.

Run `crontab -e` and add:
```bash
# Run every day at 8:00 AM
0 8 * * * curl -X GET "https://your-domain.com/api/cron/reminders" -H "Authorization: Bearer your_secure_random_string" >/dev/null 2>&1
```

### 3. Third-party Cron Services
Services like [cron-job.org](https://cron-job.org/) or [EasyCron](https://www.easycron.com/) can be used to hit the endpoint periodically. Configure them to make a GET request to `https://your-domain.com/api/cron/reminders` with the `Authorization` header.
