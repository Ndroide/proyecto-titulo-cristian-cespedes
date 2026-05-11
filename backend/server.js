const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      ok: false,
      message: 'Token no proporcionado'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      ok: false,
      message: 'Formato de token inválido'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Token inválido o expirado'
    });
  }
};

const verificarAdmin = (req, res, next) => {
  const esAdmin =
    req.usuario?.rol === "Administrador" ||
    req.usuario?.rol_id === 1;

  if (!esAdmin) {
    return res.status(403).json({
      ok: false,
      message: "No tienes permisos para realizar esta acción"
    });
  }

  next();
};

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'API funcionando correctamente'
  });
});


app.get('/api/db-health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DATABASE() AS base_datos, NOW() AS fecha_servidor');
    res.json({
      ok: true,
      message: 'Conexión a MySQL funcionando correctamente',
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al conectar con MySQL',
      error: error.message
    });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        ok: false,
        message: 'Correo y contraseña son obligatorios'
      });
    }

    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.rol_id,
        r.nombre AS rol,
        u.nombre_completo,
        u.correo,
        u.hash_contrasena,
        u.activo
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.correo = ?
      LIMIT 1
    `, [correo]);

    if (rows.length === 0) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales inválidas'
      });
    }

    const usuario = rows[0];

    if (!usuario.activo) {
      return res.status(403).json({
        ok: false,
        message: 'Usuario inactivo'
      });
    }

    const passwordValida = await bcrypt.compare(
      contrasena,
      usuario.hash_contrasena
    );

    if (!passwordValida) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol,
        rol_id: usuario.rol_id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '2h'
      }
    );

    res.json({
      ok: true,
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        rol_id: usuario.rol_id,
        rol: usuario.rol,
        nombre_completo: usuario.nombre_completo,
        correo: usuario.correo
      }
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
});
/*
app.post('/api/crear-admin-temporal', async (req, res) => {
  try {
    const {
      nombre_completo,
      correo,
      contrasena
    } = req.body;

    if (!nombre_completo || !correo || !contrasena) {
      return res.status(400).json({
        ok: false,
        message: 'Faltan campos obligatorios'
      });
    }

    const hash = await bcrypt.hash(contrasena, 10);

    const [result] = await pool.query(`
      INSERT INTO usuarios
      (rol_id, nombre_completo, correo, hash_contrasena, activo)
      VALUES (?, ?, ?, ?, ?)
    `, [
      1,
      nombre_completo,
      correo,
      hash,
      1
    ]);

    res.status(201).json({
      ok: true,
      message: 'Administrador creado correctamente',
      id: result.insertId
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al crear administrador',
      error: error.message
    });
  }
});
*/
// ROLES / SEGMENTOS DE RIESGO
app.get('/api/roles', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        nombre,
        descripcion,
        fecha_creacion
      FROM roles
      ORDER BY id ASC
    `);

    res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener los roles',
      error: error.message
    });
  }
});

app.get('/api/segmentos-riesgo', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        nombre,
        descripcion,
        puntaje_minimo,
        puntaje_maximo
      FROM segmentos_riesgo
      ORDER BY id ASC
    `);

    res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener los segmentos de riesgo',
      error: error.message
    });
  }
});

// EVENTOS: POST / GET / PUT / DELETE
app.get('/api/eventos', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.id,
        e.usuario_id,
        u.nombre_completo AS usuario,
        e.titulo,
        e.descripcion,
        e.tipo_evento,
        e.fecha_evento,
        e.hora_evento,
        e.ubicacion,
        e.capacidad,
        e.estado,
        e.fecha_creacion,
        e.fecha_actualizacion
      FROM eventos e
      INNER JOIN usuarios u ON e.usuario_id = u.id
      ORDER BY e.id DESC
    `);

    res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener los eventos',
      error: error.message
    });
  }
});

app.get('/api/eventos/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        e.id,
        e.usuario_id,
        u.nombre_completo AS usuario,
        e.titulo,
        e.descripcion,
        e.tipo_evento,
        e.fecha_evento,
        e.hora_evento,
        e.ubicacion,
        e.capacidad,
        e.estado,
        e.fecha_creacion,
        e.fecha_actualizacion
      FROM eventos e
      INNER JOIN usuarios u ON e.usuario_id = u.id
      WHERE e.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      ok: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener el evento',
      error: error.message
    });
  }
});

app.post('/api/eventos', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const {
      usuario_id,
      titulo,
      descripcion,
      tipo_evento,
      fecha_evento,
      hora_evento,
      ubicacion,
      capacidad,
      estado
    } = req.body;

    if (!usuario_id || !titulo || !tipo_evento || !fecha_evento || !ubicacion) {
      return res.status(400).json({
        ok: false,
        message: 'Faltan campos obligatorios'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO eventos 
      (usuario_id, titulo, descripcion, tipo_evento, fecha_evento, hora_evento, ubicacion, capacidad, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id,
        titulo,
        descripcion || null,
        tipo_evento,
        fecha_evento,
        hora_evento || null,
        ubicacion,
        capacidad || null,
        estado || 'borrador'
      ]
    );

    res.status(201).json({
      ok: true,
      message: 'Evento creado correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al crear el evento',
      error: error.message
    });
  }
});

