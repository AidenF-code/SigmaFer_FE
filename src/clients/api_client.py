import httpx
from flask import current_app


class APIError(Exception):
    def __init__(self, message, status_code=400, errors=None):
        self.message = message
        self.errors = errors
        self.status_code = status_code
        super().__init__(message)


class APIClient:
    def __init__(self, token: str = None):
        self.base_url = current_app.config["API_BASE_URL"]
        self.headers = {'Content-Type': 'application/json'}
        if token:
            self.headers['X-Auth-Token'] = token

    def _url(self, path: str) -> str:
        ful_url = f"{self.base_url.rstrip('/')}/{path.lstrip('/')}"
        print(f"APIClient: {ful_url}")
        return ful_url


    def _handle(self, response: httpx.Response):
        if not response.content:
            raise APIError("EL servidor retorno una respuesta vacia", response.status_code)

        try:
            body = response.json()
        except Exception:
            raise APIError(
                f'Respuesta no es un JSON valido (status {response.status_code}): '
                f'{response.text[:200]}',
                response.status_code
            )

    # El backend retorna una lista directamente -> envolverla
        if isinstance(body, list):
            return body #Los controladores recibiran la lista tal cual

        if not isinstance(body, dict):
            raise APIError(
                f'Formato de respuesta inesperado: {type(body).__name__}',
                response.status_code
            )

    # Backend con wrapper {success, data} {estructura propia}
        if 'success' in body:
            if not body.get('success'):
                raise APIError (
                    body.get('message', 'Error desconocido'),
                    response.status_code,
                    body.get('errors')
                )
            return body.get('data')

    # Backend externo con dict plano (sin wrapper)
        if response.status_code < 400:
            return body
        raise APIError(
            body.get('message') or body.get('error') or 'Error del servidor',
            response.status_code
        )    

    def get(self, path, params = None):
        print(path)
        r = httpx.get(self._url(path), params=params, headers=self.headers, timeout=10)
        print(r.text)
        return self._handle(r)

    def post(self, path, json=None):
        print(path)

        r = httpx.post(
            self._url(path),
            json=json,
            headers=self.headers,
            timeout=10
        )

        print(r.text)

        return self._handle(r)

    def put(self, path, json=None):
        print(path)

        r = httpx.put(
            self._url(path),
            json=json,
            headers=self.headers,
            timeout=10
        )

        print(r.text)

        return self._handle(r)

    def delete(self, path):
        print(path)

        r = httpx.delete(
            self._url(path),
            headers=self.headers,
            timeout=10
        )

        print(r.text)

        return self._handle(r)

    @staticmethod
    def as_list(data):
        """Normaliza respuesta a lista, sea directa o paginada"""
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return data.get("items") or data.get('data') or data.get("results") or []
        return []

    