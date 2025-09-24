#mejoras 
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageTk
import cv2
import numpy as np
import pandas as pd
import os
from datetime import datetime
import matplotlib.pyplot as plt
import skfuzzy as fuzz
from skfuzzy import control as ctrl
from functools import reduce
import operator
from fpdf import FPDF
import sys
import traceback
import tempfile
import winreg
import re
import shutil

# ========== LOG DE ERRORES MEJORADO ==========
def registrar_error(e):
    """Registra errores con más información de contexto"""
    error_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    error_msg = f"\n--- ERROR ({error_time}) ---\n"
    error_msg += f"Type: {type(e).__name__}\n"
    error_msg += f"Message: {str(e)}\n"
    error_msg += "Traceback:\n"
    error_msg += traceback.format_exc()
    error_msg += "\n" + "-"*50 + "\n"
    
    try:
        with open("error.log", "a", encoding="utf-8") as logf:
            logf.write(error_msg)
    except Exception as log_error:
        print(f"Error al escribir en log: {log_error}")
    
    try:
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("Error crítico", 
                            f"Se produjo un error: {type(e).__name__}\n"
                            f"Mensaje: {str(e)}\n\n"
                            "Revisa el archivo error.log para detalles.")
        root.destroy()
    except Exception:
        pass

# ========== SISTEMA DIFUSO OPTIMIZADO ==========
def create_universe(lim_inf, lim_sup, points=101):
    """Crea universo de discurso optimizado"""
    return np.linspace(lim_inf, lim_sup, points)

# Diccionario para almacenar las variables difusas
FUZZY_VARS = {}

def initialize_fuzzy_system():
    """Inicializa el sistema difuso de forma segura y eficiente"""
    # Antecedentes
    FUZZY_VARS['Sensibilidad'] = ctrl.Antecedent(create_universe(0, 6), 'Sensibilidad')
    FUZZY_VARS['Area'] = ctrl.Antecedent(create_universe(0, 4), 'Area')
    FUZZY_VARS['DesvEstR'] = ctrl.Antecedent(create_universe(0, 4), 'DesvEstR')
    FUZZY_VARS['Secrecion'] = ctrl.Antecedent(create_universe(0, 1), 'Secrecion')
    FUZZY_VARS['Eritema'] = ctrl.Antecedent(create_universe(0, 1), 'Eritema')
    FUZZY_VARS['TiempoEvol'] = ctrl.Antecedent(create_universe(0, 35), 'TiempoEvol')
    FUZZY_VARS['ControlGlu'] = ctrl.Antecedent(create_universe(5, 12), 'ControlGlu')
    
    # Consecuente
    FUZZY_VARS['Riesgo'] = ctrl.Consequent(create_universe(1, 3), 'Riesgo', defuzzify_method='centroid')
    
    # Funciones de membresía
    sens = FUZZY_VARS['Sensibilidad']
    sens['Normal'] = fuzz.trapmf(sens.universe, [4, 5, 6, 6])
    sens['Disminuida'] = fuzz.trapmf(sens.universe, [1, 2, 4, 5])
    sens['Ausente'] = fuzz.trapmf(sens.universe, [0, 0, 1, 2])
    
    area = FUZZY_VARS['Area']
    area['Pequena'] = fuzz.trapmf(area.universe, [0, 0, 0.3, 0.7])
    area['Mediana'] = fuzz.trapmf(area.universe, [0.5, 1, 1.5, 2])
    area['Grande'] = fuzz.trapmf(area.universe, [1.8, 2.5, 4, 4])
    
    desv = FUZZY_VARS['DesvEstR']
    desv['Baja'] = fuzz.trapmf(desv.universe, [0, 0, 1, 1.5])
    desv['Media'] = fuzz.trapmf(desv.universe, [1.2, 1.5, 2.5, 2.8])
    desv['Alta'] = fuzz.trapmf(desv.universe, [2.3, 2.5, 4, 4])
    
    secrec = FUZZY_VARS['Secrecion']
    secrec['No'] = fuzz.trapmf(secrec.universe, [0, 0, 0.4, 0.6])
    secrec['Si'] = fuzz.trapmf(secrec.universe, [0.4, 0.6, 1, 1])
    
    erit = FUZZY_VARS['Eritema']
    erit['No'] = fuzz.trapmf(erit.universe, [0, 0, 0.4, 0.6])
    erit['Si'] = fuzz.trapmf(erit.universe, [0.4, 0.6, 1, 1])
    
    tiempo = FUZZY_VARS['TiempoEvol']
    tiempo['Reciente'] = fuzz.trapmf(tiempo.universe, [0, 0, 5, 7])
    tiempo['Intermedio'] = fuzz.trapmf(tiempo.universe, [6, 8, 20, 22])
    tiempo['Prolongado'] = fuzz.trapmf(tiempo.universe, [20, 22, 35, 35])
    
    gluc = FUZZY_VARS['ControlGlu']
    gluc['Bueno'] = fuzz.trapmf(gluc.universe, [5, 5, 6.5, 7])
    gluc['Regular'] = fuzz.trapmf(gluc.universe, [6.8, 7, 8.5, 8.7])
    gluc['Malo'] = fuzz.trapmf(gluc.universe, [8.5, 9, 12, 12])
    
    riesgo = FUZZY_VARS['Riesgo']
    riesgo['Bajo'] = fuzz.trimf(riesgo.universe, [1, 1.3, 2])
    riesgo['Moderado'] = fuzz.trimf(riesgo.universe, [1.6, 2, 2.4])
    riesgo['Alto'] = fuzz.trimf(riesgo.universe, [2.1, 2.5, 3])
    
    # Validar que los universos sean consistentes
    for var_name, var in FUZZY_VARS.items():
        if not hasattr(var, 'universe') or var.universe.size == 0:
            raise ValueError(f"Variable difusa '{var_name}' no tiene universo definido")

