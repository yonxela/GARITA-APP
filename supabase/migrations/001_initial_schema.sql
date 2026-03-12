-- ============================================
-- GARITA.APP - Schema Inicial
-- Base de datos para gestión de acceso
-- a condominios/residenciales
-- ============================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: condominios
-- ============================================
CREATE TABLE condominios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  direccion TEXT NOT NULL,
  observaciones TEXT,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  
  -- Configuración de métodos de acceso
  config_lpr BOOLEAN DEFAULT false,
  config_qr BOOLEAN DEFAULT true,
  config_tag BOOLEAN DEFAULT false,
  config_manual BOOLEAN DEFAULT true,
  
  -- Recordatorio de pago
  recordatorio_pago BOOLEAN DEFAULT false,
  dias_recordatorio INTEGER,
  mensaje_recordatorio TEXT,
  fecha_vencimiento TIMESTAMPTZ
);

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  codigo VARCHAR(6) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  telefono VARCHAR(20) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('master', 'administrador', 'coadministrador', 'vecino', 'policia')),
  condominio_id UUID REFERENCES condominios(id) ON DELETE CASCADE,
  lote_casa VARCHAR(50),
  moroso BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usuarios_codigo ON usuarios(codigo);
CREATE INDEX idx_usuarios_condominio ON usuarios(condominio_id);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- ============================================
-- TABLA: vehiculos
-- ============================================
CREATE TABLE vehiculos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  placa VARCHAR(20) NOT NULL,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  color VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehiculos_placa ON vehiculos(placa);
CREATE INDEX idx_vehiculos_usuario ON vehiculos(usuario_id);

-- ============================================
-- TABLA: visitas
-- ============================================
CREATE TABLE visitas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vecino_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  nombre_visita VARCHAR(200) NOT NULL,
  motivo TEXT NOT NULL,
  placa VARCHAR(20),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  visita_larga BOOLEAN DEFAULT false,
  fecha_fin TIMESTAMPTZ,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'ingresada', 'finalizada', 'expirada')),
  fecha_ingreso TIMESTAMPTZ
);

CREATE INDEX idx_visitas_condominio ON visitas(condominio_id);
CREATE INDEX idx_visitas_vecino ON visitas(vecino_id);
CREATE INDEX idx_visitas_estado ON visitas(estado);
CREATE INDEX idx_visitas_fecha ON visitas(fecha_creacion);

-- ============================================
-- TABLA: registros_acceso
-- ============================================
CREATE TABLE registros_acceso (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  tipo_acceso VARCHAR(10) NOT NULL CHECK (tipo_acceso IN ('lpr', 'qr', 'tag', 'manual')),
  tipo_resultado VARCHAR(20) NOT NULL CHECK (tipo_resultado IN ('verificado', 'moroso', 'no_registrado', 'visita')),
  vehiculo_id UUID REFERENCES vehiculos(id),
  visita_id UUID REFERENCES visitas(id),
  usuario_id UUID REFERENCES usuarios(id),
  placa VARCHAR(20),
  fecha_hora TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_registros_condominio ON registros_acceso(condominio_id);
CREATE INDEX idx_registros_fecha ON registros_acceso(fecha_hora);

-- ============================================
-- TABLA: mensajes
-- ============================================
CREATE TABLE mensajes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  remitente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  contenido TEXT NOT NULL,
  filtro_condominio UUID REFERENCES condominios(id),
  filtro_rol VARCHAR(20) CHECK (filtro_rol IN ('master', 'administrador', 'coadministrador', 'vecino', 'policia')),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: mensajes_leidos
-- ============================================
CREATE TABLE mensajes_leidos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mensaje_id UUID NOT NULL REFERENCES mensajes(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_lectura TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mensaje_id, usuario_id)
);

-- ============================================
-- RLS (Row Level Security) Policies
-- Cada condominio solo ve sus propios datos
-- ============================================
ALTER TABLE condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_acceso ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_leidos ENABLE ROW LEVEL SECURITY;

-- Política permisiva para acceso anónimo (la app maneja la autenticación por código)
CREATE POLICY "allow_all_condominios" ON condominios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_vehiculos" ON vehiculos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_visitas" ON visitas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_registros" ON registros_acceso FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_mensajes" ON mensajes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_mensajes_leidos" ON mensajes_leidos FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- FUNCIÓN: Expirar visitas automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION expirar_visitas()
RETURNS void AS $$
BEGIN
  UPDATE visitas
  SET estado = 'expirada'
  WHERE estado = 'pendiente'
    AND visita_larga = false
    AND fecha_creacion < NOW() - INTERVAL '1 day';
    
  UPDATE visitas
  SET estado = 'expirada'
  WHERE estado = 'pendiente'
    AND visita_larga = true
    AND fecha_fin < NOW();
END;
$$ LANGUAGE plpgsql;
