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

def remove_no_edges(node_df, edge_df):
    node_list = node_df["spotify_id"].values
    cleaned_nodes = []
    
    

node_df = create_node_df()
edge_df = create_edge_df()
