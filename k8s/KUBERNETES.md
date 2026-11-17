# Deploy on the local Minikube cluster

This deployment runs the four services in the repository:

`frontend -> backend -> shortlist-agent -> qdrant`

The frontend is exposed with a Minikube `NodePort`. The other services are
internal ClusterIP services. Qdrant data is stored in a 2 GiB PVC.

## 1. Check Minikube capacity

The shortlist agent loads PyTorch and a sentence-transformer model. The parser
also contains LibreOffice and OCR dependencies. A 2 GiB Minikube VM/container
may OOM during startup. If possible, recreate or resize Minikube with at least
4 GiB and 2 CPUs (6 GiB is more comfortable):

```sh
minikube stop
minikube start --driver=docker --cpus=2 --memory=4096
```

If the profile must be recreated, that deletes resources inside Minikube:

```sh
minikube delete
minikube start --driver=docker --cpus=2 --memory=4096
```

## 2. Create the API-key Secret

Run this from the repository root. The key is stored in Kubernetes as a
Secret and is not written into the manifest:

```sh
minikube kubectl -- create namespace resume-parser --dry-run=client -o yaml | \
  minikube kubectl -- apply -f -
minikube kubectl -- -n resume-parser create secret generic parser-backend-secret \
  --from-literal=GOOGLE_API_KEY='PASTE_YOUR_GOOGLE_API_KEY_HERE' \
  --dry-run=client -o yaml | minikube kubectl -- apply -f -
```

Do not commit the key or paste it into `k8s/app.yaml`.

## 3. Build the application images inside Minikube

Using `minikube image build` makes the images available to the Minikube node;
no registry is required:

```sh
minikube image build -t resume-parser-backend:local ./backend
minikube image build -t shortlist-agent:local ./shortlist_agent
minikube image build -t resume-parser-frontend:local ./frontend
```

The shortlist-agent and backend builds are large and can take several minutes.

## 4. Apply the workloads

```sh
minikube kubectl -- apply -f k8s/namespace.yaml -f k8s/app.yaml
minikube kubectl -- -n resume-parser get pods -w
```

Wait until all four pods show `Running` and `READY 1/1`. The shortlist agent
may take the longest because it downloads the embedding model on first start.

## 5. Open the application

```sh
minikube service frontend -n resume-parser --url
```

Open the printed URL in a browser. The frontend proxies `/api` to the backend
and `/shortlist` to the shortlist agent, so no backend or Qdrant port needs to
be exposed to the host.

Useful checks:

```sh
minikube kubectl -- -n resume-parser get pods,svc,pvc
minikube kubectl -- -n resume-parser logs deploy/backend
minikube kubectl -- -n resume-parser logs deploy/shortlist-agent
minikube kubectl -- -n resume-parser describe pod -l app=shortlist-agent
```

## Existing Qdrant data

The PVC starts empty. The shortlist agent creates its two collections on
startup, and jobs can then be created from the UI. If the existing local
`qdrant_storage/` data must be migrated, stop the Qdrant deployment before
copying it into the mounted PVC; do not copy into a live Qdrant database.

## Updating code

Rebuild the changed image and restart its deployment:

```sh
minikube image build -t resume-parser-backend:local ./backend
minikube kubectl -- -n resume-parser rollout restart deployment/backend
minikube kubectl -- -n resume-parser rollout status deployment/backend
```

Use the analogous deployment name for `frontend` or `shortlist-agent`.

## Remove the deployment

```sh
minikube kubectl -- delete namespace resume-parser
```

That deletes the application and the Qdrant PVC. Delete the namespace only if
you are intentionally removing the local vector data.
