const stockMinimo = document.querySelector('[name="stock_minimo"]');
const stockMaximo = document.querySelector('[name="stock_maximo"]');
const formulario = document.querySelector('.form-grid');

formulario.addEventListener('submit', function (event) {

    const minimo = parseFloat(stockMinimo.value);

    const maximo = stockMaximo.value === ''
        ? null
        : parseFloat(stockMaximo.value);

    if (maximo !== null && maximo <= minimo) {
        event.preventDefault();

        alert('El stock máximo debe ser mayor que el stock mínimo.');
    }
});