# putout-editor — k3d / k8s deploy

## Prerequisites

- [k3d](https://k3d.io/) — lightweight Kubernetes in Docker
- [kubectl](https://kubernetes.io/docs/tasks/tools/) — Kubernetes CLI
- [docker](https://docker.com/) — container runtime

## Quick start

**Create a k3d cluster** with port mapping:

```sh
   k3d cluster create putout-editor -p "8080:80@loadbalancer"
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
```

This creates a single-node dev cluster and maps host port `8080` to the Traefik loadbalancer.
**Make sure a real GHCR image tag exists.** Push a tag to GitHub (e.g. `v0.1.0`) and wait for the`docker-release.yml` workflow to finish. Check the published packages at:<https://github.com/coderaiser/putout-editor/pkgs/container/putout-editor>
**Update the image tag** in `deploy/k8s/deployment.yaml`.Change `image:` to the tag you pushed (e.g. `v0.1.0`).
**Apply all manifests:**

```sh
   kubectl apply -f deploy/k8s/
```

**Confirm the pod is running:**

```sh
kubectl -n putout-editor get pods
```

Wait until `STATUS` shows `Running`.

**Open in browser:**<http://putout-editor.cloudcmd.io:8080>`*.localhost` resolves to `127.0.0.1` in every modern browser/OS,
no `/etc/hosts` edits needed.

## Private GHCR package

If the GHCR package is private (default is public unless changed),
add a Docker registry secret and reference it in `deployment.yaml`:

```sh
kubectl -n putout-editor create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username=<gh-username> \
  --docker-password=<gh-pat>
```

Then add `imagePullSecrets` to the pod spec in `deployment.yaml`:

```yaml
spec:
  imagePullSecrets:
    - name: ghcr-pull
```

## Teardown

```sh
k3d cluster delete putout-editor
```

## Adding another service

Same pattern — new directory, its own `namespace:` value matching its
repo/service name. No coordination needed between namespaces.
