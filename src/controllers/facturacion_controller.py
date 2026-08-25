from flask import Blueprint, render_template,redirect, url_for, request, flash, session
from src.clients.api_client import APIClient, APIError


facturacion_bp = Blueprint('facturacion', __name__, url_prefix='/facturacion')

def _client():
    return APIClient(session.get('api_token'))

@facturacion_bp.route('/')
def inicio():
    return render_template('facturacion/modulo_facturacion.html')




# ==========================================
# CLIENTES
# ==========================================

#CREAR CLIENTES
@facturacion_bp.route('/crear_clientes', methods=['GET', 'POST'])
def crear_clientes():

    if request.method == 'POST':

        data = {
            'nombre': request.form.get('nombre'),
            'tipo_documento': request.form.get('tipo_documento'),
            'numero_identificacion': request.form.get('numero_identificacion'),
            'razon_social': request.form.get('razon_social'),
            'telefono': request.form.get('telefono'),
            'correo': request.form.get('correo'),
            'direccion': request.form.get('direccion'),
            'estado': request.form.get('estado')
        }

        print("================================")
        print("DATOS ENVIADOS AL BACKEND:")
        print(data)
        print("================================")


        try:
        
            respuesta = _client().post(
                '/clientes/',
                json=data
            )
        
            print("================================")
            print("RESPUESTA DEL BACKEND:")
            print(respuesta)
            print("================================")
        
            return redirect(url_for('facturacion.crear_clientes'))
        
        except APIError as e:
        
            print("================================")
            print("ERROR AL CREAR CLIENTE")
            print("Mensaje:", e.message)
            print("Status:", e.status_code)
            print("Errors:", e.errors)
            print("================================")
        
            return render_template(
                'facturacion/crear_clientes.html',
                error=e.message
            )


    return render_template(
        'facturacion/crear_clientes.html'
    )



# LISTA DE CLIENTES
@facturacion_bp.route('/lista_clientes')
def lista_clientes():

    q = request.args.get('q', '').strip()

    try:
        data = _client().get('/clientes/')
        clientes = APIClient.as_list(data)

    except APIError as e:
        clientes = []

    return render_template(
        'facturacion/lista_clientes.html',
        clientes=clientes,
        q=q
    )


# EDITAR CLIENTE
@facturacion_bp.route('/editar_cliente/<int:id>', methods=['GET', 'POST'])
def editar_cliente(id):
    try:
        cliente = _client().get(f'/clientes/{id}')
    except APIError as e:
        flash(f'Error al obtener cliente: {e.message}', 'error')
        return redirect(url_for('facturacion.lista_clientes'))

    if request.method == 'POST':
        data = {
            'tipo_documento': cliente.get('tipo_documento'),
            'numero_identificacion': cliente.get('numero_identificacion'),
            'razon_social': cliente.get('razon_social'),
            'nombre': request.form.get('nombre'),
            'telefono': request.form.get('telefono'),
            'direccion': request.form.get('direccion'),
            'correo': request.form.get('correo'),
            'estado': request.form.get('estado')
        }

        try:
            _client().put(f'/clientes/{id}', json=data)
            return redirect(url_for('facturacion.lista_clientes'))
        except APIError as e:
            return render_template(
                'facturacion/editar_cliente.html',
                cliente=cliente,
                error=e.message
            )

    return render_template(
        'facturacion/editar_cliente.html',
        cliente=cliente
    )



# ==========================================
# FACTURAS
# ==========================================

