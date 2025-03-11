from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Función para calcular cuotas de una simulación (sin dependencias de tkinter)
def calcular_cuotas_simulacion(valor_prestamo, anios, interes_anual, anio_amortizacion):
    try:
        # Validación de datos
        if not (valor_prestamo and anios and interes_anual and anio_amortizacion):
            return None, None, None, None  # Si algún dato está vacío, no calcula nada

        # Conversión de entrada
        valor_prestamo = float(valor_prestamo)
        anios = int(anios)
        interes_anual = float(interes_anual) / 100
        anio_amortizacion = int(anio_amortizacion)

        # Validar año de amortización
        if anio_amortizacion > anios or anio_amortizacion < 1:
            return None, None, None, None

        # Conversión de años a meses
        meses = anios * 12
        interes_mensual = interes_anual / 12

        # Fórmula para calcular cuota mensual
        if interes_mensual > 0:
            cuota = valor_prestamo * (interes_mensual * (1 + interes_mensual)**meses) / ((1 + interes_mensual)**meses - 1)
        else:
            cuota = valor_prestamo / meses  # Sin interés

        total_pagado = cuota * meses
        total_intereses = total_pagado - valor_prestamo

        # Calcular intereses acumulados hasta el año de amortización
        capital_restante = valor_prestamo
        intereses_acumulados = 0
        for mes in range(1, anio_amortizacion * 12 + 1):
            interes_mes = capital_restante * interes_mensual
            amortizacion_mes = cuota - interes_mes
            capital_restante -= amortizacion_mes
            intereses_acumulados += interes_mes

        return round(cuota, 2), round(total_pagado, 2), round(total_intereses, 2), round(intereses_acumulados, 2)

    except ValueError:
        return None, None, None, None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calcular', methods=['POST'])
def calcular():
    # Obtener datos generales
    valor_inmueble = request.form.get('valor_inmueble', '')
    ahorros = request.form.get('ahorros', '')
    itp_porcentaje = request.form.get('itp', '')
    notaria = request.form.get('notaria', '')
    registro = request.form.get('registro', '')
    gestoria = request.form.get('gestoria', '')
    tasacion = request.form.get('tasacion', '')
    
    # Calcular gastos fijos
    try:
        valor_inmueble_float = float(valor_inmueble)
        itp_valor = valor_inmueble_float * (float(itp_porcentaje) / 100)
        gastos_fijos = itp_valor + float(notaria) + float(registro) + float(gestoria) + float(tasacion)
    except ValueError:
        gastos_fijos = 0
    
    # Obtener datos del formulario para ambas simulaciones
    # Simulación 1
    nombre_entidad1 = request.form.get('entidad1', '')
    entrada_porcentaje1 = request.form.get('entrada_porcentaje1', '')
    valor1 = request.form.get('valor1', '')
    anios1 = request.form.get('anios1', '')
    interes1 = request.form.get('interes1', '')
    anio_amortizacion1 = request.form.get('anio_amortizacion1', '')
    
    # Simulación 2
    nombre_entidad2 = request.form.get('entidad2', '')
    entrada_porcentaje2 = request.form.get('entrada_porcentaje2', '')
    valor2 = request.form.get('valor2', '')
    anios2 = request.form.get('anios2', '')
    interes2 = request.form.get('interes2', '')
    anio_amortizacion2 = request.form.get('anio_amortizacion2', '')
    
    # Calcular resultados
    resultados = {}
    
    # Simulación 1
    cuota1, total1, intereses1, acum1 = calcular_cuotas_simulacion(
        valor1, anios1, interes1, anio_amortizacion1
    )
    if cuota1:
        resultados['simulacion1'] = {
            'entidad': nombre_entidad1,
            'valor_financiar': float(valor1),
            'cuota': cuota1,
            'total': total1,
            'intereses': intereses1,
            'intereses_acumulados': acum1
        }
    else:
        resultados['simulacion1'] = None
        
    # Simulación 2
    cuota2, total2, intereses2, acum2 = calcular_cuotas_simulacion(
        valor2, anios2, interes2, anio_amortizacion2
    )
    if cuota2:
        resultados['simulacion2'] = {
            'entidad': nombre_entidad2,
            'valor_financiar': float(valor2),
            'cuota': cuota2,
            'total': total2,
            'intereses': intereses2,
            'intereses_acumulados': acum2
        }
    else:
        resultados['simulacion2'] = None
    
    # Calcular diferencias si ambas simulaciones tienen resultados
    if resultados['simulacion1'] and resultados['simulacion2']:
        diferencia_cuota = cuota1 - cuota2
        diferencia_total = total1 - total2
        diferencia_intereses = intereses1 - intereses2
        resultados['diferencias'] = {
            'cuota': round(diferencia_cuota, 2),
            'total': round(diferencia_total, 2),
            'intereses': round(diferencia_intereses, 2)
        }
    
    return jsonify(resultados)

if __name__ == '__main__':
    app.run(debug=True)