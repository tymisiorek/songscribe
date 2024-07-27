from dotenv import load_dotenv
import os
import pandas as pd
import igraph as ig
import matplotlib.pyplot as plt

#load environment variable files
load_dotenv()
DATASET_PATH = os.getenv("DATASET_PATH")

def create_node_df():
    node_path = DATASET_PATH + "nodes.csv"
    node_df = pd.read_csv(node_path)
    return node_df

def create_edge_df():
    edge_path = DATASET_PATH + "edges.csv"
    edge_df = pd.read_csv(edge_path)
    return edge_df

def retrieve_names(node_df):
    name_dict = {}
    for index, row in node_df.iterrows():
        id = row["spotify_id"]
        name = row["name"]
        name_dict[id] = name
    return name_dict

def retrieve_popularity(node_df):
    popularity_dict = {}
    for index, row in node_df.iterrows():
        id = row["spotify_id"]
        popularity = row["popularity"]
        popularity_dict[id] = popularity
    return popularity_dict

def retrieve_genres(node_df):
    genre_dict = {}
    for index, row in node_df.iterrows():
        id = row["spotify_id"]
        genre = row["genres"]
        genre_dict[id] = genre
    return genre_dict

def assemble_network(node_df, edge_df):
    graph = ig.Graph()
    num_vertices = node_df["spotify_id"].unique()
    graph.add_vertices(num_vertices)
    
    edges = list(zip(edge_df["id_0"], edge_df["id_1"]))
    cleaned_edges = []
    
    for edge in edges:
        if edge[0] in node_df["spotify_id"].values and edge[1] in node_df["spotify_id"].values:
            cleaned_edges.append(edge)
    
    batch_size = 10000  # Batch size for adding edges
    for i in range(0, len(cleaned_edges), batch_size):
        graph.add_edges(cleaned_edges[i:i+batch_size])
        print(f"Added {min(i+batch_size, len(cleaned_edges))} edges out of {len(cleaned_edges)}")
    
    layout = graph.layout('fr')
    ig.plot(
        graph,
        layout=layout,
        vertex_size=2,
        vertex_color='skyblue',
        edge_width=1,
        edge_color='gray',
        bbox=(1000, 1000)  # Reduced plot size
    ).save(DATASET_PATH + 'collaboration_network.png')
    graph.write_gml(DATASET_PATH + 'collaboration_network.gml')
    
    
node_df = create_node_df()
edge_df = create_edge_df()
assemble_network(node_df, edge_df)