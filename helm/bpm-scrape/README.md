# BPM Scrape Helm Chart

A Helm chart for deploying the Blood Pressure Monitor web application on Kubernetes.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- PersistentVolume provisioner support (for log storage)

## Installing the Chart

### From GitHub Container Registry (GHCR)

The chart is automatically published to GHCR via GitHub Actions.

```bash
# Install from GHCR
helm install bpm-scrape oci://ghcr.io/furfmon/bpm-scrape --version 1.0.0

# Or install latest version
helm install bpm-scrape oci://ghcr.io/furfmon/bpm-scrape

# With custom namespace
helm install bpm-scrape oci://ghcr.io/furfmon/bpm-scrape \
  --namespace bpm-scrape --create-namespace

# With custom values
helm install bpm-scrape oci://ghcr.io/furfmon/bpm-scrape \
  -f my-values.yaml
```

**For private charts**, login first:

```bash
echo $GITHUB_TOKEN | helm registry login ghcr.io -u USERNAME --password-stdin
```

### From Local Source

If building from source or for development:

```bash
# Build the Docker image
docker build -t bpm-scrape:latest .

# For k3s, import the image
docker save bpm-scrape:latest | sudo k3s ctr images import -

# Install local chart
helm install bpm-scrape ./helm/bpm-scrape

# Install in a specific namespace
helm install bpm-scrape ./helm/bpm-scrape --namespace bpm-scrape --create-namespace

# Install with custom values
helm install bpm-scrape ./helm/bpm-scrape -f my-values.yaml
```

## Uninstalling the Chart

```bash
helm uninstall bpm-scrape
```

## Configuration

The following table lists the configurable parameters and their default values.

### General Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `1` |
| `image.repository` | Image repository | `bpm-scrape` |
| `image.tag` | Image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `nameOverride` | Override chart name | `""` |
| `fullnameOverride` | Override full resource names | `""` |

### Service Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.type` | Service type (ClusterIP/NodePort/LoadBalancer) | `ClusterIP` |
| `service.port` | Service port | `5000` |
| `service.nodePort` | NodePort (if service.type is NodePort) | `nil` |

### Ingress Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `""` |
| `ingress.annotations` | Ingress annotations | See values.yaml |
| `ingress.hosts[0].host` | Hostname | `bpm.example.com` |
| `ingress.tls` | TLS configuration | `[]` |

### Persistence Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `persistence.enabled` | Enable persistent storage | `true` |
| `persistence.storageClass` | Storage class | `local-path` |
| `persistence.accessMode` | Access mode | `ReadWriteOnce` |
| `persistence.size` | Storage size | `1Gi` |
| `persistence.existingClaim` | Use existing PVC | `""` |

### Resource Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `resources.limits.cpu` | CPU limit | `500m` |
| `resources.limits.memory` | Memory limit | `512Mi` |
| `resources.requests.cpu` | CPU request | `100m` |
| `resources.requests.memory` | Memory request | `256Mi` |

### Environment Variables

| Parameter | Description | Default |
|-----------|-------------|---------|
| `env.NODE_ENV` | Node environment | `production` |
| `env.PORT` | Application port | `5000` |

## Example Configurations

### Using Published Docker Image from GHCR

```yaml
# values-ghcr.yaml
image:
  repository: ghcr.io/furfmon/bpm-scrape
  tag: "1.0.0"
  pullPolicy: IfNotPresent

# For private images
imagePullSecrets:
  - name: ghcr-secret
```

Create secret for private images:
```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=USERNAME \
  --docker-password=$GITHUB_TOKEN \
  --namespace=bpm-scrape
```

Deploy:
```bash
helm install bpm-scrape oci://ghcr.io/furfmon/bpm-scrape -f values-ghcr.yaml
```

### Home Network Deployment (NodePort)

```yaml
# values-home.yaml
service:
  type: NodePort
  nodePort: 30500

ingress:
  enabled: false

persistence:
  size: 2Gi
```

Deploy:
```bash
helm install bpm-scrape ./helm/bpm-scrape -f values-home.yaml
```

Access: `http://<node-ip>:30500`

### Production with Ingress and TLS

```yaml
# values-prod.yaml
replicaCount: 2

ingress:
  enabled: true
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: bpm.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: bpm-scrape-tls
      hosts:
        - bpm.yourdomain.com

persistence:
  storageClass: "fast-ssd"
  size: 5Gi

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 250m
    memory: 512Mi
```

Deploy:
```bash
helm install bpm-scrape ./helm/bpm-scrape -f values-prod.yaml --namespace bpm-scrape --create-namespace
```

### Using External Image Registry

```yaml
# values-registry.yaml
image:
  repository: registry.example.com/bpm-scrape
  tag: "1.0.0"
  pullPolicy: Always

imagePullSecrets:
  - name: registry-secret
```

Create registry secret first:
```bash
kubectl create secret docker-registry registry-secret \
  --docker-server=registry.example.com \
  --docker-username=user \
  --docker-password=pass \
  --namespace bpm-scrape
```

Deploy:
```bash
helm install bpm-scrape ./helm/bpm-scrape -f values-registry.yaml
```

## Upgrading

```bash
# Upgrade with new values
helm upgrade bpm-scrape ./helm/bpm-scrape -f my-values.yaml

# Upgrade with new image tag
helm upgrade bpm-scrape ./helm/bpm-scrape --set image.tag=1.1.0
```

## Backup and Restore

### Backup Logs

```bash
# Get pod name
POD=$(kubectl get pod -l app.kubernetes.io/name=bpm-scrape -o jsonpath="{.items[0].metadata.name}")

# Copy logs from pod
kubectl cp $POD:/app/logs/bp_logs.json ./backup-bp_logs.json
```

### Restore Logs

```bash
# Copy logs to pod
kubectl cp ./backup-bp_logs.json $POD:/app/logs/bp_logs.json
```

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -l app.kubernetes.io/name=bpm-scrape
kubectl describe pod -l app.kubernetes.io/name=bpm-scrape
kubectl logs -l app.kubernetes.io/name=bpm-scrape
```

### Check Service

```bash
kubectl get svc -l app.kubernetes.io/name=bpm-scrape
```

### Check Ingress

```bash
kubectl get ingress -l app.kubernetes.io/name=bpm-scrape
kubectl describe ingress -l app.kubernetes.io/name=bpm-scrape
```

### Check PVC

```bash
kubectl get pvc
kubectl describe pvc <pvc-name>
```

## Development

### Template Rendering (Dry Run)

```bash
# Render templates without installing
helm template bpm-scrape ./helm/bpm-scrape

# Render with custom values
helm template bpm-scrape ./helm/bpm-scrape -f my-values.yaml
```

### Linting

```bash
helm lint ./helm/bpm-scrape
```

## License

MIT
