import requests

OPENROUTER_API_KEY = "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"  # your key
broken_code="""<class 'transformers.tokenization_utils_base.BatchEncoding'> torch.Size([1, 50]) ```python from manim import *  class LoRALowRankAdaptation(Scene):     def construct(self):         # Title         title = Text("LoRA: Low-Rank Adaptation", font_size=24, color=WHITE).to_edge(UP, buff=0.5)         self.play(Write(title), run_time=1)          # Description         description = Text(             "Instead of updating all weights,\nonly small matrices are trained.",             font_size=16,             color=GRAY_A,             t2c={"small matrices": BLUE},         ).next_to(title, DOWN, buff=0.3)         self.play(Write(description), run_time=1.5)          # Neural Network Representation         nn_title = Text("Neural Network", font_size=18, color=BLUE).move_to(LEFT * 2.5 + UP * 1.5)         self.play(FadeIn(nn_title), run_time=0.5)          # Full Weight Matrix         full_weight = MathTex(r"W_{\text{full}}", font_size=20, color=RED).move_to(RIGHT * 2.5 + UP * 1.5)         self.play(FadeIn(full_weight), run_time=0.5)          # Rank-1 Approximation         rank_1_approx = MathTex(r"W_{\text{rank-1}} \approx W_{\text{full}}", font_size=16, color=GREEN).move_to(RIGHT * 2.5 + DOWN * 0.5)         self.play(Write(rank_1_approx), run_time=1)          # Update Only Small Matrices         update_small_matrices = Text(             "Update only small matrices",             font_size=16,             color=ORANGE,             t2c={"small matrices": ORANGE}         ).move_to(LEFT * 2.5 + DOWN * 0.5)         self.play(Transform(rank_1_approx, update_small_matrices), run_time=1)          # Visualization of the process         self.wait(2)          # Conclusion         conclusion = Text(             "Efficient and effective for fine-tuning models.\nReduces computational cost and memory usage.",             font_size=16,             color=GRAY_A,             t2c={"efficient": GREEN, "effective": BLUE, "fine-tuning": PURPLE, " """
def fix_manim_code(broken_code: str) -> str:
    prompt = f"""You are a Manim expert. The following Manim code has these issues:
- Overlapping animations (objects rendering on top of each other)
- Blank rectangles appearing unexpectedly
- Possible z_index and buff spacing problems

Fix ALL of these issues. Rules:
- Use self.play() calls sequentially, not simultaneously where objects overlap
- Add proper buff spacing between objects (minimum buff=0.3)
- Set z_index explicitly where needed to control layering
- Replace any SurroundingRectangle or BackgroundRectangle that appears blank with properly styled ones (set fill_opacity, color explicitly)
- Do NOT change the concept being visualized
- Return ONLY the corrected Python code, no explanation

BROKEN CODE:
{broken_code}"""

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "nvidia/nemotron-3-super-120b-a12b:free",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1
        }
    )

    data = response.json()
    if "choices" not in data:
        raise RuntimeError(f"API error: {data}")

    content = data["choices"][0]["message"]["content"]
    
    # strip markdown fences if model wraps in ```python
    if "```python" in content:
        content = content.split("```python")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]
    
    return content.strip()


# --- usage ---
with open("testmanim.py", "r") as f:
    bad_code = f.read()

fixed = fix_manim_code(bad_code)

with open("fixed_output.py", "w") as f:
    f.write(fixed)

print("Done. Run: manim -pql fixed_output.py <SceneName>")