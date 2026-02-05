from flask import Flask, render_template, request, jsonify, make_response
import io
import json
from datetime import datetime
from pdf_generator import generate_pdf_report

app = Flask(__name__)

def calcular_cuotas_simulacion(valor_prestamo, anios, interes_anual, anio_amortizacion, tin_partida=None, productos_detalle=None):
    """
    Calcula las cuotas e intereses de una hipoteca.
    
    Si se proporcionan tin_partida y productos_detalle, calcula los intereses
    considerando que el interés sube cuando los productos expiran.
    Si no, usa el interés fijo proporcionado.
    """
    try:
        if not (valor_prestamo and anios and interes_anual):
            return None, None, None, None

        valor_prestamo = float(valor_prestamo)
        anios = float(anios)
        interes_anual = float(interes_anual) / 100
        
        # Si no hay año de amortización, usar el total de años
        if anio_amortizacion:
            try:
                anio_amortizacion = float(anio_amortizacion)
                if anio_amortizacion > anios or anio_amortizacion < 0.01:
                    anio_amortizacion = anios
            except (ValueError, TypeError):
                anio_amortizacion = anios
        else:
            anio_amortizacion = anios

        meses = int(anios * 12)
        meses_amortizacion = int(anio_amortizacion * 12)
        
        # Si tenemos información de productos, calcular con interés variable
        if tin_partida is not None and productos_detalle:
            return calcular_cuotas_con_interes_variable(
                valor_prestamo, meses, meses_amortizacion, 
                float(tin_partida) / 100, interes_anual, productos_detalle
            )
        
        # Cálculo tradicional con interés fijo
        interes_mensual = interes_anual / 12

        if interes_mensual > 0:
            cuota = valor_prestamo * (interes_mensual * (1 + interes_mensual)**meses) / ((1 + interes_mensual)**meses - 1)
        else:
            cuota = valor_prestamo / meses if meses > 0 else 0

        total_pagado = cuota * meses
        total_intereses = total_pagado - valor_prestamo

        capital_restante = valor_prestamo
        intereses_acumulados = 0
        for mes in range(1, min(meses_amortizacion + 1, meses + 1)):
            interes_mes = capital_restante * interes_mensual
            amortizacion_mes = cuota - interes_mes
            capital_restante -= amortizacion_mes
            intereses_acumulados += interes_mes

        return round(cuota, 2), round(total_pagado, 2), round(total_intereses, 2), round(intereses_acumulados, 2)
    except (ValueError, TypeError, ZeroDivisionError):
        return None, None, None, None

def calcular_cuotas_con_interes_variable(valor_prestamo, meses_totales, meses_amortizacion, tin_partida, tin_bonificado, productos_detalle):
    """
    Calcula cuotas e intereses considerando que el interés cambia cuando los productos expiran.
    
    La cuota se calcula usando el TIN bonificado inicial, pero los intereses reales
    se calculan mes a mes según qué productos están activos.
    """
    try:
        # Calcular la cuota usando el TIN bonificado (como si fuera fijo)
        # Esto simula que el banco fija la cuota al inicio
        interes_bonificado_mensual = tin_bonificado / 12
        if interes_bonificado_mensual > 0:
            cuota = valor_prestamo * (interes_bonificado_mensual * (1 + interes_bonificado_mensual)**meses_totales) / ((1 + interes_bonificado_mensual)**meses_totales - 1)
        else:
            cuota = valor_prestamo / meses_totales if meses_totales > 0 else 0
        
        # Crear un mapa de bonificaciones activas por mes
        # Las bonificaciones vienen en formato porcentual (0.20 = 0.20%, no 20%)
        bonificaciones_por_mes = {}
        for prod in productos_detalle:
            duracion_meses = int(float(prod.get('duracion', 0)) * 12)
            bonificacion = float(prod.get('bonificacion', 0))  # Ya viene como porcentaje (0.20 = 0.20%)
            for mes in range(1, min(duracion_meses + 1, meses_totales + 1)):
                if mes not in bonificaciones_por_mes:
                    bonificaciones_por_mes[mes] = 0
                bonificaciones_por_mes[mes] += bonificacion
        
        # Calcular intereses mes a mes
        capital_restante = valor_prestamo
        total_intereses = 0
        intereses_acumulados = 0
        
        for mes in range(1, meses_totales + 1):
            # Calcular el interés efectivo de este mes
            # bonificacion_mes ya está en formato porcentual (0.20 = 0.20%)
            bonificacion_mes = bonificaciones_por_mes.get(mes, 0)
            # Convertir bonificación de porcentaje a decimal para restar del TIN
            bonificacion_decimal = bonificacion_mes / 100
            interes_efectivo_mes = max(0, tin_partida - bonificacion_decimal)
            interes_mensual_efectivo = interes_efectivo_mes / 12
            
            # Calcular intereses del mes
            interes_mes = capital_restante * interes_mensual_efectivo
            amortizacion_mes = cuota - interes_mes
            capital_restante = max(0, capital_restante - amortizacion_mes)
            
            total_intereses += interes_mes
            
            if mes <= meses_amortizacion:
                intereses_acumulados += interes_mes
        
        total_pagado = cuota * meses_totales
        
        return round(cuota, 2), round(total_pagado, 2), round(total_intereses, 2), round(intereses_acumulados, 2)
    except (ValueError, TypeError, ZeroDivisionError):
        return None, None, None, None