app.put('/api/eventos/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      tipo_evento,
      fecha_evento,
      hora_evento,
      ubicacion,
      capacidad,
      estado
    } = req.body;

    const [result] = await pool.query(
      `UPDATE eventos
       SET titulo = ?, descripcion = ?, tipo_evento = ?, fecha_evento = ?, hora_evento = ?, ubicacion = ?, capacidad = ?, estado = ?
       WHERE id = ?`,
      [
        titulo,
        descripcion || null,
        tipo_evento,
        fecha_evento,
        hora_evento || null,
        ubicacion,
        capacidad || null,
        estado,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      ok: true,
      message: 'Evento actualizado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al actualizar el evento',
      error: error.message
    });
  }
});

app.delete('/api/eventos/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM eventos WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      ok: true,
      message: 'Evento eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al eliminar el evento',
      error: error.message
    });
  }
});

// INVITADOS: POST / GET / DELETE
app.get('/api/invitados', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        i.id,
        i.segmento_riesgo_id,
        sr.nombre AS segmento_riesgo,
        i.grupo_invitado_id,
        g.nombre_grupo,
        i.nombres,
        i.apellidos,
        i.correo,
        i.telefono,
        i.ciudad,
        i.rango_edad,
        i.puntaje_asistencia,
        i.fecha_creacion,
        i.fecha_actualizacion
      FROM invitados i
      LEFT JOIN segmentos_riesgo sr 
        ON i.segmento_riesgo_id = sr.id
      LEFT JOIN grupos_invitados g
        ON i.grupo_invitado_id = g.id
      ORDER BY i.id DESC
    `);

    res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener los invitados',
      error: error.message
    });
  }
});

app.get('/api/invitados/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        i.id,
        i.segmento_riesgo_id,
        sr.nombre AS segmento_riesgo,
        i.grupo_invitado_id,
        g.nombre_grupo,
        i.nombres,
        i.apellidos,
        i.correo,
        i.telefono,
        i.ciudad,
        i.rango_edad,
        i.puntaje_asistencia,
        i.fecha_creacion,
        i.fecha_actualizacion
      FROM invitados i
      LEFT JOIN segmentos_riesgo sr 
        ON i.segmento_riesgo_id = sr.id
      LEFT JOIN grupos_invitados g
        ON i.grupo_invitado_id = g.id
      WHERE i.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Invitado no encontrado'
      });
    }

    res.json({
      ok: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener el invitado',
      error: error.message
    });
  }
});

app.post('/api/invitados', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const {
      segmento_riesgo_id,
      grupo_invitado_id,
      nombres,
      apellidos,
      correo,
      telefono,
      ciudad,
      rango_edad,
      puntaje_asistencia
    } = req.body;

    if (!nombres || !apellidos) {
      return res.status(400).json({
        ok: false,
        message: 'Faltan campos obligatorios'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO invitados
      (
        segmento_riesgo_id,
        grupo_invitado_id,
        nombres,
        apellidos,
        correo,
        telefono,
        ciudad,
        rango_edad,
        puntaje_asistencia
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        segmento_riesgo_id || null,
        grupo_invitado_id || null,
        nombres,
        apellidos,
        correo || null,
        telefono || null,
        ciudad || null,
        rango_edad || null,
        puntaje_asistencia || null
      ]
    );

    res.status(201).json({
      ok: true,
      message: 'Invitado creado correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al crear el invitado',
      error: error.message
    });
  }
});

app.put('/api/invitados/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      segmento_riesgo_id,
      grupo_invitado_id,
      nombres,
      apellidos,
      correo,
      telefono,
      ciudad,
      rango_edad,
      puntaje_asistencia
    } = req.body;

    const [result] = await pool.query(
      `UPDATE invitados
       SET segmento_riesgo_id = ?,
           grupo_invitado_id = ?,
           nombres = ?,
           apellidos = ?,
           correo = ?,
           telefono = ?,
           ciudad = ?,
           rango_edad = ?,
           puntaje_asistencia = ?
       WHERE id = ?`,
      [
        segmento_riesgo_id || null,
        grupo_invitado_id || null,
        nombres,
        apellidos,
        correo || null,
        telefono || null,
        ciudad || null,
        rango_edad || null,
        puntaje_asistencia || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Invitado no encontrado'
      });
    }

    res.json({
      ok: true,
      message: 'Invitado actualizado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al actualizar el invitado',
      error: error.message
    });
  }
});

app.delete('/api/invitados/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM invitados WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Invitado no encontrado'
      });
    }

    res.json({
      ok: true,
      message: 'Invitado eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al eliminar el invitado',
      error: error.message
    });
  }
});

// INVITACIONES: POST / GET / DELETE
app.get('/api/invitaciones', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        inv.id,
        inv.evento_id,
        e.titulo AS evento,
        inv.invitado_id,
        CONCAT(i.nombres, ' ', i.apellidos) AS invitado,
        inv.codigo_invitacion,
        inv.canal_envio,
        inv.fecha_envio,
        inv.estado_invitacion,
        inv.vista_previa_mensaje,
        inv.fecha_creacion,
        inv.fecha_actualizacion
      FROM invitaciones inv
      INNER JOIN eventos e ON inv.evento_id = e.id
      INNER JOIN invitados i ON inv.invitado_id = i.id
      ORDER BY inv.id DESC
    `);

    res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener las invitaciones',
      error: error.message
    });
  }
});

