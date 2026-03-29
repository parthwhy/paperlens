"""
Test Manim Service Flow - Step by Step
Shows output at each layer of the animation generation pipeline
"""

import asyncio
import json
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax
from rich.markdown import Markdown
from dotenv import load_dotenv

console = Console()

async def test_manim_flow():
    """Test the complete Manim service flow with detailed output"""
    
    # Load environment variables from .env file
    load_dotenv()
    console.print("[dim]✓ Loaded .env file[/dim]\n")
    
    # Setup
    from app.manim_service import ManimService
    from app.ingestion import PaperIngestionService
    from app.config import settings
    
    console.print("\n[bold cyan]═══════════════════════════════════════════════════════════[/bold cyan]")
    console.print("[bold cyan]        MANIM SERVICE FLOW TEST - LAYER BY LAYER          [/bold cyan]")
    console.print("[bold cyan]═══════════════════════════════════════════════════════════[/bold cyan]\n")
    
    # Initialize services
    ingestion_service = PaperIngestionService()
    manim_service = ManimService(ingestion_service)
    
    # Test parameters
    paper_id = input("\n📄 Enter paper_id (or press Enter for 'attention_paper'): ").strip() or "attention_paper"
    concept = input("🎯 Enter concept to animate (or press Enter for 'Attention Mechanism'): ").strip() or "Attention Mechanism"
    
    console.print(f"\n[bold green]Testing with:[/bold green]")
    console.print(f"  Paper ID: {paper_id}")
    console.print(f"  Concept: {concept}\n")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LAYER 1: Paper Analysis (Gemini)
    # ═══════════════════════════════════════════════════════════════════════════
    
    console.print("\n[bold yellow]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/bold yellow]")
    console.print("[bold yellow]LAYER 1: Paper Analysis with Gemini 2.0 Flash[/bold yellow]")
    console.print("[bold yellow]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/bold yellow]\n")
    
    try:
        console.print("📡 Calling Gemini API to analyze entire paper...")
        analysis = await manim_service._analyze_paper_with_gemini(paper_id)
        
        console.print(f"\n[bold green]✓ Analysis Complete![/bold green]")
        console.print(f"  • Found {len(analysis['concepts'])} concepts")
        console.print(f"  • Found {len(analysis['edges'])} relationships\n")
        
        # Show first 3 concepts
        console.print("[bold]Sample Concepts:[/bold]")
        for i, c in enumerate(analysis['concepts'][:3], 1):
            console.print(Panel(
                f"[cyan]ID:[/cyan] {c['id']}\n"
                f"[cyan]Label:[/cyan] {c['label']}\n"
                f"[cyan]Type:[/cyan] {c['type']}\n"
                f"[cyan]Explanation:[/cyan] {c['explanation']}\n"
                f"[cyan]Visual Hint:[/cyan] {c['visual_hint']}\n"
                f"[cyan]Frequency:[/cyan] {c['frequency']}/10",
                title=f"Concept {i}",
                border_style="blue"
            ))
        
        # Find our target concept
        concept_data = next(
            (c for c in analysis["concepts"]
             if c["label"].lower() == concept.lower()
             or c["id"] == concept.lower().replace(" ", "_")),
            None
        )
        
        if concept_data:
            console.print(f"\n[bold green]✓ Found target concept in analysis![/bold green]")
            console.print(Panel(
                f"[cyan]Label:[/cyan] {concept_data['label']}\n"
                f"[cyan]Explanation:[/cyan] {concept_data['explanation']}\n"
                f"[cyan]Visual Hint:[/cyan] {concept_data['visual_hint']}",
                title=f"Target: {concept}",
                border_style="green"
            ))
            context = (
                f"Concept: {concept_data['label']}\n"
                f"Explanation: {concept_data['explanation']}\n"
                f"Visual hint: {concept_data['visual_hint']}"
            )
        else:
            console.print(f"\n[yellow]⚠ Concept not found in Gemini analysis, using RAG fallback...[/yellow]")
            context = manim_service._get_context(paper_id, concept)
            console.print(Panel(context[:500] + "...", title="RAG Context", border_style="yellow"))
        
    except Exception as e:
        console.print(f"[bold red]✗ Error in Layer 1: {e}[/bold red]")
        return
    
    input("\n[dim]Press Enter to continue to Layer 2...[/dim]")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LAYER 2: Scene Planning (Groq)
    # ═══════════════════════════════════════════════════════════════════════════
    
    console.print("\n[bold yellow]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/bold yellow]")
    console.print("[bold yellow]LAYER 2: Scene Planning with Groq (llama-3.3-70b)[/bold yellow]")
    console.print("[bold yellow]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/bold yellow]\n")
    
    try:
        console.print("🎬 Generating visual storyboard...")
        
        plan_response = await manim_service.client.chat.completions.create(
            model=settings.groq_model,
            messages=[{
                "role": "system",
                "content": "You are an expert at explaining research paper concepts visually. Describe a 3-5 scene Manim animation storyboard in plain English. Be specific: what shapes, arrows, labels, transitions. No code."
            }, {
                "role": "user",
                "content": f"Concept: {concept}\n\nPaper context:\n{context[:1000]}\n\nWrite a clear visual storyboard."
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
        
    except Exception as e:
        console.print(f"[bold red]✗ Error in Layer 2: {e}[/bold red]")
        return
    
    input("\n[dim]Press Enter to continue to Layer 3...[/dim]")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LAYER 3: Code Generation (DeepSeek V3)
    # ═══════════════════════════════════════════════════════════════════════════
    
    console.print("\n[bold yellow]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/bold yellow]")
    console.print("[bold yellow]LAYER 3: Code Generation with DeepSeek V3[/bold yellow]")
    console.print("[bold yellow]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/bold yellow]\n")
    
    try:
        console.print("💻 Converting storyboard to Manim Python code...")
        
        code_response = await manim_service.deepseek_client.chat.completions.create(
            model=settings.deepseek_model,
            messages=[{
                "role": "system",
                "content": "You are a Manim Community Edition expert. Convert animation storyboards into working Python code. Return ONLY executable Python code, no markdown, no explanation."
            }, {
                "role": "user",
                "content": f"Convert this storyboard to Manim code:\n\n{scene_plan}\n\nRules: class named ConceptAnimation(Scene), only use Text/Arrow/Rectangle/Circle/MathTex, under 30 seconds, no external imports."
            }],
            temperature=0.2,
            max_tokens=1500
        )
        
        manim_code = code_response.choices[0].message.content.strip()
        
        # Clean up markdown if present
        if manim_code.startswith("```"):
            manim_code = "\n".join(manim_code.split("\n")[1:])
        if manim_code.endswith("```"):
            manim_code = "\n".join(manim_code.split("\n")[:-1])
        if "class ConceptAnimation" not in manim_code:
            manim_code = manim_code.replace("class Scene", "class ConceptAnimation")
        
        console.print(f"\n[bold green]✓ Manim Code Generated![/bold green]\n")
        console.print(Panel(
            Syntax(manim_code, "python", theme="monokai", line_numbers=True),
            title="Generated Manim Python Script",
            border_style="green"
        ))
        
        # Save to file
        test_script_path = Path("./test_animation.py")
        test_script_path.write_text(manim_code)
        console.print(f"\n[dim]💾 Saved to: {test_script_path}[/dim]")
        
    except Exception as e:
        console.print(f"[bold red]✗ Error in Layer 3: {e}[/bold red]")
        return
    
    input("\n[dim]Press Enter to continue to Layer 4...[/dim]")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LAYER 4: Manim Rendering (Subprocess)
    # ═══════════════════════════════════════════════════════════════════════════
    
    console.print("\n[bold yellow]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[/bold yellow]")
    console.print("[bold yellow]LAYER 4: Manim Rendering (Subprocess)[/bold yellow]")
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
                    
                    console.print("\n[bold]Manim Output:[/bold]")
                    console.print(Panel(stdout.decode()[-1000:], border_style="blue"))
                else:
                    console.print(f"[yellow]⚠ Render succeeded but video not found at expected location[/yellow]")
                    console.print(f"Expected: {expected_path}")
            else:
                console.print(f"\n[bold red]✗ Rendering Failed![/bold red]")
                console.print("\n[bold]Error Output:[/bold]")
                console.print(Panel(stderr.decode()[-1000:], border_style="red"))
                
        except asyncio.TimeoutError:
            console.print(f"[bold red]✗ Rendering timed out after 120 seconds[/bold red]")
            proc.kill()
        except Exception as e:
            console.print(f"[bold red]✗ Error in Layer 4: {e}[/bold red]")
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
    console.print("  1. ✓ Gemini analyzed paper → extracted concepts")
    console.print("  2. ✓ Groq generated visual storyboard")
    console.print("  3. ✓ DeepSeek converted to Manim code")
    if render_choice == 'y':
        console.print("  4. ✓ Manim rendered animation to MP4")
    else:
        console.print("  4. ⊘ Manim rendering skipped")
    
    console.print("\n[bold]Files Created:[/bold]")
    console.print(f"  • test_animation.py (Manim script)")
    if render_choice == 'y' and expected_path.exists():
        console.print(f"  • {expected_path} (MP4 video)")
    
    console.print("\n[dim]Test complete! 🎉[/dim]\n")


if __name__ == "__main__":
    asyncio.run(test_manim_flow())
