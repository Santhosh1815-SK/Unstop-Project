import urllib.request
import json

try:
    print("Testing /api/evaluations/1 ...")
    req = urllib.request.Request("http://127.0.0.1:8000/api/evaluations/1")
    with urllib.request.urlopen(req) as response:
        print(response.status)
        data = json.loads(response.read().decode())
        print(f"Eval 1 Score: {data.get('overall_score')}")

    print("Testing /api/regression/compare?v1=1&v2=2 ...")
    req = urllib.request.Request("http://127.0.0.1:8000/api/regression/compare?v1=1&v2=2")
    with urllib.request.urlopen(req) as response:
        print(response.status)
        data = json.loads(response.read().decode())
        print(f"Regression detected: {data.get('score_regression')}")
except Exception as e:
    print(e)