app.get('/api/invitaciones/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        inv.id,
        inv.evento_id,
        e.titulo AS evento,
        inv.invitado_id,
        CONCAT(i.nombres, ' ', i.apellidos) AS invitado,
        inv.codigo_invitacion,
        inv.canal_envio,
        inv.fecha_envio,
        inv.estado_invitacion,
        inv.vista_previa_mensaje,
        inv.fecha_creacion,
        inv.fecha_actualizacion
      FROM invitaciones inv
      INNER JOIN eventos e ON inv.evento_id = e.id
      INNER JOIN invitados i ON inv.invitado_id = i.id
      WHERE inv.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Invitación no encontrada'
      });
    }

    res.json({
      ok: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener la invitación',
      error: error.message
    });
  }
});

app.post('/api/invitaciones', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const {
      evento_id,
      invitado_id,
      codigo_invitacion,
      canal_envio,
      fecha_envio,
      estado_invitacion,
      vista_previa_mensaje
    } = req.body;

    if (!evento_id || !invitado_id || !codigo_invitacion || !canal_envio) {
      return res.status(400).json({
        ok: false,
        message: 'Faltan campos obligatorios'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO invitaciones
      (evento_id, invitado_id, codigo_invitacion, canal_envio, fecha_envio, estado_invitacion, vista_previa_mensaje)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        evento_id,
        invitado_id,
        codigo_invitacion,
        canal_envio,
        fecha_envio || null,
        estado_invitacion || 'pendiente',
        vista_previa_mensaje || null
      ]
    );

    res.status(201).json({
      ok: true,
      message: 'Invitación creada correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al crear la invitación',
      error: error.message
    });
  }
});

app.put('/api/invitaciones/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      evento_id,
      invitado_id,
      codigo_invitacion,
      canal_envio,
      fecha_envio,
      estado_invitacion,
      vista_previa_mensaje
    } = req.body;

    const [result] = await pool.query(
      `UPDATE invitaciones
       SET evento_id = ?, invitado_id = ?, codigo_invitacion = ?, canal_envio = ?, fecha_envio = ?, estado_invitacion = ?, vista_previa_mensaje = ?
       WHERE id = ?`,
      [
        evento_id,
        invitado_id,
        codigo_invitacion,
        canal_envio,
        fecha_envio || null,
        estado_invitacion,
        vista_previa_mensaje || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Invitación no encontrada'
      });
    }

    res.json({
      ok: true,
      message: 'Invitación actualizada correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al actualizar la invitación',
      error: error.message
    });
  }
});

app.delete('/api/invitaciones/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM invitaciones WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Invitación no encontrada'
      });
    }

    res.json({
      ok: true,
      message: 'Invitación eliminada correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al eliminar la invitación',
      error: error.message
    });
  }
});

// RESPUESTAS RSVP: POST / GET / DELETE
const actualizarSegmentacionInvitado = async (invitacionId) => {
  const [rows] = await pool.query(`
    SELECT
      i.id AS invitado_id,
      r.estado_respuesta,
      r.cantidad_acompanantes
    FROM invitaciones inv
    INNER JOIN invitados i ON inv.invitado_id = i.id
    LEFT JOIN respuestas_rsvp r ON r.invitacion_id = inv.id
    WHERE inv.id = ?
    LIMIT 1
  `, [invitacionId]);

  if (rows.length === 0) return;

  const datos = rows[0];

  let puntaje = 0;

  if (datos.estado_respuesta === "confirmado") {
    puntaje += 70;
  }

  if (datos.estado_respuesta === "rechazado") {
    puntaje += 10;
  }

  if (Number(datos.cantidad_acompanantes || 0) > 0) {
    puntaje += 20;
  }

  if (puntaje > 100) {
    puntaje = 100;
  }

  const [segmentos] = await pool.query(`
    SELECT id
    FROM segmentos_riesgo
    WHERE ? BETWEEN puntaje_minimo AND puntaje_maximo
    LIMIT 1
  `, [puntaje]);

  const segmentoId = segmentos.length > 0 ? segmentos[0].id : null;

  await pool.query(`
    UPDATE invitados
    SET puntaje_asistencia = ?,
        segmento_riesgo_id = ?
    WHERE id = ?
  `, [
    puntaje,
    segmentoId,
    datos.invitado_id
  ]);
};

