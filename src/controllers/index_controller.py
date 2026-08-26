from flask import Blueprint, render_template, redirect, url_for, request, flash, session
from src.clients.api_client import APIClient, APIError


index_bp = Blueprint('index', __name__)

@index_bp.route('/', methods=['GET', 'POST'])
def inicio():
    # Si el usuario ya está autenticado, enviarlo directo al dashboard
    if session.get('api_token'):
        return redirect(url_for('dashboard.dashboard'))

    error = None
    email = ''

    if request.method == 'POST':
        email = (request.form.get('email') or request.form.get('correo') or '').strip()
        password = (request.form.get('password') or '').strip()

        if not email or not password:
            error = 'Por favor ingrese su correo electrónico y contraseña.'
            return render_template('index.html', error=error, email=email)

        try:
            client = APIClient()
            try:
                response = client.post('/auth/login', json={'correo': email, 'password': password})
            except APIError:
                # Fallback al endpoint alternativo si fuera necesario
                response = client.post('/usuarios/login', json={'correo': email, 'password': password})

            # Si requiere cambio de contraseña en primer ingreso
            if response.get('primer_ingreso'):
                session['primer_ingreso_temp'] = {
                    'token': response.get('temp_token') or response.get('access_token'),
                    'usuario': response.get('usuario')
                }
                return redirect(url_for('index.cambiar_password_inicial'))

            token = response.get('access_token') if isinstance(response, dict) else None
            usuario = response.get('usuario') if isinstance(response, dict) else None

            if not token:
                error = 'No se pudo obtener el token de autenticación.'
                return render_template('index.html', error=error, email=email)

            # Guardar en sesión
            session['api_token'] = token
            session['usuario'] = usuario

            flash(f"Bienvenido de nuevo, {usuario.get('nombre', 'Usuario')}", 'success')
            return redirect(url_for('dashboard.dashboard'))

        except APIError as e:
            error = e.message or 'Credenciales inválidas. Verifique su correo y contraseña.'
            return render_template('index.html', error=error, email=email)
        except Exception as e:
            error = f'No fue posible conectar con el servidor backend: {str(e)}'
            return render_template('index.html', error=error, email=email)

    return render_template('index.html', error=error, email=email)


@index_bp.route('/cambiar_password_inicial', methods=['GET', 'POST'])
def cambiar_password_inicial():
    temp_data = session.get('primer_ingreso_temp')
    if not temp_data:
        return redirect(url_for('index.inicio'))

    usuario = temp_data.get('usuario', {})
    token = temp_data.get('token')
    error = None

    if request.method == 'POST':
        password_nueva = (request.form.get('password_nueva') or '').strip()
        password_confirmar = (request.form.get('password_confirmar') or '').strip()

        if not password_nueva or not password_confirmar:
            error = 'Por favor complete todos los campos requeridos.'
            return render_template('cambiar_password_inicial.html', usuario=usuario, error=error)

        if password_nueva != password_confirmar:
            error = 'Las contraseñas no coinciden. Por favor verifique.'
            return render_template('cambiar_password_inicial.html', usuario=usuario, error=error)

        if len(password_nueva) < 8:
            error = 'La contraseña debe tener al menos 8 caracteres.'
            return render_template('cambiar_password_inicial.html', usuario=usuario, error=error)

        try:
            client = APIClient(token)
            client.post('/auth/cambiar_password_inicial', json={'password_nueva': password_nueva})

            # Limpiar sesión temporal y redirigir con mensaje de éxito
            session.clear()
            flash('¡Contraseña actualizada exitosamente! Inicia sesión con tu nueva contraseña.', 'success')
            return redirect(url_for('index.inicio'))

        except APIError as e:
            error = e.message or 'No se pudo actualizar la contraseña.'
            return render_template('cambiar_password_inicial.html', usuario=usuario, error=error)
        except Exception as e:
            error = f'Error de conexión: {str(e)}'
            return render_template('cambiar_password_inicial.html', usuario=usuario, error=error)

    return render_template('cambiar_password_inicial.html', usuario=usuario, error=error)


@index_bp.route('/logout')
def logout():
    session.clear()
    flash('Has cerrado sesión correctamente.', 'info')
    return redirect(url_for('index.inicio'))


dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard')
def dashboard():
    usuario = session.get('usuario') or {}
    nombre_usuario = usuario.get('nombre', 'Administrador') if isinstance(usuario, dict) else 'Administrador'
    return render_template('dashboard.html', nombre_usuario=nombre_usuario, usuario=usuario)
