from flask import Blueprint, render_template, redirect, url_for, request, flash, session, jsonify
from src.clients.api_client import APIClient, APIError



inventarios_bp = Blueprint('inventarios', __name__, url_prefix='/inventarios')

def _client():
    return APIClient(session.get('api_token'))

@inventarios_bp.route('/')
def inicio():
    return render_template('inventarios/modulo_inventarios.html')


# ==========================================
# PRODUCTOS
# ==========================================

@inventarios_bp.route('/crear_producto', methods=['GET', 'POST'])
def crear_producto():

    # =========================================
    # CARGAR PROVEEDORES
    # =========================================

    try:
        proveedores_data = _client().get('/proveedores/')
        proveedores = APIClient.as_list(proveedores_data)

    except APIError:
        proveedores = []

    # =========================================
    # CARGAR CATEGORÍAS
    # =========================================

    try:
        categorias_data = _client().get('/categorias/')
        categorias = APIClient.as_list(categorias_data)

    except APIError:
        categorias = []

    # =========================================
    # CREAR PRODUCTO
    # =========================================

    if request.method == 'POST':

        data = {
            'nombre': request.form.get('nombre'),
            'codigo': request.form.get('codigo'),
            'proveedor_id': request.form.get('proveedor_id'),
            'categoria_id': request.form.get('categoria_id'),
            'stock': request.form.get('stock'),
            'stock_minimo': request.form.get('stock_minimo'),
            'stock_maximo': request.form.get('stock_maximo'),
            'precio': request.form.get('precio'),
            'estado': request.form.get('estado')
        }

        print("================================")
        print("DATOS ENVIADOS AL BACKEND:")
        print(data)
        print("================================")

        try:

            respuesta = _client().post(
                '/productos/',
                json=data
            )

            print("================================")
            print("RESPUESTA DEL BACKEND:")
            print(respuesta)
            print("================================")

            return redirect(
                url_for('inventarios.crear_producto')
            )

        except APIError as e:

            print("================================")
            print("ERROR AL CREAR PRODUCTO")
            print("Mensaje:", e.message)
            print("Status:", e.status_code)
            print("Errors:", e.errors)
            print("================================")

            return render_template(
                'inventarios/crear_producto.html',
                proveedores=proveedores,
                categorias=categorias,
                error=e.message
            )

    # =========================================
    # MOSTRAR FORMULARIO
    # =========================================

    return render_template(
        'inventarios/crear_producto.html',
        proveedores=proveedores,
        categorias=categorias
    )


@inventarios_bp.route('/lista_productos')
def lista_productos():

    q = request.args.get('q', '').strip()

    try:
        data = _client().get('/productos/')
        productos = APIClient.as_list(data)
    except APIError as e:
        productos = []

    try:
        proveedores_data = _client().get('/proveedores/')
        proveedores = APIClient.as_list(proveedores_data)
    except APIError:
        proveedores = []

    try:
        categorias_data = _client().get('/categorias/')
        categorias = APIClient.as_list(categorias_data)
    except APIError:
        categorias = []

    return render_template(
        'inventarios/lista_productos.html',
        productos=productos,
        proveedores=proveedores,
        categorias=categorias,
        q=q
    )


@inventarios_bp.route('/editar_producto/<int:id>', methods=['GET', 'POST'])
def editar_producto(id):
    try:
        producto = _client().get(f'/productos/{id}')
    except APIError as e:
        flash(f'Error al obtener el producto: {e.message}', 'error')
        return redirect(url_for('inventarios.lista_productos'))

    if request.method == 'POST':
        stock_minimo = request.form.get('stock_minimo')
        stock_maximo = request.form.get('stock_maximo')
        precio = request.form.get('precio')
        estado = request.form.get('estado')

        payload = {
            'nombre': producto.get('nombre'),
            'codigo': producto.get('codigo'),
            'categoria_id': producto.get('categoria_id'),
            'proveedor_id': producto.get('proveedor_id'),
            'stock': producto.get('stock'),
            'stock_minimo': stock_minimo,
            'stock_maximo': stock_maximo if stock_maximo else None,
            'precio': precio,
            'estado': estado
        }

        try:
            _client().put(f'/productos/{id}', json=payload)
            flash('Producto actualizado correctamente', 'success')
            return redirect(url_for('inventarios.lista_productos'))
        except APIError as e:
            return render_template(
                'inventarios/editar_producto.html',
                producto=producto,
                error=e.message
            )

    return render_template(
        'inventarios/editar_producto.html',
        producto=producto
    )