app.get('/api/respuestas-rsvp', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.id,
        r.invitacion_id,
        inv.codigo_invitacion,
        e.titulo AS evento,
        CONCAT(i.nombres, ' ', i.apellidos) AS invitado,
        r.estado_respuesta,
        r.fecha_respuesta,
        r.cantidad_acompanantes,
        r.observaciones,
        r.fecha_creacion,
        r.fecha_actualizacion
      FROM respuestas_rsvp r
      INNER JOIN invitaciones inv ON r.invitacion_id = inv.id
      INNER JOIN eventos e ON inv.evento_id = e.id
      INNER JOIN invitados i ON inv.invitado_id = i.id
      ORDER BY r.id DESC
    `);

    res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener las respuestas RSVP',
      error: error.message
    });
  }
});

app.get('/api/respuestas-rsvp/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        r.id,
        r.invitacion_id,
        inv.codigo_invitacion,
        e.titulo AS evento,
        CONCAT(i.nombres, ' ', i.apellidos) AS invitado,
        r.estado_respuesta,
        r.fecha_respuesta,
        r.cantidad_acompanantes,
        r.observaciones,
        r.fecha_creacion,
        r.fecha_actualizacion
      FROM respuestas_rsvp r
      INNER JOIN invitaciones inv ON r.invitacion_id = inv.id
      INNER JOIN eventos e ON inv.evento_id = e.id
      INNER JOIN invitados i ON inv.invitado_id = i.id
      WHERE r.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Respuesta RSVP no encontrada'
      });
    }

    res.json({
      ok: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener la respuesta RSVP',
      error: error.message
    });
  }
});

app.post('/api/respuestas-rsvp', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const {
      invitacion_id,
      estado_respuesta,
      fecha_respuesta,
      cantidad_acompanantes,
      observaciones
    } = req.body;

    if (!invitacion_id || !estado_respuesta) {
      return res.status(400).json({
        ok: false,
        message: 'Faltan campos obligatorios'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO respuestas_rsvp
      (invitacion_id, estado_respuesta, fecha_respuesta, cantidad_acompanantes, observaciones)
      VALUES (?, ?, ?, ?, ?)`,
      [
        invitacion_id,
        estado_respuesta,
        fecha_respuesta || null,
        cantidad_acompanantes ?? 0,
        observaciones || null
      ]
    );

    await actualizarSegmentacionInvitado(invitacion_id);

    res.status(201).json({
      ok: true,
      message: 'Respuesta RSVP creada correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al crear la respuesta RSVP',
      error: error.message
    });
  }
});

app.put('/api/respuestas-rsvp/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      invitacion_id,
      estado_respuesta,
      fecha_respuesta,
      cantidad_acompanantes,
      observaciones
    } = req.body;

    const [result] = await pool.query(
      `UPDATE respuestas_rsvp
       SET invitacion_id = ?, estado_respuesta = ?, fecha_respuesta = ?, cantidad_acompanantes = ?, observaciones = ?
       WHERE id = ?`,
      [
        invitacion_id,
        estado_respuesta,
        fecha_respuesta || null,
        cantidad_acompanantes ?? 0,
        observaciones || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Respuesta RSVP no encontrada'
      });
    }

    await actualizarSegmentacionInvitado(invitacion_id);

    res.json({
      ok: true,
      message: 'Respuesta RSVP actualizada correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al actualizar la respuesta RSVP',
      error: error.message
    });
  }
});

app.delete('/api/respuestas-rsvp/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM respuestas_rsvp WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Respuesta RSVP no encontrada'
      });
    }

    res.json({
      ok: true,
      message: 'Respuesta RSVP eliminada correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al eliminar la respuesta RSVP',
      error: error.message
    });
  }
});

