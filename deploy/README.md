# putout-editor — Kubernetes and ArgoCD

## Overview

A git tag push triggers a GitHub Actions CI/CD pipeline that builds a multi-arch Docker image, pushes it to GHCR, deploys the new image to a test k3d cluster, runs a smoke test, and finally bumps the image tag in the production kustomize overlay. ArgoCD picks up the tag bump from the `master` branch and syncs the live production cluster within ~30 seconds.

To roll back, `git revert` the tag-bump commit and push to `master`. ArgoCD will sync back to the previous image tag.

***

## Prerequisites

- [k3d](https://k3d.io/) — lightweight Kubernetes in Docker (local dev only)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) — Kubernetes CLI
- [kustomize](https://kustomize.io/) — included in kubectl v1.14+
- [palabra](https://github.com/coderaiser/palabra) — binary manager (used in CI)
- [docker](https://docker.com/) — container runtime

***

## Part 1: VPS / production (k3s)

### Install k3s on the VPS

```sh
palabra i k3d
```

### Install cert-manager

```sh
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
```

### Deploy the application

```sh
kubectl apply -k deploy/k8s/overlays/prod
```

### DNS / Cloudflare

- Point a DNS record (e.g. `putout-editor.cloudcmd.io`) to the VPS IP.
- **During initial certificate issuance**, set the Cloudflare proxy icon to **grey cloud** (DNS only) so Let's Encrypt can validate. Set it back to **orange cloud** (proxied) once the certificate is issued.

## Part 2: ArgoCD

### 1. Install ArgoCD

```sh
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### 2. Patch for Traefik TLS termination

ArgoCD defaults to serving its own TLS, which conflicts with Traefik (k3s's default ingress controller). Disable ArgoCD's internal TLS by patching the `argocd-server` deployment:

```sh
kubectl patch deployment argocd-server -n argocd --type=json \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--insecure"}]'
```

Without this patch, the ArgoCD UI returns **Internal Server Error** because Traefik terminates TLS before the request reaches ArgoCD, and ArgoCD rejects the plaintext connection.

### 3. Create an ingress

Apply `deploy/k8s/argocd/ingress.yaml` to expose ArgoCD at `argocd.cloudcmd.io`.

### 4. Get the initial admin password

```sh
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

Login at `https://argocd.cloudcmd.io` with username `admin` and the password above.

### 5. Create the Application CR

Apply `deploy/k8s/argocd/application.yaml`. This tells ArgoCD to watch the `deploy/k8s/overlays/prod` directory in the `master` branch of the `coderaiser/putout-editor` repository.

### 6. Webhook for instant deploys

1. Go to **Settings → Repositories** in the ArgoCD UI.
2. Select the `coderaiser/putout-editor` repository.
3. Under **Events**, enable push events and copy the webhook URL.
4. Go to the GitHub repository **Settings → Webhooks** and add the URL with `Content-Type: application/json`.

***

## Part 3: CI/CD flow

The `.github/workflows/release.yml` workflow:

1. **build-and-push** — Builds a multi-arch Docker image (linux/amd64 + linux/arm64), pushes to GHCR with semver tags.
2. **deploy-test** — Creates a temporary k3d cluster, deploys the new image, and runs a smoke test (`curl` + `grep` for the version in the page title). If the smoke test passes, the image is known to work.
3. **deploy-prod** — Updates the image tag in `deploy/k8s/overlays/prod/kustomization.yaml` and commits the change to `master`. ArgoCD detects the change and syncs the production cluster.

### Manual deploy (without ArgoCD)

```sh
cd deploy/k8s/overlays/prod
kustomize edit set image ghcr.io/coderaiser/putout-editor=ghcr.io/coderaiser/putout-editor:<tag>
kubectl apply -k .
```

***

## Part 4: Local dev cluster (k3d)

### Create a cluster

```sh
k3d cluster create putout-editor -p "8080:80@loadbalancer"
```

### Apply the CI overlay

```sh
kubectl apply -k deploy/k8s/overlays/ci
```

### Smoke test

```sh
curl -H "Host: putout-editor.cloudcmd.io" http://localhost:8080 | grep "Putout Editor"
```

### Teardown

```sh
k3d cluster delete putout-editor
```

***

## Manifest structure

```
deploy/
├── README.md
└── k8s/
    ├── base/
    │   ├── kustomization.yaml
    │   ├── namespace.yaml
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── ingress.yaml
    ├── overlays/
    │   ├── ci/
    │   │   ├── kustomization.yaml
    │   │   └── ingress-patch.yaml
    │   └── prod/
    │       ├── kustomization.yaml
    │       └── cluster-issuer.yaml
    └── argocd/
        ├── application.yaml
        └── ingress.yaml
```

- **base/** — shared manifests (namespace, deployment, service, ingress)
- **overlays/ci/** — CI overlay: patches ingress for local dev (no TLS, simpler host rules)
- **overlays/prod/** — production overlay: adds cert-manager ClusterIssuer for Let's Encrypt, references the live image tag
- **argocd/** — ArgoCD configuration (Application CR and ingress)

***

## Troubleshooting

### Pod not starting

```sh
kubectl -n putout-editor describe pod <pod-name>
kubectl -n putout-editor logs <pod-name>
```

Common causes: missing image tag, private registry without `imagePullSecrets`, or insufficient resources.

### Certificate not issuing

```sh
kubectl -n putout-editor get certificates
kubectl -n putout-editor describe certificate putout-editor-tls
kubectl -n putout-editor get challenges
```

Check that DNS resolves correctly and Cloudflare proxy is set to **grey cloud** (DNS only) during issuance.

### ArgoCD OutOfSync

Click **Sync** in the ArgoCD UI or run:

```sh
argocd app sync putout-editor
```

If the sync fails, check the app status for errors. Common causes: missing manifests, invalid kustomize overlay, or the image tag in the overlay doesn't exist yet.

### 404 from Traefik

The ingress uses `Host: putout-editor.cloudcmd.io`. In a local k3d cluster, use `curl -H "Host: putout-editor.cloudcmd.io" http://localhost:8080`. In production, ensure DNS resolves to the VPS IP and Traefik is configured correctly.

### ArgoCD UI Internal Server Error

This is almost always the missing `--insecure` flag on `argocd-server` (see Part 2, step 2). Apply the patch and restart the pod:

```sh
kubectl rollout restart deployment argocd-server -n argocd
```
