import requests
from dotenv import load_dotenv
from flask import Flask, redirect, request, jsonify, session, render_template
from datetime import datetime, timedelta
import urllib.parse
import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import pandas as pd
import spotify_api_functions as saf

load_dotenv()

app = Flask(__name__, template_folder='../frontend/templates', static_folder = '../frontend/static')
#add later
app.secret_key = os.getenv("SECRET_KEY")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = "http://localhost:5000/callback"
AUTH_URL = 'https://accounts.spotify.com/authorize'
TOKEN_URL = 'https://accounts.spotify.com/api/token'
API_BASE_URL =  'https://api.spotify.com/v1/'


@app.route('/')
def index(): 
    return render_template('index.html')

@app.route('/login')
def login():
    scope = 'user-read-private user-read-email'
    params = {
        'client_id': CLIENT_ID,
        'response_type': 'code',
        'scope': scope,
        'redirect_uri': REDIRECT_URI,
        'show_dialog': True
    }
    auth_url = f"{AUTH_URL}?{urllib.parse.urlencode(params)}"

    return redirect(auth_url)

@app.route('/callback')
def callback():
    if 'error' in request.args:
        return jsonify({"error": request.args['error']})
    
    if 'code' in request.args:
        req_body = {
            'code': request.args['code'],
            'grant_type': 'authorization_code',
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET
        }
        response = requests.post(TOKEN_URL, data = req_body)
        token_info = response.json()

        session['access_token'] = token_info['access_token']
        session['refresh_token'] = token_info['refresh_token']
        session['expires_at'] = datetime.now().timestamp() + token_info['expires_in']

        return redirect('/playlists')
    
@app.route('/playlists')
def get_playlists():
    if 'access_token' not in session:
        return redirect('/login')
    
    if datetime.now().timestamp() > session['expires_at']:
        return redirect('/refresh-token')
    
    headers = {
        'Authorization': f"Bearer {session['access_token']}"

    }
    response = requests.get(API_BASE_URL + 'me/playlists', headers = headers)
    playlists = response.json()
    sp = spotipy.Spotify(auth=session['access_token'])
    track_ids = saf.get_playlist_tracks(sp)
    audio_features = saf.get_audio_features(sp, track_ids)
    print(f"Retrieved {len(track_ids)} tracks from all playlists.")

    return render_template('playlists.html', playlists = playlists['items'])

@app.route('/generate-playlist', methods = ['POST'])
def generate_playlist():
    if 'access_token' not in session:
        return redirect('/login')
    if datetime.now().timestamp() > session['expires_at']:
        return redirect('/refresh-token')
    
    headers = {
        'Authorization': f"Bearer {session['access_token']}"
    }
    response = requests.get(API_BASE_URL + 'me/generate-playlist', headers = headers)
    return render_template('generate_playlist.html')

@app.route('/refresh-token')
def refresh_token():
    if 'refresh_token' not in session:
        return redirect('/login')

    if datetime.now().timestamp() > session['expires_at']:
        req_body = {
            'grant_type': 'refresh_token',
            'refresh_token': session['refresh_token'],
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET
        }
        response = requests.post(TOKEN_URL, data = req_body)
        new_token_info  = response.json()
        session['access_token'] = new_token_info['access_token']
        session['expires_at'] = datetime.now().timestamp() + new_token_info['expires_in']

        return redirect('/playlists')
    
@app.route('/network')
def network():
    return render_template('network.html')
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug = True)