// RECORDATORIOS: POST / GET / DELETE
app.get('/api/recordatorios', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.id,
        r.invitacion_id,
        inv.codigo_invitacion,
        e.titulo AS evento,
        CONCAT(i.nombres, ' ', i.apellidos) AS invitado,
        r.tipo_recordatorio,
        r.fecha_envio,
        r.estado_recordatorio,
        r.fecha_creacion
      FROM recordatorios r
      INNER JOIN invitaciones inv ON r.invitacion_id = inv.id
      INNER JOIN eventos e ON inv.evento_id = e.id
      INNER JOIN invitados i ON inv.invitado_id = i.id
      ORDER BY r.id DESC
    `);

    res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener los recordatorios',
      error: error.message
    });
  }
});

app.get('/api/recordatorios/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        r.id,
        r.invitacion_id,
        inv.codigo_invitacion,
        e.titulo AS evento,
        CONCAT(i.nombres, ' ', i.apellidos) AS invitado,
        r.tipo_recordatorio,
        r.fecha_envio,
        r.estado_recordatorio,
        r.fecha_creacion
      FROM recordatorios r
      INNER JOIN invitaciones inv ON r.invitacion_id = inv.id
      INNER JOIN eventos e ON inv.evento_id = e.id
      INNER JOIN invitados i ON inv.invitado_id = i.id
      WHERE r.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Recordatorio no encontrado'
      });
    }

    res.json({
      ok: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener el recordatorio',
      error: error.message
    });
  }
});

app.post('/api/recordatorios', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const {
      invitacion_id,
      tipo_recordatorio,
      fecha_envio,
      estado_recordatorio
    } = req.body;

    if (!invitacion_id || !tipo_recordatorio) {
      return res.status(400).json({
        ok: false,
        message: 'Faltan campos obligatorios'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO recordatorios
      (invitacion_id, tipo_recordatorio, fecha_envio, estado_recordatorio)
      VALUES (?, ?, ?, ?)`,
      [
        invitacion_id,
        tipo_recordatorio,
        fecha_envio || null,
        estado_recordatorio || 'programado'
      ]
    );

    res.status(201).json({
      ok: true,
      message: 'Recordatorio creado correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al crear el recordatorio',
      error: error.message
    });
  }
});

app.put('/api/recordatorios/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      invitacion_id,
      tipo_recordatorio,
      fecha_envio,
      estado_recordatorio
    } = req.body;

    const [result] = await pool.query(
      `UPDATE recordatorios
       SET invitacion_id = ?, tipo_recordatorio = ?, fecha_envio = ?, estado_recordatorio = ?
       WHERE id = ?`,
      [
        invitacion_id,
        tipo_recordatorio,
        fecha_envio || null,
        estado_recordatorio,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Recordatorio no encontrado'
      });
    }

    res.json({
      ok: true,
      message: 'Recordatorio actualizado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al actualizar el recordatorio',
      error: error.message
    });
  }
});

app.delete('/api/recordatorios/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM recordatorios WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Recordatorio no encontrado'
      });
    }

    res.json({
      ok: true,
      message: 'Recordatorio eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al eliminar el recordatorio',
      error: error.message
    });
  }
});

// GRUPOS_INVITADOS: POST / GET / DELETE
app.get('/api/grupos-invitados', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        g.id,
        g.usuario_id,
        u.nombre_completo AS usuario,
        g.nombre_grupo,
        g.descripcion,
        g.fecha_creacion
      FROM grupos_invitados g
      INNER JOIN usuarios u ON g.usuario_id = u.id
      ORDER BY g.id DESC
    `);

    res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener los grupos de invitados',
      error: error.message
    });
  }
});

app.get('/api/grupos-invitados/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        g.id,
        g.usuario_id,
        u.nombre_completo AS usuario,
        g.nombre_grupo,
        g.descripcion,
        g.fecha_creacion
      FROM grupos_invitados g
      INNER JOIN usuarios u ON g.usuario_id = u.id
      WHERE g.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Grupo de invitados no encontrado'
      });
    }

    res.json({
      ok: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener el grupo de invitados',
      error: error.message
    });
  }
});

app.post('/api/grupos-invitados', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const {
      //usuario_id,
      nombre_grupo,
      descripcion
    } = req.body;

    const usuario_id = req.usuario.id;

    if (!usuario_id || !nombre_grupo) {
      return res.status(400).json({
        ok: false,
        message: 'Faltan campos obligatorios'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO grupos_invitados
      (usuario_id, nombre_grupo, descripcion)
      VALUES (?, ?, ?)`,
      [
        usuario_id,
        nombre_grupo,
        descripcion || null
      ]
    );

    res.status(201).json({
      ok: true,
      message: 'Grupo de invitados creado correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al crear el grupo de invitados',
      error: error.message
    });
  }
});

app.put('/api/grupos-invitados/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre_grupo,
      descripcion
    } = req.body;
    
    const usuario_id = req.usuario.id;

    const [result] = await pool.query(
      `UPDATE grupos_invitados
       SET usuario_id = ?, nombre_grupo = ?, descripcion = ?
       WHERE id = ?`,
      [
        usuario_id,
        nombre_grupo,
        descripcion || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Grupo de invitados no encontrado'
      });
    }

    res.json({
      ok: true,
      message: 'Grupo de invitados actualizado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al actualizar el grupo de invitados',
      error: error.message
    });
  }
});

app.delete('/api/grupos-invitados/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM grupos_invitados WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Grupo de invitados no encontrado'
      });
    }

    res.json({
      ok: true,
      message: 'Grupo de invitados eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al eliminar el grupo de invitados',
      error: error.message
    });
  }
});

