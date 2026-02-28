# Frontend deploy scaffolding

## Included
- `deployment.yaml` : standard Deployment
- `service.yaml` : ClusterIP service (Ingress backend)
- `ingress.yaml` : ALB Ingress (EKS + AWS Load Balancer Controller)
- `service-lb.yaml` : direct LoadBalancer service option
- `rollout-bluegreen.yaml` : Argo Rollouts Blue/Green example

## Replace before deploy
- `<AWS_ACCOUNT_ID>`
- `frontend.example.com`
- region/repository names if needed

## Apply (basic)
```bash
kubectl apply -f deploy/k8s/frontend/deployment.yaml
kubectl apply -f deploy/k8s/frontend/service.yaml
kubectl apply -f deploy/k8s/frontend/ingress.yaml
```

## Apply (blue/green with Argo Rollouts)
```bash
kubectl apply -f deploy/k8s/frontend/rollout-bluegreen.yaml
```

> Note: Blue/Green file requires Argo Rollouts CRD/controller installed.