@facturacion_bp.route('/crear_factura', methods=['GET', 'POST'])
def crear_factura():

    # CARGAR DATOS PARA EL FORMULARIO
    try:
        clientes = _client().get('/clientes/')
        productos = _client().get('/productos/')
        usuarios = _client().get('/usuarios/')
        roles = _client().get('/roles/')
        metodos_pago = _client().get('/metodos_pago/')

        # Buscar el rol Vendedor
        rol_vendedor = next(
            (
                rol for rol in roles
                if rol.get('nombre', '').strip().lower() == 'vendedor'
            ),
            None
        )

        if rol_vendedor:
            vendedores = [
                usuario
                for usuario in usuarios
                if usuario.get('estado') is True
                and usuario.get('rol_id') == rol_vendedor.get('id')
            ]
        else:
            # Si no hay rol vendedor explícito, mostrar todos los usuarios activos
            vendedores = [
                usuario for usuario in usuarios if usuario.get('estado') is True
            ]

        metodos_pago_activos = [
            metodo
            for metodo in metodos_pago
            if metodo.get('estado')
        ]

    except APIError as e:
        print("ERROR AL OBTENER DATOS DE FACTURACION:", e.message)
        clientes = []
        productos = []
        usuarios = []
        roles = []
        vendedores = []
        metodos_pago_activos = []

    # OBTENER SIGUIENTE CONSECUTIVO
    try:
        consecutivo_data = _client().get('/facturas/siguiente_numero')
        numero_factura = consecutivo_data.get('numero_factura', 'FV-000001') if isinstance(consecutivo_data, dict) else 'FV-000001'
    except Exception:
        numero_factura = 'FV-000001'

    # GUARDAR FACTURA
    if request.method == 'POST':
        cliente_id = request.form.get('cliente_id')
        usuario_id = request.form.get('usuario_id')
        metodo_pago_id = request.form.get('metodo_pago_id')
        observaciones = (request.form.get('observaciones') or '').strip()

        # Si cliente_id no viene en el hidden, intentar resolver por documento o razón social
        if not cliente_id or not str(cliente_id).isdigit():
            doc_ingresado = (request.form.get('numero_identificacion') or '').strip().lower()
            busqueda_ingresada = (request.form.get('cliente_busqueda') or '').strip().lower()
            for c in (clientes or []):
                doc_c = str(c.get('numero_identificacion', '')).strip().lower()
                razon_c = str(c.get('razon_social', '')).strip().lower()
                nom_c = str(c.get('nombre', '')).strip().lower()
                if doc_ingresado and doc_c == doc_ingresado:
                    cliente_id = c.get('id')
                    break
                elif busqueda_ingresada and (busqueda_ingresada in razon_c or busqueda_ingresada in nom_c or busqueda_ingresada in doc_c):
                    cliente_id = c.get('id')
                    break

        productos_ids = request.form.getlist('producto_id[]')
        codigos = request.form.getlist('codigo[]')
        nombres_prods = request.form.getlist('producto_nombre[]')
        cantidades = request.form.getlist('cantidad[]')
        valores_unitarios = request.form.getlist('valor_unitario[]')
        ivas = request.form.getlist('iva_porcentaje[]')

        total_filas = max(len(productos_ids), len(codigos), len(nombres_prods), len(cantidades))
        detalles = []

        for i in range(total_filas):
            p_id = (productos_ids[i] or '').strip() if i < len(productos_ids) else ''
            cod = (codigos[i] or '').strip() if i < len(codigos) else ''
            nom = (nombres_prods[i] or '').strip() if i < len(nombres_prods) else ''
            cant_str = (cantidades[i] or '0').strip() if i < len(cantidades) else '0'
            val_str = (valores_unitarios[i] or '0').strip() if i < len(valores_unitarios) else '0'
            iva_str = (ivas[i] or '19').strip() if i < len(ivas) else '19'

            # Resolver ID del producto si no vino en el campo oculto
            if not p_id and (cod or nom):
                for p in (productos or []):
                    p_cod = str(p.get('codigo', '')).strip().lower()
                    p_nom = str(p.get('nombre', '')).strip().lower()
                    if cod and p_cod == cod.lower():
                        p_id = str(p.get('id'))
                        break
                    elif nom and (p_nom == nom.lower() or nom.lower() in p_nom):
                        p_id = str(p.get('id'))
                        break

            if p_id and str(p_id).isdigit() and int(p_id) > 0:
                try:
                    # Limpiar caracteres monetarios y espacios
                    val_clean = str(val_str).replace('$', '').replace(' ', '').replace('\xa0', '')
                    if ',' in val_clean and '.' in val_clean:
                        val_clean = val_clean.replace('.', '').replace(',', '.')
                    elif ',' in val_clean:
                        val_clean = val_clean.replace(',', '.')

                    cant = int(cant_str) if cant_str.isdigit() else 1
                    val = float(val_clean)
                    iva_pct = float(iva_str) if iva_str else 19.0

                    if cant > 0:
                        detalles.append({
                            'producto_id': int(p_id),
                            'cantidad': cant,
                            'valor_unitario': val,
                            'iva_porcentaje': iva_pct
                        })
                except (ValueError, TypeError) as err:
                    print("Error al procesar detalle de producto:", err)

        payload = {
            'cliente_id': int(cliente_id) if cliente_id and str(cliente_id).isdigit() else None,
            'usuario_id': int(usuario_id) if usuario_id and str(usuario_id).isdigit() else None,
            'metodo_pago_id': int(metodo_pago_id) if metodo_pago_id and str(metodo_pago_id).isdigit() else None,
            'observaciones': observaciones,
            'detalles': detalles
        }

        print("DATOS ENVIADOS A CREAR FACTURA:", payload)

        try:
            _client().post('/facturas/', json=payload)
            flash('Factura guardada exitosamente', 'success')
            return redirect(url_for('facturacion.lista_facturas'))
        except APIError as e:
            print("ERROR AL GUARDAR FACTURA:", e.message)
            return render_template(
                'facturacion/crear_factura.html',
                numero_factura=numero_factura,
                clientes=clientes,
                productos=productos,
                vendedores=vendedores,
                metodos_pago=metodos_pago_activos,
                error=e.message
            )

    return render_template(
        'facturacion/crear_factura.html',
        numero_factura=numero_factura,
        clientes=clientes,
        productos=productos,
        vendedores=vendedores,
        metodos_pago=metodos_pago_activos
    )

