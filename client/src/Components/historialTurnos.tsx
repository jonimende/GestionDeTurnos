// client/src/components/turnos/HistorialTurnos.tsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CalendarViewWeekIcon from "@mui/icons-material/CalendarViewWeek";

interface Turno {
  id: number;
  fecha: string;
  confirmado: boolean;
}

const HistorialTurnos: React.FC = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("token");
  const usuarioId = localStorage.getItem("usuarioId");

  const fetchHistorial = () => {
    if (!token || !usuarioId) return;
    setLoading(true);
    setError(null);

    axios
      .get<Turno[]>(`http://localhost:5000/turnos/historial`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTurnos(res.data))
      .catch(() => setError("Error al cargar el historial de turnos"))
      .then(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistorial();
  }, [token, usuarioId]);

  // 🔹 Calcular totales semanales y mensuales
  const resumen = useMemo(() => {
    const ahora = new Date();
    const startOfWeek = new Date(ahora);
    startOfWeek.setDate(ahora.getDate() - ahora.getDay()); // domingo inicio de semana
    const startOfMonth = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    const semanal = turnos.filter(
      (t) => new Date(t.fecha) >= startOfWeek && t.confirmado
    ).length;

    const mensual = turnos.filter(
      (t) => new Date(t.fecha) >= startOfMonth && t.confirmado
    ).length;

    return { semanal, mensual };
  }, [turnos]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage:
          "url('https://source.unsplash.com/featured/?barbershop,history')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        bgcolor: "rgba(0,0,0,0.7)",
        backgroundBlendMode: "darken",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={12}
          sx={{
            p: 4,
            borderRadius: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backdropFilter: "blur(8px)",
            bgcolor: "rgba(17, 24, 39, 0.85)",
            color: "white",
          }}
        >
          <EventAvailableIcon sx={{ fontSize: 48, color: "#3b82f6", mb: 2 }} />
          <Typography
            component="h1"
            variant="h4"
            sx={{ mb: 3, fontWeight: "bold", color: "white" }}
          >
            Historial de Turnos
          </Typography>

          {/* 🔹 Resumen semanal/mensual usando Box y Card */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, width: "100%" }}>
            <Card
              sx={{
                flex: 1,
                bgcolor: "rgba(59,130,246,0.2)",
                borderRadius: 2,
                textAlign: "center",
                color: "white",
              }}
            >
              <CardContent>
                <CalendarViewWeekIcon sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h6">{resumen.semanal}</Typography>
                <Typography variant="body2">Turnos esta semana</Typography>
              </CardContent>
            </Card>
            <Card
              sx={{
                flex: 1,
                bgcolor: "rgba(34,197,94,0.2)",
                borderRadius: 2,
                textAlign: "center",
                color: "white",
              }}
            >
              <CardContent>
                <CalendarMonthIcon sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h6">{resumen.mensual}</Typography>
                <Typography variant="body2">Turnos este mes</Typography>
              </CardContent>
            </Card>
          </Box>

          {loading && <CircularProgress sx={{ color: "#3b82f6", mb: 2 }} />}
          {error && (
            <Alert severity="error" sx={{ mb: 2, width: "100%" }}>
              {error}
            </Alert>
          )}
          {!loading && turnos.length === 0 && (
            <Typography variant="body1" sx={{ color: "#d1d5db" }}>
              No tenés turnos en tu historial
            </Typography>
          )}

          <List sx={{ width: "100%" }}>
            {turnos.map((t) => (
              <React.Fragment key={t.id}>
                <ListItem>
                  <ListItemText
                    primary={new Date(t.fecha).toLocaleString("es-AR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                    secondary={
                      t.confirmado ? "✅ Confirmado" : "⌛ Pendiente de confirmación"
                    }
                    primaryTypographyProps={{ sx: { color: "white" } }}
                    secondaryTypographyProps={{
                      sx: { color: t.confirmado ? "#22c55e" : "#facc15" },
                    }}
                  />
                </ListItem>
                <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Container>
    </Box>
  );
};

export default HistorialTurnos;
