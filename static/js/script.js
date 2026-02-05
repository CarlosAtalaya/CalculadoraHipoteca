document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formulario-hipotecas');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const btnPdf = document.getElementById('btn-pdf');
    const comparacionResultados = document.getElementById('comparacion-resultados');
    const numSimulacionesSelect = document.getElementById('num_simulaciones');
    
    // Configuración inicial
    const MAX_SIMULACIONES = 4;
    let numSimulaciones = 2;

    function actualizarVisibilidadPaneles() {
        numSimulaciones = parseInt(numSimulacionesSelect.value);
        
        for (let i = 1; i <= MAX_SIMULACIONES; i++) {
            const panel = document.getElementById(`panel-sim${i}`);
            const inputs = panel.querySelectorAll('input, select');
            
            if (i <= numSimulaciones) {
                panel.classList.remove('hidden');
                inputs.forEach(input => {
                    if (input.closest('.productos-container')) {
                        input.required = false;
                        // Restaurar valores por defecto si están vacíos y el input tiene un atributo value
                        if (input.type === 'number' && !input.value && input.hasAttribute('value')) {
                            input.value = input.getAttribute('value');
                        }
                    } else if (input.id.includes('valor') || input.id.includes('interes')) {
                        // readonly
                    } else if (input.type === 'checkbox' && input.id.includes('bonificacion_permanente')) {
                        // Los checkboxes de bonificación permanente no son obligatorios
                        input.required = false;
                    } else if (input.dataset.wasRequired) {
                        input.required = true;
                    } else {
                        input.required = true;
                    }
                });
            } else {
                panel.classList.add('hidden');
                inputs.forEach(input => {
                    if (input.required) {
                        input.dataset.wasRequired = "true"; 
                        input.required = false;
                    }
                });
                // Limpiar valores solo cuando se oculta el panel
                inputs.forEach(input => {
                    // No limpiar checkboxes de bonificación permanente ni valores por defecto de productos
                    if (input.id && input.id.includes('bonificacion_permanente')) {
                        // Mantener el estado del checkbox
                    } else if (input.closest('.productos-container')) {
                        // Limpiar productos cuando se oculta
                        if(input.type === 'checkbox') input.checked = false;
                        else if (!input.disabled) input.value = '';
                    } else if(input.type === 'checkbox') {
                        input.checked = false;
                    } else if (!input.readOnly) {
                        input.value = '';
                    }
                });
                document.getElementById(`resultados${i}`).innerHTML = '';
            }
        }
        
        const container = document.querySelector('.simulaciones-container');
        container.className = 'simulaciones-container'; 
        if (numSimulaciones === 1) container.classList.add('grid-1');
        else if (numSimulaciones === 2) container.classList.add('grid-2');
        else if (numSimulaciones === 3) container.classList.add('grid-3');
        else container.classList.add('grid-4');
        
        comparacionResultados.innerHTML = '';
        comparacionResultados.classList.add('hidden');
    }

    if (numSimulacionesSelect) {
        numSimulacionesSelect.addEventListener('change', actualizarVisibilidadPaneles);
    }
    
    // --- LÓGICA DE CALCULADORA AVANZADA ---
    window.toggleProductos = function(id) {
        const container = document.getElementById(`productos-container${id}`);
        container.classList.toggle('hidden');
    };

    function calcularBonificaciones(simId) {
        const tinPartidaInput = document.getElementById(`tin_partida${simId}`);
        const interesInput = document.getElementById(`interes${simId}`);
        const jsonInput = document.getElementById(`productos_json${simId}`);
        
        if (!tinPartidaInput || !interesInput) return;

        let tinBase = parseFloat(tinPartidaInput.value) || 0;
        let bonificacionTotal = 0;
        let costeProductosVidaTotal = 0; // Coste total en toda la vida de la hipoteca
        let listaProductos = [];

        const checkboxes = document.querySelectorAll(`.prod-check[data-sim="${simId}"]`);
        
        checkboxes.forEach(chk => {
            if (chk.checked) {
                const row = chk.closest('.producto-row');
                
                // Bonificación
                const bonifInput = row.querySelector('.bonif-input');
                const bonif = bonifInput ? (parseFloat(bonifInput.value) || 0) : 0;

                // Coste Anual
                const costeInput = row.querySelector('.coste-input');
                const coste = costeInput ? (parseFloat(costeInput.value) || 0) : 0;

                // Duración
                const duracionInput = row.querySelector('.duracion-input');
                const duracion = duracionInput ? (parseFloat(duracionInput.value) || 0) : 0;

                bonificacionTotal += bonif;
                // Calculamos el coste total de este producto: coste/año * años
                const costeTotalProd = parseFloat((coste * duracion).toFixed(2));
                costeProductosVidaTotal += costeTotalProd;
                
                listaProductos.push({
                    nombre: chk.value,
                    bonificacion: parseFloat(bonif.toFixed(4)),
                    coste_anual: parseFloat(coste.toFixed(2)),
                    duracion: parseFloat(duracion.toFixed(2)),
                    coste_total: costeTotalProd
                });
            }
        });

        let tinFinal = tinBase - bonificacionTotal;
        if (tinFinal < 0) tinFinal = 0;

        // Mantener precisión pero mostrar con decimales razonables
        interesInput.value = tinFinal.toFixed(4).replace(/\.?0+$/, '');

        // Guardamos todo el detalle
        const datosExtra = {
            tin_partida: parseFloat(tinBase.toFixed(4)),
            bonificacion_total: parseFloat(bonificacionTotal.toFixed(4)),
            coste_productos_vida_total: parseFloat(costeProductosVidaTotal.toFixed(2)),
            detalle: listaProductos
        };
        
        if (jsonInput) {
            jsonInput.value = JSON.stringify(datosExtra);
        }
    }

    // Inicializar listeners
    for (let i = 1; i <= MAX_SIMULACIONES; i++) {
        const elements = [
            document.getElementById(`tin_partida${i}`),
            ...document.querySelectorAll(`.prod-check[data-sim="${i}"]`),
            ...document.querySelectorAll(`.bonif-input[data-sim="${i}"]`),
            ...document.querySelectorAll(`.coste-input[data-sim="${i}"]`),
            ...document.querySelectorAll(`.duracion-input[data-sim="${i}"]`)
        ];

        elements.forEach(el => {
            if(el) el.addEventListener('input', () => calcularBonificaciones(i));
            if(el && el.type === 'checkbox') el.addEventListener('change', () => calcularBonificaciones(i));
        });
    }

    // --- CÁLCULOS GLOBALES ---
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
                alert(`Simulación ${i}: Ahorros insuficientes. Necesitas ${totalNecesario.toLocaleString('es-ES', {maximumFractionDigits:0})} €`);
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
            alert('Error al calcular. Revisa los datos.');
        });
    }

    function generarHTMLResultado(sim) {
        let detalleProductos = '';
        if (sim.productos && sim.productos.detalle.length > 0) {
            detalleProductos = `<div style="margin-top:10px; font-size:0.9rem; background:#fff; padding:10px; border-radius:5px;">
                <strong>Detalle Vinculaciones:</strong><ul style="padding-left:20px; margin:5px 0;">`;
            
            sim.productos.detalle.forEach(p => {
                detalleProductos += `<li>${p.nombre}: ${p.coste_total.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})} € (${p.duracion} años)</li>`;
            });
            
            detalleProductos += `</ul>
                <div style="text-align:right; margin-top:5px; color:#c0392b;"><strong>+ ${sim.productos.coste_productos_vida_total.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})} € en productos</strong></div>`;
            
            // Mostrar información sobre bonificación permanente/temporal
            if (sim.bonificacion_permanente !== undefined) {
                const tipoBonif = sim.bonificacion_permanente 
                    ? '<span style="color:#2ecc71; font-weight:bold;">✓ Bonificación permanente</span>' 
                    : '<span style="color:#e74c3c; font-weight:bold;">⚠ Bonificación temporal</span>';
                detalleProductos += `<div style="margin-top:8px; padding-top:8px; border-top:1px solid #eee; font-size:0.85rem;">${tipoBonif} - ${sim.bonificacion_permanente ? 'El TIN bonificado se mantiene toda la vida' : 'El interés volverá al TIN de partida cuando expiren los productos'}</div>`;
            }
            
            detalleProductos += `</div>`;
        }

        let interesesAcumuladosInfo = '';
        if (sim.intereses_acumulados !== undefined && sim.intereses_acumulados !== null) {
            const anioAmortizacion = sim.input && sim.input.anio_amortizacion ? sim.input.anio_amortizacion : '';
            interesesAcumuladosInfo = `<p><strong>Intereses hasta año ${anioAmortizacion || 'amortización'}:</strong> ${sim.intereses_acumulados.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</p>`;
        }

        return `
            <div class="resultados-seccion">
                <h4>Financiero</h4>
                <p><strong>Cuota mensual:</strong> ${sim.cuota.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</p>
                <p><strong>Total intereses (vida completa):</strong> ${sim.intereses.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</p>
                ${interesesAcumuladosInfo}
                <p><strong>Total pagado (Banco):</strong> ${sim.total.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</p>
                ${detalleProductos}
            </div>
            <div class="resultados-seccion">
                <h4>Coste Real Final</h4>
                <p style="font-size:1.1rem; color:#2c3e50;"><strong>${sim.total_con_productos.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</strong></p>
                <small>(Incluye hipoteca + coste productos durante su duración)</small>
            </div>
        `;
    }

    function crearTablaComparacion(simulaciones, recomendacion) {
        if (!simulaciones || simulaciones.length < 2) return '';

        let html = `
            <h2>Comparativa Total</h2>
            <div class="comparacion-table-container">
                <table class="comparacion-table">
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            ${simulaciones.map(sim => `<th class="entidad-header">${sim.entidad}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Obtener el año de amortización para mostrar en la etiqueta
        const anioAmortizacion = simulaciones[0]?.input?.anio_amortizacion || '';
        const labelInteresesAcum = anioAmortizacion 
            ? `Intereses hasta Año ${anioAmortizacion}` 
            : 'Intereses hasta Año Amort.';
        
        const filas = [
            { label: 'Cuota Mensual', key: 'cuota', isCurrency: true },
            { label: 'Intereses Banco (Total)', key: 'intereses', isCurrency: true },
            { label: labelInteresesAcum, key: 'intereses_acumulados', isCurrency: true },
            { label: 'Coste Productos', key: 'coste_productos_vida_total', isCurrency: true }, 
            { label: 'COSTE TOTAL REAL', key: 'total_con_productos', isCurrency: true, isTotal: true },
            { label: 'Desembolso Inicial', key: 'desembolso_inicial', isCurrency: true }
        ];

        filas.forEach(fila => {
            const valores = simulaciones.map(s => {
                if (fila.key === 'coste_productos_vida_total') {
                    return s.productos ? s.productos.coste_productos_vida_total : 0;
                }
                return s[fila.key] || 0;
            });
            const minValor = Math.min(...valores);
            
            html += `<tr>
                <td class="concepto-col" ${fila.isTotal ? 'style="font-weight:bold; color:#2c3e50;"' : ''}>${fila.label}</td>
                ${simulaciones.map((sim, index) => {
                    let val = sim[fila.key];
                    if (fila.key === 'coste_productos_vida_total') {
                        val = sim.productos ? sim.productos.coste_productos_vida_total : 0;
                    }
                    if (val === undefined) val = 0;

                    // Para todos los campos, el mejor es el menor valor (incluyendo desembolso inicial)
                    const isBest = Math.abs(val - minValor) < 0.1; 
                    const formatted = fila.isCurrency ? (val || 0).toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' €' : (val || 0);
                    
                    return `<td class="valor-col ${isBest ? 'mejor-valor-cell' : ''}">
                        ${formatted} ${isBest ? '<i class="fas fa-check-circle best-icon"></i>' : ''}
                    </td>`;
                }).join('')}
            </tr>`;
        });

        html += `</tbody></table></div>`;
        
        if (recomendacion) {
            const mejor = simulaciones.find(s => s.entidad === recomendacion.mejor_intereses.entidad);
            html += `<div class="comparacion-recomendacion"><div class="comparacion-valor"><i class="fas fa-star"></i> Opción recomendada por coste real: <strong>${mejor.entidad}</strong>.</div></div>`;
        }
        
        return html;
    }

    btnLimpiar.addEventListener('click', function() {
        formulario.reset();
        for (let i = 1; i <= MAX_SIMULACIONES; i++) {
            document.getElementById(`resultados${i}`).innerHTML = '';
        }
        comparacionResultados.innerHTML = '';
        comparacionResultados.classList.add('hidden');
        actualizarVisibilidadPaneles();
    });

    if (btnPdf) {
        btnPdf.addEventListener('click', function() {
            const valorInmueble = parseFloat(valorInmuebleInput.value) || 0;
            if (valorInmueble <= 0) { alert('Introduce los datos primero.'); return; }
            const originalAction = formulario.action;
            const originalTarget = formulario.target;
            formulario.action = '/descargar-pdf';
            formulario.target = '_blank';
            formulario.method = 'POST';
            formulario.submit();
            setTimeout(() => { formulario.action = originalAction; formulario.target = originalTarget; }, 500);
        });
    }

    actualizarVisibilidadPaneles();
});