# LISTADO DE FACTURAS
@facturacion_bp.route('/lista_facturas')
def lista_facturas():

    q = request.args.get('q', '').strip()

    try:
        facturas = _client().get(
            '/facturas/'
        )
    except APIError as e:
        print("ERROR AL OBTENER EL LISTADO DE FACTURAS:", e.message)
        facturas = []

    return render_template(
        'facturacion/lista_facturas.html',
        facturas=facturas,
        q=q
    )


# VER DETALLE DE FACTURA
@facturacion_bp.route('/ver_factura/<int:id>', methods=['GET'])
def ver_factura(id):
    try:
        factura = _client().get(f'/facturas/{id}')
    except APIError as e:
        flash(f'Error al obtener factura: {e.message}', 'error')
        return redirect(url_for('facturacion.lista_facturas'))

    try:
        detalles_data = _client().get(f'/detalle_facturas/factura/{id}')
        detalles = APIClient.as_list(detalles_data)
    except APIError:
        detalles = []

    # Enriquecer con catálogo de productos si hiciera falta
    try:
        productos_data = _client().get('/productos/')
        productos = APIClient.as_list(productos_data)
        prod_map = {p.get('id'): p for p in productos}
        for d in detalles:
            p_id = d.get('producto_id')
            if p_id in prod_map:
                if not d.get('producto_nombre'):
                    d['producto_nombre'] = prod_map[p_id].get('nombre', '')
                if not d.get('producto_codigo'):
                    d['producto_codigo'] = prod_map[p_id].get('codigo', '')
    except Exception:
        pass

    return render_template(
        'facturacion/ver_factura.html',
        factura=factura,
        detalles=detalles
    )


# EDITAR FACTURA (SOLO PRODUCTOS Y CANTIDADES)
@facturacion_bp.route('/editar_factura/<int:id>', methods=['GET', 'POST'])
def editar_factura(id):
    try:
        factura = _client().get(f'/facturas/{id}')
    except APIError as e:
        flash(f'Error al obtener factura: {e.message}', 'error')
        return redirect(url_for('facturacion.lista_facturas'))

    try:
        productos_data = _client().get('/productos/')
        productos = APIClient.as_list(productos_data)
    except APIError:
        productos = []

    try:
        detalles_data = _client().get(f'/detalle_facturas/factura/{id}')
        detalles = APIClient.as_list(detalles_data)
    except APIError:
        detalles = []

    # Asegurar producto_nombre y producto_codigo en edición
    prod_map = {p.get('id'): p for p in productos}
    for d in detalles:
        p_id = d.get('producto_id')
        if p_id in prod_map:
            if not d.get('producto_nombre'):
                d['producto_nombre'] = prod_map[p_id].get('nombre', '')
            if not d.get('producto_codigo'):
                d['producto_codigo'] = prod_map[p_id].get('codigo', '')


    if request.method == 'POST':
        productos_ids = request.form.getlist('producto_id[]')
        codigos = request.form.getlist('codigo[]')
        nombres_prods = request.form.getlist('producto_nombre[]')
        cantidades = request.form.getlist('cantidad[]')
        valores_unitarios = request.form.getlist('valor_unitario[]')
        ivas = request.form.getlist('iva_porcentaje[]')

        total_filas = max(len(productos_ids), len(codigos), len(nombres_prods), len(cantidades))
        detalles_nuevos = []

        for i in range(total_filas):
            p_id = (productos_ids[i] or '').strip() if i < len(productos_ids) else ''
            cod = (codigos[i] or '').strip() if i < len(codigos) else ''
            nom = (nombres_prods[i] or '').strip() if i < len(nombres_prods) else ''
            cant_str = (cantidades[i] or '0').strip() if i < len(cantidades) else '0'
            val_str = (valores_unitarios[i] or '0').strip() if i < len(valores_unitarios) else '0'
            iva_str = (ivas[i] or '19').strip() if i < len(ivas) else '19'

            # Resolver ID del producto si viene vacío
            if not p_id and (cod or nom):
                for p in productos:
                    p_cod = str(p.get('codigo', '')).strip().lower()
                    p_nom = str(p.get('nombre', '')).strip().lower()
                    if cod and p_cod == cod.lower():
                        p_id = str(p.get('id'))
                        break
                    elif nom and (p_nom == nom.lower() or nom.lower() in p_nom):
                        p_id = str(p.get('id'))
                        break

            if p_id and str(p_id).isdigit() and int(p_id) > 0:
                try:
                    val_clean = str(val_str).replace('$', '').replace(' ', '').replace('\xa0', '')
                    if ',' in val_clean and '.' in val_clean:
                        val_clean = val_clean.replace('.', '').replace(',', '.')
                    elif ',' in val_clean:
                        val_clean = val_clean.replace(',', '.')

                    cant = int(cant_str) if str(cant_str).isdigit() else 1
                    val = float(val_clean)
                    iva_pct = float(iva_str) if iva_str else 19.0

                    if cant > 0:
                        detalles_nuevos.append({
                            'producto_id': int(p_id),
                            'cantidad': cant,
                            'valor_unitario': val,
                            'iva_porcentaje': iva_pct
                        })
                except (ValueError, TypeError):
                    pass

        try:
            _client().put(f'/facturas/{id}', json={'detalles': detalles_nuevos})
            flash('Factura modificada exitosamente', 'success')
            return redirect(url_for('facturacion.ver_factura', id=id))
        except APIError as e:
            return render_template(
                'facturacion/editar_factura.html',
                factura=factura,
                detalles=detalles,
                productos=productos,
                error=e.message
            )

    return render_template(
        'facturacion/editar_factura.html',
        factura=factura,
        detalles=detalles,
        productos=productos
    )


