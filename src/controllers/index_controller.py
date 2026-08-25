from flask import Blueprint, render_template,redirect, url_for, request, flash, session
from src.clients.api_client import APIClient, APIError


index_bp = Blueprint('index', __name__)

@index_bp.route('/')
def inicio():
    return render_template('index.html')


dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')



"""

    """
