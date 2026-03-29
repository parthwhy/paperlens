from manim import *

class ConceptAnimation(Scene):
    def construct(self):
        # Scene 1: Introduction to Neural Network
        title1 = Text("Step 1: Neural Network Structure", font_size=28).to_edge(UP)
        self.play(Write(title1))
        self.wait(0.5)
        
        # Create nodes with proper spacing
        input_nodes = VGroup(*[Circle(radius=0.3, color=BLUE).set_fill(BLUE, opacity=0.5) for _ in range(3)])
        input_nodes.arrange(DOWN, buff=0.8).shift(LEFT*3)
        input_label = Text("Input Layer", font_size=20).next_to(input_nodes, UP, buff=0.3)
        
        hidden_nodes = VGroup(*[Circle(radius=0.3, color=YELLOW).set_fill(YELLOW, opacity=0.5) for _ in range(4)])
        hidden_nodes.arrange(DOWN, buff=0.8)
        hidden_label = Text("Hidden Layer", font_size=20).next_to(hidden_nodes, UP, buff=0.3)
        
        output_nodes = VGroup(*[Circle(radius=0.3, color=ORANGE).set_fill(ORANGE, opacity=0.5) for _ in range(2)])
        output_nodes.arrange(DOWN, buff=0.8).shift(RIGHT*3)
        output_label = Text("Output Layer", font_size=20).next_to(output_nodes, UP, buff=0.3)
        
        # Create connections
        connections = VGroup()
        for inp in input_nodes:
            for hid in hidden_nodes:
                connections.add(Line(inp.get_center(), hid.get_center(), stroke_width=1, color=GRAY))
        for hid in hidden_nodes:
            for out in output_nodes:
                connections.add(Line(hid.get_center(), out.get_center(), stroke_width=1, color=GRAY))
        
        # Explanation text
        explanation1 = Text("Information flows from input through hidden layers to output", 
                           font_size=18).to_edge(DOWN)
        
        # Animate
        self.play(Create(connections), run_time=1)
        self.play(
            Create(input_nodes), Write(input_label),
            Create(hidden_nodes), Write(hidden_label),
            Create(output_nodes), Write(output_label),
            run_time=2
        )
        self.play(Write(explanation1))
        self.wait(1.5)
        
        # Clear scene
        scene1_objects = VGroup(title1, input_nodes, input_label, hidden_nodes, hidden_label, 
                               output_nodes, output_label, connections, explanation1)
        self.play(FadeOut(scene1_objects))
        self.wait(0.5)
        
        # Scene 2: Weights and Learning
        title2 = Text("Step 2: Weights Control Connections", font_size=28).to_edge(UP)
        self.play(Write(title2))
        self.wait(0.5)
        
        # Recreate simplified network
        node_a = Circle(radius=0.4, color=BLUE).set_fill(BLUE, opacity=0.5).shift(LEFT*2)
        node_b = Circle(radius=0.4, color=ORANGE).set_fill(ORANGE, opacity=0.5).shift(RIGHT*2)
        label_a = Text("A", font_size=24).move_to(node_a)
        label_b = Text("B", font_size=24).move_to(node_b)
        
        connection = Arrow(node_a.get_right(), node_b.get_left(), buff=0.1, stroke_width=3)
        weight_text = MathTex(r"w = 0.8", font_size=32).next_to(connection, UP, buff=0.3)
        
        explanation2 = Text("Each connection has a weight that determines signal strength", 
                           font_size=18).to_edge(DOWN)
        
        self.play(Create(node_a), Write(label_a))
        self.play(Create(connection), Write(weight_text))
        self.play(Create(node_b), Write(label_b))
        self.play(Write(explanation2))
        self.wait(1.5)
        
        # Show signal flow
        dot = Dot(color=YELLOW).move_to(node_a.get_center())
        self.play(Create(dot))
        self.play(MoveAlongPath(dot, connection), run_time=1.5)
        self.play(FadeOut(dot))
        self.wait(1)
        
        # Clear scene
        scene2_objects = VGroup(title2, node_a, node_b, label_a, label_b, 
                               connection, weight_text, explanation2)
        self.play(FadeOut(scene2_objects))
        self.wait(0.5)
        
        # Scene 3: Training Process
        title3 = Text("Step 3: Training Adjusts Weights", font_size=28).to_edge(UP)
        self.play(Write(title3))
        self.wait(0.5)
        
        # Show weight adjustment
        weight_initial = MathTex(r"w = 0.5", font_size=36).shift(UP)
        arrow_down = Arrow(weight_initial.get_bottom(), weight_initial.get_bottom() + DOWN*1.5, 
                          buff=0.1, color=GREEN)
        adjustment_label = Text("Gradient Descent", font_size=20, color=GREEN).next_to(arrow_down, RIGHT, buff=0.3)
        weight_final = MathTex(r"w = 0.3", font_size=36).shift(DOWN*1.5)
        
        explanation3 = Text("Weights are adjusted to minimize prediction error", 
                           font_size=18).to_edge(DOWN)
        
        self.play(Write(weight_initial))
        self.wait(0.5)
        self.play(Create(arrow_down), Write(adjustment_label))
        self.wait(0.5)
        self.play(Write(weight_final))
        self.play(Write(explanation3))
        self.wait(2)
        
        # Clear scene
        scene3_objects = VGroup(title3, weight_initial, arrow_down, adjustment_label, 
                               weight_final, explanation3)
        self.play(FadeOut(scene3_objects))
        self.wait(0.5)
        
        # Scene 4: Final Message
        final_title = Text("Neural Networks Learn Through Iteration", font_size=32)
        final_subtitle = Text("Adjusting weights to improve predictions", font_size=24).next_to(final_title, DOWN, buff=0.5)
        
        self.play(Write(final_title))
        self.play(FadeIn(final_subtitle, shift=UP*0.3))
        self.wait(2)
