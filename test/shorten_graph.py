import pandas as pd
from dotenv import load_dotenv
import os
import pandas as pd
import igraph as ig
import matplotlib.pyplot as plt


load_dotenv()
DATASET_PATH = os.getenv("DATASET_PATH")
popular_node_path = DATASET_PATH + "popular_nodes.csv"
popular_edge_path = DATASET_PATH + "popular_edges.csv"
nodes = pd.read_csv(DATASET_PATH + "nodes.csv")
edges = pd.read_csv(DATASET_PATH + "edges.csv")

popular_nodes = []
popular_edges = []
for index, row in nodes.iterrows():
    if row["popularity"] >= 50:
        popular_nodes.append(row)
popular_nodes = pd.DataFrame(popular_nodes)
print(popular_nodes.shape)

for index, row in edges.iterrows():
    if row["id_0"] in popular_nodes['spotify_id'].values and row['id_1'] in popular_nodes['spotify_id'].values:
        popular_edges.append(row)
popular_edges = pd.DataFrame(popular_edges)
print(popular_edges.shape)

popular_nodes.to_csv(popular_node_path, index = False)
popular_edges.to_csv(popular_edge_path, index = False)
