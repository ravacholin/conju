# GitHub Secrets Setup Guide

This document describes the required secrets for GitHub Actions workflows to function properly.

## Required Secrets

### For CI/CD Pipeline

#### `CODECOV_TOKEN`
- **Purpose**: Upload code coverage reports to Codecov
- **Where to get**: https://codecov.io/gh/your-org/your-repo/settings
- **Required for**: Continuous Integration workflow (`ci.yml`)
- **Setup**:
  1. Go to Codecov and login with GitHub
  2. Navigate to your repository settings
  3. Copy the repository upload token
  4. Add as `CODECOV_TOKEN` in GitHub repository secrets

### For Deployment

#### `VERCEL_TOKEN`
- **Purpose**: Authenticate with Vercel for deployments
- **Where to get**: https://vercel.com/account/tokens
- **Required for**: Deploy workflow (`deploy.yml`)
- **Setup**:
  1. Login to Vercel dashboard
  2. Go to Settings > Tokens
  3. Create a new token with appropriate scope
  4. Add as `VERCEL_TOKEN` in GitHub repository secrets

#### `VERCEL_ORG_ID`
- **Purpose**: Identify your Vercel organization/team
- **Where to get**: Vercel project settings or `.vercel/project.json`
- **Required for**: Deploy workflow (`deploy.yml`)
- **Setup**:
  1. Run `vercel link` in your project locally, or
  2. Check `.vercel/project.json` after linking, or
  3. Get from Vercel project settings
  4. Add as `VERCEL_ORG_ID` in GitHub repository secrets

#### `VERCEL_PROJECT_ID`
- **Purpose**: Identify your specific Vercel project
- **Where to get**: Vercel project settings or `.vercel/project.json`
- **Required for**: Deploy workflow (`deploy.yml`)
- **Setup**:
  1. Run `vercel link` in your project locally, or
  2. Check `.vercel/project.json` after linking, or
  3. Get from Vercel project settings
  4. Add as `VERCEL_PROJECT_ID` in GitHub repository secrets

## How to Add Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Enter the secret name (e.g., `CODECOV_TOKEN`)
5. Paste the secret value
6. Click **Add secret**

## Optional Secrets

These secrets are optional but may be useful for enhanced functionality:

- `SLACK_WEBHOOK_URL`: For deployment notifications
- `DISCORD_WEBHOOK_URL`: For deployment notifications
- `LIGHTHOUSE_SERVER_URL`: For custom Lighthouse CI server

## Testing Secrets

After adding secrets, you can test them by:

1. Triggering a workflow run
2. Checking the workflow logs for authentication success
3. Verifying that deployments and uploads work as expected

## Security Notes

- **Never** commit secrets to your repository
- Regularly rotate tokens and secrets
- Use minimal required permissions for tokens
- Monitor secret usage in workflow logs
- Remove unused secrets promptly

## Troubleshooting

### Codecov Upload Fails
- Verify `CODECOV_TOKEN` is correct
- Check that the repository is properly linked to Codecov
- Ensure coverage files are being generated (`./coverage/lcov.info`)

### Vercel Deployment Fails
- Verify all three Vercel secrets are set correctly
- Check that the Vercel project is linked to the correct GitHub repository
- Ensure the Vercel token has deployment permissions

### General Issues
- Check secret names match exactly (case-sensitive)
- Verify secrets are added to the correct repository
- Review workflow logs for specific error messages