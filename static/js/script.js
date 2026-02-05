document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formulario-hipotecas');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const btnPdf = document.getElementById('btn-pdf');
    const comparacionResultados = document.getElementById('comparacion-resultados');
    const numSimulacionesSelect = document.getElementById('num_simulaciones');
    
    // Configuración inicial
    const MAX_SIMULACIONES = 4;
    let numSimulaciones = 2; // Valor por defecto

    // Función para gestionar la visibilidad de los paneles
    function actualizarVisibilidadPaneles() {
        numSimulaciones = parseInt(numSimulacionesSelect.value);
        
        for (let i = 1; i <= MAX_SIMULACIONES; i++) {
            const panel = document.getElementById(`panel-sim${i}`);
            const inputs = panel.querySelectorAll('input, select');
            
            if (i <= numSimulaciones) {
                panel.classList.remove('hidden');
                // Activar campos requeridos
                inputs.forEach(input => {
                    if (input.dataset.wasRequired) {
                        input.required = true;
                    } else if (input.id.includes('valor')) {
                        // valorN es readonly, no requiere required
                    } else {
                        // Por defecto, asumimos que los inputs principales son requeridos si el panel es visible
                        // excepto si explicitamente sabemos que no (lógica simplificada)
                        input.required = true;
                    }
                });
            } else {
                panel.classList.add('hidden');
                // Desactivar campos requeridos para que no bloqueen el envío
                inputs.forEach(input => {
                    if (input.required) {
                        input.dataset.wasRequired = "true"; // Guardar estado
                        input.required = false;
                    }
                });
                // Limpiar valores de paneles ocultos para no enviar basura
                inputs.forEach(input => input.value = '');
                document.getElementById(`resultados${i}`).innerHTML = '';
            }
        }
        
        // Actualizar grid layout
        const container = document.querySelector('.simulaciones-container');
        container.className = 'simulaciones-container'; // Reset classes
        if (numSimulaciones === 1) container.classList.add('grid-1');
        else if (numSimulaciones === 2) container.classList.add('grid-2');
        else if (numSimulaciones === 3) container.classList.add('grid-3');
        else container.classList.add('grid-4');
        
        // Ocultar comparación si cambiamos el número
        comparacionResultados.innerHTML = '';
        comparacionResultados.classList.add('hidden');
    }

    // Listener para el selector de número de simulaciones
    if (numSimulacionesSelect) {
        numSimulacionesSelect.addEventListener('change', actualizarVisibilidadPaneles);
        // Inicializar
        actualizarVisibilidadPaneles();
    }
    
    // Función para crear tabla de comparación dinámica
    function crearTablaComparacion(simulaciones, recomendacion) {
        if (!simulaciones || simulaciones.length < 2) return '';

        let html = `
            <h2>Comparativa entre entidades</h2>
            <div class="comparacion-table-container">
                <table class="comparacion-table">
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            ${simulaciones.map((sim, index) => 
                                `<th class="entidad-header entidad-${index+1}">${sim.entidad}</th>`
                            ).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        const filas = [
            { label: 'Desembolso Inicial', key: 'desembolso_inicial', isCurrency: true },
            { label: 'Cuota Mensual', key: 'cuota', isCurrency: true },
            { label: 'Total Intereses', key: 'intereses', isCurrency: true },
            { label: 'Intereses hasta amort.', key: 'intereses_acumulados', isCurrency: true },
            { label: 'Total Pagado', key: 'total', isCurrency: true }
        ];

        filas.forEach(fila => {
            // Encontrar mejor valor (mínimo)
            const valores = simulaciones.map(s => s[fila.key]);
            const minValor = Math.min(...valores);
            
            html += `<tr>
                <td class="concepto-col">${fila.label}</td>
                ${simulaciones.map((sim, index) => {
                    const val = sim[fila.key];
                    const isBest = Math.abs(val - minValor) < 0.01; // Tolerancia float
                    const formatted = fila.isCurrency ? 
                        val.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €' : 
                        val;
                    
                    return `<td class="valor-col ${isBest ? 'mejor-valor-cell' : ''} entidad-${index+1}-bg">
                        ${formatted}
                        ${isBest ? '<i class="fas fa-check-circle best-icon"></i>' : ''}
                    </td>`;
                }).join('')}
            </tr>`;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        if (recomendacion) {
            const ahorro = (recomendacion.mejor_intereses.intereses - Math.max(...simulaciones.map(s => s.intereses)) * -1).toLocaleString('es-ES'); // Lógica simple, ajustar si necesario
            // Mejor usar la logica del servidor si viene
            
            html += `
                <div class="comparacion-recomendacion">
                    <div class="comparacion-label">Recomendación:</div>
                    <div class="comparacion-valor">
                        La mejor opción por <strong>menores intereses</strong> es <strong>${recomendacion.mejor_intereses.entidad}</strong>.
                    </div>
                </div>
            `;
        }
        
        return html;
    }

    // Elementos de inputs globales
    const valorInmuebleInput = document.getElementById('valor_inmueble');
    const ahorrosInput = document.getElementById('ahorros');
    // ... otros inputs globales ...
    const inputsGastos = ['itp', 'notaria', 'registro', 'gestoria', 'tasacion'].map(id => document.getElementById(id));

    // Función genérica para calcular gastos
    function calcularGastosFijos() {
        const valorInmueble = parseFloat(valorInmuebleInput.value) || 0;
        let total = 0;
        
        inputsGastos.forEach(input => {
            if (input.id === 'itp') {
                total += valorInmueble * ((parseFloat(input.value) || 0) / 100);
            } else {
                total += parseFloat(input.value) || 0;
            }
        });
        return total;
    }

    // Actualizar valores a financiar
    function actualizarValoresFinanciar() {
        const valorInmueble = parseFloat(valorInmuebleInput.value) || 0;
        
        // Actualizar para cada panel visible
        for (let i = 1; i <= numSimulaciones; i++) {
            const inputEntrada = document.getElementById(`entrada_porcentaje${i}`);
            const inputValor = document.getElementById(`valor${i}`);
            
            if (inputEntrada && inputValor) {
                const porcentaje = parseFloat(inputEntrada.value) || 0;
                const entrada = valorInmueble * (porcentaje / 100);
                inputValor.value = valorInmueble - entrada;
            }
        }
    }

    // Listeners para actualizaciones en tiempo real
    [valorInmuebleInput, ...inputsGastos].forEach(input => {
        if(input) input.addEventListener('input', actualizarValoresFinanciar);
    });

    // Añadir listeners dinámicos a los inputs de porcentaje
    // Usamos delegación de eventos o asignamos a los 4 posibles
    for (let i = 1; i <= MAX_SIMULACIONES; i++) {
        const input = document.getElementById(`entrada_porcentaje${i}`);
        if(input) input.addEventListener('input', actualizarValoresFinanciar);
        
        // Sincronización de años (opcional, manteniendo lógica anterior si se desea)
        const inputAnios = document.getElementById(`anios${i}`);
        if (i === 1 && inputAnios) {
            inputAnios.addEventListener('input', function() {
                // Copiar a los otros si están vacíos o si el usuario quiere (lógica simplificada: copiar siempre por ahora para mantener UX previa)
                for (let j = 2; j <= numSimulaciones; j++) {
                    const target = document.getElementById(`anios${j}`);
                    if (target) target.value = this.value;
                }
            });
        }
    }

    // Envío del formulario
    formulario.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar ahorros vs gastos (simplificado para N simulaciones)
        const valorInmueble = parseFloat(valorInmuebleInput.value) || 0;
        const ahorros = parseFloat(ahorrosInput.value) || 0;
        const gastosFijos = calcularGastosFijos();
        
        let error = false;
        for (let i = 1; i <= numSimulaciones; i++) {
            const inputEntrada = document.getElementById(`entrada_porcentaje${i}`);
            const porcentaje = parseFloat(inputEntrada.value) || 0;
            const entrada = valorInmueble * (porcentaje / 100);
            const totalNecesario = entrada + gastosFijos;
            
            if (ahorros < totalNecesario) {
                alert(`Simulación ${i}: Los ahorros no son suficientes. Necesitas ${totalNecesario.toLocaleString('es-ES')} €`);
                error = true;
                break; // Parar al primer error
            }
        }
        
        if (error) return;

        calcularHipotecas();
    });

    function calcularHipotecas() {
        const formData = new FormData(formulario);
        
        fetch('/calcular', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Renderizar resultados individuales
            if (data.simulaciones) {
                data.simulaciones.forEach(sim => {
                    const resultDiv = document.getElementById(`resultados${sim.id}`);
                    if (resultDiv) {
                        resultDiv.innerHTML = generarHTMLResultado(sim, data.gastos_fijos_total, data.valor_inmueble, data.ahorros);
                        resultDiv.classList.remove('error');
                    }
                });
            }

            // Renderizar comparativa si hay más de 1 simulación
            if (data.num_simulaciones > 1 && data.simulaciones && data.simulaciones.length > 1) {
                comparacionResultados.innerHTML = crearTablaComparacion(data.simulaciones, data.recomendacion);
                comparacionResultados.classList.remove('hidden');
            } else {
                comparacionResultados.classList.add('hidden');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al calcular hipotecas');
        });
    }

    function generarHTMLResultado(sim, gastosFijos, valorInmueble, ahorros) {
        const entrada = sim.entrada_valor;
        const itpInput = document.getElementById('itp');
        const itpPorcentaje = parseFloat(itpInput.value) || 0;
        
        return `
            <div class="resultados-seccion">
                <h4>Datos de la hipoteca</h4>
                <p><strong>Entidad:</strong> ${sim.entidad}</p>
                <p><strong>Cuota mensual:</strong> ${sim.cuota.toLocaleString('es-ES')} €</p>
                <p><strong>Total intereses:</strong> ${sim.intereses.toLocaleString('es-ES')} €</p>
                <p><strong>Total pagado:</strong> ${sim.total.toLocaleString('es-ES')} €</p>
            </div>
            <div class="resultados-seccion">
                <h4>Gastos iniciales</h4>
                <p><strong>Entidad + Gastos:</strong> <span class="gasto-destacado">${sim.desembolso_inicial.toLocaleString('es-ES')} €</span></p>
                <p><strong>Ahorros restantes:</strong> <span class="ahorro-destacado">${sim.ahorros_restantes.toLocaleString('es-ES')} €</span></p>
            </div>
        `;
    }

    // Botón Limpiar
    btnLimpiar.addEventListener('click', function() {
        formulario.reset();
        for (let i = 1; i <= MAX_SIMULACIONES; i++) {
            document.getElementById(`resultados${i}`).innerHTML = '';
        }
        comparacionResultados.innerHTML = '';
        comparacionResultados.classList.add('hidden');
        actualizarVisibilidadPaneles(); // Resetear visibilidad
    });

    // Botón PDF
    if (btnPdf) {
        btnPdf.addEventListener('click', function() {
             // Validaciones básicas
            const valorInmueble = parseFloat(valorInmuebleInput.value) || 0;
            if (valorInmueble <= 0) {
                 alert('Por favor, introduce los datos necesarios.');
                 return;
            }

            const originalAction = formulario.action;
            const originalTarget = formulario.target;
            const originalMethod = formulario.method;
            
            formulario.action = '/descargar-pdf';
            formulario.target = '_blank';
            formulario.method = 'POST';
            
            formulario.submit();
            
            setTimeout(() => {
                formulario.action = originalAction;
                formulario.target = originalTarget;
                formulario.method = originalMethod;
            }, 100);
        });
    }
});