def process_simulation_data(form_data):
    valor_inmueble = form_data.get('valor_inmueble', '')
    ahorros = form_data.get('ahorros', '')
    itp_porcentaje = form_data.get('itp', '')
    notaria = form_data.get('notaria', '')
    registro = form_data.get('registro', '')
    gestoria = form_data.get('gestoria', '')
    tasacion = form_data.get('tasacion', '')
    
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

    try:
        data['valor_inmueble'] = float(valor_inmueble) if valor_inmueble else 0
        data['ahorros'] = float(ahorros) if ahorros else 0
        itp_valor = data['valor_inmueble'] * (float(itp_porcentaje) / 100) if itp_porcentaje else 0
    
        data['gastos_fijos_detalles'] = {
            'itp_porcentaje': float(itp_porcentaje) if itp_porcentaje else 0,
            'itp_valor': itp_valor,
            'notaria': float(notaria) if notaria else 0,
            'registro': float(registro) if registro else 0,
            'gestoria': float(gestoria) if gestoria else 0,
            'tasacion': float(tasacion) if tasacion else 0
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
    
    for i in range(1, num_simulaciones + 1):
        suffix = str(i)
        entidad = form_data.get(f'entidad{suffix}', '')
        valor = form_data.get(f'valor{suffix}', '')
        anios = form_data.get(f'anios{suffix}', '')
        interes = form_data.get(f'interes{suffix}', '')
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

        # Leer JSON de productos
        productos_json = form_data.get(f'productos_json{suffix}', '{}')
        try:
            productos_data = json.loads(productos_json)
        except:
            productos_data = {'coste_productos_vida_total': 0, 'detalle': [], 'tin_partida': None}

        # Obtener TIN de partida si está disponible
        tin_partida = form_data.get(f'tin_partida{suffix}', '')
        if tin_partida:
            try:
                tin_partida = float(tin_partida)
                productos_data['tin_partida'] = tin_partida
            except (ValueError, TypeError):
                tin_partida = None
        else:
            tin_partida = None

        # Obtener si la bonificación es permanente o temporal
        bonificacion_permanente = form_data.get(f'bonificacion_permanente{suffix}', '')
        bonificacion_permanente = bonificacion_permanente == '1'
        productos_data['bonificacion_permanente'] = bonificacion_permanente

        # Calcular cuotas considerando interés variable si:
        # 1. Hay productos con duración limitada
        # 2. Y la bonificación NO es permanente (es temporal)
        productos_detalle = productos_data.get('detalle', [])
        anios_float = float(anios) if anios else 0
        tiene_productos_limite = False
        
        if productos_detalle and anios_float > 0:
            for p in productos_detalle:
                duracion = float(p.get('duracion', 0) or 0)
                if duracion > 0 and duracion < anios_float:
                    tiene_productos_limite = True
                    break
        
        # Solo usar interés variable si la bonificación NO es permanente
        usar_interes_variable = tin_partida and tiene_productos_limite and productos_detalle and not bonificacion_permanente
        
        if usar_interes_variable:
            # Calcular con interés variable (el interés sube cuando los productos expiran)
            cuota, total, intereses, acum = calcular_cuotas_simulacion(
                valor, anios, interes, anio_amortizacion, 
                tin_partida=tin_partida, productos_detalle=productos_detalle
            )
        else:
            # Calcular con interés fijo (comportamiento tradicional o bonificación permanente)
            cuota, total, intereses, acum = calcular_cuotas_simulacion(
                valor, anios, interes, anio_amortizacion
            )
        
        sim_result = None
        if cuota is not None:
            # El coste total de productos ya viene calculado por JS (suma de coste*duracion)
            # o podemos recalcularlo aquí para seguridad
            coste_prods_total = 0
            for prod in productos_data.get('detalle', []):
                coste_anual = float(prod.get('coste_anual', 0) or 0)
                duracion = float(prod.get('duracion', 0) or 0)
                coste_prods_total += (coste_anual * duracion)
            
            # Actualizamos el valor por si acaso
            productos_data['coste_productos_vida_total'] = coste_prods_total
            
            total_con_productos = total + coste_prods_total

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
                'total_con_productos': round(total_con_productos, 2),
                'bonificacion_permanente': bonificacion_permanente,  # Indica si la bonificación es permanente
                'calculo_interes_variable': usar_interes_variable  # Indica si se usó cálculo con interés variable
            }
            
            try:
                entrada_porcentaje_val = float(entrada_porcentaje) if entrada_porcentaje else 0
                entrada_val = data['valor_inmueble'] * (entrada_porcentaje_val / 100)
                sim_result['entrada_valor'] = round(entrada_val, 2)
                sim_result['desembolso_inicial'] = round(entrada_val + data['gastos_fijos_total'], 2)
                sim_result['ahorros_restantes'] = round(data['ahorros'] - sim_result['desembolso_inicial'], 2)
            except (ValueError, TypeError):
                sim_result['entrada_valor'] = 0
                sim_result['desembolso_inicial'] = 0
                sim_result['ahorros_restantes'] = 0

        data['simulaciones'].append(sim_result)

    valid_sims = [s for s in data['simulaciones'] if s is not None]
    if len(valid_sims) >= 2:
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
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    filename = f"reporte_hipotecas_{timestamp}.pdf"
    
    pdf_output = io.BytesIO()
    pdf.output(pdf_output)
    pdf_output.seek(0)
    
    response = make_response(pdf_output.getvalue())
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f'attachment; filename={filename}'
    return response

if __name__ == '__main__':
    app.run(debug=True)