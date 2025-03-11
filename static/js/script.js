document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formulario-hipotecas');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const resultados1 = document.getElementById('resultados1');
    const resultados2 = document.getElementById('resultados2');
    const comparacionResultados = document.getElementById('comparacion-resultados');
    
    // Evento para calcular al enviar el formulario
    formulario.addEventListener('submit', function(e) {
        e.preventDefault();
        calcularHipotecas();
    });
    
    // Evento para limpiar el formulario
    btnLimpiar.addEventListener('click', function() {
        formulario.reset();
        resultados1.innerHTML = '';
        resultados2.innerHTML = '';
        comparacionResultados.innerHTML = '';
        comparacionResultados.classList.add('hidden');
    });
    
    // Validar que el año de amortización no sea mayor que los años de financiación
    const anios1Input = document.getElementById('anios1');
    const anioAmortizacion1Input = document.getElementById('anio_amortizacion1');
    const anios2Input = document.getElementById('anios2');
    const anioAmortizacion2Input = document.getElementById('anio_amortizacion2');
    
    anioAmortizacion1Input.addEventListener('input', function() {
        const anios = parseInt(anios1Input.value);
        const anioAmortizacion = parseInt(anioAmortizacion1Input.value);
        
        if (anioAmortizacion > anios) {
            anioAmortizacion1Input.setCustomValidity('El año de amortización no puede ser mayor que los años de financiación');
        } else {
            anioAmortizacion1Input.setCustomValidity('');
        }
    });
    
    anioAmortizacion2Input.addEventListener('input', function() {
        const anios = parseInt(anios2Input.value);
        const anioAmortizacion = parseInt(anioAmortizacion2Input.value);
        
        if (anioAmortizacion > anios) {
            anioAmortizacion2Input.setCustomValidity('El año de amortización no puede ser mayor que los años de financiación');
        } else {
            anioAmortizacion2Input.setCustomValidity('');
        }
    });
    
    // Duplicar valores entre simulaciones
    document.getElementById('valor1').addEventListener('input', function() {
        document.getElementById('valor2').value = this.value;
    });
    
    document.getElementById('anios1').addEventListener('input', function() {
        document.getElementById('anios2').value = this.value;
    });
    
    // Función principal para calcular hipotecas
    function calcularHipotecas() {
        // Obtener datos del formulario
        const formData = new FormData(formulario);
        
        // Enviar datos al servidor
        fetch('/calcular', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Mostrar resultados de simulación 1
            if (data.simulacion1) {
                resultados1.innerHTML = `
                    <p><strong>Entidad bancaria:</strong> ${data.simulacion1.entidad}</p>
                    <p><strong>Cuota mensual:</strong> ${data.simulacion1.cuota.toLocaleString('es-ES')} €</p>
                    <p><strong>Total pagado:</strong> ${data.simulacion1.total.toLocaleString('es-ES')} €</p>
                    <p><strong>Total intereses:</strong> ${data.simulacion1.intereses.toLocaleString('es-ES')} €</p>
                    <p><strong>Intereses hasta amortización:</strong> ${data.simulacion1.intereses_acumulados.toLocaleString('es-ES')} €</p>
                `;
                resultados1.classList.remove('error');
            } else {
                resultados1.innerHTML = '<p>No se han podido calcular los resultados. Verifica los datos introducidos.</p>';
                resultados1.classList.add('error');
            }
            
            // Mostrar resultados de simulación 2
            if (data.simulacion2) {
                resultados2.innerHTML = `
                    <p><strong>Entidad bancaria:</strong> ${data.simulacion2.entidad}</p>
                    <p><strong>Cuota mensual:</strong> ${data.simulacion2.cuota.toLocaleString('es-ES')} €</p>
                    <p><strong>Total pagado:</strong> ${data.simulacion2.total.toLocaleString('es-ES')} €</p>
                    <p><strong>Total intereses:</strong> ${data.simulacion2.intereses.toLocaleString('es-ES')} €</p>
                    <p><strong>Intereses hasta amortización:</strong> ${data.simulacion2.intereses_acumulados.toLocaleString('es-ES')} €</p>
                `;
                resultados2.classList.remove('error');
            } else {
                resultados2.innerHTML = '<p>No se han podido calcular los resultados. Verifica los datos introducidos.</p>';
                resultados2.classList.add('error');
            }
            
            // Mostrar comparación si hay resultados en ambas simulaciones
            if (data.diferencias) {
                const entidad1 = data.simulacion1.entidad;
                const entidad2 = data.simulacion2.entidad;
                
                let htmlComparacion = '<h2>Comparativa entre entidades</h2>';
                
                // Cuota mensual
                htmlComparacion += crearFilaComparacion(
                    'Diferencia en cuota mensual',
                    data.diferencias.cuota,
                    entidad1,
                    entidad2
                );
                
                // Total pagado
                htmlComparacion += crearFilaComparacion(
                    'Diferencia en total pagado',
                    data.diferencias.total,
                    entidad1,
                    entidad2
                );
                
                // Total intereses
                htmlComparacion += crearFilaComparacion(
                    'Diferencia en total intereses',
                    data.diferencias.intereses,
                    entidad1,
                    entidad2
                );
                
                // Añadir recomendación
                const mejorOpcion = data.diferencias.total < 0 ? entidad2 : entidad1;
                const ahorro = Math.abs(data.diferencias.total).toLocaleString('es-ES');
                
                htmlComparacion += `
                    <div class="comparacion-item">
                        <div class="comparacion-label">Recomendación:</div>
                        <div class="comparacion-valor">
                            <strong>${mejorOpcion}</strong> - Ahorro total de <strong>${ahorro} €</strong>
                        </div>
                    </div>
                `;
                
                comparacionResultados.innerHTML = htmlComparacion;
                comparacionResultados.classList.remove('hidden');
            } else {
                comparacionResultados.classList.add('hidden');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ha ocurrido un error al calcular las hipotecas.');
        });
    }
    
    // Función para crear filas de comparación
    function crearFilaComparacion(etiqueta, valor, entidad1, entidad2) {
        const esPositivo = valor > 0;
        const claseCSS = esPositivo ? 'diferencia-positiva' : 'diferencia-negativa';
        const mejorEntidad = esPositivo ? entidad2 : entidad1;
        const valorAbsoluto = Math.abs(valor).toLocaleString('es-ES');
        const icono = esPositivo ? '↓' : '↑';
        
        return `
            <div class="comparacion-item">
                <div class="comparacion-label">${etiqueta}:</div>
                <div class="comparacion-valor ${claseCSS}">
                    ${valorAbsoluto} € ${icono} (Mejor: ${mejorEntidad})
                </div>
            </div>
        `;
    }
});