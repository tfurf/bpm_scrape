# Kubernetes/k3s Deployment Guide

This guide explains how to deploy the Blood Pressure Monitor app to a k3s Kubernetes cluster.

## Prerequisites

- k3s cluster up and running
- `kubectl` configured to access your k3s cluster
- Docker installed for building images

## Deployment Steps

### 1. Build the Docker Image

```bash
# Build the Docker image
docker build -t bpm-scrape:latest .

# For k3s, you can import directly (no registry needed)
docker save bpm-scrape:latest | sudo k3s ctr images import -
```

**Alternative: Using a Registry**

If using a private registry:

```bash
# Tag for your registry
docker tag bpm-scrape:latest your-registry.com/bpm-scrape:latest

# Push to registry
docker push your-registry.com/bpm-scrape:latest

# Update k8s/deployment.yaml with your image name
```

### 2. Deploy to k3s

```bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

**Or apply all at once:**

```bash
kubectl apply -f k8s/
```

### 3. Configure Ingress

Edit `k8s/ingress.yaml` and change the host:

```yaml
spec:
  rules:
  - host: bpm.yourdomain.com  # Your actual domain
```

Then reapply:

```bash
kubectl apply -f k8s/ingress.yaml
```

### 4. Verify Deployment

```bash
# Check pod status
kubectl get pods -n bpm-scrape

# Check service
kubectl get svc -n bpm-scrape

# Check ingress
kubectl get ingress -n bpm-scrape

# View logs
kubectl logs -f deployment/bpm-scrape -n bpm-scrape
```

## Configuration Options

### Environment Variables

Add environment variables in `k8s/deployment.yaml`:

```yaml
env:
- name: PORT
  value: "5000"
- name: NODE_ENV
  value: "production"
```

### Resource Limits

Adjust resources in `k8s/deployment.yaml`:

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Storage

The app uses a PersistentVolumeClaim (1Gi) for storing logs. To increase:

```yaml
# In k8s/pvc.yaml
resources:
  requests:
    storage: 5Gi
```

## Accessing the Application

### Via Ingress (Production)

Once ingress is configured: `http://bpm.yourdomain.com`

### Via Port Forward (Testing)

```bash
kubectl port-forward -n bpm-scrape service/bpm-scrape-service 5000:5000
```

Then access: `http://localhost:5000`

### Via NodePort (Home Network)

Change service type in `k8s/service.yaml`:

```yaml
spec:
  type: NodePort
  ports:
  - port: 5000
    targetPort: 5000
    nodePort: 30500  # Choose port 30000-32767
```

Access via: `http://<node-ip>:30500`

## HTTPS/TLS Setup (Optional)

### Using cert-manager

1. Install cert-manager:

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

2. Create ClusterIssuer:

```bash
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: traefik
EOF
```

3. Uncomment TLS section in `k8s/ingress.yaml`

## Troubleshooting

### Pod not starting

```bash
kubectl describe pod -n bpm-scrape -l app=bpm-scrape
kubectl logs -n bpm-scrape -l app=bpm-scrape
```

### Image pull errors

For k3s without registry:

```bash
# Re-import image
docker save bpm-scrape:latest | sudo k3s ctr images import -

# Verify import
sudo k3s ctr images ls | grep bpm-scrape
```

### Storage issues

```bash
kubectl get pvc -n bpm-scrape
kubectl describe pvc bpm-logs-pvc -n bpm-scrape
```

### Ingress not working

```bash
# Check Traefik (k3s default ingress controller)
kubectl get pods -n kube-system | grep traefik

# Check ingress
kubectl describe ingress -n bpm-scrape
```

## Updating the Application

1. Build new image with version tag:

```bash
docker build -t bpm-scrape:v1.1.0 .
docker save bpm-scrape:v1.1.0 | sudo k3s ctr images import -
```

2. Update deployment:

```bash
kubectl set image deployment/bpm-scrape bpm-scrape=bpm-scrape:v1.1.0 -n bpm-scrape
```

Or edit `k8s/deployment.yaml` and reapply:

```bash
kubectl apply -f k8s/deployment.yaml
```

## Backup and Restore

### Backup logs

```bash
kubectl cp bpm-scrape/<pod-name>:/app/logs/bp_logs.json ./backup-bp_logs.json -n bpm-scrape
```

### Restore logs

```bash
kubectl cp ./backup-bp_logs.json bpm-scrape/<pod-name>:/app/logs/bp_logs.json -n bpm-scrape
```

## Uninstall

```bash
# Delete all resources
kubectl delete -f k8s/

# Or delete namespace (removes everything)
kubectl delete namespace bpm-scrape
```

## Architecture

```
┌─────────────────────────────────────────┐
│           Internet/Home Network          │
└────────────────┬────────────────────────┘
                 │
         ┌───────▼────────┐
         │  k3s Ingress   │
         │   (Traefik)    │
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │    Service     │
         │  (ClusterIP)   │
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │   Deployment   │
         │  (1 replica)   │
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │   Pod          │
         │  bpm-scrape    │
         │  container     │
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │      PVC       │
         │  (logs data)   │
         └────────────────┘
```

## Production Considerations

1. **Persistent Storage**: Use external storage solutions for production
2. **Replicas**: Keep at 1 replica due to file-based storage (or use external database)
3. **Backup**: Regular backup of PVC data
4. **Monitoring**: Add Prometheus metrics
5. **Security**: Enable TLS/HTTPS with cert-manager
6. **Resource Limits**: Adjust based on usage patterns
7. **Network Policy**: Add network policies for security

## Home Network Setup

For home network deployment without a domain:

1. Use NodePort service type
2. Access via `http://<k3s-node-ip>:30500`
3. Configure router port forwarding if accessing from outside
4. No need for Ingress or cert-manager

Example NodePort service:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: bpm-scrape-service
  namespace: bpm-scrape
spec:
  type: NodePort
  ports:
  - port: 5000
    targetPort: 5000
    nodePort: 30500
  selector:
    app: bpm-scrape
```
