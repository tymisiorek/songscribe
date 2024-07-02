import pandas as pd
import numpy as np
import json
import os
import re
import sys
from dotenv import load_dotenv
from sklearn.preprocessing import MinMaxScaler

#env and track dataframe
load_dotenv()
DATASET_PATH = os.getenv("DATASET_PATH")
track_dataset1 = pd.read_csv(DATASET_PATH + "spotify_tracks_data.csv")
track_dataset2 = pd.read_csv(DATASET_PATH + "spotify_tracks_data_2018.csv")
track_dataset3 = pd.read_csv(DATASET_PATH + "spotify_tracks_data_2019.csv")

#combine dataframes and drop genre (not consistent among datasets)
common_columns = track_dataset1.columns.intersection(track_dataset2.columns).intersection(track_dataset3.columns)
filtered_dataset1 = track_dataset1[common_columns]
filtered_dataset2 = track_dataset2[common_columns]
filtered_dataset3 = track_dataset3[common_columns]
merged_dataset = pd.concat([filtered_dataset1, filtered_dataset2, filtered_dataset3])
merged_dataset = merged_dataset.drop_duplicates(subset='track_id').reset_index(drop=True)

#minmax scale
song_features = ['popularity', 'danceability', 'energy', 'loudness', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo']
scaler = MinMaxScaler()
merged_dataset[song_features] = scaler.fit_transform(merged_dataset[song_features])



path = DATASET_PATH + "full_track_data.csv"
merged_dataset.to_csv(path)
