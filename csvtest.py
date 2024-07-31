import pandas as pd

# Load a small portion of the CSV to inspect
df = pd.read_csv('data/spotify_ord.csv', nrows=100)
print(df.head(10))