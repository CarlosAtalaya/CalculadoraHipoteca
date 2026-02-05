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
                    // Si el input está dentro del contenedor de productos (hidden), no debe ser required
                    if (input.closest('.productos-container')) {
                        input.required = false;
                    } else if (input.id.includes('valor') || input.id.includes('interes')) {
                        // valorN e interesN son readonly o calculados
                    } else if (input.dataset.wasRequired) {
                        input.required = true;
                    } else {
                        // Lógica básica para campos principales
                        input.required = true;
                    }
                });
            } else {
                panel.classList.add('hidden');
                // Desactivar campos requeridos
                inputs.forEach(input => {
                    if (input.required) {
                        input.dataset.wasRequired = "true"; 
                        input.required = false;
                    }
                });
                // Limpiar valores de paneles ocultos
                inputs.forEach(input => {
                    if(input.type === 'checkbox') input.checked = false;
                    else input.value = '';
                });
                document.getElementById(`resultados${i}`).innerHTML = '';
            }
        }
        
        // Actualizar grid layout
        const container = document.querySelector('.simulaciones-container');
        container.className = 'simulaciones-container'; 
        if (numSimulaciones === 1) container.classList.add('grid-1');
        else if (numSimulaciones === 2) container.classList.add('grid-2');
        else if (numSimulaciones === 3) container.classList.add('grid-3');
        else container.classList.add('grid-4');
        
        comparacionResultados.innerHTML = '';
        comparacionResultados.classList.add('hidden');
    }

    // Listener para el selector de número de simulaciones
    if (numSimulacionesSelect) {
        numSimulacionesSelect.addEventListener('change', actualizarVisibilidadPaneles);
    }
    
    // --- LÓGICA DE CALCULADORA AVANZADA DE TAE ---
    
    window.toggleProductos = function(id) {
        const container = document.getElementById(`productos-container${id}`);
        container.classList.toggle('hidden');
    };

    function calcularBonificaciones(simId) {
        const tinPartidaInput = document.getElementById(`tin_partida${simId}`);
        const interesInput = document.getElementById(`interes${simId}`); // Este es el campo "TAE Bonificado"
        const jsonInput = document.getElementById(`productos_json${simId}`);
        
        if (!tinPartidaInput || !interesInput) return;

        let tinBase = parseFloat(tinPartidaInput.value) || 0;
        let bonificacionTotal = 0;
        let costeProductosAnual = 0;
        let listaProductos = [];

        // Buscar todos los checkboxes de productos de esta simulación
        const checkboxes = document.querySelectorAll(`.prod-check[data-sim="${simId}"]`);
        
        checkboxes.forEach(chk => {
            if (chk.checked) {
                // NUEVO: Buscar el input de bonificación en la misma fila
                const row = chk.closest('.producto-row');
                const bonifInput = row.querySelector('.bonif-input');
                let bonif = 0;
                
                if (bonifInput) {
                    bonif = parseFloat(bonifInput.value) || 0;
                }

                // Buscar el coste asociado (input hermano)
                const costeInput = row.querySelector('.coste-input');
                let coste = 0;
                if (costeInput) {
                    coste = parseFloat(costeInput.value) || 0;
                }

                const nombre = chk.value;

                bonificacionTotal += bonif;
                costeProductosAnual += coste;
                
                listaProductos.push({
                    nombre: nombre,
                    bonificacion: bonif,
                    coste: coste
                });
            }
        });

        // Calcular TIN Final (No puede ser negativo)
        let tinFinal = tinBase - bonificacionTotal;
        if (tinFinal < 0) tinFinal = 0;

        // Actualizar el campo visual y el que se envía al servidor
        interesInput.value = tinFinal.toFixed(2);

        // Guardar datos completos en el input oculto JSON
        const datosExtra = {
            tin_partida: tinBase,
            bonificacion_total: bonificacionTotal,
            coste_productos_anual: costeProductosAnual,
            detalle: listaProductos
        };
        
        if (jsonInput) {
            jsonInput.value = JSON.stringify(datosExtra);
        }
    }

    // Inicializar listeners para todos los campos de calculadora
    for (let i = 1; i <= MAX_SIMULACIONES; i++) {
        // TIN Partida
        const tinInput = document.getElementById(`tin_partida${i}`);
        if (tinInput) {
            tinInput.addEventListener('input', () => calcularBonificaciones(i));
        }

        // Checkboxes
        const checkboxes = document.querySelectorAll(`.prod-check[data-sim="${i}"]`);
        checkboxes.forEach(chk => {
            chk.addEventListener('change', () => calcularBonificaciones(i));
        });

        // Inputs de Coste
        const costes = document.querySelectorAll(`.coste-input[data-sim="${i}"]`);
        costes.forEach(inp => {
            inp.addEventListener('input', () => calcularBonificaciones(i));
        });

        // NUEVO: Inputs de Bonificación Manual
        const bonifs = document.querySelectorAll(`.bonif-input[data-sim="${i}"]`);
        bonifs.forEach(inp => {
            inp.addEventListener('input', () => calcularBonificaciones(i));
        });
    }

    // --- FIN LÓGICA CALCULADORA ---

    // Elementos de inputs globales para gastos
    const valorInmuebleInput = document.getElementById('valor_inmueble');
    const ahorrosInput = document.getElementById('ahorros');
    const inputsGastos = ['itp', 'notaria', 'registro', 'gestoria', 'tasacion'].map(id => document.getElementById(id));

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

    function actualizarValoresFinanciar() {
        const valorInmueble = parseFloat(valorInmuebleInput.value) || 0;
        for (let i = 1; i <= numSimulaciones; i++) {
            const inputEntrada = document.getElementById(`entrada_porcentaje${i}`);
            const inputValor = document.getElementById(`valor${i}`);
            if (inputEntrada && inputValor) {
                const porcentaje = parseFloat(inputEntrada.value) || 0;
                const entrada = valorInmueble * (porcentaje / 100);
                inputValor.value = (valorInmueble - entrada).toFixed(2);
            }
        }
    }

    [valorInmuebleInput, ...inputsGastos].forEach(input => {
        if(input) input.addEventListener('input', actualizarValoresFinanciar);
    });

    for (let i = 1; i <= MAX_SIMULACIONES; i++) {
        const input = document.getElementById(`entrada_porcentaje${i}`);
        if(input) input.addEventListener('input', actualizarValoresFinanciar);
    }

    // Envío del formulario
    formulario.addEventListener('submit', function(e) {
        e.preventDefault();
        
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
                alert(`Simulación ${i}: Los ahorros no son suficientes. Necesitas ${totalNecesario.toLocaleString('es-ES', {maximumFractionDigits:0})} €`);
                error = true;
                break;
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
            if (data.simulaciones) {
                data.simulaciones.forEach(sim => {
                    const resultDiv = document.getElementById(`resultados${sim.id}`);
                    if (resultDiv) {
                        resultDiv.innerHTML = generarHTMLResultado(sim);
                        resultDiv.classList.remove('error');
                    }
                });
            }

            if (data.num_simulaciones > 1 && data.simulaciones && data.simulaciones.length > 1) {
                comparacionResultados.innerHTML = crearTablaComparacion(data.simulaciones, data.recomendacion);
                comparacionResultados.classList.remove('hidden');
            } else {
                comparacionResultados.classList.add('hidden');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al calcular hipotecas. Verifica los datos.');
        });
    }

    function generarHTMLResultado(sim) {
        let costeProductosHtml = '';
        if (sim.productos && sim.productos.coste_productos_anual > 0) {
            costeProductosHtml = `<p><strong>Coste anual productos:</strong> ${sim.productos.coste_productos_anual.toLocaleString('es-ES')} €</p>`;
        }

        return `
            <div class="resultados-seccion">
                <h4>Resultados de la Hipoteca</h4>
                <p><strong>Cuota mensual:</strong> ${sim.cuota.toLocaleString('es-ES')} €</p>
                <p><strong>Total intereses:</strong> ${sim.intereses.toLocaleString('es-ES')} €</p>
                <p><strong>Total pagado (Banco):</strong> ${sim.total.toLocaleString('es-ES')} €</p>
                ${costeProductosHtml}
            </div>
            <div class="resultados-seccion">
                <h4>Gastos Iniciales</h4>
                <p><strong>Entrada + Gastos:</strong> <span class="gasto-destacado">${sim.desembolso_inicial.toLocaleString('es-ES')} €</span></p>
                <p><strong>Ahorros restantes:</strong> <span class="ahorro-destacado">${sim.ahorros_restantes.toLocaleString('es-ES')} €</span></p>
            </div>
        `;
    }

    function crearTablaComparacion(simulaciones, recomendacion) {
        if (!simulaciones || simulaciones.length < 2) return '';

        let html = `
            <h2>Comparativa y Coste Real</h2>
            <div class="comparacion-table-container">
                <table class="comparacion-table">
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            ${simulaciones.map((sim, index) => 
                                `<th class="entidad-header">${sim.entidad}</th>`
                            ).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        const filas = [
            { label: 'Cuota Mensual', key: 'cuota', isCurrency: true },
            { label: 'Intereses Banco', key: 'intereses', isCurrency: true },
            { label: 'Coste Prod. (Total)', key: 'coste_productos_total', isCurrency: true }, 
            { label: 'COSTE TOTAL REAL', key: 'total_con_productos', isCurrency: true, isTotal: true },
            { label: 'Desembolso Inicial', key: 'desembolso_inicial', isCurrency: true }
        ];

        filas.forEach(fila => {
            const valores = simulaciones.map(s => {
                if (fila.key === 'coste_productos_total') {
                    // Calculamos el coste total de productos aquí para mostrarlo en la tabla
                    // Aunque en app.py ya lo tenemos en total_con_productos - total
                    // Pero visualmente:
                    return (s.productos ? s.productos.coste_productos_anual * (s.input.anios || 0) : 0);
                }
                return s[fila.key] || 0;
            });
            const minValor = Math.min(...valores);
            
            html += `<tr>
                <td class="concepto-col" ${fila.isTotal ? 'style="font-weight:bold; color:#2c3e50;"' : ''}>${fila.label}</td>
                ${simulaciones.map((sim, index) => {
                    let val = sim[fila.key];
                    if (fila.key === 'coste_productos_total') {
                        val = (sim.productos ? sim.productos.coste_productos_anual * (sim.input.anios || 0) : 0);
                    }
                    if (val === undefined) val = 0;

                    const isBest = Math.abs(val - minValor) < 0.1 && fila.key !== 'desembolso_inicial'; 
                    const formatted = fila.isCurrency ? 
                        val.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €' : 
                        val;
                    
                    return `<td class="valor-col ${isBest ? 'mejor-valor-cell' : ''}">
                        ${formatted}
                        ${isBest ? '<i class="fas fa-check-circle best-icon"></i>' : ''}
                    </td>`;
                }).join('')}
            </tr>`;
        });

        html += `</tbody></table></div>`;
        
        if (recomendacion) {
            // Usar la recomendación del backend que considera productos
            const mejor = simulaciones.find(s => s.entidad === recomendacion.mejor_intereses.entidad);
            
            html += `
                <div class="comparacion-recomendacion">
                    <div class="comparacion-valor">
                        <i class="fas fa-star"></i> Teniendo en cuenta intereses + coste de productos, la mejor opción es <strong>${mejor.entidad}</strong>.
                    </div>
                </div>
            `;
        }
        
        return html;
    }

    // Botón Limpiar
    btnLimpiar.addEventListener('click', function() {
        formulario.reset();
        for (let i = 1; i <= MAX_SIMULACIONES; i++) {
            document.getElementById(`resultados${i}`).innerHTML = '';
        }
        comparacionResultados.innerHTML = '';
        comparacionResultados.classList.add('hidden');
        actualizarVisibilidadPaneles();
    });

    // Botón PDF
    if (btnPdf) {
        btnPdf.addEventListener('click', function() {
            const valorInmueble = parseFloat(valorInmuebleInput.value) || 0;
            if (valorInmueble <= 0) {
                 alert('Por favor, introduce los datos necesarios antes de generar el PDF.');
                 return;
            }
            const originalAction = formulario.action;
            const originalTarget = formulario.target;
            
            formulario.action = '/descargar-pdf';
            formulario.target = '_blank';
            formulario.method = 'POST';
            formulario.submit();
            
            setTimeout(() => {
                formulario.action = originalAction;
                formulario.target = originalTarget;
            }, 500);
        });
    }

    // Inicializar estado
    actualizarVisibilidadPaneles();
    // Forzar actualización inicial
    for(let i=1; i<=MAX_SIMULACIONES; i++) calcularBonificaciones(i);
});