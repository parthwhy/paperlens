"""
Simulates exactly what manim_service._run_manim() does, 
so we can confirm the path logic and subprocess call work end-to-end.
"""
import sys
import subprocess
from pathlib import Path

SCRIPT_ID = "test_sim_abc123"
QUALITY_FLAG = "-ql"
QUALITY_SUBDIR = "480p15"

# 1. Write a simple manim script to manim_scripts/
scripts_dir = Path("manim_scripts")
scripts_dir.mkdir(exist_ok=True)
script_path = scripts_dir / f"{SCRIPT_ID}.py"
script_path.write_text('''from manim import *

class ConceptAnimation(Scene):
    def construct(self):
        t = Text("Pipeline Sim Test", font_size=40)
        self.play(Write(t))
        self.wait(1)
''')
print(f"[SIM] Script written to: {script_path}")

# 2. Build the command exactly as manim_service does
cmd = [sys.executable, "-m", "manim", QUALITY_FLAG, str(script_path), "ConceptAnimation"]
print(f"[SIM] Command: {' '.join(cmd)}")
print(f"[SIM] cwd: {Path.cwd()}")

# 3. Run it
proc = subprocess.run(cmd, capture_output=True, timeout=120)
stderr_text = proc.stderr.decode(errors="replace")
stdout_text = proc.stdout.decode(errors="replace")
print(f"[SIM] returncode: {proc.returncode}")
print(f"[SIM] stdout:\n{stdout_text[-500:]}")
print(f"[SIM] stderr (last 500 chars):\n{stderr_text[-500:]}")

# 4. Check expected path (exactly as _run_manim does it)
script_stem = script_path.stem
expected = Path("media") / "videos" / script_stem / QUALITY_SUBDIR / "ConceptAnimation.mp4"
print(f"\n[SIM] Looking for MP4 at: {expected}")
print(f"[SIM] Absolute path: {expected.resolve()}")
print(f"[SIM] MP4 exists: {expected.exists()}")

# Also scan what actually got produced
import glob
found = glob.glob(f"media/videos/{script_stem}/**/*.mp4", recursive=True)
print(f"[SIM] All MP4s produced under media/videos/{script_stem}/:")
for f in found:
    print(f"  {f}")
