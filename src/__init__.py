from flask import Flask, session

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

    #Modulo de inventarios
    app.register_blueprint(inventarios_bp)

    #Modulo de facturacion
    app.register_blueprint(facturacion_bp)

    #Modulo de administracion
    app.register_blueprint(administracion_bp)

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