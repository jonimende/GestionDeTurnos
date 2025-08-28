// client/src/components/turnos/HistorialTurnos.tsx
import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

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
                    primary={new Date(t.fecha).toLocaleString()}
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