# =========================================
    # CREAR PROVEEDOR
# =========================================

@inventarios_bp.route('/crear_proveedor', methods=['GET', 'POST'])
def crear_proveedor():
    

    if request.method == 'POST':

        data = {
            'nombre': request.form.get('nombre'),
            'nit': request.form.get('nit'),
            'direccion': request.form.get('direccion'),
            'telefono': request.form.get('telefono'),
            'correo': request.form.get('correo'),
            'nombre_contacto': request.form.get('nombre_contacto'),
            'estado': request.form.get('estado')
            
        }

        print("================================")
        print("DATOS ENVIADOS AL BACKEND:")
        print(data)
        print("================================")

        try:

            respuesta = _client().post(
                '/proveedores/',
                json=data
            )

            print("================================")
            print("RESPUESTA DEL BACKEND:")
            print(respuesta)
            print("================================")

            return redirect(
                url_for('inventarios.crear_proveedor')
            )

        except APIError as e:

            print("================================")
            print("ERROR AL CREAR PROVEEDOR")
            print("Mensaje:", e.message)
            print("Status:", e.status_code)
            print("Errors:", e.errors)
            print("================================")

            return render_template(
                'inventarios/crear_proveedor.html',
                error=e.message
            )

    # =========================================
    # MOSTRAR FORMULARIO
    # =========================================

    return render_template(
        'inventarios/crear_proveedor.html',
    )



@inventarios_bp.route('/lista_proveedores')
def lista_proveedores():

    q = request.args.get('q', '').strip()
        
    try:
        data = _client().get('/proveedores/')
        proveedores = APIClient.as_list(data)
        
    except APIError as e:
        proveedores = []
    return render_template(
        'inventarios/lista_proveedores.html',
        proveedores=proveedores,
        q=q
    )


@inventarios_bp.route('/editar_proveedor/<int:id>', methods=['GET', 'POST'])
def editar_proveedor(id):
    try:
        proveedor = _client().get(f'/proveedores/{id}')
    except APIError as e:
        flash(f'Error al obtener el proveedor: {e.message}', 'error')
        return redirect(url_for('inventarios.lista_proveedores'))

    if request.method == 'POST':
        direccion = request.form.get('direccion')
        telefono = request.form.get('telefono')
        correo = request.form.get('correo')
        nombre_contacto = request.form.get('nombre_contacto')
        estado = request.form.get('estado')

        payload = {
            'nombre': proveedor.get('nombre'),
            'nit': proveedor.get('nit'),
            'direccion': direccion,
            'telefono': telefono,
            'correo': correo,
            'nombre_contacto': nombre_contacto,
            'estado': estado
        }

        try:
            _client().put(f'/proveedores/{id}', json=payload)
            flash('Proveedor actualizado correctamente', 'success')
            return redirect(url_for('inventarios.lista_proveedores'))
        except APIError as e:
            return render_template(
                'inventarios/editar_proveedor.html',
                proveedor=proveedor,
                error=e.message
            )

    return render_template(
        'inventarios/editar_proveedor.html',
        proveedor=proveedor
    )


