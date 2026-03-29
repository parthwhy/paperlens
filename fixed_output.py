frommanim import *


class LoRALowRankAdaptation(Scene):
    def construct(self):
        # Title
        title = Text("LoRA: Low-Rank Adaptation", font_size=28, color=WHITE).to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1)

        # Description
        description = Text(
            "Instead of updating all weights,\nonly small matrices are trained.",
            font_size=18,
            color=GRAY_A,
        ).next_to(title, DOWN, buff=0.3)
        self.play(Write(description), run_time=1.5)

        # Full weight matrix box (left)
        full_box = Rectangle(width=2.5, height=2.5, color=RED).move_to(LEFT * 3 + DOWN * 0.5)
        full_box.set_z_index(1)
        full_label = Text("W (full)", font_size=16, color=RED).next_to(full_box, UP, buff=0.3)
        full_label.set_z_index(2)
        full_size = Text("d × d  (huge)", font_size=13, color=GRAY_A).next_to(full_box, DOWN, buff=0.3)
        full_size.set_z_index(2)
        self.play(Create(full_box), run_time=0.8)
        self.play(FadeIn(full_label), run_time=0.5)
        self.play(FadeIn(full_size), run_time=0.5)

        # Arrow
        arrow = Arrow(LEFT * 0.8 + DOWN * 0.5, RIGHT * 0.8 + DOWN * 0.5, color=WHITE)
        arrow.set_z_index(3)
        arrow_label = Text("LoRA replaces", font_size=13, color=YELLOW).next_to(arrow, UP, buff=0.3)
        arrow_label.set_z_index(4)
        self.play(GrowArrow(arrow), run_time=0.6)
        self.play(FadeIn(arrow_label), run_time=0.5)

        # Low-rank decomposition (right) — two thin matrices
        a_box = Rectangle(width=0.6, height=2.5, color=BLUE).move_to(RIGHT * 2.2 + DOWN * 0.5)
        a_box.set_z_index(1)
        a_label = Text("A", font_size=16, color=BLUE).next_to(a_box, UP, buff=0.3)
        a_label.set_z_index(2)
        a_size = Text("d×r", font_size=13, color=GRAY_A).next_to(a_box, DOWN, buff=0.3)
        a_size.set_z_index(2)

        b_box = Rectangle(width=2.5, height=0.6, color=GREEN).move_to(RIGHT * 3.8 + DOWN * 0.5)
        b_box.set_z_index(1)
        b_label = Text("B", font_size=16, color=GREEN).next_to(b_box, UP, buff=0.3)
        b_label.set_z_index(2)
        b_size = Text("r×d", font_size=13, color=GRAY_A).next_to(b_box, DOWN, buff=0.3)
        b_size.set_z_index(2)

        self.play(Create(a_box), run_time=0.6)
        self.play(FadeIn(a_label), run_time=0.4)
        self.play(FadeIn(a_size), run_time=0.4)
        self.play(Create(b_box), run_time=0.6)
        self.play(FadeIn(b_label), run_time=0.4)
        self.play(FadeIn(b_size), run_time=0.4)

        # Rank label
        rank_note = MathTex(r"r \ll d", font_size=22, color=YELLOW).move_to(RIGHT * 3 + UP * 1.8)
        rank_note.set_z_index(3)
        self.play(Write(rank_note), run_time=0.8)

        self.wait(1)

        # Formula
        formula = MathTex(
            r"\Delta W = A \cdot B",
            font_size=26, color=WHITE
        ).move_to(DOWN * 2.5)
        formula.set_z_index(3)
        self.play(Write(formula), run_time=1)

        # Conclusion
        self.wait(1)
        conclusion = Text(
            "Trains only A and B — reduces parameters by 10-10000×",
            font_size=16,
            color=GREEN,
        ).move_to(DOWN * 3.2)
        conclusion.set_z_index(3)
        self.play(FadeIn(conclusion), run_time=1)

        self.wait(2)