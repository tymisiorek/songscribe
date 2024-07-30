from dotenv import load_dotenv
import os
import pandas as pd
import igraph as ig
import matplotlib.pyplot as plt
import random
import pickle
import json

load_dotenv()
DATASET_PATH = os.getenv("DATASET_PATH")
collab_path = os.path.join(os.path.dirname(__file__), '../frontend/static/')

with open(DATASET_PATH + "collaboration_network.pkl", "rb") as f:
    graph, layout = pickle.load(f)

def create_subset(graph, num_nodes):
    sampled_nodes = random.sample(graph.vs.indices, num_nodes)
    subgraph = graph.subgraph(sampled_nodes)
    nodes = [{"id": v.index, "label": v["name"], "group": v["membership"], "color": v["color"]} for v in subgraph.vs]
    edges = [{"source": e.source, "target": e.target} for e in subgraph.es]
    return {"nodes": nodes, "links": edges}

initial_subset = create_subset(graph, 50000) 
with open(collab_path + "network_initial.json", "w") as f:
    json.dump(initial_subset, f)
