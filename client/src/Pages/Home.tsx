import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Button, IconButton,
  List, ListItem, ListItemText, Divider, Snackbar, Alert
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { DateTime } from "luxon";

interface Turno {
  id: number;
  fecha: string;
  usuarioId: number;
  estado: "disponible" | "reservado" | "confirmado" | "cancelado" | "deshabilitado";
  cliente?: { nombre: string; apellido: string };
}

const Home: React.FC = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(DateTime.now().toISODate()!);
  const [turnosOcupando, setTurnosOcupando] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; mensaje: string; tipo: "success" | "error" }>({ open: false, mensaje: "", tipo: "success" });

  const horarios = [
    "09:00", "10:00", "11:00",
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
  ];

  const token = localStorage.getItem("token");
  const usuarioId = Number(localStorage.getItem("usuarioId"));
  const esAdmin = JSON.parse(localStorage.getItem("admin") || "false");

  const navigate = useNavigate();
  const location = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);

  const showSnackbar = (mensaje: string, tipo: "success" | "error") => {
    setSnackbar({ open: true, mensaje, tipo });
  };

  // 🔹 Convierte fecha local a UTC ISO
  const fechaAUTC = (fecha: DateTime) => fecha.toUTC().toISO();

  // 🔹 Obtiene turno por horario usando Luxon
  const obtenerTurnoPorHora = (horario: string): Turno | undefined => {
    const [horas, minutos] = horario.split(":").map(Number);
    return turnos.find(t => {
      const dt = DateTime.fromISO(t.fecha, { zone: "UTC" }).setZone("America/Argentina/Buenos_Aires");
      const fechaSel = DateTime.fromISO(fechaSeleccionada, { zone: "America/Argentina/Buenos_Aires" });
      return dt.hasSame(fechaSel, "day") && dt.hour === horas && dt.minute === minutos;
    });
  };

  // 🔹 Fetch turnos
  useEffect(() => {
    if (!token) return;
    axios.get<Turno[]>("https://gestiondeturnos-production.up.railway.app/turnos", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTurnos(res.data))
      .catch(err => { console.error(err); setTurnos([]); });
  }, [token, location, fechaSeleccionada]);

  const handleCrearTurno = (hora: string) => {
    if (!fechaSeleccionada || !hora) return showSnackbar("Seleccioná fecha y hora", "error");
    if (!usuarioId && !esAdmin) return showSnackbar("Usuario no identificado", "error");

    const turnoExistente = obtenerTurnoPorHora(hora);
    if ((turnoExistente && (turnoExistente.estado === "reservado" || turnoExistente.estado === "confirmado")) 
        || turnosOcupando.includes(hora)) {
      return showSnackbar("Ese turno no está disponible", "error");
    }

    setTurnosOcupando(prev => [...prev, hora]);

    const [horas, minutos] = hora.split(":").map(Number);
    const fecha = DateTime.fromISO(fechaSeleccionada, { zone: "America/Argentina/Buenos_Aires" })
                          .set({ hour: horas, minute: minutos });

    axios.post(
      "https://gestiondeturnos-production.up.railway.app/turnos",
      { fecha: fechaAUTC(fecha), usuarioId, estado: "reservado" },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(res => {
      showSnackbar("Turno reservado!", "success");
      setTurnos(prev => [...prev, res.data as Turno]);
    })
    .catch(err => showSnackbar(err.response?.data?.error || "Error al reservar turno", "error"))
    .then(() => setTurnosOcupando(prev => prev.filter(h => h !== hora)));
  };

  const handleCancelarTurno = (turno: Turno) => {
    axios.put(`https://gestiondeturnos-production.up.railway.app/turnos/${turno.id}/cancelar`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        showSnackbar("Turno cancelado", "success");
        setTurnos(prev => prev.map(t => t.id === turno.id ? { ...t, estado: "disponible", usuarioId: 0 } : t));
      })
      .catch(() => showSnackbar("Error al cancelar turno", "error"));
  };

  const handleDeshabilitarTurno = (turno: Turno | undefined, hora: string) => {
    const [horas, minutos] = hora.split(":").map(Number);
    const fecha = DateTime.fromISO(fechaSeleccionada, { zone: "America/Argentina/Buenos_Aires" })
                          .set({ hour: horas, minute: minutos });
    if (turno) {
      axios.put(`https://gestiondeturnos-production.up.railway.app/turnos/${turno.id}/deshabilitar`, {}, { headers: { Authorization: `Bearer ${token}` } })
        .then(() => setTurnos(prev => prev.map(t => t.id === turno.id ? { ...t, estado: "deshabilitado" } : t)))
        .catch(() => showSnackbar("Error al deshabilitar turno", "error"));
    } else {
      axios.post(
        "https://gestiondeturnos-production.up.railway.app/turnos",
        { fecha: fechaAUTC(fecha), usuarioId: 0, estado: "deshabilitado" },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(res => setTurnos(prev => [...prev, res.data as Turno]))
      .catch(() => showSnackbar("Error al deshabilitar turno", "error"));
    }
  };

  const handleHabilitarTurno = (turno: Turno) => {
    axios.put(`https://gestiondeturnos-production.up.railway.app/turnos/${turno.id}/habilitar`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => setTurnos(prev => prev.map(t => t.id === turno.id ? { ...t, estado: "disponible" } : t)))
      .catch(() => showSnackbar("Error al habilitar turno", "error"));
  };

  const handleCambioFecha = (dias: number) => {
    const nuevaFecha = DateTime.fromISO(fechaSeleccionada).plus({ days: dias });
    setFechaSeleccionada(nuevaFecha.toISODate()!);
  };

  const scrollCard = (direction: "up" | "down") => {
    if (!cardRef.current) return;
    const offset = 80;
    cardRef.current.scrollBy({ top: direction === "up" ? -offset : offset, behavior: "smooth" });
  };

  const turnosConfirmados = turnos.filter(t => {
    const dt = DateTime.fromISO(t.fecha, { zone: "UTC" }).setZone("America/Argentina/Buenos_Aires");
    const fechaSel = DateTime.fromISO(fechaSeleccionada, { zone: "America/Argentina/Buenos_Aires" });
    return dt.hasSame(fechaSel, "day") && t.estado === "confirmado";
  });

  return (
    <Box sx={{ bgcolor: "#121212", color: "#e0e0e0", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", p: 4 }}>
      <Typography variant="h4" mb={3} sx={{ fontWeight: "bold", color: "#90caf9" }}>Reservá tu turno</Typography>

      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => handleCambioFecha(-1)} sx={{ color: "#90caf9" }}><ArrowBackIosIcon /></IconButton>
        <Typography variant="h6" mx={2}>
          {DateTime.fromISO(fechaSeleccionada, { zone: "America/Argentina/Buenos_Aires" }).toLocaleString({ weekday: "long", day: "numeric", month: "long" })}
        </Typography>
        <IconButton onClick={() => handleCambioFecha(1)} sx={{ color: "#90caf9" }}><ArrowForwardIosIcon /></IconButton>
      </Box>

      <Card sx={{ width: "100%", maxWidth: 600, maxHeight: 400, overflow: "hidden", position: "relative", bgcolor: "#1e1e1e", borderRadius: 3, boxShadow: "0 6px 20px rgba(0,0,0,0.5)", mb: 3 }}>
        <CardContent ref={cardRef} sx={{ overflowY: "auto", maxHeight: 400 }}>
          <List>
            {horarios.map(horario => {
              const turno = obtenerTurnoPorHora(horario);
              const ocupado = turno && (turno.estado === "reservado" || turno.estado === "confirmado");
              const deshabilitado = turno && turno.estado === "deshabilitado";

              const fechaSel = DateTime.fromISO(fechaSeleccionada, { zone: "America/Argentina/Buenos_Aires" });
              const esNoLaborable = fechaSel.weekday === 7 || fechaSel.weekday === 1; // domingo = 7, lunes = 1

              return (
                <ListItem key={horario} sx={{ flexDirection: "column", alignItems: "flex-start" }}>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: "bold", color: "#fff" }}>Hora: {horario}</Typography>}
                    secondary={<Typography sx={{ color: "#fff" }}>
                      {esNoLaborable ? "No laborable" : ocupado ? `No disponible (${turno?.estado})` : deshabilitado ? "Deshabilitado" : "Disponible"}
                    </Typography>}
                  />
                  <Box display="flex" gap={1} mt={1}>
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      disabled={ocupado || deshabilitado || turnosOcupando.includes(horario) || esNoLaborable}
                      onClick={() => handleCrearTurno(horario)}
                    >
                      {ocupado ? turno?.estado : esNoLaborable ? "No laborable" : "Reservar"}
                    </Button>

                   {esAdmin && turno && (turno.estado === "reservado" || turno.estado === "confirmado") && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="warning"
                        onClick={() => handleCancelarTurno(turno)}
                      >
                        Cancelar
                      </Button>
                    )}
                    
                    {esAdmin && !deshabilitado && !esNoLaborable && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => handleDeshabilitarTurno(turno, horario)}
                        disabled={ocupado}
                      >
                        Deshabilitar
                      </Button>
                    )}

                    {esAdmin && deshabilitado && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="success"
                        onClick={() => handleHabilitarTurno(turno)}
                      >
                        Habilitar
                      </Button>
                    )}
                  </Box>
                  <Divider sx={{ bgcolor: "#424242", width: "100%", mt: 1 }} />
                </ListItem>
              );
            })}
          </List>
        </CardContent>

        {horarios.length > 3 && (
          <Box position="absolute" top={0} right={0} display="flex" flexDirection="column">
            <IconButton size="small" onClick={() => scrollCard("up")} sx={{ bgcolor: "rgba(0,0,0,0.1)", m: 0.5 }}><KeyboardArrowUpIcon /></IconButton>
            <IconButton size="small" onClick={() => scrollCard("down")} sx={{ bgcolor: "rgba(0,0,0,0.1)", m: 0.5 }}><KeyboardArrowDownIcon /></IconButton>
          </Box>
        )}
      </Card>
    {esAdmin && (
      <Card sx={{ width: "100%", maxWidth: 600, maxHeight: 200, overflow: "hidden", bgcolor: "#1e1e1e", borderRadius: 3, boxShadow: "0 6px 20px rgba(0,0,0,0.5)" }}>
        <CardContent sx={{ maxHeight: 200, overflowY: "auto" }}>
          <Typography sx={{ fontWeight: "bold", color: "#90caf9", mb: 1 }}>Turnos Confirmados</Typography>
          <List>
            {turnosConfirmados.length === 0 && <Typography sx={{ color: "#fff" }}>No hay turnos confirmados</Typography>}
            {turnosConfirmados.map(turno => (
              <ListItem key={turno.id}>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: "bold", color: "#fff" }}>
                    {DateTime.fromISO(turno.fecha, { zone: "UTC" }).setZone("America/Argentina/Buenos_Aires").toFormat("HH:mm")}
                  </Typography>}
                  secondary={turno.cliente ? <Typography sx={{ color: "#fff" }}>{turno.cliente.nombre} {turno.cliente.apellido}</Typography> : null}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    )}
      {esAdmin && (
        <Box mt={4} display="flex" gap={2}>
          <Button variant="contained" onClick={() => navigate("/confirmar-turnos")} sx={{ backgroundColor: "#1976d2", "&:hover": { backgroundColor: "#1565c0" }, fontWeight: "bold" }}>Confirmar/Cancelar Turnos</Button>
          <Button variant="contained" onClick={() => navigate("/historial")} sx={{ backgroundColor: "#1976d2", "&:hover": { backgroundColor: "#1565c0" }, fontWeight: "bold" }}>Historial de Turnos</Button>
        </Box>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.tipo} sx={{ width: "100%" }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Home;
