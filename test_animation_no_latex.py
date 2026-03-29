from manim import *

class ConceptAnimation(Scene):
    def construct(self):
        # Scene 1: Introduction to Neural Network
        input_layer = VGroup(*[Circle(radius=0.3, color=BLUE) for _ in range(3)]).arrange(DOWN, buff=0.5)
        hidden_layer = VGroup(*[Circle(radius=0.3, color=BLUE) for _ in range(3)]).arrange(DOWN, buff=0.5).next_to(input_layer, RIGHT, buff=1)
        output_layer = VGroup(*[Circle(radius=0.3, color=BLUE) for _ in range(3)]).arrange(DOWN, buff=0.5).next_to(hidden_layer, RIGHT, buff=1)
        
        input_label = Text("Input", font_size=24).next_to(input_layer, DOWN)
        hidden_label = Text("Hidden Layer", font_size=24).next_to(hidden_layer, DOWN)
        output_label = Text("Output", font_size=24).next_to(output_layer, DOWN)
        
        connections = VGroup()
        for i in range(3):
            for j in range(3):
                connections.add(Arrow(input_layer[i].get_right(), hidden_layer[j].get_left(), buff=0.1))
                connections.add(Arrow(hidden_layer[i].get_right(), output_layer[j].get_left(), buff=0.1))
        
        self.play(Create(input_layer), Create(hidden_layer), Create(output_layer), Write(input_label), Write(hidden_label), Write(output_label))
        self.play(Create(connections))
        self.wait(1)
        
        # Scene 2: Information Flow and Weights (using Text instead of MathTex)
        weights = VGroup()
        for connection in connections:
            weight = Text("0.5", font_size=18).next_to(connection, UP, buff=0.1)
            weights.add(weight)
        
        self.play(connections.animate.set_color(PURPLE), Write(weights))
        self.wait(1)
        
        arrow = Arrow(ORIGIN, RIGHT).next_to(connections[0], UP)
        weight_label = Text("Adjustable during training", font_size=18).next_to(arrow, UP)
        self.play(Create(arrow), Write(weight_label))
        self.wait(1)
        
        # Scene 3: Attention Mechanism
        spotlight = Circle(radius=0.4, color=YELLOW).move_to(hidden_layer[1])
        attention_label = Text("Attention Mechanism", font_size=20).next_to(spotlight, UP)
        arrow_attention = Arrow(attention_label.get_bottom(), spotlight.get_top())
        
        self.play(Create(spotlight), Write(attention_label), Create(arrow_attention))
        self.wait(1)
        
        for i in range(3):
            connections[i*3+1].set_stroke(width=5, color=YELLOW)
            connections[i*3+1].set_color(YELLOW)
        
        self.play(connections.animate.set_opacity(0.3), connections[1].animate.set_opacity(1), connections[4].animate.set_opacity(1), connections[7].animate.set_opacity(1))
        self.wait(1)
        
        # Scene 4: Output and Conclusion
        output_node = output_layer[1]
        output_glow = Circle(radius=0.5, color=GREEN).move_to(output_node)
        output_label_final = Text("Output", font_size=20).next_to(output_node, DOWN)
        weighted_sum_label = Text("Weighted Sum", font_size=18).next_to(connections[4], DOWN)
        final_label = Text("Attention Mechanism in Machine Learning", font_size=28).to_edge(UP)
        
        self.play(Create(output_glow), Write(output_label_final), Write(weighted_sum_label))
        self.wait(1)
        self.play(Write(final_label))
        self.wait(2)
