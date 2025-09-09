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

interface Turno {
  id: number;
  fecha: string;
  usuarioId: number;
  estado: "disponible" | "reservado" | "confirmado" | "cancelado" | "deshabilitado";
  cliente?: { nombre: string; apellido: string };
}

const Home: React.FC = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(new Date().toISOString().slice(0, 10));
  const [turnosOcupando, setTurnosOcupando] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; mensaje: string; tipo: "success" | "error" }>({ open: false, mensaje: "", tipo: "success" });

  const horarios = [
    "09:00", "10:00", "11:00", // mañana
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", // tarde
  ];
  const todosLosHorarios = [...horarios];

  const token = localStorage.getItem("token");
  const usuarioId = Number(localStorage.getItem("usuarioId"));
  const esAdmin = JSON.parse(localStorage.getItem("admin") || "false");


  const navigate = useNavigate();
  const location = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);

  // 🔹 Fetch turnos solo cuando cambia fecha o token
  useEffect(() => {
    if (!token) return;
    axios.get<Turno[]>("http://gestiondeturnos-production.up.railway.app/turnos", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTurnos(res.data))
      .catch(err => { console.error(err); setTurnos([]); });
  }, [token, location, fechaSeleccionada]);

  const showSnackbar = (mensaje: string, tipo: "success" | "error") => {
    setSnackbar({ open: true, mensaje, tipo });
  };

  const fechaAUTC = (fecha: Date) => {
    const f = new Date(fecha);
    f.setMinutes(f.getMinutes() - f.getTimezoneOffset());
    return f.toISOString();
  };

  const obtenerTurnoPorHora = (horario: string): Turno | undefined => {
    const [horas, minutos] = horario.split(":").map(Number);
    const fechaSel = new Date(fechaSeleccionada);
    return turnos.find(t => {
      const fechaTurno = new Date(t.fecha);
      return (
        fechaTurno.getFullYear() === fechaSel.getFullYear() &&
        fechaTurno.getMonth() === fechaSel.getMonth() &&
        fechaTurno.getDate() === fechaSel.getDate() &&
        fechaTurno.getHours() === horas &&
        fechaTurno.getMinutes() === minutos
      );
    });
  };

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
    const fecha = new Date(fechaSeleccionada);
    fecha.setHours(horas, minutos, 0, 0);

    axios.post(
      "http://gestiondeturnos-production.up.railway.app/turnos",
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

  const handleDeshabilitarTurno = (turno: Turno | undefined, hora: string) => {
    const [horas, minutos] = hora.split(":").map(Number);
    const fecha = new Date(fechaSeleccionada);
    fecha.setHours(horas, minutos, 0, 0);

    if (turno) {
      axios.put(`http://gestiondeturnos-production.up.railway.app/turnos/${turno.id}/deshabilitar`, {}, { headers: { Authorization: `Bearer ${token}` } })
        .then(() => {
          showSnackbar("Turno deshabilitado", "success");
          setTurnos(prev => prev.map(t => t.id === turno.id ? { ...t, estado: "deshabilitado" } : t));
        })
        .catch(() => showSnackbar("Error al deshabilitar turno", "error"));
    } else {
      axios.post(
        "http://gestiondeturnos-production.up.railway.app/turnos",
        { fecha: fechaAUTC(fecha), usuarioId: 0, estado: "deshabilitado" },
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(res => {
        showSnackbar("Turno deshabilitado", "success");
        setTurnos(prev => [...prev, res.data as Turno]);
      })
      .catch(() => showSnackbar("Error al deshabilitar turno", "error"));
    }
  };

  const handleHabilitarTurno = (turno: Turno) => {
    axios.put(`http://gestiondeturnos-production.up.railway.app/turnos/${turno.id}/habilitar`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        showSnackbar("Turno habilitado", "success");
        setTurnos(prev => prev.map(t => t.id === turno.id ? { ...t, estado: "disponible" } : t));
      })
      .catch(() => showSnackbar("Error al habilitar turno", "error"));
  };

  const handleCancelarTurno = (turno: Turno) => {
    axios.put(`http://gestiondeturnos-production.up.railway.app/turnos/${turno.id}/cancelar`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        showSnackbar("Turno cancelado", "success");
        setTurnos(prev => prev.map(t => t.id === turno.id ? { ...t, estado: "disponible" } : t));
      })
      .catch(() => showSnackbar("Error al cancelar turno", "error"));
  };

  const handleCambioFecha = (dias: number) => {
    const nuevaFecha = new Date(fechaSeleccionada);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    setFechaSeleccionada(nuevaFecha.toISOString().slice(0, 10));
  };

  const scrollCard = (direction: "up" | "down") => {
    if (!cardRef.current) return;
    const offset = 80;
    cardRef.current.scrollBy({ top: direction === "up" ? -offset : offset, behavior: "smooth" });
  };

  const turnosConfirmados = turnos.filter(t => {
    const fechaTurno = new Date(t.fecha);
    const fechaSel = new Date(fechaSeleccionada);
    return fechaTurno.getFullYear() === fechaSel.getFullYear() &&
           fechaTurno.getMonth() === fechaSel.getMonth() &&
           fechaTurno.getDate() === fechaSel.getDate() &&
           t.estado === "confirmado";
  });

  return (
    <Box sx={{ bgcolor: "#121212", color: "#e0e0e0", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", p: 4 }}>
      <Typography variant="h4" mb={3} sx={{ fontWeight: "bold", color: "#90caf9" }}>Reservá tu turno</Typography>

      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => handleCambioFecha(-1)} sx={{ color: "#90caf9" }}><ArrowBackIosIcon /></IconButton>
        <Typography variant="h6" mx={2}>{new Date(fechaSeleccionada).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</Typography>
        <IconButton onClick={() => handleCambioFecha(1)} sx={{ color: "#90caf9" }}><ArrowForwardIosIcon /></IconButton>
      </Box>

      <Card sx={{ width: "100%", maxWidth: 600, maxHeight: 400, overflow: "hidden", position: "relative", bgcolor: "#1e1e1e", borderRadius: 3, boxShadow: "0 6px 20px rgba(0,0,0,0.5)", mb: 3 }}>
        <CardContent ref={cardRef} sx={{ overflowY: "auto", maxHeight: 400 }}>
          <List>
            {todosLosHorarios.map(horario => {
              const turno = obtenerTurnoPorHora(horario);
              const ocupado = turno && (turno.estado === "reservado" || turno.estado === "confirmado");
              const deshabilitado = turno && turno.estado === "deshabilitado";

              // 🔹 Deshabilitar domingos y lunes
              const fechaSel = new Date(fechaSeleccionada);
              const esNoLaborable = fechaSel.getDay() === 0 || fechaSel.getDay() === 1;

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
                      {esNoLaborable ? "No laborable" : ocupado || deshabilitado ? turno?.estado : "Reservar"}
                    </Button>

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

                    {esAdmin && turno && turno.estado !== "disponible" && turno.estado !== "deshabilitado" && !esNoLaborable && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="warning"
                        onClick={() => handleCancelarTurno(turno)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </Box>
                  <Divider sx={{ bgcolor: "#424242", width: "100%", mt: 1 }} />
                </ListItem>
              );
            })}
          </List>
        </CardContent>

        {todosLosHorarios.length > 3 && (
          <Box position="absolute" top={0} right={0} display="flex" flexDirection="column">
            <IconButton size="small" onClick={() => scrollCard("up")} sx={{ bgcolor: "rgba(0,0,0,0.1)", m: 0.5 }}><KeyboardArrowUpIcon /></IconButton>
            <IconButton size="small" onClick={() => scrollCard("down")} sx={{ bgcolor: "rgba(0,0,0,0.1)", m: 0.5 }}><KeyboardArrowDownIcon /></IconButton>
          </Box>
        )}
      </Card>

      <Card sx={{ width: "100%", maxWidth: 600, maxHeight: 200, overflow: "hidden", bgcolor: "#1e1e1e", borderRadius: 3, boxShadow: "0 6px 20px rgba(0,0,0,0.5)" }}>
        <CardContent sx={{ maxHeight: 200, overflowY: "auto" }}>
          <Typography sx={{ fontWeight: "bold", color: "#90caf9", mb: 1 }}>Turnos Confirmados</Typography>
          <List>
            {turnosConfirmados.length === 0 && <Typography sx={{ color: "#fff" }}>No hay turnos confirmados</Typography>}
            {turnosConfirmados.map(turno => (
              <ListItem key={turno.id}>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: "bold", color: "#fff" }}>{new Date(turno.fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}</Typography>}
                  secondary={turno.cliente ? <Typography sx={{ color: "#fff" }}>{turno.cliente.nombre} {turno.cliente.apellido}</Typography> : null}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

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
