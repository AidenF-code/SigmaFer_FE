import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'frontend_secret')
    API_BASE_URL = os.getenv('API_BASE_URL', 'https://sigmafer-be.onrender.com/api/v1')

class DevelopmentConfig(Config):
    DEBUG = True

config = {'development': DevelopmentConfig, 'default': DevelopmentConfig}