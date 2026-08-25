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

    return app