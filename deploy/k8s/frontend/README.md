# Frontend deploy scaffolding

> Note: 이 디렉터리는 Kubernetes 예시 산출물이다. 현재 운영 명세서 v1.0의 확정 인프라는 ECS(Fargate)이며, 본 디렉터리는 현행 운영 기준이 아니다.

## Included
- `deployment.yaml` : legacy Kubernetes Deployment 예시
- `service.yaml` : legacy Kubernetes Service 예시
- `ingress.yaml` : legacy ALB Ingress 예시
- `service-lb.yaml` : legacy LoadBalancer Service 예시
- `rollout-bluegreen.yaml` : legacy Argo Rollouts 예시

## Replace before deploy
- `<AWS_ACCOUNT_ID>`
- `frontend.example.com`
- region/repository names if needed

## Apply (legacy example)
```bash
kubectl apply -f deploy/k8s/frontend/deployment.yaml
kubectl apply -f deploy/k8s/frontend/service.yaml
kubectl apply -f deploy/k8s/frontend/ingress.yaml
```

## Apply (legacy blue/green example)
```bash
kubectl apply -f deploy/k8s/frontend/rollout-bluegreen.yaml
```

> Note: 이 Blue/Green 예시는 Argo Rollouts CRD/controller가 필요한 legacy 예시다.
