from flask import Flask, session, request, redirect, url_for, flash

def create_app(config_name = "default"):
    app = Flask(__name__)

    from src.config.config import config
    app.config.from_object(config[config_name])

    from src.controllers.index_controller import index_bp, dashboard_bp
    from src.controllers.inventario_controller import inventarios_bp
    from src.controllers.facturacion_controller import facturacion_bp
    from src.controllers.administracion_controller import administracion_bp

    app.register_blueprint(index_bp)
    app.register_blueprint(dashboard_bp)

    # Modulo de inventarios
    app.register_blueprint(inventarios_bp)

    # Modulo de facturacion
    app.register_blueprint(facturacion_bp)

    # Modulo de administracion
    app.register_blueprint(administracion_bp)

    # ========================================================
    # PROTECCIÓN GLOBAL DE RUTAS (REQUIERE INICIO DE SESIÓN)
    # ========================================================
    @app.before_request
    def require_login():
        # Endpoints y rutas públicas que no requieren autenticación previa
        public_endpoints = {
            'static',
            'index.inicio',
            'index.logout',
            'index.cambiar_password_inicial'
        }

        # Permitir archivos estáticos por ruta
        if request.path.startswith('/static'):
            return None

        # Permitir endpoints públicos
        if request.endpoint in public_endpoints:
            return None

        # Si el endpoint no existe (dejar que Flask maneje 404)
        if request.endpoint is None:
            return None

        # Si no hay token de autenticación ni usuario activo en sesión, bloquear acceso
        if not session.get('api_token') or not session.get('usuario'):
            flash('Debes iniciar sesión para acceder a las secciones del sistema.', 'info')
            return redirect(url_for('index.inicio'))

    @app.context_processor
    def inject_global_vars():
        from datetime import datetime
        now = datetime.now()
        hora = now.hour
        if 5 <= hora < 12:
            saludo = "Buenos días"
        elif 12 <= hora < 19:
            saludo = "Buenas tardes"
        else:
            saludo = "Buenas noches"

        meses = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ]
        fecha_texto = f"{now.day} de {meses[now.month - 1]} de {now.year}"
        
        usuario = session.get('usuario') or {}
        nombre_usuario = usuario.get('nombre', 'Administrador') if isinstance(usuario, dict) else 'Administrador'
        
        return {
            'saludo_hora': saludo,
            'fecha_actual_texto': fecha_texto,
            'usuario_actual_nombre': nombre_usuario
        }

    return app