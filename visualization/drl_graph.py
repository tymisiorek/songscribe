from igraph import Graph, plot
import igraph as ig
import leidenalg
import numpy as np
from dotenv import load_dotenv
import os
import matplotlib.pyplot as plt
import pickle

load_dotenv()
DATASET_PATH = os.getenv("DATASET_PATH")

graph = ig.Graph.Read_GML(DATASET_PATH + 'collaboration_network.gml')
partition = leidenalg.find_partition(graph, leidenalg.ModularityVertexPartition)
graph.vs["membership"] = partition.membership

layout = graph.layout_drl()
palette = ig.RainbowPalette(n=np.max(partition.membership) + 1)
graph.vs["color"] = [palette.get(membership) for membership in graph.vs["membership"]]

plot(graph, layout=layout, vertex_size=5, edge_width=0.5, bbox=(2000, 2000), margin=20, target= DATASET_PATH + "collaboration_network.png")
graph.write_gml(DATASET_PATH + 'collaboration_network.gml')

with open(DATASET_PATH + "collaboration_network.pkl", "wb") as f:
    pickle.dump((graph, layout), f)