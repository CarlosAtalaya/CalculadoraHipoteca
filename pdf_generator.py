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

    # --- Información General ---
    pdf.set_font('helvetica', 'B', 14)
    pdf.cell(0, 10, 'Información General', 0, 1)
    pdf.set_font('helvetica', '', 11)
    
    # Datos básicos
    pdf.cell(95, 8, f"Valor del Inmueble: {data.get('valor_inmueble', 0):,.2f} EUR", 0, 0)
    pdf.cell(95, 8, f"Ahorros Disponibles: {data.get('ahorros', 0):,.2f} EUR", 0, 1)
    
    # Gastos Fijos
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

    # --- Simulaciones ---
    simulaciones = [s for s in data.get('simulaciones', []) if s is not None]
    num_sims = len(simulaciones)

    if num_sims > 0:
        pdf.set_font('helvetica', 'B', 14)
        pdf.cell(0, 10, 'Detalle de Simulaciones', 0, 1)
        
        # Configuración de columnas dinámica
        # Ancho total disponible aprox 190
        w_label = 50
        # Calcular ancho restante para columnas de datos
        w_col = (190 - w_label) / num_sims
        
        # Encabezados de tabla
        pdf.set_font('helvetica', 'B', 10)
        pdf.cell(w_label, 10, "Concepto", 1, 0, 'C')
        for sim in simulaciones:
            # Truncar nombre si es muy largo
            entidad_nombre = sim['entidad'][:20]
            pdf.cell(w_col, 10, entidad_nombre, 1, 0, 'C')
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

        # Filas de datos
        row("Valor a Financiar", 'valor_financiar')
        row("Años", None, is_currency=False, input_key='anios')
        row("Interés (TAE)", None, is_currency=False, input_key='interes')
        row("Cuota Mensual", 'cuota')
        row("Total Intereses", 'intereses')
        row("Intereses hasta amort.", 'intereses_acumulados')
        row("Total Pagado (Hipot.)", 'total')
        
        row("Entrada Inicial", 'entrada_valor')
        row("Desembolso Inicial Total", 'desembolso_inicial')
        row("Ahorros Restantes", 'ahorros_restantes')
        row("Total Pagado (Hipot.)", 'total')

        # NUEVAS FILAS
        pdf.ln(2)
        pdf.set_font('helvetica', 'B', 9)
        pdf.cell(w_label, 6, "Productos Vinculados", 1)
        pdf.set_font('helvetica', '', 8)
        
        for sim in simulaciones:
            # Crear lista legible: "Nómina, Alarma, Seguro Vida"
            prods = sim.get('productos', {}).get('detalle', [])
            nombres = [p['nombre'] for p in prods]
            texto = ", ".join(nombres) if nombres else "Ninguno"
            # Cortar texto si es muy largo
            if len(texto) > 25: texto = texto[:22] + "..."
            pdf.cell(w_col, 6, texto, 1, 0, 'C')
        pdf.ln()

        # Función auxiliar para sacar el coste total
        def get_coste_total_real(s):
            return s.get('total_con_productos', 0)

        pdf.set_font('helvetica', 'B', 9)
        row("COSTE TOTAL REAL", None, is_currency=True, custom_val_func=get_coste_total_real)
        pdf.set_font('helvetica', '', 9)

        pdf.ln(5)

    # --- Recomendación (solo si hay comparación) ---
    recomendacion = data.get('recomendacion')
    if recomendacion and num_sims > 1:
        pdf.set_font('helvetica', 'B', 14)
        pdf.cell(0, 10, 'Comparativa y Recomendación', 0, 1)
        pdf.set_font('helvetica', '', 11)
        
        mejor_opcion = recomendacion['mejor_intereses']
        peor_opcion = max(simulaciones, key=lambda x: x['intereses'])
        ahorro = peor_opcion['intereses'] - mejor_opcion['intereses']
        
        pdf.set_fill_color(240, 248, 255)
        pdf.rect(10, pdf.get_y(), 190, 25, 'F')
        pdf.set_xy(15, pdf.get_y() + 5)
        pdf.set_font('helvetica', 'B', 12)
        
        pdf.multi_cell(0, 6, f"RECOMENDACIÓN: Basándonos en el coste total de intereses, la mejor opción es {mejor_opcion['entidad']}.\nComparado con la opción más costosa ({peor_opcion['entidad']}), ahorrarías {ahorro:,.2f} EUR.")

    return pdf
