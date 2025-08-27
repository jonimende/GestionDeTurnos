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
import { useSpring, animated } from "react-spring";

interface Turno {
  id: number;
  fecha: string;
  usuarioId: number;
  confirmado: boolean;
  deshabilitado?: boolean;
  cliente?: { nombre: string; apellido: string };
}

const Home: React.FC = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(new Date().toISOString().slice(0, 10));
  const [turnosOcupando, setTurnosOcupando] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; mensaje: string; tipo: "success" | "error" }>({ open: false, mensaje: "", tipo: "success" });

  const horariosManana = ["09:00", "10:00", "11:00", "12:00"];
  const horariosTarde = ["16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
  const todosLosHorarios = [...horariosManana, ...horariosTarde];

  const token = localStorage.getItem("token");
  const usuarioId = Number(localStorage.getItem("usuarioId"));
  const esAdmin = localStorage.getItem("admin") === "true";

  const navigate = useNavigate();
  const location = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);

  const animProps = useSpring({
    from: { opacity: 0, transform: "translateY(-10px)" },
    to: { opacity: 1, transform: "translateY(0px)" },
    reset: true,
    config: { tension: 200, friction: 20 },
  });

  const fetchTurnos = () => {
    if (!token) return;
    axios.get<Turno[]>("http://localhost:5000/turnos", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setTurnos(res.data))
      .catch(err => { console.error(err); setTurnos([]); });
  };

  useEffect(() => { fetchTurnos(); }, [token, location, fechaSeleccionada]);

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

    if ((turnoExistente && (turnoExistente.confirmado || turnoExistente.deshabilitado)) || turnosOcupando.includes(hora)) {
      return showSnackbar("Ese turno ya está reservado o deshabilitado", "error");
    }

    setTurnosOcupando(prev => [...prev, hora]);

    const [horas, minutos] = hora.split(":").map(Number);
    const fecha = new Date(fechaSeleccionada);
    fecha.setHours(horas, minutos, 0, 0);

    axios.post(
      "http://localhost:5000/turnos",
      { fecha: fechaAUTC(fecha), usuarioId, deshabilitado: false },
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(() => {
        showSnackbar("Turno creado!", "success");
        fetchTurnos();
        setTurnosOcupando(prev => prev.filter(h => h !== hora));
      })
      .catch(err => {
        console.error(err);
        showSnackbar(err.response?.data?.error || "Error al crear turno", "error");
        setTurnosOcupando(prev => prev.filter(h => h !== hora));
      });
  };

  const handleDeshabilitarTurno = (turno: Turno | undefined, hora: string) => {
    if (turno?.confirmado || turno?.deshabilitado) return;

    const [horas, minutos] = hora.split(":").map(Number);
    const fecha = new Date(fechaSeleccionada);
    fecha.setHours(horas, minutos, 0, 0);

    if (turno) {
      // Turno existente
      setTurnos(prev => prev.map(t => t.id === turno.id ? { ...t, deshabilitado: true } : t));
      axios.put(`http://localhost:5000/turnos/deshabilitar/${turno.id}`, {}, { headers: { Authorization: `Bearer ${token}` } })
        .then(fetchTurnos)
        .catch(err => {
          console.error(err);
          showSnackbar("Error al deshabilitar el turno", "error");
          setTurnos(prev => prev.map(t => t.id === turno.id ? { ...t, deshabilitado: false } : t));
        });
    } else {
      // Crear turno “fantasma” deshabilitado
      axios.post(
        "http://localhost:5000/turnos",
        { fecha: fechaAUTC(fecha), usuarioId: 0, deshabilitado: true },
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then(fetchTurnos)
        .catch(err => {
          console.error(err);
          showSnackbar("Error al deshabilitar el turno", "error");
        });
    }
  };

  const handleCancelarTurno = (turno: Turno) => {
    axios.put(`http://localhost:5000/turnos/cancelar/${turno.id}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => { showSnackbar("Turno cancelado y disponible nuevamente", "success"); fetchTurnos(); })
      .catch(err => console.error(err));
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
           t.confirmado;
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
              const ocupado = !!(turno?.deshabilitado || turno?.confirmado || turnosOcupando.includes(horario));

              return (
                <animated.div key={horario} style={animProps}>
                  <ListItem sx={{ flexDirection: "column", alignItems: "flex-start" }}>
                    <ListItemText
                      primary={<Typography sx={{ fontWeight: "bold", color: "#fff" }}>Hora: {horario}</Typography>}
                      secondary={<Typography sx={{ color: ocupado ? "#ff5252" : "#fff" }}>{ocupado ? "No disponible" : "Disponible"}</Typography>}
                    />
                    <Box display="flex" gap={1} mt={1}>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        disabled={ocupado}
                        onClick={() => handleCrearTurno(horario)}
                      >
                        {ocupado ? "Reservado" : "Reservar"}
                      </Button>

                      {esAdmin && (
                        <Button
                          variant="outlined"
                          size="small"
                          color={turno?.deshabilitado ? "warning" : "error"}
                          disabled={turno?.confirmado || turno?.deshabilitado}
                          onClick={() => handleDeshabilitarTurno(turno, horario)}
                        >
                          {turno?.deshabilitado ? "Deshabilitado" : "Deshabilitar"}
                        </Button>
                      )}

                      {esAdmin && turno && (turno.confirmado || turno.deshabilitado) && (
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
                  </ListItem>
                  <Divider sx={{ bgcolor: "#424242" }} />
                </animated.div>
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
            {turnosConfirmados.length === 0 && <Typography sx={{ color: "#e0e0e0" }}>No hay turnos confirmados</Typography>}
            {turnosConfirmados.map(turno => (
              <ListItem key={turno.id}>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: "bold", color: "#fff" }}>{new Date(turno.fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}</Typography>}
                  secondary={turno.cliente ? <Typography sx={{ color: "#e0e0e0" }}>{turno.cliente.nombre} {turno.cliente.apellido}</Typography> : null}
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
