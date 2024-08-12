import requests
from dotenv import load_dotenv
from flask import Flask, redirect, request, jsonify, session, render_template
from datetime import datetime, timedelta
import urllib.parse
import os
import pandas as pd
import json
from flask_cors import CORS

load_dotenv()

app = Flask(__name__, template_folder='../frontend/templates', static_folder = '../frontend')
CORS(app)
#add later
app.secret_key = os.getenv("SECRET_KEY")
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = "https://spotify-collaboration-network-7f7d5ee3e659.herokuapp.com/"
# AUTH_URL = 'https://accounts.spotify.com/authorize'
# TOKEN_URL = 'https://accounts.spotify.com/api/token'
# API_BASE_URL =  'https://api.spotify.com/v1/'


@app.route('/')
def index(): 
    return render_template('network.html')
    
@app.route('/network')
def network():
    return render_template('network.html')


@app.route('/network_data')
def network_data():
    json_path = os.path.join(app.static_folder, 'static/spotify_atlas_new.json')
    with open(json_path) as f:
        network_data = json.load(f)
    
    csv_path = os.path.join(app.static_folder, 'static/popular_nodes.csv')
    artist_map = pd.read_csv(csv_path).set_index('spotify_id').to_dict()['name']

    for node in network_data['nodes']:
        spotify_id = node['attributes']['name']
        if spotify_id in artist_map:
            artist_name = artist_map[spotify_id]
            node['attributes']['name'] = artist_name  

    return jsonify(network_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug = True)