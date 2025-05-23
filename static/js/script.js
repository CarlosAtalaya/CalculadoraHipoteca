document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formulario-hipotecas');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const resultados1 = document.getElementById('resultados1');
    const resultados2 = document.getElementById('resultados2');
    const comparacionResultados = document.getElementById('comparacion-resultados');
    
        // Función para crear filas de comparación mejoradas
    function crearFilaComparacionMejorada(etiqueta, valor1, valor2, entidad1, entidad2) {
        const valor1Formateado = parseFloat(valor1).toLocaleString('es-ES');
        const valor2Formateado = parseFloat(valor2).toLocaleString('es-ES');
        const diferencia = Math.abs(valor1 - valor2).toLocaleString('es-ES');
        const mejorEntidad = valor1 < valor2 ? entidad1 : entidad2;
        
        return `
            <div class="comparacion-item">
                <div class="comparacion-label">${etiqueta}:</div>
                <div class="comparacion-valores">
                    <div class="comparacion-valor-entidad entidad1-valor ${valor1 < valor2 ? 'mejor-valor' : ''}">
                        ${valor1Formateado} €
                    </div>
                    <div class="comparacion-diferencia">
                        Diferencia: ${diferencia} € 
                        <span class="mejor-opcion">(Mejor: ${mejorEntidad})</span>
                    </div>
                    <div class="comparacion-valor-entidad entidad2-valor ${valor2 < valor1 ? 'mejor-valor' : ''}">
                        ${valor2Formateado} €
                    </div>
                </div>
            </div>
        `;
    }
    
    // Función original para crear filas de comparación (mantener por compatibilidad)
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
    const valorInmuebleInput = document.getElementById('valor_inmueble');
    const ahorrosInput = document.getElementById('ahorros');
    const itpInput = document.getElementById('itp');
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
        const valorInmueble = parseFloat(valorInmuebleInput.value) || 0;
        const itpPorcentaje = parseFloat(itpInput.value) || 0;
        const itpValor = valorInmueble * (itpPorcentaje / 100);
        const notaria = parseFloat(notariaInput.value) || 0;
        const registro = parseFloat(registroInput.value) || 0;
        const gestoria = parseFloat(gestoriaInput.value) || 0;
        const tasacion = parseFloat(tasacionInput.value) || 0;
        
        return itpValor + notaria + registro + gestoria + tasacion;
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
     itpInput, notariaInput, registroInput, gestoriaInput, tasacionInput].forEach(input => {
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
                    <div class="resultados-seccion">
                        <h4>Datos de la hipoteca</h4>
                        <p><strong>Entidad bancaria:</strong> ${data.simulacion1.entidad}</p>
                        <p><strong>Valor inmueble:</strong> ${valorInmueble.toLocaleString('es-ES')} €</p>
                        <p><strong>Entrada (${porcentajeEntrada1}%):</strong> ${entrada1.toLocaleString('es-ES')} €</p>
                        <p><strong>Valor a financiar:</strong> ${data.simulacion1.valor_financiar.toLocaleString('es-ES')} €</p>
                        <p><strong>Cuota mensual:</strong> ${data.simulacion1.cuota.toLocaleString('es-ES')} €</p>
                        <p><strong>Total pagado en hipoteca:</strong> ${data.simulacion1.total.toLocaleString('es-ES')} €</p>
                        <p><strong>Total pagado (hipoteca + entrada + gastos):</strong> ${(data.simulacion1.total + entrada1 + gastosFijos).toLocaleString('es-ES')} €</p>
                        <p><strong>Total intereses:</strong> ${data.simulacion1.intereses.toLocaleString('es-ES')} €</p>
                        <p><strong>Intereses hasta amortización:</strong> ${data.simulacion1.intereses_acumulados.toLocaleString('es-ES')} €</p>
                    </div>

                    <div class="resultados-seccion">
                        <h4>Gastos y ahorros</h4>
                        <p><strong>Entrada (${porcentajeEntrada1}%):</strong> ${entrada1.toLocaleString('es-ES')} €</p>
                        <p><strong>ITP (${parseFloat(itpInput.value)}%):</strong> ${(valorInmueble * parseFloat(itpInput.value) / 100).toLocaleString('es-ES')} €</p>
                        <p><strong>Otros gastos fijos:</strong> ${(gastosFijos - (valorInmueble * parseFloat(itpInput.value) / 100)).toLocaleString('es-ES')} €</p>
                        <p><strong>Total gastos fijos:</strong> ${gastosFijos.toLocaleString('es-ES')} €</p>
                        <p><strong>Desembolso inicial:</strong> <span class="gasto-destacado">${(entrada1 + gastosFijos).toLocaleString('es-ES')} €</span></p>
                        <p><strong>Ahorros restantes:</strong> <span class="ahorro-destacado">${ahorrosRestantes1.toLocaleString('es-ES')} €</span></p>
                    </div>
                `;
                resultados1.classList.remove('error');
            } else {
                resultados1.innerHTML = '<p>No se han podido calcular los resultados. Verifica los datos introducidos.</p>';
                resultados1.classList.add('error');
            }
            
            // Mostrar resultados de simulación 2
            if (data.simulacion2) {
                resultados2.innerHTML = `
                    <div class="resultados-seccion">
                        <h4>Datos de la hipoteca</h4>
                        <p><strong>Entidad bancaria:</strong> ${data.simulacion2.entidad}</p>
                        <p><strong>Valor inmueble:</strong> ${valorInmueble.toLocaleString('es-ES')} €</p>
                        <p><strong>Entrada (${porcentajeEntrada2}%):</strong> ${entrada2.toLocaleString('es-ES')} €</p>
                        <p><strong>Valor a financiar:</strong> ${data.simulacion2.valor_financiar.toLocaleString('es-ES')} €</p>
                        <p><strong>Cuota mensual:</strong> ${data.simulacion2.cuota.toLocaleString('es-ES')} €</p>
                        <p><strong>Total pagado en hipoteca:</strong> ${data.simulacion2.total.toLocaleString('es-ES')} €</p>
                        <p><strong>Total pagado (hipoteca + entrada + gastos):</strong> ${(data.simulacion2.total + entrada2 + gastosFijos).toLocaleString('es-ES')} €</p>
                        <p><strong>Total intereses:</strong> ${data.simulacion2.intereses.toLocaleString('es-ES')} €</p>
                        <p><strong>Intereses hasta amortización:</strong> ${data.simulacion2.intereses_acumulados.toLocaleString('es-ES')} €</p>
                    </div>

                    <div class="resultados-seccion">
                        <h4>Gastos y ahorros</h4>
                        <p><strong>Entrada (${porcentajeEntrada2}%):</strong> ${entrada2.toLocaleString('es-ES')} €</p>
                        <p><strong>ITP (${parseFloat(itpInput.value)}%):</strong> ${(valorInmueble * parseFloat(itpInput.value) / 100).toLocaleString('es-ES')} €</p>
                        <p><strong>Otros gastos fijos:</strong> ${(gastosFijos - (valorInmueble * parseFloat(itpInput.value) / 100)).toLocaleString('es-ES')} €</p>
                        <p><strong>Total gastos fijos:</strong> ${gastosFijos.toLocaleString('es-ES')} €</p>
                        <p><strong>Desembolso inicial:</strong> <span class="gasto-destacado">${(entrada2 + gastosFijos).toLocaleString('es-ES')} €</span></p>
                        <p><strong>Ahorros restantes:</strong> <span class="ahorro-destacado">${ahorrosRestantes2.toLocaleString('es-ES')} €</span></p>
                    </div>
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
                
                let htmlComparacion = `
                    <h2>Comparativa entre entidades</h2>
                    <div class="comparacion-header">
                        <div class="comparacion-entidad entidad1">${entidad1}</div>
                        <div class="comparacion-vs">VS</div>
                        <div class="comparacion-entidad entidad2">${entidad2}</div>
                    </div>
                `;
                
                // Desembolso inicial
                const desembolso1 = entrada1 + gastosFijos;
                const desembolso2 = entrada2 + gastosFijos;
                const difDesembolso = desembolso1 - desembolso2;
                
                htmlComparacion += crearFilaComparacionMejorada(
                    'Desembolso inicial',
                    desembolso1,
                    desembolso2,
                    entidad1,
                    entidad2
                );
                
                // Cuota mensual
                htmlComparacion += crearFilaComparacionMejorada(
                    'Cuota mensual',
                    data.simulacion1.cuota,
                    data.simulacion2.cuota,
                    entidad1,
                    entidad2
                );
                
                // Total intereses
                htmlComparacion += crearFilaComparacionMejorada(
                    'Total intereses',
                    data.simulacion1.intereses,
                    data.simulacion2.intereses,
                    entidad1,
                    entidad2
                );
                
                // Comparativa de intereses hasta amortización
                htmlComparacion += crearFilaComparacionMejorada(
                    'Intereses hasta amortización',
                    data.simulacion1.intereses_acumulados,
                    data.simulacion2.intereses_acumulados,
                    entidad1,
                    entidad2
                );
                
                // Añadir recomendación basada en intereses totales
                const mejorOpcion = data.simulacion1.intereses < data.simulacion2.intereses ? entidad1 : entidad2;
                const ahorro = Math.abs(data.diferencias.intereses).toLocaleString('es-ES');
                
                htmlComparacion += `
                    <div class="comparacion-item comparacion-recomendacion">
                        <div class="comparacion-label">Recomendación (por intereses):</div>
                        <div class="comparacion-valor">
                            <strong>${mejorOpcion}</strong> - Ahorro en intereses de <strong>${ahorro} €</strong>
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