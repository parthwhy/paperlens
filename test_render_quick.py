from manim import *

class ConceptAnimation(Scene):
    def construct(self):
        title = Text("Attention Mechanism", font_size=36).to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        q = Circle(radius=0.5, color=BLUE).shift(LEFT*3)
        k = Circle(radius=0.5, color=BLUE).shift(ORIGIN)
        v = Circle(radius=0.5, color=ORANGE).shift(RIGHT*3)
        q_label = Text("Q", font_size=28).move_to(q)
        k_label = Text("K", font_size=28).move_to(k)
        v_label = Text("V", font_size=28).move_to(v)
        self.play(Create(VGroup(q, k, v)), Write(VGroup(q_label, k_label, v_label)))
        self.wait(1)

        formula = MathTex(r"\text{score} = \frac{QK^T}{\sqrt{d_k}}", font_size=32).shift(DOWN*2)
        self.play(Write(formula))
        self.wait(1.5)

        self.play(FadeOut(VGroup(q, k, v, q_label, k_label, v_label, formula)))
        output = Text("Done!", font_size=36, color=GREEN)
        self.play(Write(output))
        self.wait(1)