@inventarios_bp.route('/crear_entrada', methods=['GET', 'POST'])
def crear_entrada():
    from datetime import datetime

    try:
        proveedores_data = _client().get('/proveedores/')
        proveedores = APIClient.as_list(proveedores_data)
    except APIError:
        proveedores = []

    try:
        productos_data = _client().get('/productos/')
        productos = APIClient.as_list(productos_data)
    except APIError:
        productos = []

    try:
        usuarios_data = _client().get('/usuarios/')
        usuarios = APIClient.as_list(usuarios_data)
    except APIError:
        usuarios = []

    try:
        data_co = _client().get('/documentos_inventario/siguiente_numero?tipo=CO')
        consecutivo_co = data_co.get('numero_documento', 'CO-00001') if isinstance(data_co, dict) else 'CO-00001'
    except Exception:
        consecutivo_co = 'CO-00001'

    try:
        data_en = _client().get('/documentos_inventario/siguiente_numero?tipo=EN')
        consecutivo_en = data_en.get('numero_documento', 'EN-00001') if isinstance(data_en, dict) else 'EN-00001'
    except Exception:
        consecutivo_en = 'EN-00001'

    try:
        data_oc = _client().get('/ordenes_compra/siguiente_numero')
        consecutivo_oc = data_oc.get('numero_orden', 'OC-00001') if isinstance(data_oc, dict) else 'OC-00001'
    except Exception:
        consecutivo_oc = 'OC-00001'

    fecha_hora = datetime.now().strftime('%Y-%m-%d %H:%M')

    if request.method == 'POST':
        tipo_entrada = request.form.get('tipo_entrada', 'COMPRA')
        numero_documento = request.form.get('numero_documento') or (consecutivo_co if tipo_entrada == 'COMPRA' else consecutivo_en)
        numero_orden_compra = request.form.get('numero_orden_compra') or consecutivo_oc
        numero_factura_proveedor = (request.form.get('numero_factura_proveedor') or '').strip()
        proveedor_id = request.form.get('proveedor_id')
        usuario_id = request.form.get('usuario_id') or request.form.get('usuario_id_ajuste')
        observaciones_user = (request.form.get('observaciones') or request.form.get('observaciones_ajuste') or '').strip()

        notas = []
        if tipo_entrada == 'COMPRA':
            if numero_factura_proveedor:
                notas.append(f"Factura Proveedor: {numero_factura_proveedor}")
            if numero_orden_compra:
                notas.append(f"Orden Compra: {numero_orden_compra}")

        if observaciones_user:
            notas.append(observaciones_user)
        observaciones_final = " | ".join(notas)

        # Resolver proveedor_id si no vino en el hidden
        if tipo_entrada == 'COMPRA' and (not proveedor_id or not str(proveedor_id).isdigit()):
            busqueda_prov = (request.form.get('proveedor_busqueda') or request.form.get('nit_proveedor') or '').strip().lower()
            for p in proveedores:
                p_nom = str(p.get('nombre', '')).strip().lower()
                p_nit = str(p.get('nit', '')).strip().lower()
                if busqueda_prov and (busqueda_prov in p_nom or busqueda_prov == p_nit):
                    proveedor_id = p.get('id')
                    break

        if not usuario_id or not str(usuario_id).isdigit():
            if usuarios:
                usuario_id = usuarios[0].get('id')

        productos_ids = request.form.getlist('producto_id[]')
        codigos = request.form.getlist('codigo[]')
        nombres_prods = request.form.getlist('producto_nombre[]')
        cantidades = request.form.getlist('cantidad[]')
        valores_unitarios = request.form.getlist('valor_unitario[]')

        total_filas = max(len(productos_ids), len(codigos), len(nombres_prods), len(cantidades))
        detalles = []

        for i in range(total_filas):
            p_id = (productos_ids[i] or '').strip() if i < len(productos_ids) else ''
            cod = (codigos[i] or '').strip() if i < len(codigos) else ''
            nom = (nombres_prods[i] or '').strip() if i < len(nombres_prods) else ''
            cant_str = (cantidades[i] or '0').strip() if i < len(cantidades) else '0'
            val_str = (valores_unitarios[i] or '0').strip() if i < len(valores_unitarios) else '0'

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
                    if cant > 0:
                        detalles.append({
                            'producto_id': int(p_id),
                            'cantidad': cant,
                            'valor_unitario': val
                        })
                except (ValueError, TypeError):
                    pass

        payload = {
            'numero_documento': numero_documento,
            'tipo_documento': 'Entrada' if tipo_entrada == 'COMPRA' else 'Ajuste',
            'observaciones': observaciones_final,
            'proveedor_id': int(proveedor_id) if proveedor_id and str(proveedor_id).isdigit() else None,
            'usuario_id': int(usuario_id) if usuario_id and str(usuario_id).isdigit() else None,
            'detalles': detalles
        }

        try:
            _client().post('/documentos_inventario/', json=payload)
            flash('Entrada de inventario guardada exitosamente', 'success')
            return redirect(url_for('inventarios.lista_entradas'))
        except APIError as e:
            return render_template(
                'inventarios/crear_entrada.html',
                proveedores=proveedores,
                productos=productos,
                usuarios=usuarios,
                consecutivo_co=consecutivo_co,
                consecutivo_en=consecutivo_en,
                consecutivo_oc=consecutivo_oc,
                fecha_hora=fecha_hora,
                error=e.message
            )

    return render_template(
        'inventarios/crear_entrada.html',
        proveedores=proveedores,
        productos=productos,
        usuarios=usuarios,
        consecutivo_co=consecutivo_co,
        consecutivo_en=consecutivo_en,
        consecutivo_oc=consecutivo_oc,
        fecha_hora=fecha_hora
    )



