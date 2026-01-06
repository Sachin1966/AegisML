import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

with open("models.txt", "w") as f:
    f.write("Listing models...\n")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            f.write(f"Name: {m.name}\n")
            print(f"Name: {m.name}")
