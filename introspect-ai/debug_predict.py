import requests
import torch
from torchvision import datasets, transforms
from io import BytesIO

API_URL = "http://127.0.0.1:8000"

def debug():
    # Create a dummy image
    img = datasets.MNIST('./datasets', train=False, download=True)[0][0]
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    
    print("Sending request...")
    try:
        res = requests.post(f"{API_URL}/predict", files={"file": ("image.png", buf, "image/png")})
        try:
            detail = res.json()['detail']
            print(f"Error Detail: {detail}")
            with open("debug_error.txt", "w") as f:
                f.write(detail)
        except:
            print(f"Response Text: {res.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    debug()