@inventarios_bp.route('/lista_entradas')
def lista_entradas():
    import unicodedata
    def clean(t):
        if not t: return ''
        return unicodedata.normalize('NFKD', str(t)).encode('ASCII', 'ignore').decode('utf-8').lower()

    try:
        documentos_data = _client().get('/documentos_inventario/')
        todos = APIClient.as_list(documentos_data)
        documentos = []
        for d in todos:
            tipo = clean(d.get('tipo_documento', ''))
            num = (d.get('numero_documento') or '').upper()
            # Excluir Devoluciones y Salidas
            if 'devolu' in tipo or num.startswith('DE-') or 'salida' in tipo or num.startswith('SA-'):
                continue
            if 'entrada' in tipo or 'ajuste' in tipo or 'compra' in tipo or num.startswith('CO-') or num.startswith('EN-'):
                documentos.append(d)
    except APIError:
        documentos = []
    return render_template('inventarios/lista_entradas.html', documentos=documentos)


@inventarios_bp.route('/ver_entrada/<int:id>')
def ver_entrada(id):
    try:
        documento = _client().get(f'/documentos_inventario/{id}')
    except APIError as e:
        flash(f'Error al obtener el documento de entrada: {e.message}', 'error')
        return redirect(url_for('inventarios.lista_entradas'))

    try:
        productos_data = _client().get('/productos/')
        productos = APIClient.as_list(productos_data)
        prod_map = {p.get('id'): p for p in productos}
        if documento and isinstance(documento, dict):
            for d in documento.get('detalles', []):
                p_id = d.get('producto_id')
                if p_id in prod_map:
                    if not d.get('producto'):
                        d['producto'] = prod_map[p_id].get('nombre', '')
                    if not d.get('codigo_producto'):
                        d['codigo_producto'] = prod_map[p_id].get('codigo', '')
    except Exception:
        pass

    return render_template('inventarios/ver_entrada.html', documento=documento)