# Texto de reglas sin duplicados
REGLASTEXT = """
3 3 0 0 0 0 0, 3
0 0 0 2 2 0 0, 3
0 0 3 0 0 0 3, 3
0 3 0 0 0 3 0, 3
2 2 0 0 0 0 0, 2
2 0 2 0 0 0 0, 2
1 1 0 1 0 0 0, 1
1 0 1 0 1 0 0, 1
0 1 0 0 0 1 0, 1
1 0 0 0 0 0 0, 1
"""

MFS = [
    ["Normal", "Disminuida", "Ausente"],
    ["Pequena", "Mediana", "Grande"],
    ["Baja", "Media", "Alta"],
    ["No", "Si"],
    ["No", "Si"],
    ["Reciente", "Intermedio", "Prolongado"],
    ["Bueno", "Regular", "Malo"]
]
SALIDAS = ["Bajo", "Moderado", "Alto"]

# Singleton para el sistema de control
FUZZY_SYSTEM = None

def get_fuzzy_system():
    """Obtiene el sistema difuso (patrón singleton)"""
    global FUZZY_SYSTEM
    if FUZZY_SYSTEM is None:
        # Inicializar variables difusas
        initialize_fuzzy_system()
        
        # Procesar reglas
        all_rules = []
        for line in REGLASTEXT.strip().split("\n"):
            if not line.strip():
                continue
            parts = line.split(",")
            if len(parts) < 2:
                continue
                
            condiciones = parts[0].split()
            salida = int(parts[1])
            antecedentes = []
            
            for idx, v in enumerate(condiciones):
                v = int(v)
                if v == 0: 
                    continue
                    
                var_name = ['Sensibilidad', 'Area', 'DesvEstR', 'Secrecion', 
                           'Eritema', 'TiempoEvol', 'ControlGlu'][idx]
                mf_name = MFS[idx][v-1]
                
                # Acceso seguro sin usar eval()
                antecedent = FUZZY_VARS[var_name][mf_name]
                antecedentes.append(antecedent)
            
            if not antecedentes:
                continue
                
            rule_antecedent = reduce(operator.and_, antecedentes) if len(antecedentes) > 1 else antecedentes[0]
            regla = ctrl.Rule(rule_antecedent, FUZZY_VARS['Riesgo'][SALIDAS[salida-1]])
            all_rules.append(regla)
        
        FUZZY_SYSTEM = ctrl.ControlSystem(all_rules)
    
    return FUZZY_SYSTEM

# ========== ANÁLISIS DE IMAGEN MEJORADO ==========
def select_roi_safe(img, img_name):
    """Selección segura de ROI con manejo de cancelación"""
    win_name = f"Selecciona ROI: {img_name}"
    cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(win_name, 800, 600)
    
    r = cv2.selectROI(win_name, img)
    cv2.destroyWindow(win_name)
    
    if r == (0, 0, 0, 0):
        return None
    return r

def analizar_imagen(imagen_path):
    """Analiza imagen con manejo robusto de errores"""
    img = cv2.imread(imagen_path)
    if img is None:
        raise FileNotFoundError(f'Imagen no encontrada: {imagen_path}')
    
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_name = os.path.basename(imagen_path)
    
    r = select_roi_safe(img, img_name)
    if r is None:
        raise ValueError("Selección de ROI cancelada por el usuario")
    
    x, y, w, h = map(int, r)
    roi = img_rgb[y:y+h, x:x+w]
    
    if roi.size == 0:
        raise ValueError("ROI seleccionada no contiene datos")
    
    mean_rgb = np.mean(roi, axis=(0, 1))
    std_rgb = np.std(roi, axis=(0, 1))
    area_lesion = (w * h) / 10000  # Convertir a cm²
    
    return img_rgb, roi, mean_rgb, std_rgb, area_lesion

def evaluar_riesgo(sensibilidad, area, desv_estr, secrecion, eritema, tiempo_evol, control_glu):
    """Evalúa el riesgo usando el sistema difuso"""
    sim = ctrl.ControlSystemSimulation(get_fuzzy_system())
    
    inputs = {
        'Sensibilidad': max(0, min(6, sensibilidad)),
        'Area': max(0, min(4, area)),
        'DesvEstR': max(0, min(4, desv_estr)),
        'Secrecion': 1 if secrecion >= 0.5 else 0,
        'Eritema': 1 if eritema >= 0.5 else 0,
        'TiempoEvol': max(0, min(35, tiempo_evol)),
        'ControlGlu': max(5, min(12, control_glu))
    }
    
    # Registrar entrada para diagnóstico
    print(f"Evaluando riesgo con entradas: {inputs}")
    
    for key, value in inputs.items():
        sim.input[key] = value
    
    try:
        sim.compute()
        riesgo = sim.output['Riesgo']
        return max(1.0, min(3.0, riesgo))  # Asegurar rango 1-3
    except Exception as e:
        registrar_error(e)
        return 2.0  # Valor predeterminado en caso de error

