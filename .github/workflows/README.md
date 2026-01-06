# GitHub Actions Workflows

This repository includes automated CI/CD workflows for building and publishing the Blood Pressure Monitor application.

## Workflows

### 1. Helm Chart Release (`helm-release.yaml`)

Automatically packages and publishes the Helm chart to GitHub Container Registry (GHCR) as an OCI artifact.

**Triggers:**
- Push to `main` branch with changes to `helm/bpm-scrape/**`
- Manual workflow dispatch

**What it does:**
1. Packages the Helm chart
2. Pushes to GHCR OCI registry at `ghcr.io/{org}/bpm-scrape`
3. Uploads chart as build artifact

**Permissions required:**
- `contents: read` - Read repository contents
- `packages: write` - Push to GHCR

### 2. Docker Image Build (`docker-build.yaml`)

Builds and publishes the Docker image to GHCR with multi-platform support.

**Triggers:**
- Push to `main` branch
- Push of version tags (`v*`)
- Pull requests (build only, no push)
- Manual workflow dispatch

**What it does:**
1. Builds Docker image for `linux/amd64` and `linux/arm64`
2. Pushes to GHCR at `ghcr.io/{org}/bpm-scrape`
3. Tags with version, branch, SHA, and `latest`
4. Generates build provenance attestation

**Image tags:**
- `latest` - Latest build from main branch
- `main` - Latest build from main branch
- `v1.0.0` - Semantic version tags
- `v1.0` - Major.minor version
- `v1` - Major version
- `main-sha123456` - Branch with commit SHA

## Setup

### For Organization: `furfmon`

When moved to the `furfmon` organization, the workflows will automatically:
- Publish to `ghcr.io/furfmon/bpm-scrape` (Docker image)
- Publish to `oci://ghcr.io/furfmon/bpm-scrape` (Helm chart)

No additional configuration needed! GitHub Actions provides the `GITHUB_TOKEN` automatically.

### Registry Visibility

By default, packages are private. To make them public:

1. Go to package settings on GitHub
2. Navigate to `ghcr.io/furfmon/bpm-scrape`
3. Click "Package settings"
4. Under "Danger Zone", change visibility to Public

## Using the Published Artifacts

### Install Helm Chart from GHCR

```bash
# Login to GHCR (if package is private)
echo $GITHUB_TOKEN | helm registry login ghcr.io -u USERNAME --password-stdin

# Install chart
helm install bpm-scrape oci://ghcr.io/furfmon/bpm-scrape --version 1.0.0

# Or install latest version
helm install bpm-scrape oci://ghcr.io/furfmon/bpm-scrape
```

### Pull Docker Image from GHCR

```bash
# Login to GHCR (if image is private)
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull image
docker pull ghcr.io/furfmon/bpm-scrape:latest

# Or specific version
docker pull ghcr.io/furfmon/bpm-scrape:v1.0.0
```

### Use in Helm Chart

Update the Helm chart values to use the GHCR image:

```yaml
# values.yaml
image:
  repository: ghcr.io/furfmon/bpm-scrape
  tag: "1.0.0"
  pullPolicy: IfNotPresent
```

For private images, create an image pull secret:

```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=USERNAME \
  --docker-password=$GITHUB_TOKEN \
  --namespace=bpm-scrape
```

Then reference it in values:

```yaml
imagePullSecrets:
  - name: ghcr-secret
```

## Versioning

### Helm Chart Versions

Chart versions are defined in `helm/bpm-scrape/Chart.yaml`:

```yaml
version: 1.0.0  # Chart version
appVersion: "1.0.0"  # Application version
```

Update these before pushing to trigger a new release.

### Docker Image Versions

Docker images are automatically tagged based on:
- Git tags: Push `v1.0.0` tag for versioned release
- Branch: `main` for latest development
- Commit SHA: For traceable builds

To create a version release:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Workflow Permissions

The workflows use `GITHUB_TOKEN` which is automatically provided by GitHub Actions. It has these permissions:

- **packages: write** - Push to GHCR
- **contents: read** - Read repository
- **attestations: write** - Create build attestations (Docker workflow)

No additional secrets or PATs required!

## Troubleshooting

### Workflow fails with "permission denied"

Ensure repository settings allow Actions to write to packages:
1. Go to repository Settings → Actions → General
2. Under "Workflow permissions", select "Read and write permissions"
3. Save changes

### Chart not found in GHCR

Check that:
1. The workflow ran successfully
2. Package visibility is set correctly (private/public)
3. You're using the correct registry path: `oci://ghcr.io/furfmon/bpm-scrape`

### Image pull fails in Kubernetes

For private images:
1. Create an image pull secret (see above)
2. Reference it in Helm values or deployment manifest
3. Ensure the secret is in the same namespace as the deployment

## Local Testing

### Test Helm Chart Packaging

```bash
helm package helm/bpm-scrape --destination .deploy
```

### Test Docker Build

```bash
docker build -t bpm-scrape:test .
```

### Test with act (run GitHub Actions locally)

```bash
# Install act: https://github.com/nektos/act
brew install act

# Run workflows locally
act -W .github/workflows/helm-release.yaml
act -W .github/workflows/docker-build.yaml
```

## Manual Releases

### Manually Trigger Workflow

1. Go to Actions tab on GitHub
2. Select workflow (Helm Chart Release or Docker Build)
3. Click "Run workflow"
4. Select branch and click "Run workflow"

### Manually Push to GHCR

```bash
# Build and tag Docker image
docker build -t ghcr.io/furfmon/bpm-scrape:manual .

# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Push image
docker push ghcr.io/furfmon/bpm-scrape:manual

# Package and push Helm chart
helm package helm/bpm-scrape
helm push bpm-scrape-1.0.0.tgz oci://ghcr.io/furfmon
```

## Best Practices

1. **Version bumping**: Always update chart version in `Chart.yaml` before merging
2. **Git tags**: Use semantic versioning for releases (`v1.0.0`, `v1.1.0`)
3. **Testing**: Test Helm charts locally before pushing
4. **Changelog**: Maintain a CHANGELOG.md for tracking releases
5. **Security**: Use Dependabot for dependency updates
6. **Attestations**: Docker workflow generates build provenance for supply chain security
