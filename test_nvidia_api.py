"""Test NVIDIA API to see available models"""
import asyncio
from openai import AsyncOpenAI

async def test_nvidia():
    client = AsyncOpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key="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"
    )
    
    # Try to list models
    try:
        models = await client.models.list()
        print("Available models:")
        for model in models.data:
            print(f"  - {model.id}")
    except Exception as e:
        print(f"Failed to list models: {e}")
    
    # Try the configured model
    try:
        print("\nTesting nvidia/llama-3.3-nemotron-super-49b-v1.5...")
        response = await client.chat.completions.create(
            model="nvidia/llama-3.3-nemotron-super-49b-v1.5",
            messages=[{"role": "user", "content": "Say hello"}],
            max_tokens=10
        )
        print(f"Success: {response.choices[0].message.content}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_nvidia())
