from manim import *

class ConceptAnimation(Scene):
    def construct(self):
        title = Text("Attention Mechanism", font_size=36)
        self.play(Write(title))
        self.wait(1)
        
        box1 = Rectangle(width=2, height=1, color=BLUE)
        box2 = Rectangle(width=2, height=1, color=GREEN)
        box1.shift(LEFT * 2)
        box2.shift(RIGHT * 2)
        
        label1 = Text("Query", font_size=24).move_to(box1)
        label2 = Text("Key", font_size=24).move_to(box2)
        
        arrow = Arrow(box1.get_right(), box2.get_left(), color=YELLOW)
        
        self.play(FadeOut(title))
        self.play(Create(box1), Create(box2))
        self.play(Write(label1), Write(label2))
        self.play(Create(arrow))
        self.wait(2)