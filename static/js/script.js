document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formulario-hipotecas');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const resultados1 = document.getElementById('resultados1');
    const resultados2 = document.getElementById('resultados2');
    const comparacionResultados = document.getElementById('comparacion-resultados');
    
    // Elementos para cálculos de valores a financiar
    const valorInmuebleInput = document.getElementById('valor_inmueble');
    const ahorrosInput = document.getElementById('ahorros');
    const notariaInput = document.getElementById('notaria');
    const registroInput = document.getElementById('registro');
    const gestoriaInput = document.getElementById('gestoria');
    const tasacionInput = document.getElementById('tasacion');
    const entradaPorcentaje1Input = document.getElementById('entrada_porcentaje1');
    const entradaPorcentaje2Input = document.getElementById('entrada_porcentaje2');
    const valor1Input = document.getElementById('valor1');
    const valor2Input = document.getElementById('valor2');
    
    // Calcular valor a financiar cuando cambian los valores relevantes
    function actualizarValoresFinanciar() {
        const valorInmueble = parseFloat(valorInmuebleInput.value) || 0;
        const ahorros = parseFloat(ahorrosInput.value) || 0;
        const gastosFijos = calcularGastosFijos();
        
        // Simulación 1
        const porcentajeEntrada1 = parseFloat(entradaPorcentaje1Input.value) || 0;
        const entrada1 = valorInmueble * (porcentajeEntrada1 / 100);
        const valorFinanciar1 = valorInmueble - entrada1;
        valor1Input.value = valorFinanciar1;
        
        // Simulación 2
        const porcentajeEntrada2 = parseFloat(entradaPorcentaje2Input.value) || 0;
        const entrada2 = valorInmueble * (porcentajeEntrada2 / 100);
        const valorFinanciar2 = valorInmueble - entrada2;
        valor2Input.value = valorFinanciar2;
        
        // Verificar si los ahorros son suficientes para los gastos y las entradas
        verificarAhorrosSuficientes();
    }
    
    // Calcular el total de gastos fijos
    function calcularGastosFijos() {
        const notaria = parseFloat(notariaInput.value) || 0;
        const registro = parseFloat(registroInput.value) || 0;
        const gestoria = parseFloat(gestoriaInput.value) || 0;
        const tasacion = parseFloat(tasacionInput.value) || 0;
        
        return notaria + registro + gestoria + tasacion;
    }
    
    // Verificar si los ahorros son suficientes
    function verificarAhorrosSuficientes() {
        const valorInmueble = parseFloat(valorInmuebleInput.value) || 0;
        const ahorros = parseFloat(ahorrosInput.value) || 0;
        const gastosFijos = calcularGastosFijos();
        
        // Simulación 1
        const porcentajeEntrada1 = parseFloat(entradaPorcentaje1Input.value) || 0;
        const entrada1 = valorInmueble * (porcentajeEntrada1 / 100);
        const totalNecesario1 = entrada1 + gastosFijos;
        
        // Simulación 2
        const porcentajeEntrada2 = parseFloat(entradaPorcentaje2Input.value) || 0;
        const entrada2 = valorInmueble * (porcentajeEntrada2 / 100);
        const totalNecesario2 = entrada2 + gastosFijos;
        
        // Verificamos para simulación 1
        if (ahorros < totalNecesario1) {
            entradaPorcentaje1Input.setCustomValidity(`Los ahorros no son suficientes. Necesitas ${totalNecesario1.toLocaleString('es-ES')} €`);
        } else {
            entradaPorcentaje1Input.setCustomValidity('');
        }
        
        // Verificamos para simulación 2
        if (ahorros < totalNecesario2) {
            entradaPorcentaje2Input.setCustomValidity(`Los ahorros no son suficientes. Necesitas ${totalNecesario2.toLocaleString('es-ES')} €`);
        } else {
            entradaPorcentaje2Input.setCustomValidity('');
        }
    }
    
    // Eventos para actualizar valores
    [valorInmuebleInput, ahorrosInput, entradaPorcentaje1Input, entradaPorcentaje2Input,
     notariaInput, registroInput, gestoriaInput, tasacionInput].forEach(input => {
        input.addEventListener('input', actualizarValoresFinanciar);
    });
    
    // Evento para calcular al enviar el formulario
    formulario.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Verificar si los ahorros son suficientes antes de calcular
        const valorInmueble = parseFloat(valorInmuebleInput.value) || 0;
        const ahorros = parseFloat(ahorrosInput.value) || 0;
        const gastosFijos = calcularGastosFijos();
        
        // Simulación 1
        const porcentajeEntrada1 = parseFloat(entradaPorcentaje1Input.value) || 0;
        const entrada1 = valorInmueble * (porcentajeEntrada1 / 100);
        const totalNecesario1 = entrada1 + gastosFijos;
        
        // Simulación 2
        const porcentajeEntrada2 = parseFloat(entradaPorcentaje2Input.value) || 0;
        const entrada2 = valorInmueble * (porcentajeEntrada2 / 100);
        const totalNecesario2 = entrada2 + gastosFijos;
        
        if (ahorros < totalNecesario1 || ahorros < totalNecesario2) {
            alert('Los ahorros disponibles no son suficientes para cubrir la entrada y los gastos fijos.');
            return;
        }
        
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
        const anios = parseInt(anios1Input.value) || 0;
        const anioAmortizacion = parseInt(anioAmortizacion1Input.value) || 0;
        
        if (anioAmortizacion > anios) {
            anioAmortizacion1Input.setCustomValidity('El año de amortización no puede ser mayor que los años de financiación');
        } else {
            anioAmortizacion1Input.setCustomValidity('');
        }
    });
    
    anioAmortizacion2Input.addEventListener('input', function() {
        const anios = parseInt(anios2Input.value) || 0;
        const anioAmortizacion = parseInt(anioAmortizacion2Input.value) || 0;
        
        if (anioAmortizacion > anios) {
            anioAmortizacion2Input.setCustomValidity('El año de amortización no puede ser mayor que los años de financiación');
        } else {
            anioAmortizacion2Input.setCustomValidity('');
        }
    });
    
    // Duplicar años entre simulaciones
    anios1Input.addEventListener('input', function() {
        anios2Input.value = this.value;
        
        // Actualizar validación de año de amortización
        const anioAmortizacion2 = parseInt(anioAmortizacion2Input.value) || 0;
        if (anioAmortizacion2 > parseInt(this.value)) {
            anioAmortizacion2Input.setCustomValidity('El año de amortización no puede ser mayor que los años de financiación');
        } else {
            anioAmortizacion2Input.setCustomValidity('');
        }
    });
    
    // Función principal para calcular hipotecas
    function calcularHipotecas() {
        // Obtener datos del formulario
        const formData = new FormData(formulario);
        
        // Añadir información sobre gastos a los resultados
        const valorInmueble = parseFloat(valorInmuebleInput.value);
        const ahorros = parseFloat(ahorrosInput.value);
        const gastosFijos = calcularGastosFijos();
        
        // Simulación 1
        const porcentajeEntrada1 = parseFloat(entradaPorcentaje1Input.value);
        const entrada1 = valorInmueble * (porcentajeEntrada1 / 100);
        const ahorrosRestantes1 = ahorros - entrada1 - gastosFijos;
        
        // Simulación 2
        const porcentajeEntrada2 = parseFloat(entradaPorcentaje2Input.value);
        const entrada2 = valorInmueble * (porcentajeEntrada2 / 100);
        const ahorrosRestantes2 = ahorros - entrada2 - gastosFijos;
        
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
                    <p><strong>Valor inmueble:</strong> ${valorInmueble.toLocaleString('es-ES')} €</p>
                    <p><strong>Entrada (${porcentajeEntrada1}%):</strong> ${entrada1.toLocaleString('es-ES')} €</p>
                    <p><strong>Gastos fijos:</strong> ${gastosFijos.toLocaleString('es-ES')} €</p>
                    <p><strong>Desembolso inicial:</strong> ${(entrada1 + gastosFijos).toLocaleString('es-ES')} €</p>
                    <p><strong>Ahorros restantes:</strong> ${ahorrosRestantes1.toLocaleString('es-ES')} €</p>
                    <p><strong>Valor a financiar:</strong> ${data.simulacion1.valor_financiar.toLocaleString('es-ES')} €</p>
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
                    <p><strong>Valor inmueble:</strong> ${valorInmueble.toLocaleString('es-ES')} €</p>
                    <p><strong>Entrada (${porcentajeEntrada2}%):</strong> ${entrada2.toLocaleString('es-ES')} €</p>
                    <p><strong>Gastos fijos:</strong> ${gastosFijos.toLocaleString('es-ES')} €</p>
                    <p><strong>Desembolso inicial:</strong> ${(entrada2 + gastosFijos).toLocaleString('es-ES')} €</p>
                    <p><strong>Ahorros restantes:</strong> ${ahorrosRestantes2.toLocaleString('es-ES')} €</p>
                    <p><strong>Valor a financiar:</strong> ${data.simulacion2.valor_financiar.toLocaleString('es-ES')} €</p>
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
                
                // Desembolso inicial
                const desembolso1 = entrada1 + gastosFijos;
                const desembolso2 = entrada2 + gastosFijos;
                const difDesembolso = desembolso1 - desembolso2;
                
                htmlComparacion += crearFilaComparacion(
                    'Diferencia en desembolso inicial',
                    difDesembolso,
                    entidad1,
                    entidad2
                );
                
                // Cuota mensual
                htmlComparacion += crearFilaComparacion(
                    'Diferencia en cuota mensual',
                    data.diferencias.cuota,
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
                
                // Calcular coste total (entrada + gastos + hipoteca)
                const costeTotalGlobal1 = desembolso1 + data.simulacion1.total;
                const costeTotalGlobal2 = desembolso2 + data.simulacion2.total;
                const difCosteTotalGlobal = costeTotalGlobal1 - costeTotalGlobal2;
                
                htmlComparacion += crearFilaComparacion(
                    'Diferencia en coste total global',
                    difCosteTotalGlobal,
                    entidad1,
                    entidad2
                );
                
                // Añadir recomendación basada en coste total global
                const mejorOpcion = difCosteTotalGlobal < 0 ? entidad1 : entidad2;
                const ahorro = Math.abs(difCosteTotalGlobal).toLocaleString('es-ES');
                
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