@inventarios_bp.route('/crear_salida', methods=['GET', 'POST'])
def crear_salida():
    from datetime import datetime

    try:
        productos_data = _client().get('/productos/')
        productos = APIClient.as_list(productos_data)
    except APIError:
        productos = []

    try:
        usuarios_data = _client().get('/usuarios/')
        usuarios = APIClient.as_list(usuarios_data)
    except APIError:
        usuarios = []

    try:
        data_sa = _client().get('/documentos_inventario/siguiente_numero?tipo=SA')
        consecutivo_sa = data_sa.get('numero_documento', 'SA-00001') if isinstance(data_sa, dict) else 'SA-00001'
    except Exception:
        consecutivo_sa = 'SA-00001'

    fecha_hora = datetime.now().strftime('%Y-%m-%d %H:%M')

    if request.method == 'POST':
        numero_documento = request.form.get('numero_documento') or consecutivo_sa
        usuario_id = request.form.get('usuario_id')
        observaciones = (request.form.get('observaciones') or '').strip()

        if not usuario_id or not str(usuario_id).isdigit():
            if usuarios:
                usuario_id = usuarios[0].get('id')

        productos_ids = request.form.getlist('producto_id[]')
        codigos = request.form.getlist('codigo[]')
        nombres_prods = request.form.getlist('producto_nombre[]')
        cantidades = request.form.getlist('cantidad[]')
        valores_unitarios = request.form.getlist('valor_unitario[]')

        total_filas = max(len(productos_ids), len(codigos), len(nombres_prods), len(cantidades))
        detalles = []

        for i in range(total_filas):
            p_id = (productos_ids[i] or '').strip() if i < len(productos_ids) else ''
            cod = (codigos[i] or '').strip() if i < len(codigos) else ''
            nom = (nombres_prods[i] or '').strip() if i < len(nombres_prods) else ''
            cant_str = (cantidades[i] or '0').strip() if i < len(cantidades) else '0'
            val_str = (valores_unitarios[i] or '0').strip() if i < len(valores_unitarios) else '0'

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
                    if cant > 0:
                        detalles.append({
                            'producto_id': int(p_id),
                            'cantidad': cant,
                            'valor_unitario': val
                        })
                except (ValueError, TypeError):
                    pass

        payload = {
            'numero_documento': numero_documento,
            'tipo_documento': 'Salida',
            'observaciones': observaciones,
            'usuario_id': int(usuario_id) if usuario_id and str(usuario_id).isdigit() else None,
            'detalles': detalles
        }

        try:
            _client().post('/documentos_inventario/', json=payload)
            flash('Salida de inventario registrada exitosamente', 'success')
            return redirect(url_for('inventarios.lista_salidas'))
        except APIError as e:
            return render_template(
                'inventarios/crear_salida.html',
                productos=productos,
                usuarios=usuarios,
                consecutivo_sa=consecutivo_sa,
                fecha_hora=fecha_hora,
                error=e.message
            )

    return render_template(
        'inventarios/crear_salida.html',
        productos=productos,
        usuarios=usuarios,
        consecutivo_sa=consecutivo_sa,
        fecha_hora=fecha_hora
    )


@inventarios_bp.route('/lista_salidas')
def lista_salidas():
    try:
        documentos_data = _client().get('/documentos_inventario/?tipo=Salida')
        documentos = APIClient.as_list(documentos_data)
    except APIError:
        documentos = []
    return render_template('inventarios/lista_salidas.html', documentos=documentos)