// EVENTO_GRUPO_INVITADO: POST / GET / DELETE
app.get('/api/evento-grupo-invitado', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        egi.id,
        egi.evento_id,
        e.titulo AS evento,
        egi.grupo_invitado_id,
        g.nombre_grupo,
        g.descripcion,
        egi.fecha_creacion
      FROM evento_grupo_invitado egi
      INNER JOIN eventos e ON egi.evento_id = e.id
      INNER JOIN grupos_invitados g ON egi.grupo_invitado_id = g.id
      ORDER BY egi.id DESC
    `);

    res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener las relaciones evento-grupo',
      error: error.message
    });
  }
});

app.get('/api/evento-grupo-invitado/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT
        egi.id,
        egi.evento_id,
        e.titulo AS evento,
        egi.grupo_invitado_id,
        g.nombre_grupo,
        g.descripcion,
        egi.fecha_creacion
      FROM evento_grupo_invitado egi
      INNER JOIN eventos e ON egi.evento_id = e.id
      INNER JOIN grupos_invitados g ON egi.grupo_invitado_id = g.id
      WHERE egi.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Relación evento-grupo no encontrada'
      });
    }

    res.json({
      ok: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener la relación evento-grupo',
      error: error.message
    });
  }
});

app.post('/api/evento-grupo-invitado', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { evento_id, grupo_invitado_id } = req.body;

    if (!evento_id || !grupo_invitado_id) {
      return res.status(400).json({
        ok: false,
        message: 'Faltan campos obligatorios'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO evento_grupo_invitado
      (evento_id, grupo_invitado_id)
      VALUES (?, ?)`,
      [evento_id, grupo_invitado_id]
    );

    res.status(201).json({
      ok: true,
      message: 'Relación evento-grupo creada correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al crear la relación evento-grupo',
      error: error.message
    });
  }
});

app.put('/api/evento-grupo-invitado/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { evento_id, grupo_invitado_id } = req.body;

    const [result] = await pool.query(
      `UPDATE evento_grupo_invitado
       SET evento_id = ?, grupo_invitado_id = ?
       WHERE id = ?`,
      [evento_id, grupo_invitado_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Relación evento-grupo no encontrada'
      });
    }

    res.json({
      ok: true,
      message: 'Relación evento-grupo actualizada correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al actualizar la relación evento-grupo',
      error: error.message
    });
  }
});

app.delete('/api/evento-grupo-invitado/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM evento_grupo_invitado WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Relación evento-grupo no encontrada'
      });
    }

    res.json({
      ok: true,
      message: 'Relación evento-grupo eliminada correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al eliminar la relación evento-grupo',
      error: error.message
    });
  }
});

