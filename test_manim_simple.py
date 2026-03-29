"""
Simple Manim Flow Test - No Paper Required
Tests just the LLM layers without needing an ingested paper
"""

import asyncio
from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax
from rich.markdown import Markdown
from groq import AsyncGroq
from openai import AsyncOpenAI
import os
from pathlib import Path
from dotenv import load_dotenv

console = Console()

async def test_simple_flow():
    """Test LLM layers without paper dependency"""
    
    console.print("\n[bold cyan]═══════════════════════════════════════════════════════════[/bold cyan]")
    console.print("[bold cyan]     MANIM LLM FLOW TEST (No Paper Required)              [/bold cyan]")
    console.print("[bold cyan]═══════════════════════════════════════════════════════════[/bold cyan]\n")
    
    # Load environment variables from .env file
    load_dotenv()
    console.print("[dim]✓ Loaded .env file[/dim]\n")
    
    # Get API keys
    groq_key = os.getenv("GROQ_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    
    if not groq_key:
        console.print("[bold red]Error: GROQ_API_KEY not found in environment[/bold red]")
        return
    
    # Initialize clients
    groq_client = AsyncGroq(api_key=groq_key)
    deepseek_client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=openrouter_key
    ) if openrouter_key else groq_client
    
    # Test concept
    concept = input("\n🎯 Enter concept to animate (or press Enter for 'Neural Network'): ").strip() or "Neural Network"
    
    # Simple context (no paper needed)
    context = f"""
    A {concept} is a computational model inspired by biological neural networks.
    It consists of interconnected nodes (neurons) organized in layers.
    Information flows from input layer through hidden layers to output layer.
    Each connection has a weight that is adjusted during training.
    """
    
    console.print(f"\n[bold green]Testing with concept:[/bold green] {concept}\n")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LAYER 1: Scene Planning (Groq)
    # ═══════════════════════════════════════════════════════════════════════════
    
    console.print("\n[bold yellow]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/bold yellow]")
    console.print("[bold yellow]LAYER 1: Scene Planning with Groq (llama-3.3-70b)[/bold yellow]")
    console.print("[bold yellow]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/bold yellow]\n")
    
    try:
        console.print("🎬 Generating visual storyboard...")
        
        plan_response = await groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "system",
                "content": "You are an expert at explaining concepts visually. Describe a 3-5 scene Manim animation storyboard in plain English. Be specific: what shapes, arrows, labels, transitions. No code."
            }, {
                "role": "user",
                "content": f"Concept: {concept}\n\nContext:\n{context}\n\nWrite a clear visual storyboard for a 20-30 second animation."
            }],
            temperature=0.3,
            max_tokens=500
        )
        scene_plan = plan_response.choices[0].message.content
        
        console.print(f"\n[bold green]✓ Storyboard Generated![/bold green]\n")
        console.print(Panel(
            Markdown(scene_plan),
            title="Visual Storyboard (Plain English)",
            border_style="green"
        ))
        
        console.print(f"\n[dim]Model: {plan_response.model}[/dim]")
        console.print(f"[dim]Tokens: {plan_response.usage.total_tokens}[/dim]")
        
    except Exception as e:
        console.print(f"[bold red]✗ Error in Layer 1: {e}[/bold red]")
        return
    
    input("\n[dim]Press Enter to continue to Layer 2...[/dim]")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LAYER 2: Code Generation (DeepSeek V3 or Groq fallback)
    # ═══════════════════════════════════════════════════════════════════════════
    
    console.print("\n[bold yellow]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/bold yellow]")
    model_name = "DeepSeek V3" if openrouter_key else "Groq (fallback)"
    console.print(f"[bold yellow]LAYER 2: Code Generation with {model_name}[/bold yellow]")
    console.print("[bold yellow]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/bold yellow]\n")
    
    try:
        console.print("💻 Converting storyboard to Manim Python code...")
        
        code_model = "deepseek/deepseek-chat" if openrouter_key else "llama-3.3-70b-versatile"
        
        code_response = await deepseek_client.chat.completions.create(
            model=code_model,
            messages=[{
                "role": "system",
                "content": """You are a Manim Community Edition v0.18 expert. Convert JSON scene plans into complete, runnable Python animation scripts.

ABSOLUTE RULES:
1. Class MUST be named `ConceptAnimation` and extend `Scene`
2. `from manim import *` is the ONLY import — no os, no sys, no external libs
3. Every visual change needs self.play() — never mutate objects silently
4. Use self.wait() between scenes for pacing
5. Use MathTex() for ALL equations/formulas — never Text() for math
6. Keep all objects within frame: use .to_edge(), .shift(), .move_to(), .next_to()
7. After creating multiple related objects wrap them: group = VGroup(a, b, c)
8. Return ONLY raw Python code — no markdown fences, no comments explaining the plan

CLARITY & PACING REQUIREMENTS:
9. Add explanatory text labels for EVERY major step — tell the viewer what they're seeing
10. Use descriptive Text() objects to narrate the process (e.g., "Step 1: Initialize inputs", "Computing attention scores")
11. Space objects generously — minimum 1.0 unit between major elements, use buff=0.5 or higher
12. Time animations properly:
   - Use self.wait(1.5) after introducing new concepts
   - Use self.wait(0.5) between related steps
   - Use self.wait(2) before transitioning to next major scene
   - Never rush — viewer needs time to read text and understand visuals
13. Clear the screen between major scenes: self.play(FadeOut(VGroup(*self.mobjects))) before starting new scene
14. Prevent overlaps:
   - Check object positions before placing new elements
   - Use .next_to() with proper buff parameter instead of absolute positioning
   - Arrange related objects in VGroup with .arrange(RIGHT/DOWN, buff=0.8)
   - Keep text labels away from visual elements (buff >= 0.3)

LAYOUT RULES:
- Title: always Text(..., font_size=36).to_edge(UP)
- Step labels: Text("Step X: ...", font_size=24).to_edge(UP).shift(DOWN*0.5) — clear, readable narration
- Main objects: center or CENTER + slight UP shift, with generous spacing (buff >= 0.8)
- Labels under objects: label.next_to(obj, DOWN, buff=0.3)
- Process flow (A→B→C): arrange LEFT to RIGHT with Arrow() between, buff=1.5 minimum
- Explanation text: Text(..., font_size=20).to_edge(DOWN) — describe what's happening
- Before moving to next scene: self.play(FadeOut(VGroup(*self.mobjects))), then self.wait(0.5)"""
            }, {
                "role": "user",
                "content": f"Convert this storyboard to Manim code:\n\n{scene_plan}\n\nCreate a clear, well-paced educational animation with step labels and explanations."
            }],
            temperature=0.2,
            max_tokens=2000
        )
        
        manim_code = code_response.choices[0].message.content.strip()
        
        # Clean up markdown if present
        if manim_code.startswith("```"):
            lines = manim_code.split("\n")
            manim_code = "\n".join(lines[1:])
        if manim_code.endswith("```"):
            lines = manim_code.split("\n")
            manim_code = "\n".join(lines[:-1])
        
        # Ensure correct class name
        if "class ConceptAnimation" not in manim_code:
            manim_code = manim_code.replace("class Scene", "class ConceptAnimation")
            manim_code = manim_code.replace("class Animation", "class ConceptAnimation")
        
        console.print(f"\n[bold green]✓ Manim Code Generated![/bold green]\n")
        console.print(Panel(
            Syntax(manim_code, "python", theme="monokai", line_numbers=True),
            title="Generated Manim Python Script",
            border_style="green"
        ))
        
        console.print(f"\n[dim]Model: {code_response.model if hasattr(code_response, 'model') else code_model}[/dim]")
        if hasattr(code_response, 'usage'):
            console.print(f"[dim]Tokens: {code_response.usage.total_tokens}[/dim]")
        
        # Save to file
        test_script_path = Path("./test_animation.py")
        test_script_path.write_text(manim_code)
        console.print(f"\n[dim]💾 Saved to: {test_script_path}[/dim]")
        
    except Exception as e:
        console.print(f"[bold red]✗ Error in Layer 2: {e}[/bold red]")
        import traceback
        console.print(f"[dim]{traceback.format_exc()}[/dim]")
        return
    
    input("\n[dim]Press Enter to continue to Layer 3...[/dim]")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LAYER 3: Manim Rendering (Subprocess)
    # ═══════════════════════════════════════════════════════════════════════════
    
    console.print("\n[bold yellow]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/bold yellow]")
    console.print("[bold yellow]LAYER 3: Manim Rendering (Subprocess)[/bold yellow]")
    console.print("[bold yellow]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/bold yellow]\n")
    
    render_choice = input("🎥 Do you want to render the animation? (y/n): ").strip().lower()
    
    if render_choice == 'y':
        try:
            console.print("\n🎬 Starting Manim render process...")
            console.print("[dim]This may take 30-120 seconds...[/dim]\n")
            
            quality_flag = "-ql"  # Low quality for testing
            cmd = [
                "manim",
                quality_flag,
                str(test_script_path),
                "ConceptAnimation",
            ]
            
            console.print(f"[dim]Command: {' '.join(cmd)}[/dim]\n")
            
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Show live output
            console.print("[dim]Rendering...[/dim]")
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
            
            if proc.returncode == 0:
                console.print(f"\n[bold green]✓ Rendering Complete![/bold green]")
                
                # Find the output video
                script_stem = test_script_path.stem
                expected_path = Path("media") / "videos" / script_stem / "480p15" / "ConceptAnimation.mp4"
                
                if expected_path.exists():
                    console.print(f"\n[bold green]✓ Video created successfully![/bold green]")
                    console.print(f"📹 Location: {expected_path}")
                    console.print(f"📊 Size: {expected_path.stat().st_size / 1024:.1f} KB")
                    
                    console.print("\n[bold]Manim Output (last 1000 chars):[/bold]")
                    console.print(Panel(stdout.decode()[-1000:], border_style="blue"))
                else:
                    console.print(f"[yellow]⚠ Render succeeded but video not found at expected location[/yellow]")
                    console.print(f"Expected: {expected_path}")
                    console.print("\n[bold]Full Output:[/bold]")
                    console.print(Panel(stdout.decode(), border_style="yellow"))
            else:
                console.print(f"\n[bold red]✗ Rendering Failed![/bold red]")
                console.print(f"Return code: {proc.returncode}")
                console.print("\n[bold]Error Output:[/bold]")
                console.print(Panel(stderr.decode(), border_style="red"))
                
        except asyncio.TimeoutError:
            console.print(f"[bold red]✗ Rendering timed out after 120 seconds[/bold red]")
            proc.kill()
        except Exception as e:
            console.print(f"[bold red]✗ Error in Layer 3: {e}[/bold red]")
            import traceback
            console.print(f"[dim]{traceback.format_exc()}[/dim]")
    else:
        console.print("\n[dim]Skipping render. You can manually run:[/dim]")
        console.print(f"[dim]  manim -ql {test_script_path} ConceptAnimation[/dim]")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # Summary
    # ═══════════════════════════════════════════════════════════════════════════
    
    console.print("\n[bold cyan]═══════════════════════════════════════════════════════════[/bold cyan]")
    console.print("[bold cyan]                    FLOW COMPLETE                          [/bold cyan]")
    console.print("[bold cyan]═══════════════════════════════════════════════════════════[/bold cyan]\n")
    
    console.print("[bold green]Summary of Layers:[/bold green]")
    console.print("  1. ✓ Groq generated visual storyboard")
    console.print(f"  2. ✓ {model_name} converted to Manim code")
    if render_choice == 'y':
        console.print("  3. ✓ Manim rendered animation to MP4")
    else:
        console.print("  3. ⊘ Manim rendering skipped")
    
    console.print("\n[bold]Files Created:[/bold]")
    console.print(f"  • test_animation.py (Manim script)")
    if render_choice == 'y':
        try:
            if expected_path.exists():
                console.print(f"  • {expected_path} (MP4 video)")
        except:
            pass
    
    console.print("\n[dim]Test complete! 🎉[/dim]\n")


if __name__ == "__main__":
    asyncio.run(test_simple_flow())
