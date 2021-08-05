# Flagger

## Installation

Requires installation of flagger into the cluster, using helm.

```bash
> helm repo add flagger https://flagger.app
> kubectl apply -f --set selectorLabels=flaggerName https://raw.githubusercontent.com/fluxcd/flagger/main/artifacts/flagger/crd.yaml
customresourcedefinition.apiextensions.k8s.io/canaries.flagger.app created
customresourcedefinition.apiextensions.k8s.io/metrictemplates.flagger.app created
customresourcedefinition.apiextensions.k8s.io/alertproviders.flagger.app created
```
Requires a mesh, like istio: (Note that Flagger depends on Istio telemetry and Prometheus, 
if you're installing Istio with istioctl then you should be using the default profile.)

Note that c6o clusters already have istio with a compatible profile, but you will need to install grafana and prometheus
shown below. The command below assumes prometheus is installed into the istio-system namespace.

```bash
> helm upgrade -i flagger flagger/flagger --namespace=istio-system --set crd.create=false --set meshProvider=istio --set metricsServer=http://prometheus.istio-system:9090
Release "flagger" does not exist. Installing it now.
NAME: flagger
LAST DEPLOYED: Tue Jul 27 11:05:32 2021
NAMESPACE: istio-system
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
Flagger installed
```
Not sure what this does yet: (creates a flagger.yaml for some unknown purpose).
```bash
> helm fetch --untar --untardir . flagger/flagger && helm template flagger ./flagger --namespace=istio-system --set metricsServer=http://prometheus.istio-system:9090 > flagger.yaml
Install Grafana
helm upgrade -i flagger-grafana flagger/grafana --namespace=istio-system --set url=http://prometheus.istio-system:9090 --set user=admin --set password=change-me
Release "flagger-grafana" does not exist. Installing it now.
NAME: flagger-grafana
LAST DEPLOYED: Tue Jul 27 12:03:54 2021
NAMESPACE: istio-system
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
1. Run the port forward command:

kubectl -n istio-system port-forward svc/flagger-grafana 9091:80

2. Navigate to:

http://localhost:9091

> kubectl -n istio-system port-forward svc/flagger-grafana 9091:80
```

Add prometheus to istio-system
```bash
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.8/samples/addons/prometheus.yaml
```

## Configuration

This configuration works with the halyard-backend service. The intial configuration used from the getting started,
modified for halyard is in `k8s-flagger/halyard-backend-canary.yaml`
```bash
kk apply -n halyard -f k8s-flagger/halyard-backend-canary.yaml
```
Another more complicated example is in `k8s-flagger/halyard-backend-complex-canary.yaml`

First create a horizontal pod scaler and deploy a load tester?:

```bash
kubectl apply -k https://github.com/fluxcd/flagger//kustomize/podinfo?ref=main
kubectl apply -k https://github.com/fluxcd/flagger//kustomize/tester?ref=main
```
