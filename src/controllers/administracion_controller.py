from flask import Blueprint, render_template,redirect, url_for, request, flash, session
from src.clients.api_client import APIClient, APIError

administracion_bp = Blueprint('administracion', __name__, url_prefix='/administracion')

def _client():
    return APIClient(session.get('api_token'))

@administracion_bp.route('/')
def inicio():
    return render_template('administracion/modulo_administracion.html')


# ==========================================
# USUARIOS
# ==========================================

@administracion_bp.route('/crear_usuario', methods=['GET', 'POST'])
def crear_usuario():

# CARGAR ROLES
    try:
        roles_data = _client().get('/roles/')
        roles = APIClient.as_list(roles_data)

    except APIError:
        roles = []

# =========================================
# CREAR USUARIO
# =========================================


    if request.method == 'POST':

        data = {
            'nombre': request.form.get('nombre'),
            'identificacion': request.form.get('identificacion'),
            'rol_id': request.form.get('rol_id'),
            'correo': request.form.get('correo'),
            'telefono': request.form.get('telefono'),
            'password': request.form.get('password'),
            'estado': request.form.get('estado')
        }

        print("================================")
        print("DATOS ENVIADOS AL BACKEND:")
        print(data)
        print("================================")

        try:

            respuesta = _client().post(
                '/usuarios/',
                json=data
            )

            print("================================")
            print("RESPUESTA DEL BACKEND:")
            print(respuesta)
            print("================================")
            
            return redirect(
                url_for('administracion.crear_usuario')
            )

        except APIError as e:
        
                    print("================================")
                    print("ERROR AL CREAR USUARIO")
                    print("Mensaje:", e.message)
                    print("Status:", e.status_code)
                    print("Errors:", e.errors)
                    print("================================")
        
                    return render_template(
                        'administracion/crear_usuario.html',
                        roles=roles,
                        error=e.message
                    )
        

    return render_template('administracion/crear_usuario.html',roles=roles)


# =========================================
# EDITAR USUARIO
# =========================================

@administracion_bp.route('/editar_usuario/<int:id>', methods=['GET', 'POST'])
def editar_usuario(id):
    # Cargar roles
    try:
        roles_data = _client().get('/roles/')
        roles = APIClient.as_list(roles_data)
    except APIError:
        roles = []

    # Cargar datos actuales del usuario
    try:
        usuario = _client().get(f'/usuarios/{id}')
    except APIError as e:
        flash(f'Error al obtener usuario: {e.message}', 'error')
        return redirect(url_for('administracion.lista_usuarios'))

    if request.method == 'POST':
        data = {
            'nombre': request.form.get('nombre') or usuario.get('nombre'),
            'identificacion': request.form.get('identificacion') or usuario.get('identificacion'),
            'correo': request.form.get('correo') or usuario.get('correo'),
            'telefono': request.form.get('telefono'),
            'rol_id': int(request.form.get('rol_id')) if request.form.get('rol_id') else None,
            'estado': request.form.get('estado')
        }

        try:
            _client().put(f'/usuarios/{id}', json=data)
            return redirect(url_for('administracion.lista_usuarios'))
        except APIError as e:
            return render_template(
                'administracion/editar_usuario.html',
                usuario=usuario,
                roles=roles,
                error=e.message
            )

    return render_template(
        'administracion/editar_usuario.html',
        usuario=usuario,
        roles=roles
    )


@administracion_bp.route('/lista_usuarios')
def lista_usuarios():

    q = request.args.get('q', '').strip()

    try:
        data = _client().get('/usuarios/')
        usuarios = APIClient.as_list(data)

    except APIError as e:
            usuarios = []
            
    return render_template(
            'administracion/lista_usuarios.html',
            usuarios=usuarios,
            q=q
            )




# ==========================================
# ROLES Y PERMISOS
# ==========================================

def _extraer_permisos_del_form(form):
    """Extrae los checkboxes de permisos agrupados por módulo, recurso y acción."""
    permisos = {}
    for key in form.keys():
        if key.startswith('perm_'):
            # Formato: perm_<modulo>_<recurso>_<accion>
            partes = key.split('_', 3)
            if len(partes) == 4:
                _, modulo, recurso, accion = partes
                if modulo not in permisos:
                    permisos[modulo] = {}
                if recurso not in permisos[modulo]:
                    permisos[modulo][recurso] = {}
                permisos[modulo][recurso][accion] = True
    return permisos


# CREAR ROL
@administracion_bp.route('/crear_rol', methods=['GET', 'POST'])
def crear_rol():
    if request.method == 'POST':
        nombre = request.form.get('nombre', '').strip()
        permisos = _extraer_permisos_del_form(request.form)

        data = {
            'nombre': nombre,
            'permisos': permisos
        }

        try:
            _client().post('/roles/', json=data)
            flash('Rol creado exitosamente con sus permisos configurados.', 'success')
            return redirect(url_for('administracion.lista_roles'))
        except APIError as e:
            return render_template(
                'administracion/crear_rol.html',
                error=e.message
            )

    return render_template('administracion/crear_rol.html')


# EDITAR ROL
@administracion_bp.route('/editar_rol/<int:id>', methods=['GET', 'POST'])
def editar_rol(id):
    try:
        rol = _client().get(f'/roles/{id}')
    except APIError as e:
        flash(f'Error al obtener el rol: {e.message}', 'error')
        return redirect(url_for('administracion.lista_roles'))

    if request.method == 'POST':
        nombre = request.form.get('nombre', '').strip()
        permisos = _extraer_permisos_del_form(request.form)

        data = {
            'nombre': nombre,
            'permisos': permisos
        }

        try:
            _client().put(f'/roles/{id}', json=data)
            flash('Rol y permisos actualizados exitosamente.', 'success')
            return redirect(url_for('administracion.lista_roles'))
        except APIError as e:
            return render_template(
                'administracion/editar_rol.html',
                rol=rol,
                error=e.message
            )

    return render_template('administracion/editar_rol.html', rol=rol)


# LISTA DE ROLES
@administracion_bp.route('/lista_roles')
def lista_roles():
    q = request.args.get('q', '').strip()
    try:
        data = _client().get('/roles/')
        roles = APIClient.as_list(data)
    except APIError:
        roles = []

    return render_template(
        'administracion/lista_roles.html',
        roles=roles,
        q=q
    )