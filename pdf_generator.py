from fpdf import FPDF
from datetime import datetime

class MortgagePDF(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 16)
        self.cell(0, 10, 'Informe Comparativo de Hipotecas', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.cell(0, 10, f'Página {self.page_no()}/{{nb}} - Generado el {datetime.now().strftime("%d/%m/%Y %H:%M")}', 0, 0, 'C')

def generate_pdf_report(data):
    pdf = MortgagePDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_font('helvetica', '', 12)

    # --- PÁGINA 1: RESUMEN ---
    pdf.set_font('helvetica', 'B', 14)
    pdf.cell(0, 10, 'Información General', 0, 1)
    pdf.set_font('helvetica', '', 11)
    
    pdf.cell(95, 8, f"Valor del Inmueble: {data.get('valor_inmueble', 0):,.2f} EUR", 0, 0)
    pdf.cell(95, 8, f"Ahorros Disponibles: {data.get('ahorros', 0):,.2f} EUR", 0, 1)
    
    pdf.ln(2)
    pdf.set_font('helvetica', 'B', 12)
    pdf.cell(0, 8, 'Desglose de Gastos Fijos', 0, 1)
    pdf.set_font('helvetica', '', 10)
    
    gastos = data.get('gastos_fijos_detalles', {})
    col_width = 63
    pdf.cell(col_width, 6, f"ITP ({gastos.get('itp_porcentaje', 0)}%): {gastos.get('itp_valor', 0):,.2f} EUR", 1)
    pdf.cell(col_width, 6, f"Notaría: {gastos.get('notaria', 0):,.2f} EUR", 1)
    pdf.cell(col_width, 6, f"Registro: {gastos.get('registro', 0):,.2f} EUR", 1)
    pdf.ln()
    pdf.cell(col_width, 6, f"Gestoría: {gastos.get('gestoria', 0):,.2f} EUR", 1)
    pdf.cell(col_width, 6, f"Tasación: {gastos.get('tasacion', 0):,.2f} EUR", 1)
    pdf.cell(col_width, 6, f"TOTAL GASTOS: {data.get('gastos_fijos_total', 0):,.2f} EUR", 1, 0, 'R')
    pdf.ln(10)

    # --- Simulaciones (Tabla Resumen) ---
    simulaciones = [s for s in data.get('simulaciones', []) if s is not None]
    num_sims = len(simulaciones)

    if num_sims > 0:
        pdf.set_font('helvetica', 'B', 14)
        pdf.cell(0, 10, 'Resumen de Ofertas', 0, 1)
        
        w_label = 50
        w_col = (190 - w_label) / num_sims
        
        # Encabezados
        pdf.set_font('helvetica', 'B', 10)
        pdf.cell(w_label, 10, "Concepto", 1, 0, 'C')
        for sim in simulaciones:
            pdf.cell(w_col, 10, sim['entidad'][:20], 1, 0, 'C')
        pdf.ln()
        
        pdf.set_font('helvetica', '', 9)
        
        def row(label, key, is_currency=True, input_key=None, custom_val_func=None):
            pdf.cell(w_label, 8, label, 1)
            for sim in simulaciones:
                val = None
                if custom_val_func:
                    val = custom_val_func(sim)
                elif input_key and 'input' in sim:
                    val = sim['input'].get(input_key)
                else:
                    val = sim.get(key)
                
                formatted_val = "-"
                if val is not None:
                    if is_currency and isinstance(val, (int, float)):
                        formatted_val = f"{val:,.2f} EUR"
                    elif not is_currency and input_key == 'interes':
                         formatted_val = f"{val}%"
                    else:
                        formatted_val = str(val)
                pdf.cell(w_col, 8, formatted_val, 1, 0, 'R')
            pdf.ln()

        row("Valor a Financiar", 'valor_financiar')
        row("Años", None, is_currency=False, input_key='anios')
        row("Interés (TAE Bonif.)", None, is_currency=False, input_key='interes')
        row("Cuota Mensual", 'cuota')
        row("Total Intereses (Vida Completa)", 'intereses')
        
        # Intereses acumulados con año específico
        def get_intereses_acumulados_con_anio(s):
            intereses_acum = s.get('intereses_acumulados', 0)
            anio_amort = s.get('input', {}).get('anio_amortizacion', '')
            if anio_amort and str(anio_amort) != '':
                return f"{intereses_acum:,.2f} EUR (Año {anio_amort})"
            return f"{intereses_acum:,.2f} EUR"
        
        pdf.cell(w_label, 8, "Intereses hasta Año Amort.", 1)
        for sim in simulaciones:
            val_formatted = get_intereses_acumulados_con_anio(sim)
            pdf.cell(w_col, 8, val_formatted, 1, 0, 'R')
        pdf.ln()
        
        row("Desembolso Inicial Total", 'desembolso_inicial')

        # Totales Reales
        pdf.set_font('helvetica', 'B', 9)
        def get_coste_total_prods(s):
            return s.get('productos', {}).get('coste_productos_vida_total', 0)
        
        row("Coste Total Productos", None, is_currency=True, custom_val_func=get_coste_total_prods)
        
        def get_total_real(s):
            return s.get('total_con_productos', 0)
            
        pdf.set_fill_color(230, 240, 255)
        pdf.cell(w_label, 8, "COSTE TOTAL FINAL", 1, 0, 'L', True)
        for sim in simulaciones:
             val = sim.get('total_con_productos', 0)
             pdf.cell(w_col, 8, f"{val:,.2f} EUR", 1, 0, 'R', True)
        pdf.ln()


    # --- PÁGINA 2: DETALLE DE VINCULACIONES ---
    pdf.add_page()
    pdf.set_font('helvetica', 'B', 14)
    pdf.cell(0, 10, 'Detalle de Vinculaciones y Productos', 0, 1)
    pdf.ln(5)
    
    for sim in simulaciones:
        pdf.set_font('helvetica', 'B', 12)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(0, 8, f"Entidad: {sim['entidad']}", 0, 1, 'L', True)
        pdf.ln(2)
        
        productos = sim.get('productos', {}).get('detalle', [])
        
        if not productos:
            pdf.set_font('helvetica', 'I', 10)
            pdf.cell(0, 8, "No se han seleccionado productos vinculados.", 0, 1)
        else:
            # Cabecera Tabla
            pdf.set_font('helvetica', 'B', 9)
            pdf.cell(60, 8, "Producto", 1, 0, 'C')
            pdf.cell(30, 8, "Bonificación", 1, 0, 'C')
            pdf.cell(35, 8, "Coste Anual", 1, 0, 'C')
            pdf.cell(25, 8, "Duración", 1, 0, 'C')
            pdf.cell(40, 8, "Coste Total Vida", 1, 0, 'C')
            pdf.ln()
            
            # Filas
            pdf.set_font('helvetica', '', 9)
            total_vida_sum = 0
            for prod in productos:
                pdf.cell(60, 8, prod['nombre'], 1)
                pdf.cell(30, 8, f"-{prod['bonificacion']}%", 1, 0, 'C')
                pdf.cell(35, 8, f"{prod['coste_anual']:,.2f} EUR", 1, 0, 'R')
                pdf.cell(25, 8, f"{prod['duracion']} años", 1, 0, 'C')
                pdf.cell(40, 8, f"{prod['coste_total']:,.2f} EUR", 1, 0, 'R')
                pdf.ln()
                total_vida_sum += prod['coste_total']
            
            # Total por entidad
            pdf.set_font('helvetica', 'B', 9)
            pdf.cell(150, 8, "TOTAL PRODUCTOS", 1, 0, 'R')
            pdf.cell(40, 8, f"{total_vida_sum:,.2f} EUR", 1, 0, 'R')
            pdf.ln()
            
        pdf.ln(5)
        
        # Resumen Texto
        pdf.set_font('helvetica', '', 10)
        anio_amort = sim['input'].get('anio_amortizacion', 'N/A')
        intereses_acum = sim.get('intereses_acumulados', 0)
        coste_prods = sim.get('productos', {}).get('coste_productos_vida_total', 0)
        bonificacion_permanente = sim.get('bonificacion_permanente', True)
        calculo_interes_variable = sim.get('calculo_interes_variable', False)
        
        resumen_texto = f"Resumen para {sim['entidad']}: Con un TIN Bonificado del {sim['input']['interes']}%, pagarás un total de intereses de {sim['intereses']:,.2f} EUR durante toda la vida de la hipoteca."
        
        # Información sobre tipo de bonificación
        if coste_prods > 0:
            if bonificacion_permanente:
                resumen_texto += " La bonificación es PERMANENTE: el TIN bonificado se mantendrá durante toda la vida de la hipoteca, incluso después de que expiren los productos vinculados."
            elif calculo_interes_variable:
                resumen_texto += " La bonificación es TEMPORAL: el interés volverá al TIN de partida cuando expiren los productos vinculados."
        
        if anio_amort and str(anio_amort) != 'N/A':
            resumen_texto += f" Hasta el año {anio_amort} habrás pagado {intereses_acum:,.2f} EUR en intereses."
        
        if coste_prods > 0:
            resumen_texto += f" A esto hay que sumar {coste_prods:,.2f} EUR derivados de los productos contratados según su duración específica."
        
        pdf.multi_cell(0, 5, resumen_texto)
        pdf.ln(10)

    # Recomendación final al pie de la página de detalles
    recomendacion = data.get('recomendacion')
    if recomendacion and num_sims > 1:
        pdf.ln(5)
        pdf.set_font('helvetica', 'B', 12)
        pdf.set_fill_color(220, 255, 220)
        mejor_opcion = recomendacion['mejor_intereses'] # Usamos la lógica de coste total que pusimos en app.py
        
        pdf.cell(0, 10, f"CONCLUSIÓN FINAL", 0, 1, 'L')
        pdf.set_font('helvetica', '', 11)
        pdf.multi_cell(0, 6, f"Considerando tanto la cuota hipotecaria como el coste temporal de los productos vinculados, la opción más económica es {mejor_opcion['entidad']} con un coste total real de {mejor_opcion['total_con_productos']:,.2f} EUR.")

    return pdf