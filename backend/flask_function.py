from dotenv import load_dotenv
import os
import base64
import requests
import json
from flask import Flask


app = Flask(__name__)
#add later
app.secret_key = os.getenv("SECRET_KEY")


client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")
REDIRECT_URI = "http://localhost:5000/callback"
AUTH_URL = 'https://accounts.spotify.com/authorize'
TOKEN_URL = 'https://accounts.spotify.com/api/token'


@app.route('/')
def index(): 
    return "Songscribe <a href = '/login>Login With Spotify:</a>"