# ========== MANEJO DE DATOS Y PDF ==========
def get_dataframe():
    """Obtiene el DataFrame de resultados, crea el archivo si no existe"""
    cols = [
        'ID', 'FechaHora', 'Paciente', 'AreaLesion', 'DesvEstR', 'MediaR', 'MediaG', 'MediaB',
        'Secrecion', 'Eritema', 'Sensibilidad', 'TiempoEvol', 'ControlGlu', 'Riesgo', 'Semaforo',
        'Imagen', 'Comparacion', 'EvolArea', 'EvolDesv'
    ]
    
    if os.path.exists("resultados_pacientes.csv"):
        df = pd.read_csv("resultados_pacientes.csv")
        
        # Asegurar que todas las columnas existan
        for col in cols:
            if col not in df.columns:
                df[col] = None
    else:
        df = pd.DataFrame(columns=cols)
    
    return df

def save_image_to_patient_folder(img_path, paciente):
    """Guarda la imagen en la carpeta del paciente y devuelve nueva ruta"""
    # Crear carpeta de paciente si no existe
    paciente_dir = os.path.join("pacientes", re.sub(r'[\\/*?:"<>|]', "", paciente))
    os.makedirs(paciente_dir, exist_ok=True)
    
    # Generar nombre único basado en fecha
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    img_name = f"{timestamp}_{os.path.basename(img_path)}"
    new_path = os.path.join(paciente_dir, img_name)
    
    # Copiar la imagen a la nueva ubicación
    shutil.copy(img_path, new_path)
    
    return new_path

def save_to_csv(df):
    """Guarda el DataFrame en CSV con manejo de errores"""
    try:
        df.to_csv("resultados_pacientes.csv", index=False)
        return True
    except Exception as e:
        registrar_error(e)
        messagebox.showerror("Error de guardado", 
                            f"No se pudo guardar los datos:\n{str(e)}")
        return False

def graficar_evolucion(df_paciente, nombre_paciente):
    """Crea gráfico de evolución en directorio temporal"""
    plt.figure(figsize=(10, 6))
    
    # Crear copia para evitar SettingWithCopyWarning
    df_plot = df_paciente.copy()
    
    # Convertir fechas y ordenar
    df_plot['Fecha'] = pd.to_datetime(df_plot['FechaHora'])
    df_plot = df_plot.sort_values('Fecha')
    
    # Gráfico principal
    plt.plot(df_plot['Fecha'], df_plot['AreaLesion'], 
             'o-', color='#3498db', linewidth=2, markersize=8, label='Área lesión (cm²)')
    
    # Segundo eje para Desviación Estándar
    ax2 = plt.gca().twinx()
    ax2.plot(df_plot['Fecha'], df_plot['DesvEstR'], 
             's--', color='#e74c3c', linewidth=2, markersize=8, label='Desv. estándar R')
    
    # Configuración de ejes
    plt.gca().set_ylabel('Área lesión (cm²)', color='#3498db', fontsize=12)
    ax2.set_ylabel('Desv. estándar R', color='#e74c3c', fontsize=12)
    
    # Títulos y leyendas
    plt.title(f"Evolución de lesión: {nombre_paciente}", fontsize=14, pad=20)
    plt.grid(True, linestyle='--', alpha=0.7)
    
    # Combinar leyendas
    lines, labels = plt.gca().get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    plt.legend(lines + lines2, labels + labels2, loc='best')
    
    plt.tight_layout()
    
    # Guardar en archivo temporal
    temp_dir = tempfile.gettempdir()
    img_name = f"{nombre_paciente}_evolucion_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
    img_path = os.path.join(temp_dir, img_name)
    plt.savefig(img_path, dpi=150)
    plt.close()
    
    return img_path

def get_downloads_folder():
    """Obtiene el directorio de descargas de forma multiplataforma"""
    if os.name == 'nt':
        try:
            sub_key = r'SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders'
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, sub_key) as key:
                downloads_dir = winreg.QueryValueEx(key, '{374DE290-123F-4565-9164-39C4925E467B}')[0]
            return downloads_dir
        except Exception:
            return os.path.join(os.path.expanduser("~"), "Downloads")
    else:
        return os.path.join(os.path.expanduser("~"), "Downloads")

