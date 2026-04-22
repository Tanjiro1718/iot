"""Main Flask application"""
import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import click

# Load environment variables
load_dotenv()

# Import configuration and database
from config import config_by_name
from database import init_db, db
from models import User

# Import routes
from routes.auth import auth_bp
from routes.access import access_bp
from routes.cards import cards_bp
from routes.users import users_bp
from routes.schedule import schedule_bp

def create_app(config_name=None):
    """Factory function to create Flask app"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_by_name.get(config_name, config_by_name['default']))

    cors_origins = [
        origin.strip()
        for origin in str(app.config.get('CORS_ORIGINS', '')).split(',')
        if origin.strip()
    ]
    fallback_origins = ['http://127.0.0.1:5000', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://localhost:3000']
    for origin in fallback_origins:
        if origin not in cors_origins:
            cors_origins.append(origin)

    effective_cors_origins = '*' if app.config.get('DEBUG') else cors_origins
    
    # Initialize extensions
    CORS(
        app,
        origins=effective_cors_origins,
        supports_credentials=False,
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allow_headers=['Content-Type', 'Authorization']
    )
    jwt = JWTManager(app)
    
    # JWT error callbacks
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Missing token'}), 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return jsonify({'error': 'Token has expired'}), 401
    
    init_db(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(access_bp)
    app.register_blueprint(cards_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(schedule_bp)
    
    # Get frontend directory path
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')
    
    # Serve frontend static files (CSS, JS, etc.)
    @app.route('/css/<path:filename>')
    def serve_css(filename):
        return send_from_directory(os.path.join(frontend_dir, 'css'), filename)
    
    @app.route('/js/<path:filename>')
    def serve_js(filename):
        return send_from_directory(os.path.join(frontend_dir, 'js'), filename)
    
    @app.route('/images/<path:filename>')
    def serve_images(filename):
        return send_from_directory(os.path.join(frontend_dir, 'images'), filename)
    
    # Serve frontend index.html
    @app.route('/', methods=['GET'])
    def serve_frontend():
        return send_from_directory(frontend_dir, 'index.html')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'version': '1.0.0'
        }), 200
    
    # JWT Error Handlers
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized - Invalid or missing token'}), 401
    
    @app.errorhandler(422)
    def unprocessable(error):
        return jsonify({'error': 'Invalid token or missing authorization header'}), 422
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    # CLI Commands
    @app.cli.command()
    @click.option('--username', prompt='Admin username', help='Username for admin account')
    @click.option('--email', prompt='Admin email', help='Email for admin account')
    @click.option('--password', prompt=True, hide_input=True, help='Password for admin account')
    @click.option('--fullname', prompt='Full name', default='Administrator', help='Full name for admin')
    def create_admin(username, email, password, fullname):
        """Create the first admin account"""
        with app.app_context():
            # Check if admin already exists
            if User.query.filter_by(username=username).first():
                click.echo(f"❌ User '{username}' already exists")
                return
            
            if User.query.filter_by(email=email).first():
                click.echo(f"❌ Email '{email}' already in use")
                return
            
            # Create admin account
            admin = User(
                username=username,
                email=email,
                full_name=fullname,
                role='admin',
                is_active=True
            )
            admin.set_password(password)
            
            db.session.add(admin)
            db.session.commit()
            
            click.echo(f"✅ Admin account created successfully!")
            click.echo(f"   Username: {username}")
            click.echo(f"   Email: {email}")
            click.echo(f"   Role: Admin")
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('FLASK_PORT', 5000)),
        debug=os.getenv('FLASK_DEBUG', False)
    )