@inventarios_bp.route('/crear_orden_compra', methods=['GET', 'POST'])
def crear_orden_compra():
    from datetime import datetime

    try:
        proveedores_data = _client().get('/proveedores/')
        proveedores = APIClient.as_list(proveedores_data)
    except APIError:
        proveedores = []

    try:
        productos_data = _client().get('/productos/')
        productos = APIClient.as_list(productos_data)
    except APIError:
        productos = []

    try:
        usuarios_data = _client().get('/usuarios/')
        usuarios = APIClient.as_list(usuarios_data)
    except APIError:
        usuarios = []

    try:
        data_oc = _client().get('/ordenes_compra/siguiente_numero')
        consecutivo_oc = data_oc.get('numero_orden', 'OC-00001') if isinstance(data_oc, dict) else 'OC-00001'
    except Exception:
        consecutivo_oc = 'OC-00001'

    fecha_hora = datetime.now().strftime('%Y-%m-%d %H:%M')

    if request.method == 'POST':
        numero_orden = request.form.get('numero_orden') or consecutivo_oc
        proveedor_id = request.form.get('proveedor_id')
        usuario_id = request.form.get('usuario_id')
        observaciones = (request.form.get('observaciones') or '').strip()

        if not proveedor_id or not str(proveedor_id).isdigit():
            busqueda_prov = (request.form.get('proveedor_busqueda') or request.form.get('nit_proveedor') or '').strip().lower()
            for p in proveedores:
                p_nom = str(p.get('nombre', '')).strip().lower()
                p_nit = str(p.get('nit', '')).strip().lower()
                if busqueda_prov and (busqueda_prov in p_nom or busqueda_prov == p_nit):
                    proveedor_id = p.get('id')
                    break

        if not usuario_id or not str(usuario_id).isdigit():
            if usuarios:
                usuario_id = usuarios[0].get('id')

        productos_ids = request.form.getlist('producto_id[]')
        codigos = request.form.getlist('codigo[]')
        nombres_prods = request.form.getlist('producto_nombre[]')
        cantidades = request.form.getlist('cantidad[]')
        valores_unitarios = request.form.getlist('valor_unitario[]')

        total_filas = max(len(productos_ids), len(codigos), len(nombres_prods), len(cantidades))
        detalles = []

        for i in range(total_filas):
            p_id = (productos_ids[i] or '').strip() if i < len(productos_ids) else ''
            cod = (codigos[i] or '').strip() if i < len(codigos) else ''
            nom = (nombres_prods[i] or '').strip() if i < len(nombres_prods) else ''
            cant_str = (cantidades[i] or '0').strip() if i < len(cantidades) else '0'
            val_str = (valores_unitarios[i] or '0').strip() if i < len(valores_unitarios) else '0'

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
                    if cant > 0:
                        detalles.append({
                            'producto_id': int(p_id),
                            'cantidad': cant,
                            'valor_unitario': val
                        })
                except (ValueError, TypeError):
                    pass

        payload = {
            'numero_orden': numero_orden,
            'proveedor_id': int(proveedor_id) if proveedor_id and str(proveedor_id).isdigit() else None,
            'usuario_id': int(usuario_id) if usuario_id and str(usuario_id).isdigit() else None,
            'observaciones': observaciones,
            'detalles': detalles
        }

        try:
            _client().post('/ordenes_compra/', json=payload)
            flash('Orden de compra emitida exitosamente', 'success')
            return redirect(url_for('inventarios.lista_ordenes_compra'))
        except APIError as e:
            return render_template(
                'inventarios/crear_orden_compra.html',
                proveedores=proveedores,
                productos=productos,
                usuarios=usuarios,
                consecutivo_oc=consecutivo_oc,
                fecha_hora=fecha_hora,
                error=e.message
            )

    return render_template(
        'inventarios/crear_orden_compra.html',
        proveedores=proveedores,
        productos=productos,
        usuarios=usuarios,
        consecutivo_oc=consecutivo_oc,
        fecha_hora=fecha_hora
    )


@inventarios_bp.route('/lista_ordenes_compra')
def lista_ordenes_compra():
    try:
        ordenes_data = _client().get('/ordenes_compra/')
        ordenes = APIClient.as_list(ordenes_data)
    except APIError:
        ordenes = []
    return render_template('inventarios/lista_ordenes_compra.html', ordenes=ordenes)