# CAMBIAR ESTADO DE FACTURA (PAGADA <-> PENDIENTE)
@facturacion_bp.route('/cambiar_estado_factura/<int:id>', methods=['POST'])

def cambiar_estado_factura(id):
    estado_pago = request.form.get('estado_pago')
    nuevo_estado = True if str(estado_pago) in ['1', 'true', 'True'] else False
    try:
        _client().put(f'/facturas/{id}', json={'estado_pago': nuevo_estado})
        flash('Estado de factura actualizado con éxito', 'success')
    except APIError as e:
        flash(f'Error al cambiar estado: {e.message}', 'error')
    return redirect(url_for('facturacion.ver_factura', id=id))


# MARCAR FACTURA COMO PAGADA (COMPATIBILIDAD)
@facturacion_bp.route('/pagar_factura/<int:id>', methods=['POST'])
def pagar_factura(id):
    return cambiar_estado_factura(id)





# ==========================================
# FORMAS DE PAGO
# ==========================================


#CREAR METODOS DE PAGO
@facturacion_bp.route('/crear_metodos_pago', methods=['GET', 'POST'])
def crear_metodos_pago():

    if request.method == 'POST':

        data = {
            'nombre': request.form.get('nombre'),
            'estado': request.form.get('estado')
        }

        print("================================")
        print("DATOS ENVIADOS AL BACKEND:")
        print(data)
        print("================================")


        try:
        
            respuesta = _client().post(
                '/metodos_pago/',
                json=data
            )
        
            print("================================")
            print("RESPUESTA DEL BACKEND:")
            print(respuesta)
            print("================================")
        
            return redirect(url_for('facturacion.crear_metodos_pago'))
        
        except APIError as e:
        
            print("================================")
            print("ERROR AL CREAR METODO DE PAGO")
            print("Mensaje:", e.message)
            print("Status:", e.status_code)
            print("Errors:", e.errors)
            print("================================")
        
            return render_template(
                'facturacion/crear_metodos_pago.html',
                error=e.message
            )


    return render_template(
        'facturacion/crear_metodos_pago.html'
    )

# LISTA METODOS DE PAGO

@facturacion_bp.route('/lista_metodos_pago')
def lista_metodos_pago():

    q = request.args.get('q', '').strip()

    try:

        metodos = _client().get(
            '/metodos_pago/'
        )

    except APIError as e:

        print("================================")
        print("ERROR AL OBTENER MÉTODOS DE PAGO")
        print("Mensaje:", e.message)
        print("Status:", e.status_code)
        print("Errors:", e.errors)
        print("================================")

        metodos = []

    return render_template(
        'facturacion/lista_metodos_pago.html',
        metodos=metodos,
        q=q
    )