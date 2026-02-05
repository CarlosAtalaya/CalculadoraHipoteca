from flask import Flask, render_template, request, jsonify, make_response
import io
import json
from datetime import datetime
from pdf_generator import generate_pdf_report

app = Flask(__name__)

# Función para calcular cuotas de una simulación
def calcular_cuotas_simulacion(valor_prestamo, anios, interes_anual, anio_amortizacion):
    try:
        # Validación de datos
        if not (valor_prestamo and anios and interes_anual and anio_amortizacion):
            return None, None, None, None

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

def process_simulation_data(form_data):
    # Obtener datos generales
    valor_inmueble = form_data.get('valor_inmueble', '')
    ahorros = form_data.get('ahorros', '')
    itp_porcentaje = form_data.get('itp', '')
    notaria = form_data.get('notaria', '')
    registro = form_data.get('registro', '')
    gestoria = form_data.get('gestoria', '')
    tasacion = form_data.get('tasacion', '')
    
    # Determinar cuántas simulaciones procesar
    try:
        num_simulaciones = int(form_data.get('num_simulaciones', 2))
    except ValueError:
        num_simulaciones = 2

    data = {
        'valor_inmueble': 0,
        'ahorros': 0,
        'gastos_fijos_detalles': {},
        'gastos_fijos_total': 0,
        'simulaciones': [],
        'num_simulaciones': num_simulaciones
    }

    # Calcular gastos fijos
    try:
        data['valor_inmueble'] = float(valor_inmueble)
        data['ahorros'] = float(ahorros)
        itp_valor = data['valor_inmueble'] * (float(itp_porcentaje) / 100)
        
        data['gastos_fijos_detalles'] = {
            'itp_porcentaje': float(itp_porcentaje),
            'itp_valor': itp_valor,
            'notaria': float(notaria),
            'registro': float(registro),
            'gestoria': float(gestoria),
            'tasacion': float(tasacion)
        }
        
        data['gastos_fijos_total'] = (
            itp_valor + 
            data['gastos_fijos_detalles']['notaria'] + 
            data['gastos_fijos_detalles']['registro'] + 
            data['gastos_fijos_detalles']['gestoria'] + 
            data['gastos_fijos_detalles']['tasacion']
        )
    except ValueError:
        pass
    
    # Procesar N simulaciones
    for i in range(1, num_simulaciones + 1):
        suffix = str(i) # IMPORTANTE: Definir suffix primero
        
        # 1. Obtener datos básicos del formulario
        entidad = form_data.get(f'entidad{suffix}', '')
        valor = form_data.get(f'valor{suffix}', '')
        anios = form_data.get(f'anios{suffix}', '')
        interes = form_data.get(f'interes{suffix}', '') # Este es el TIN final calculado por JS
        anio_amortizacion = form_data.get(f'anio_amortizacion{suffix}', '')
        entrada_porcentaje = form_data.get(f'entrada_porcentaje{suffix}', '')

        sim_input = {
            'id': i,
            'entidad': entidad,
            'valor': valor,
            'anios': anios,
            'interes': interes,
            'entrada_porcentaje': entrada_porcentaje
        }

        # 2. Obtener datos de productos (JSON)
        productos_json = form_data.get(f'productos_json{suffix}', '{}')
        try:
            productos_data = json.loads(productos_json)
        except:
            productos_data = {'coste_productos_anual': 0, 'detalle': []}

        # 3. Calcular cuotas matemáticas
        cuota, total, intereses, acum = calcular_cuotas_simulacion(
            valor, anios, interes, anio_amortizacion
        )
        
        sim_result = None
        if cuota:
            # Calcular coste total de productos durante la vida de la hipoteca
            try:
                anios_float = float(anios)
            except:
                anios_float = 0
                
            coste_productos_vida = productos_data.get('coste_productos_anual', 0) * anios_float
            total_con_productos = total + coste_productos_vida

            sim_result = {
                'id': i,
                'entidad': entidad if entidad else f"Opción {i}",
                'valor_financiar': float(valor),
                'cuota': cuota,
                'total': total,
                'intereses': intereses,
                'intereses_acumulados': acum,
                'input': sim_input,
                'productos': productos_data,
                'total_con_productos': round(total_con_productos, 2)
            }
            
            # Calcular entrada valor y ahorros restantes
            try:
                entrada_val = data['valor_inmueble'] * (float(entrada_porcentaje) / 100)
                sim_result['entrada_valor'] = entrada_val
                sim_result['desembolso_inicial'] = entrada_val + data['gastos_fijos_total']
                sim_result['ahorros_restantes'] = data['ahorros'] - sim_result['desembolso_inicial']
            except:
                sim_result['entrada_valor'] = 0
                sim_result['desembolso_inicial'] = 0
                sim_result['ahorros_restantes'] = 0

        data['simulaciones'].append(sim_result)

    # Identificar la mejor opción (solo si hay al menos 2 simulaciones válidas)
    valid_sims = [s for s in data['simulaciones'] if s is not None]
    if len(valid_sims) >= 2:
        # Recomendación basada en COSTE TOTAL REAL (Intereses + Productos)
        mejor_interes = min(valid_sims, key=lambda x: x.get('total_con_productos', x['total']))
        mejor_cuota = min(valid_sims, key=lambda x: x['cuota'])
        
        data['recomendacion'] = {
            'mejor_intereses': mejor_interes,
            'mejor_cuota': mejor_cuota
        }
        
    return data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calcular', methods=['POST'])
def calcular():
    data = process_simulation_data(request.form)
    return jsonify(data)

@app.route('/descargar-pdf', methods=['POST'])
def descargar_pdf():
    data = process_simulation_data(request.form)
    pdf = generate_pdf_report(data)
    
    # Generar nombre de archivo con fecha y hora
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    filename = f"reporte_hipotecas_{timestamp}.pdf"
    
    # Generar el PDF en memoria
    pdf_output = io.BytesIO()
    pdf.output(pdf_output)
    pdf_output.seek(0)
    
    response = make_response(pdf_output.getvalue())
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename={filename}'
    
    return response

if __name__ == '__main__':
    app.run(debug=True)