@inventarios_bp.route('/crear_devolucion', methods=['GET', 'POST'])
def crear_devolucion():
    from datetime import datetime

    try:
        facturas_data = _client().get('/facturas/')
        facturas = APIClient.as_list(facturas_data)
    except APIError:
        facturas = []

    try:
        clientes_data = _client().get('/clientes/')
        clientes = APIClient.as_list(clientes_data)
    except APIError:
        clientes = []

    try:
        productos_data = _client().get('/productos/')
        productos = APIClient.as_list(productos_data)
    except APIError:
        productos = []

    try:
        usuarios_data = _client().get('/usuarios/')
        usuarios = APIClient.as_list(usuarios_data)
    except APIError:
        usuarios = []

    try:
        data_de = _client().get('/documentos_inventario/siguiente_numero?tipo=DE')
        consecutivo_de = data_de.get('numero_documento', 'DE-00001') if isinstance(data_de, dict) else 'DE-00001'
    except Exception:
        consecutivo_de = 'DE-00001'

    fecha_hora = datetime.now().strftime('%Y-%m-%d %H:%M')

    if request.method == 'POST':
        numero_documento = request.form.get('numero_documento') or consecutivo_de
        numero_factura = (request.form.get('numero_factura') or '').strip()
        cliente_id = request.form.get('cliente_id')
        usuario_id = request.form.get('usuario_id')
        observaciones_raw = (request.form.get('observaciones') or '').strip()

        if numero_factura:
            observaciones = f"[Factura: {numero_factura}] {observaciones_raw}"
        else:
            observaciones = observaciones_raw

        if not cliente_id or not str(cliente_id).isdigit():
            busqueda_cli = (request.form.get('cliente_busqueda') or request.form.get('nit_cliente') or '').strip().lower()
            for c in clientes:
                c_nom = str(c.get('razon_social') or c.get('nombre') or '').strip().lower()
                c_doc = str(c.get('numero_documento') or c.get('nit') or '').strip().lower()
                if busqueda_cli and (busqueda_cli in c_nom or busqueda_cli == c_doc):
                    cliente_id = c.get('id')
                    break

        if not usuario_id or not str(usuario_id).isdigit():
            if usuarios:
                usuario_id = usuarios[0].get('id')

        productos_ids = request.form.getlist('producto_id[]')
        codigos = request.form.getlist('codigo[]')
        nombres_prods = request.form.getlist('producto_nombre[]')
        cantidades = request.form.getlist('cantidad[]')
        valores_unitarios = request.form.getlist('valor_unitario[]')

        total_filas = max(len(productos_ids), len(codigos), len(nombres_prods), len(cantidades))
        detalles = []

        for i in range(total_filas):
            p_id = (productos_ids[i] or '').strip() if i < len(productos_ids) else ''
            cod = (codigos[i] or '').strip() if i < len(codigos) else ''
            nom = (nombres_prods[i] or '').strip() if i < len(nombres_prods) else ''
            cant_str = (cantidades[i] or '0').strip() if i < len(cantidades) else '0'
            val_str = (valores_unitarios[i] or '0').strip() if i < len(valores_unitarios) else '0'

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
                    if cant > 0:
                        detalles.append({
                            'producto_id': int(p_id),
                            'cantidad': cant,
                            'valor_unitario': val
                        })
                except (ValueError, TypeError):
                    pass

        payload = {
            'numero_documento': numero_documento,
            'tipo_documento': 'Devolucion',
            'cliente_id': int(cliente_id) if cliente_id and str(cliente_id).isdigit() else None,
            'usuario_id': int(usuario_id) if usuario_id and str(usuario_id).isdigit() else None,
            'observaciones': observaciones,
            'detalles': detalles
        }

        try:
            _client().post('/documentos_inventario/', json=payload)
            flash('Devolución registrada exitosamente. Stock reintegrado al inventario.', 'success')
            return redirect(url_for('inventarios.lista_devoluciones'))
        except APIError as e:
            return render_template(
                'inventarios/crear_devolucion.html',
                facturas=facturas,
                clientes=clientes,
                productos=productos,
                usuarios=usuarios,
                consecutivo_de=consecutivo_de,
                fecha_hora=fecha_hora,
                error=e.message
            )

    return render_template(
        'inventarios/crear_devolucion.html',
        facturas=facturas,
        clientes=clientes,
        productos=productos,
        usuarios=usuarios,
        consecutivo_de=consecutivo_de,
        fecha_hora=fecha_hora
    )


@inventarios_bp.route('/lista_devoluciones')
def lista_devoluciones():
    try:
        documentos_data = _client().get('/documentos_inventario/?tipo=Devolucion')
        documentos = APIClient.as_list(documentos_data)
        if not documentos:
            # Fallback en caso de parametro
            todos = APIClient.as_list(_client().get('/documentos_inventario/'))
            documentos = [
                d for d in todos
                if 'devolu' in str(d.get('tipo_documento', '')).lower() or str(d.get('numero_documento', '')).startswith('DE-')
            ]
    except APIError:
        documentos = []
    return render_template('inventarios/lista_devoluciones.html', documentos=documentos)


