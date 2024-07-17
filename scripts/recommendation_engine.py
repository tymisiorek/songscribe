import pandas as pd
import numpy as np
import json
import os
import re
import sys
from dotenv import load_dotenv

#env and track dataframe
load_dotenv()
DATASET_PATH = os.getenv("DATASET_PATH")
USER_DATA = os.getenv("FEATURES_PATH")
track_dataset = pd.read_csv(DATASET_PATH, "spotify_tracks_data.csv")
user_dataset = pd.read_csv(USER_DATA)
genres = set(list(track_dataset["track_genre"]))
print(genres)