def exportar_pdf(nombre_paciente, df_paciente, img_graph):
    """Genera PDF profesional con historial completo de imágenes"""
    try:
        # Preparar nombre de archivo seguro
        safe_name = re.sub(r'[\\/*?:"<>|]', "", nombre_paciente)[:50]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pdfname = f"{safe_name}_{timestamp}_reporte.pdf"
        downloads = get_downloads_folder()
        pdf_path = os.path.join(downloads, pdfname)
        
        # Crear PDF
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        
        # === Página 1: Resumen y datos ===
        pdf.add_page()
        
        # Encabezado
        pdf.set_font("Arial", "B", 16)
        pdf.cell(0, 10, f"Reporte de Evolución - {nombre_paciente}", 0, 1, 'C')
        pdf.ln(5)
        
        # Resumen de riesgo actual
        last_record = df_paciente.iloc[-1]
        riesgo_val = last_record.get('Riesgo', 0)
        semaforo = last_record.get('Semaforo', '')
        
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 8, "Resumen de Riesgo Actual:", 0, 1)
        pdf.set_font("Arial", "", 12)
        
        if riesgo_val < 1.6:
            color = (50, 200, 50)  # Verde
        elif riesgo_val < 2.1:
            color = (200, 200, 50)  # Amarillo
        else:
            color = (200, 50, 50)  # Rojo
            
        pdf.set_text_color(*color)
        pdf.cell(0, 8, f"Riesgo: {riesgo_val:.2f} - {semaforo}", 0, 1)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(5)
        
        # Datos de la última consulta
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 8, "Última Evaluación:", 0, 1)
        
        # Tabla de datos
        col_widths = [60, 40]
        data = [
            ("Fecha", last_record['FechaHora']),
            ("Área de lesión", f"{last_record.get('AreaLesion', 0):.2f} cm²"),
            ("Desviación estándar R", f"{last_record.get('DesvEstR', 0):.2f}"),
            ("Sensibilidad", f"{last_record.get('Sensibilidad', 0)}"),
            ("Tiempo de evolución", f"{last_record.get('TiempoEvol', 0)} días"),
            ("Control glucémico", f"{last_record.get('ControlGlu', 0)}")
        ]
        
        for label, value in data:
            pdf.set_font("Arial", "B", 12)
            pdf.cell(col_widths[0], 8, label, 0, 0)
            pdf.set_font("Arial", "", 12)
            pdf.cell(0, 8, value, 0, 1)
            pdf.ln(3)
        
        pdf.ln(5)
        
        # Historial resumido
        pdf.set_font("Arial", "B", 14)
        pdf.cell(0, 8, "Resumen Histórico:", 0, 1)
        
        # Encabezados de tabla
        col_widths = [40, 25, 25, 20]
        headers = ["Fecha", "Área (cm²)", "Desv. R", "Riesgo"]
        for i, header in enumerate(headers):
            pdf.cell(col_widths[i], 8, header, 1, 0, 'C')
        pdf.ln()
        
        # Datos de tabla
        pdf.set_font("Arial", "", 9)
        for _, row in df_paciente.iterrows():
            pdf.cell(col_widths[0], 8, str(row['FechaHora'])[:16], 1)
            pdf.cell(col_widths[1], 8, f"{row.get('AreaLesion', 0):.2f}", 1, 0, 'C')
            pdf.cell(col_widths[2], 8, f"{row.get('DesvEstR', 0):.2f}", 1, 0, 'C')
            
            # Color según riesgo
            riesgo = row.get('Riesgo', 0)
            if riesgo < 1.6:
                pdf.set_text_color(50, 200, 50)
            elif riesgo < 2.1:
                pdf.set_text_color(200, 200, 50)
            else:
                pdf.set_text_color(200, 50, 50)
                
            pdf.cell(col_widths[3], 8, f"{riesgo:.2f}", 1, 0, 'C')
            pdf.set_text_color(0, 0, 0)
            pdf.ln()
        
        pdf.ln(10)
        
        # Gráfica de evolución
        if img_graph and os.path.isfile(img_graph):
            pdf.set_font("Arial", "B", 14)
            pdf.cell(0, 8, "Evolución de la Lesión:", 0, 1)
            pdf.image(img_graph, w=180)
            pdf.ln(5)
        
        # === Página 2: Imágenes históricas ===
        pdf.add_page()
        pdf.set_font("Arial", "B", 16)
        pdf.cell(0, 10, "Historial de Imágenes", 0, 1, 'C')
        pdf.ln(5)
        
        # Obtener todas las imágenes del paciente
        image_records = df_paciente[df_paciente['Comparacion'] == 'actual']
        
        for idx, record in image_records.iterrows():
            img_path = record['Imagen']
            if not os.path.isfile(img_path):
                continue
                
            try:
                # Encabezado de imagen
                pdf.set_font("Arial", "B", 12)
                pdf.cell(0, 8, f"Fecha: {record['FechaHora']}", 0, 1)
                pdf.set_font("Arial", "", 10)
                
                # Información de la imagen
                pdf.cell(0, 6, f"Área: {record.get('AreaLesion', 0):.2f} cm²", 0, 1)
                pdf.cell(0, 6, f"Desv. R: {record.get('DesvEstR', 0):.2f}", 0, 1)
                
                # Agregar la imagen
                img = Image.open(img_path)
                img.thumbnail((150, 150))  # Redimensionar para PDF
                
                # Guardar temporalmente
                temp_img = os.path.join(tempfile.gettempdir(), f"temp_{idx}.png")
                img.save(temp_img)
                
                pdf.image(temp_img, w=90)
                pdf.ln(10)
                
                # Línea separadora
                pdf.set_draw_color(200, 200, 200)
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.ln(5)
                
            except Exception as e:
                registrar_error(e)
        
        pdf.output(pdf_path)
        return pdf_path
        
    except Exception as e:
        registrar_error(e)
        return None