@inventarios_bp.route('/api/factura_detalles/<int:id>')
def api_factura_detalles(id):
    try:
        detalles_data = _client().get(f'/detalle_facturas/factura/{id}')
        detalles = APIClient.as_list(detalles_data)
        
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

        return jsonify(detalles), 200
    except APIError as e:
        return jsonify({'message': e.message, 'detalles': []}), 400


@inventarios_bp.route('/ver_devolucion/<int:id>')
def ver_devolucion(id):
    try:
        documento = _client().get(f'/documentos_inventario/{id}')
    except APIError as e:
        flash(f'Error al obtener documento: {e.message}', 'error')
        return redirect(url_for('inventarios.lista_devoluciones'))

    try:
        productos_data = _client().get('/productos/')
        productos = APIClient.as_list(productos_data)
        prod_map = {p.get('id'): p for p in productos}
        if documento and isinstance(documento, dict):
            for d in documento.get('detalles', []):
                p_id = d.get('producto_id')
                if p_id in prod_map:
                    if not d.get('producto'):
                        d['producto'] = prod_map[p_id].get('nombre', '')
                    if not d.get('codigo_producto'):
                        d['codigo_producto'] = prod_map[p_id].get('codigo', '')
    except Exception:
        pass

    return render_template('inventarios/ver_devolucion.html', documento=documento)


# ==========================================
# CATEGORÍAS
# ==========================================

@inventarios_bp.route('/crear_categoria', methods=['GET', 'POST'])
def crear_categoria():
    if request.method == 'POST':
        nombre = request.form.get('nombre', '').strip()
        estado = request.form.get('estado', 'Activo').strip()

        data = {
            'nombre': nombre,
            'estado': estado
        }

        try:
            _client().post('/categorias/', json=data)
            flash('Categoría creada exitosamente.', 'success')
            return redirect(url_for('inventarios.lista_categorias'))
        except APIError as e:
            return render_template(
                'inventarios/crear_categoria.html',
                nombre=nombre,
                estado=estado,
                error=e.message
            )

    return render_template('inventarios/crear_categoria.html')


@inventarios_bp.route('/editar_categoria/<int:id>', methods=['GET', 'POST'])
def editar_categoria(id):
    try:
        categoria = _client().get(f'/categorias/{id}')
    except APIError as e:
        flash(f'Error al obtener categoría: {e.message}', 'error')
        return redirect(url_for('inventarios.lista_categorias'))

    if request.method == 'POST':
        nombre = request.form.get('nombre', '').strip()
        estado = request.form.get('estado', 'Activo').strip()

        data = {
            'nombre': nombre,
            'estado': estado
        }

        try:
            _client().put(f'/categorias/{id}', json=data)
            flash('Categoría actualizada exitosamente.', 'success')
            return redirect(url_for('inventarios.lista_categorias'))
        except APIError as e:
            return render_template(
                'inventarios/editar_categoria.html',
                categoria=categoria,
                error=e.message
            )

    return render_template('inventarios/editar_categoria.html', categoria=categoria)


@inventarios_bp.route('/cambiar_estado_categoria/<int:id>', methods=['GET', 'POST'])
def cambiar_estado_categoria(id):
    try:
        res = _client().post(f'/categorias/{id}/toggle_estado')
        msg = res.get('message', 'Estado de la categoría actualizado.') if isinstance(res, dict) else 'Estado actualizado.'
        flash(msg, 'success')
    except APIError as e:
        flash(f'Error al cambiar estado: {e.message}', 'error')
    return redirect(url_for('inventarios.lista_categorias'))


@inventarios_bp.route('/lista_categorias')
def lista_categorias():
    try:
        categorias_data = _client().get('/categorias/')
        categorias = APIClient.as_list(categorias_data)
    except APIError:
        categorias = []

    return render_template('inventarios/lista_categorias.html', categorias=categorias)






