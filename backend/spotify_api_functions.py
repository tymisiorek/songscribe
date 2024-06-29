from dotenv import load_dotenv
import os
import base64
import requests
import json
from flask import Flask
import spotipy
from spotipy.oauth2 import SpotifyOAuth

#load environment variable files
load_dotenv()
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")

#get token
def get_token():
    auth_string = CLIENT_ID + ":" + CLIENT_SECRET
    auth_bytes = auth_string.encode("utf-8")
    auth_base64 = str(base64.b64encode(auth_bytes), "utf-8")

    url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization": "Basic " + auth_base64,
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}
    result = requests.post(url, headers = headers, data = data)
    json_result = json.loads(result.content)
    token = json_result["access_token"]
    return token

def get_auth_header(token):
    return {"Authorization": "Bearer " + token}

def search_for_artist(token, artist_name):
    url = "https://api.spotify.com/v1/search"
    headers = get_auth_header(token)
    query = f"?q={artist_name}&type=artist&limit=1"
    query_url = url + query
    result = requests.get(query_url, headers = headers)
    json_result = json.loads(result.content)["artists"]["items"]
    if len(json_result) == 0:
        print("Artist does not exist.")
        return None
    else:
        return json_result[0]
    # print(json_result)

def get_songs_by_artist(token, artist_id):
    url = "https://api.spotify.com/v1/artists/" + artist_id + "/top-tracks?country=US"
    headers = get_auth_header(token)
    result = requests.get(url, headers=headers)
    json_result = json.loads(result.content)["tracks"]
    return json_result

def get_playlist_tracks(sp):
    all_tracks = []
    playlists = sp.current_user_playlists()
    while playlists:
        for playlist in playlists['items']:
            print(f"Fetching tracks from playlist: {playlist['name']}")
            tracks = sp.playlist_tracks(playlist['id'])
            
            while tracks:
                for item in tracks['items']:
                    track = item['track']
                    if track:
                        all_tracks.append(track['id'])
                tracks = sp.next(tracks) if tracks['next'] else None
        
        playlists = sp.next(playlists) if playlists['next'] else None
    print(all_tracks)
    return all_tracks