// USUARIOS: POST / GET / DELETE
app.get('/api/usuarios', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.rol_id,
        r.nombre AS rol,
        u.nombre_completo,
        u.correo,
        u.telefono,
        u.activo,
        u.fecha_creacion,
        u.fecha_actualizacion
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      ORDER BY u.id DESC
    `);

    res.json({
      ok: true,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener los usuarios',
      error: error.message
    });
  }
});

app.get('/api/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.rol_id,
        r.nombre AS rol,
        u.nombre_completo,
        u.correo,
        u.telefono,
        u.activo,
        u.fecha_creacion,
        u.fecha_actualizacion
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      ok: true,
      data: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener el usuario',
      error: error.message
    });
  }
});

app.post('/api/usuarios', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const {
      rol_id,
      nombre_completo,
      correo,
      hash_contrasena,
      telefono,
      activo
    } = req.body;

    if (!rol_id || !nombre_completo || !correo || !hash_contrasena) {
      return res.status(400).json({
        ok: false,
        message: 'Faltan campos obligatorios'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO usuarios
      (rol_id, nombre_completo, correo, hash_contrasena, telefono, activo)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        rol_id,
        nombre_completo,
        correo,
        hash_contrasena,
        telefono || null,
        activo ?? 1
      ]
    );

    res.status(201).json({
      ok: true,
      message: 'Usuario creado correctamente',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al crear el usuario',
      error: error.message
    });
  }
});

app.put('/api/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      rol_id,
      nombre_completo,
      correo,
      hash_contrasena,
      telefono,
      activo
    } = req.body;

    const [result] = await pool.query(
      `UPDATE usuarios
       SET rol_id = ?, nombre_completo = ?, correo = ?, hash_contrasena = ?, telefono = ?, activo = ?
       WHERE id = ?`,
      [
        rol_id,
        nombre_completo,
        correo,
        hash_contrasena,
        telefono || null,
        activo ?? 1,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      ok: true,
      message: 'Usuario actualizado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al actualizar el usuario',
      error: error.message
    });
  }
});

app.delete('/api/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      ok: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al eliminar el usuario',
      error: error.message
    });
  }
});

// INVITACIÓN PÚBLICA
app.get('/api/invitacion-publica/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    const [rows] = await pool.query(`
      SELECT 
      inv.id AS invitacion_id,
      inv.codigo_invitacion,
      inv.estado_invitacion,

      e.id AS evento_id,
      e.titulo AS evento,
      e.descripcion,
      e.tipo_evento,
      e.fecha_evento,
      e.hora_evento,
      e.ubicacion,

      CONCAT(i.nombres, ' ', i.apellidos) AS invitado,

      rsvp.estado_respuesta,
      rsvp.fecha_respuesta,
      rsvp.cantidad_acompanantes,
      rsvp.observaciones

    FROM invitaciones inv

    INNER JOIN eventos e
      ON inv.evento_id = e.id

    INNER JOIN invitados i
      ON inv.invitado_id = i.id

    LEFT JOIN respuestas_rsvp rsvp
      ON inv.id = rsvp.invitacion_id

    WHERE inv.codigo_invitacion = ?

    LIMIT 1
    `, [codigo]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: 'Invitación no encontrada'
      });
    }

    res.json({
      ok: true,
      data: rows[0]
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener la invitación pública',
      error: error.message
    });
  }
});
app.post('/api/rsvp-publico', async (req, res) => {
  try {
    const {
      invitacion_id,
      estado_respuesta,
      cantidad_acompanantes,
      observaciones
    } = req.body;

    if (!invitacion_id || !estado_respuesta) {
      return res.status(400).json({
        ok: false,
        message: 'Faltan campos obligatorios'
      });
    }

    const [existente] = await pool.query(`
      SELECT id
      FROM respuestas_rsvp
      WHERE invitacion_id = ?
      LIMIT 1
    `, [invitacion_id]);

    if (existente.length > 0) {
      await pool.query(`
        UPDATE respuestas_rsvp
        SET estado_respuesta = ?,
            fecha_respuesta = NOW(),
            cantidad_acompanantes = ?,
            observaciones = ?
        WHERE invitacion_id = ?
      `, [
        estado_respuesta,
        cantidad_acompanantes ?? 0,
        observaciones || null,
        invitacion_id
      ]);
    } else {
      await pool.query(`
        INSERT INTO respuestas_rsvp
        (invitacion_id, estado_respuesta, fecha_respuesta, cantidad_acompanantes, observaciones)
        VALUES (?, ?, NOW(), ?, ?)
      `, [
        invitacion_id,
        estado_respuesta,
        cantidad_acompanantes ?? 0,
        observaciones || null
      ]);
    }

    await pool.query(`
      UPDATE invitaciones
      SET estado_invitacion = 'respondida'
      WHERE id = ?
    `, [invitacion_id]);

    await actualizarSegmentacionInvitado(invitacion_id);

    res.json({
      ok: true,
      message: 'Respuesta RSVP registrada correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al registrar respuesta RSVP',
      error: error.message
    });
  }
});

// DASHBOARD MÉTRICAS
app.get('/api/dashboard/metricas', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const [eventos] = await pool.query(`
      SELECT COUNT(*) AS total_eventos
      FROM eventos
    `);

    const [invitados] = await pool.query(`
      SELECT COUNT(*) AS total_invitados
      FROM invitados
    `);

    const [respuestas] = await pool.query(`
      SELECT
        SUM(CASE WHEN estado_respuesta = 'confirmado' THEN 1 ELSE 0 END) AS confirmados,
        SUM(CASE WHEN estado_respuesta = 'rechazado' THEN 1 ELSE 0 END) AS rechazados,
        SUM(CASE WHEN estado_respuesta = 'pendiente' THEN 1 ELSE 0 END) AS pendientes,
        SUM(
          CASE 
            WHEN estado_respuesta = 'confirmado' 
            THEN 1 + IFNULL(cantidad_acompanantes, 0)
            ELSE 0
          END
        ) AS asistencia_proyectada
      FROM respuestas_rsvp
    `);

    const [recordatorios] = await pool.query(`
      SELECT
        COUNT(*) AS total_recordatorios,
        SUM(CASE WHEN estado_recordatorio = 'programado' THEN 1 ELSE 0 END) AS programados,
        SUM(CASE WHEN estado_recordatorio = 'enviado' THEN 1 ELSE 0 END) AS enviados,
        SUM(CASE WHEN estado_recordatorio = 'fallido' THEN 1 ELSE 0 END) AS fallidos
      FROM recordatorios
    `);

    const [segmentos] = await pool.query(`
      SELECT
        SUM(CASE WHEN sr.nombre LIKE '%alto%' THEN 1 ELSE 0 END) AS riesgo_alto,
        SUM(CASE WHEN sr.nombre LIKE '%medio%' THEN 1 ELSE 0 END) AS riesgo_medio,
        SUM(CASE WHEN sr.nombre LIKE '%bajo%' THEN 1 ELSE 0 END) AS riesgo_bajo
      FROM invitados i
      LEFT JOIN segmentos_riesgo sr
        ON i.segmento_riesgo_id = sr.id
    `);

    const metricas = {
      total_eventos: Number(eventos[0].total_eventos || 0),
      total_invitados: Number(invitados[0].total_invitados || 0),

      confirmados: Number(respuestas[0].confirmados || 0),
      rechazados: Number(respuestas[0].rechazados || 0),
      pendientes: Number(respuestas[0].pendientes || 0),
      asistencia_proyectada: Number(respuestas[0].asistencia_proyectada || 0),

      total_recordatorios: Number(recordatorios[0].total_recordatorios || 0),
      recordatorios_programados: Number(recordatorios[0].programados || 0),
      recordatorios_enviados: Number(recordatorios[0].enviados || 0),
      recordatorios_fallidos: Number(recordatorios[0].fallidos || 0),

      riesgo_alto: Number(segmentos[0].riesgo_alto || 0),
      riesgo_medio: Number(segmentos[0].riesgo_medio || 0),
      riesgo_bajo: Number(segmentos[0].riesgo_bajo || 0),
    };

    res.json({
      ok: true,
      data: metricas
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener métricas del dashboard',
      error: error.message
    });
  }
});

// DASHBOARD CLIENTE
app.get('/api/cliente/dashboard', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const [rows] = await pool.query(`
      SELECT
        inv.id AS invitacion_id,
        inv.codigo_invitacion,
        inv.estado_invitacion,

        e.id AS evento_id,
        e.titulo AS evento,
        e.descripcion,
        e.tipo_evento,
        e.fecha_evento,
        e.hora_evento,
        e.ubicacion,

        i.id AS invitado_id,
        CONCAT(i.nombres, ' ', i.apellidos) AS invitado,

        r.estado_respuesta,
        r.fecha_respuesta,
        r.cantidad_acompanantes,
        r.observaciones
      FROM invitados i
      INNER JOIN invitaciones inv
        ON inv.invitado_id = i.id
      INNER JOIN eventos e
        ON inv.evento_id = e.id
      LEFT JOIN respuestas_rsvp r
        ON r.invitacion_id = inv.id
      WHERE i.usuario_id = ?
      ORDER BY e.fecha_evento ASC
    `, [usuarioId]);

    res.json({
      ok: true,
      data: rows
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al obtener dashboard del cliente',
      error: error.message
    });
  }
});

//
app.put('/api/cliente/rsvp/:invitacion_id', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { invitacion_id } = req.params;

    const {
      estado_respuesta,
      cantidad_acompanantes,
      observaciones
    } = req.body;

    if (!estado_respuesta) {
      return res.status(400).json({
        ok: false,
        message: 'Debe indicar una respuesta RSVP'
      });
    }

    const [rows] = await pool.query(`
      SELECT 
        inv.id AS invitacion_id,
        e.fecha_evento
      FROM invitados i
      INNER JOIN invitaciones inv ON inv.invitado_id = i.id
      INNER JOIN eventos e ON inv.evento_id = e.id
      WHERE i.usuario_id = ?
      AND inv.id = ?
      LIMIT 1
    `, [usuarioId, invitacion_id]);

    if (rows.length === 0) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permiso para modificar esta invitación'
      });
    }

    const fechaEvento = new Date(rows[0].fecha_evento);
    const hoy = new Date();

    const diferenciaDias = Math.ceil(
      (fechaEvento - hoy) / (1000 * 60 * 60 * 24)
    );

    if (diferenciaDias < 5) {
      return res.status(400).json({
        ok: false,
        message: 'La respuesta solo puede modificarse hasta 5 días antes del evento'
      });
    }

    const [existente] = await pool.query(`
      SELECT id
      FROM respuestas_rsvp
      WHERE invitacion_id = ?
      LIMIT 1
    `, [invitacion_id]);

    if (existente.length > 0) {
      await pool.query(`
        UPDATE respuestas_rsvp
        SET estado_respuesta = ?,
            fecha_respuesta = NOW(),
            cantidad_acompanantes = ?,
            observaciones = ?
        WHERE invitacion_id = ?
      `, [
        estado_respuesta,
        cantidad_acompanantes ?? 0,
        observaciones || null,
        invitacion_id
      ]);
    } else {
      await pool.query(`
        INSERT INTO respuestas_rsvp
        (invitacion_id, estado_respuesta, fecha_respuesta, cantidad_acompanantes, observaciones)
        VALUES (?, ?, NOW(), ?, ?)
      `, [
        invitacion_id,
        estado_respuesta,
        cantidad_acompanantes ?? 0,
        observaciones || null
      ]);
    }

    await pool.query(`
      UPDATE invitaciones
      SET estado_invitacion = 'respondida'
      WHERE id = ?
    `, [invitacion_id]);

    await actualizarSegmentacionInvitado(invitacion_id);

    res.json({
      ok: true,
      message: 'Respuesta RSVP actualizada correctamente'
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al actualizar RSVP del cliente',
      error: error.message
    });
  }
});

//
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});