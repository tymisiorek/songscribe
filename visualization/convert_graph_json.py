import igraph as ig
import json
import numpy as np
import pickle
import os
from dotenv import load_dotenv

load_dotenv()
DATASET_PATH = os.getenv("DATASET_PATH")

with open (DATASET_PATH + "collaboration_network.pkl", "rb") as f:
    graph, layout = pickle.load(f)

nodes = [{"id": v.index, "label": v["name"], "group": v["membership"], "color": v["color"]} for v in graph.vs]
edges = [{"source": e.source, "target": e.target} for e in graph.es]

graph_json = {"nodes": nodes, "links": edges}

with open("collaboration_network.json", "w") as f:
    json.dump(graph_json,f)