# ======================== INTERFAZ MEJORADA =========================
class AppPieDiabetico(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Healthy Foot - Sistema de Evaluación de Pie Diabético")
        self.geometry("1000x750")
        self.configure(bg="#f5f7ff")
        self.protocol("WM_DELETE_WINDOW", self.on_close)
        
        # Configuración de estilo
        self.style = ttk.Style()
        self.style.theme_use("clam")
        
        # Configurar colores
        self.style.configure("TFrame", background="#f5f7ff")
        self.style.configure("TLabel", background="#f5f7ff", foreground="#2c3e50")
        self.style.configure("TButton", font=("Arial", 10), padding=5)
        self.style.configure("Title.TLabel", font=("Arial", 18, "bold"), foreground="#3498db")
        self.style.configure("Subtitle.TLabel", font=("Arial", 12), foreground="#7f8c8d")
        self.style.configure("Result.TLabel", font=("Arial", 12, "bold"), foreground="#e74c3c")
        self.style.configure("Evol.TLabel", font=("Arial", 10), foreground="#2c3e50", background="#e8f4fc")
        
        # Crear widgets
        self.create_widgets()
        
        # Variables de estado
        self.img_paths = []
        self.current_images = []
        self.last_record = None
        
    def create_widgets(self):
        """Crea la interfaz de usuario"""
        main_frame = ttk.Frame(self)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Cabecera
        header_frame = ttk.Frame(main_frame)
        header_frame.pack(fill=tk.X, pady=(0, 15))
        
        ttk.Label(header_frame, text="Healthy Foot", style="Title.TLabel").pack(side=tk.LEFT)
        ttk.Label(header_frame, text="Sistema de Evaluación de Riesgo en Pie Diabético", 
                 style="Subtitle.TLabel").pack(side=tk.LEFT, padx=10)
        
        # Contenedor principal
        content_frame = ttk.Frame(main_frame)
        content_frame.pack(fill=tk.BOTH, expand=True)
        
        # Panel izquierdo - Entrada de datos
        left_frame = ttk.LabelFrame(content_frame, text="Datos del Paciente")
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        # Nombre del paciente
        ttk.Label(left_frame, text="Nombre del Paciente:").grid(row=0, column=0, sticky=tk.W, padx=10, pady=5)
        self.nombre_var = tk.StringVar()
        self.nombre_var.trace_add("write", self.on_nombre_change)
        nombre_entry = ttk.Entry(left_frame, textvariable=self.nombre_var, width=30)
        nombre_entry.grid(row=0, column=1, padx=10, pady=5, sticky=tk.W)
        
        # Campos de entrada
        self.vars = {}
        campos = [
            ("Sensibilidad (0-6)", 0, 6),
            ("¿Secreción? (0=No, 1=Sí)", 0, 1),
            ("¿Eritema? (0=No, 1=Sí)", 0, 1),
            ("Tiempo de evolución (días, 0-35)", 0, 35),
            ("Control Glucémico (5-12)", 5, 12)
        ]
        
        for i, (label, mini, maxi) in enumerate(campos, start=1):
            ttk.Label(left_frame, text=label).grid(row=i, column=0, sticky=tk.W, padx=10, pady=5)
            self.vars[label] = tk.DoubleVar(value=mini)
            entry = ttk.Entry(left_frame, textvariable=self.vars[label], width=10)
            entry.grid(row=i, column=1, padx=10, pady=5, sticky=tk.W)
        
        # Resultados del análisis de imagen
        ttk.Label(left_frame, text="Resultados del Análisis:").grid(row=6, column=0, sticky=tk.W, padx=10, pady=5)
        
        ttk.Label(left_frame, text="Área de la lesión (cm²):").grid(row=7, column=0, sticky=tk.W, padx=10, pady=2)
        self.area_var = tk.DoubleVar(value=0.0)
        ttk.Label(left_frame, textvariable=self.area_var, style="Result.TLabel").grid(row=7, column=1, sticky=tk.W, padx=10, pady=2)
        
        ttk.Label(left_frame, text="Desviación Estándar (R):").grid(row=8, column=0, sticky=tk.W, padx=10, pady=2)
        self.desv_var = tk.DoubleVar(value=0.0)
        ttk.Label(left_frame, textvariable=self.desv_var, style="Result.TLabel").grid(row=8, column=1, sticky=tk.W, padx=10, pady=2)
        
        # Evolución comparativa
        self.evol_frame = ttk.LabelFrame(left_frame, text="Evolución")
        self.evol_frame.grid(row=9, column=0, columnspan=2, sticky=tk.W+tk.E, padx=10, pady=10)
        
        self.area_evol_var = tk.StringVar(value="Área: --")
        ttk.Label(self.evol_frame, textvariable=self.area_evol_var, style="Evol.TLabel").pack(fill=tk.X, padx=5, pady=2)
        
        self.desv_evol_var = tk.StringVar(value="Desv. R: --")
        ttk.Label(self.evol_frame, textvariable=self.desv_evol_var, style="Evol.TLabel").pack(fill=tk.X, padx=5, pady=2)
        
        # Resultado del riesgo
        self.result_var = tk.StringVar(value="Complete los datos y analice")
        ttk.Label(left_frame, textvariable=self.result_var, style="Result.TLabel", 
                 wraplength=300).grid(row=10, column=0, columnspan=2, pady=10, padx=10)
        
        # Panel derecho - Imágenes y acciones
        right_frame = ttk.Frame(content_frame)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH)
        
        # Panel de imágenes
        img_frame = ttk.LabelFrame(right_frame, text="Imágenes de Lesiones")
        img_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        self.img_canvas = tk.Canvas(img_frame, bg="white", height=250)
        self.img_canvas.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.img_label = ttk.Label(img_frame, text="No hay imágenes cargadas")
        self.img_label.pack(fill=tk.X, padx=5, pady=5)
        
        # Botones de acción
        btn_frame = ttk.Frame(right_frame)
        btn_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(btn_frame, text="Cargar Imagen", command=self.cargar_imagenes,
                  style="TButton").pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        ttk.Button(btn_frame, text="Analizar y Guardar", command=self.procesar,
                  style="TButton").pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        ttk.Button(btn_frame, text="Generar PDF", command=self.generar_pdf,
                  state="disabled", style="TButton").pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        self.pdf_btn = btn_frame.winfo_children()[-1]
        
        ttk.Button(btn_frame, text="Nuevo Paciente", command=self.limpiar,
                  style="TButton").pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
    
    def on_nombre_change(self, *args):
        """Busca datos históricos cuando cambia el nombre del paciente"""
        nombre = self.nombre_var.get().strip()
        if not nombre:
            self.last_record = None
            self.update_evolution_display()
            return
            
        # Buscar en el historial
        if os.path.exists("resultados_pacientes.csv"):
            df = pd.read_csv("resultados_pacientes.csv")
            paciente_df = df[df['Paciente'] == nombre]
            
            if not paciente_df.empty:
                # Obtener el último registro como DataFrame
                self.last_record = paciente_df.sort_values('FechaHora', ascending=False).head(1)
                self.update_evolution_display()
                return
                
        self.last_record = None
        self.update_evolution_display()
    
    def update_evolution_display(self):
        """Actualiza la sección de evolución con datos comparativos"""
        if self.last_record is None or self.last_record.empty:
            self.area_evol_var.set("Área: --")
            self.desv_evol_var.set("Desv. R: --")
            return
            
        self.area_evol_var.set(f"Última área: {self.last_record['AreaLesion'].values[0]:.2f} cm²")
        self.desv_evol_var.set(f"Última desv. R: {self.last_record['DesvEstR'].values[0]:.2f}")
    
    def cargar_imagenes(self):
        """Carga imágenes con interfaz mejorada, permitiendo tomar foto o cargar archivo"""
        nombre = self.nombre_var.get().strip()
        if not nombre:
            messagebox.showerror("Error", "Ingrese el nombre del paciente primero")
            return

        # Diálogo para elegir entre tomar foto o cargar archivo
        opcion = messagebox.askquestion("Origen de la imagen", 
                                       "¿Desea tomar una foto con la cámara?",
                                       icon='question', 
                                       detail="Seleccione 'Sí' para tomar foto o 'No' para cargar un archivo.")
        
        if opcion == 'yes':
            self.tomar_foto()
        else:
            # Selección de archivos
            file = filedialog.askopenfilename(
                title="Seleccione una imagen de la lesión",
                filetypes=[("Imágenes", "*.jpg *.jpeg *.png *.bmp *.tif *.tiff")]
            )
            if file:
                self.img_paths = [file]
                self.update_image_display()
    
    def tomar_foto(self):
        """Captura una imagen desde la cámara web con mejor manejo de eventos"""
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            messagebox.showerror("Error", "No se pudo acceder a la cámara.")
            return

        # Crear ventana para preview
        win_name = "Tomar Foto - Presione 'S' para guardar, 'Q' para salir"
        cv2.namedWindow(win_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(win_name, 800, 600)
        
        saved = False
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    messagebox.showerror("Error", "No se pudo capturar imagen.")
                    break
                
                # Mostrar el frame con instrucciones
                display_frame = frame.copy()
                cv2.putText(display_frame, "Presione 'S' para guardar, 'Q' para salir", 
                            (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.imshow(win_name, display_frame)
                
                # Manejo de teclas con espera más larga
                key = cv2.waitKey(100) & 0xFF
                
                # Tecla 'S' para guardar
                if key == ord('s') or key == ord('S'):
                    # Crear un archivo temporal
                    temp_dir = tempfile.gettempdir()
                    img_name = f"captura_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
                    img_path = os.path.join(temp_dir, img_name)
                    cv2.imwrite(img_path, frame)
                    self.img_paths = [img_path]
                    saved = True
                    break
                
                # Tecla 'Q' para salir
                elif key == ord('q') or key == ord('Q') or key == 27:  # 27 = ESC
                    break
                
                # Verificar si la ventana fue cerrada manualmente
                if cv2.getWindowProperty(win_name, cv2.WND_PROP_VISIBLE) < 1:
                    break
                    
        except Exception as e:
            registrar_error(e)
            messagebox.showerror("Error", f"Error al capturar imagen: {str(e)}")
        finally:
            # Liberar recursos siempre
            cap.release()
            cv2.destroyAllWindows()
        
        if saved:
            self.update_image_display()
            messagebox.showinfo("Foto guardada", "La foto se ha capturado correctamente")

    def update_image_display(self):
        """Actualiza la visualización de imágenes en el canvas"""
        # Limpiar canvas
        self.img_canvas.delete("all")
        self.current_images = []
        
        if not self.img_paths:
            self.img_label.config(text="No hay imágenes cargadas")
            return
        
        # Mostrar miniaturas
        self.img_label.config(text=f"{len(self.img_paths)} imagen(es) cargada(s)")
        
        # Configurar grid para imágenes
        cols = 2  # Imagen actual + última histórica
        width = self.img_canvas.winfo_width() // max(1, cols) - 20
        
        # Mostrar imagen actual
        img_path = self.img_paths[0]
        try:
            img = Image.open(img_path)
            img.thumbnail((width, 200))
            
            # Crear marco para imagen
            frame = ttk.Frame(self.img_canvas)
            self.img_canvas.create_window(
                10, 10, 
                anchor=tk.NW, 
                window=frame, 
                width=width, 
                height=220
            )
            
            # Mostrar miniatura
            photo = ImageTk.PhotoImage(img)
            label = ttk.Label(frame, image=photo)
            label.image = photo
            label.pack(padx=5, pady=5)
            
            # Mostrar etiqueta
            ttk.Label(frame, text="IMAGEN ACTUAL", font=("Arial", 9, "bold")).pack(padx=5)
            
            self.current_images.append(photo)
        except Exception as e:
            registrar_error(e)
        
        # Mostrar última imagen histórica si existe
        if (self.last_record is not None and 
            not self.last_record.empty and 
            'Imagen' in self.last_record.columns and 
            os.path.isfile(self.last_record['Imagen'].iloc[0])):
            
            try:
                img_hist = Image.open(self.last_record['Imagen'].iloc[0])
                img_hist.thumbnail((width, 200))
                
                # Crear marco para imagen histórica
                frame_hist = ttk.Frame(self.img_canvas)
                self.img_canvas.create_window(
                    width + 20, 10, 
                    anchor=tk.NW, 
                    window=frame_hist, 
                    width=width, 
                    height=220
                )
                
                # Mostrar miniatura
                photo_hist = ImageTk.PhotoImage(img_hist)
                label_hist = ttk.Label(frame_hist, image=photo_hist)
                label_hist.image = photo_hist
                label_hist.pack(padx=5, pady=5)
                
                # Mostrar etiqueta
                fecha = self.last_record['FechaHora'].iloc[0].split()[0]
                ttk.Label(frame_hist, text=f"ÚLTIMA IMAGEN ({fecha})", font=("Arial", 9)).pack(padx=5)
                
                self.current_images.append(photo_hist)
            except Exception as e:
                registrar_error(e)
    
    def procesar(self):
        """Procesa los datos con manejo robusto de errores"""
        try:
            nombre = self.nombre_var.get().strip()
            if not nombre:
                messagebox.showerror("Error", "Ingrese el nombre del paciente")
                return
                
            if not self.img_paths:
                messagebox.showerror("Error", "Seleccione al menos una imagen")
                return
                
            # Obtener dataframe
            df = get_dataframe()
            next_id = df['ID'].max() + 1 if not df.empty else 1
            
            # Procesar imágenes
            resultados_img = []
            for img_path in self.img_paths:
                try:
                    _, _, mean_rgb, std_rgb, area_lesion = analizar_imagen(img_path)
                    
                    # Guardar imagen en carpeta del paciente
                    saved_path = save_image_to_patient_folder(img_path, nombre)
                    resultados_img.append((saved_path, mean_rgb, std_rgb, area_lesion))
                except Exception as e:
                    registrar_error(e)
                    messagebox.showerror("Error de imagen", 
                                       f"Error procesando {os.path.basename(img_path)}:\n{str(e)}")
                    return
            
            # Actualizar UI con resultados
            self.area_var.set(f"{resultados_img[-1][3]:.2f}")
            self.desv_var.set(f"{resultados_img[-1][2][0]:.2f}")
            
            # Obtener valores de entrada
            sensibilidad = self.vars["Sensibilidad (0-6)"].get()
            secrecion = self.vars["¿Secreción? (0=No, 1=Sí)"].get()
            eritema = self.vars["¿Eritema? (0=No, 1=Sí)"].get()
            tiempo_evol = self.vars["Tiempo de evolución (días, 0-35)"].get()
            control_glu = self.vars["Control Glucémico (5-12)"].get()
            
            # Evaluar riesgo
            riesgo = evaluar_riesgo(
                sensibilidad,
                resultados_img[-1][3],
                resultados_img[-1][2][0],
                secrecion,
                eritema,
                tiempo_evol,
                control_glu
            )
            
            # Interpretar riesgo
            if riesgo < 1.6:
                color = "BAJO (verde)"
            elif riesgo < 2.1:
                color = "MODERADO (amarillo)"
            else:
                color = "ALTO (rojo)"
                
            # Actualizar UI
            self.result_var.set(
                f"Paciente: {nombre}\n"
                f"Riesgo Calculado: {riesgo:.2f}\n"
                f"Nivel de Riesgo: {color}"
            )
            self.pdf_btn.config(state="normal")
            
            # Calcular evolución si hay registro previo
            evol_area = ""
            evol_desv = ""
            
            if self.last_record is not None and not self.last_record.empty:
                area_ant = self.last_record['AreaLesion'].iloc[0]
                desv_ant = self.last_record['DesvEstR'].iloc[0]
                
                dif_area = resultados_img[-1][3] - area_ant
                dif_desv = resultados_img[-1][2][0] - desv_ant
                
                evol_area = f" ({dif_area:+.2f})" if area_ant > 0 else ""
                evol_desv = f" ({dif_desv:+.2f})" if desv_ant > 0 else ""
            
            # Preparar registros para guardar
            registros = []
            
            # Registro actual
            registro_actual = {
                'ID': next_id,
                'FechaHora': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'Paciente': nombre,
                'AreaLesion': resultados_img[-1][3],
                'DesvEstR': resultados_img[-1][2][0],
                'MediaR': resultados_img[-1][1][0],
                'MediaG': resultados_img[-1][1][1],
                'MediaB': resultados_img[-1][1][2],
                'Secrecion': secrecion,
                'Eritema': eritema,
                'Sensibilidad': sensibilidad,
                'TiempoEvol': tiempo_evol,
                'ControlGlu': control_glu,
                'Riesgo': riesgo,
                'Semaforo': color,
                'Imagen': resultados_img[-1][0],
                'Comparacion': 'actual',
                'EvolArea': evol_area,
                'EvolDesv': evol_desv
            }
            registros.append(registro_actual)
            
            # Guardar en CSV
            df_nuevo = pd.DataFrame(registros)
            df = pd.concat([df, df_nuevo], ignore_index=True)
            
            if save_to_csv(df):
                messagebox.showinfo("Éxito", "Datos guardados correctamente")
                # Actualizar último registro
                self.last_record = pd.DataFrame([registro_actual])
                self.update_evolution_display()
                self.update_image_display()
            
        except Exception as e:
            registrar_error(e)
            messagebox.showerror("Error", f"Error en procesamiento:\n{str(e)}")
    
    def generar_pdf(self):
        """Genera reporte PDF con gráficos de evolución"""
        try:
            nombre = self.nombre_var.get().strip()
            if not nombre:
                messagebox.showerror("Error", "No se ha especificado paciente")
                return
                
            df = get_dataframe()
            if df.empty:
                messagebox.showerror("Error", "No hay datos disponibles")
                return
                
            # Filtrar datos del paciente
            df_paciente = df[df['Paciente'] == nombre]
            if df_paciente.empty:
                messagebox.showerror("Error", f"No se encontraron datos para {nombre}")
                return
                
            # Generar gráfico de evolución
            img_graph = None
            if len(df_paciente) > 1:
                try:
                    img_graph = graficar_evolucion(df_paciente, nombre)
                except Exception as e:
                    registrar_error(e)
                    img_graph = None
            
            # Generar PDF
            pdf_path = exportar_pdf(nombre, df_paciente, img_graph)
            
            if pdf_path:
                messagebox.showinfo("PDF Generado", 
                                  f"Reporte guardado en:\n{pdf_path}\n\n"
                                  "Puede encontrarlo en su carpeta de Descargas")
            else:
                messagebox.showerror("Error", "No se pudo generar el PDF")
                
        except Exception as e:
            registrar_error(e)
            messagebox.showerror("Error", f"Error generando PDF:\n{str(e)}")
    
    def limpiar(self):
        """Reinicia la interfaz para nuevo paciente"""
        self.nombre_var.set("")
        self.img_paths = []
        self.current_images = []
        self.last_record = None
        
        for var in self.vars.values():
            var.set(0)
            
        self.area_var.set(0.0)
        self.desv_var.set(0.0)
        self.result_var.set("Complete los datos y analice")
        self.area_evol_var.set("Área: --")
        self.desv_evol_var.set("Desv. R: --")
        self.pdf_btn.config(state="disabled")
        self.update_image_display()
    
    def on_close(self):
        """Maneja el cierre de la aplicación"""
        if messagebox.askokcancel("Salir", "¿Está seguro que desea salir?"):
            self.destroy()

if __name__ == "__main__":
    try:
        # Crear carpeta de pacientes si no existe
        os.makedirs("pacientes", exist_ok=True)
        
        # Inicializar sistema difuso en segundo plano
        get_fuzzy_system()
        
        app = AppPieDiabetico()
        app.mainloop()
    except Exception as e:
        registrar_error(e)
        messagebox.showerror("Error Inesperado", 
                           f"Se produjo un error crítico:\n{str(e)}\n\n"
                           "Consulte el archivo error.log para detalles")