import igraph as ig
import json
import numpy as np
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()
DATASET_PATH = os.getenv("DATASET_PATH")

nodes = pd.read_csv(DATASET_PATH + "nodes.csv")
edges = pd.read_csv(DATASET_PATH + "edges.csv")
popular_edges_path = DATASET_PATH + "popular_edges.csv"
popular_nodes_path = DATASET_PATH + "popular_nodes.csv"

popular__node_list = []
popular_node_ids = []
for index, row in nodes.iterrows():
    popularity = row["popularity"]
    chart = str(row["chart_hits"])
    rawchart = row["chart_hits"]
    if popularity >= 57:
        if pd.isna(rawchart) or "us" in chart:
            popular__node_list.append(row)
            popular_node_ids = row["spotify_id"]


edges = list(zip(edges["id_0"], edges["id_1"]))
cleaned_edges = []

for edge in edges:
    if edge[0] in popular_node_ids and edge[1] in popular_node_ids:
        cleaned_edges.append(edge)

popular__node_list = pd.DataFrame(popular__node_list)
popular_edge_list = pd.DataFrame(cleaned_edges)
popular__node_list.to_csv(popular_nodes_path)
popular_edge_list.to_csv(popular_edges_path)
