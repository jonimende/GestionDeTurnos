// client/src/components/turnos/ConfirmarTurnos.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

interface Turno {
  id: number;
  fecha: string;
  usuarioId: number;
  confirmado: boolean;
  cliente?: {
    nombre: string;
    apellido: string;
    telefono: string;
  };
}

const ConfirmarTurnos: React.FC = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const esAdmin = localStorage.getItem("admin") === "true";

  const fetchTurnosPendientes = async () => {
    if (!token || !esAdmin) return;
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get<Turno[]>("https://gestiondeturnos-production.up.railway.app/turnos/pendientes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTurnos(res.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los turnos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurnosPendientes();
  }, [token, esAdmin]);

  if (!esAdmin)
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "black",
          color: "white",
        }}
      >
        <Typography variant="h5">No tenés permisos para acceder a esta sección</Typography>
      </Box>
    );

  const handleConfirmar = async (id: number) => {
    if (!token) return;
    try {
      await axios.put(
        `https://gestiondeturnos-production.up.railway.app/turnos/${id}/confirmar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTurnosPendientes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelar = async (id: number) => {
    if (!token) return;
    try {
      await axios.delete(`https://gestiondeturnos-production.up.railway.app/turnos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTurnosPendientes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('https://source.unsplash.com/featured/?barbershop,appointment')",
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
            backdropFilter: "blur(8px)",
            bgcolor: "rgba(17, 24, 39, 0.85)",
            color: "white",
          }}
        >
          <Typography
            variant="h4"
            sx={{ mb: 3, fontWeight: "bold", textAlign: "center", color: "white" }}
          >
            Confirmar / Cancelar Turnos
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 5 }}>
              <CircularProgress color="inherit" />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : turnos.length === 0 ? (
            <Typography align="center" sx={{ color: "#9ca3af" }}>
              No hay turnos pendientes
            </Typography>
          ) : (
            <List>
              {turnos.map((t) => (
                <ListItem
                  key={t.id}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.05)",
                    mb: 2,
                    borderRadius: 2,
                  }}
                >
                  <ListItemText
                    primary={`${new Date(t.fecha).toLocaleString()}`}
                    secondary={
                      t.cliente
                        ? `${t.cliente.nombre} ${t.cliente.apellido} - ${t.cliente.telefono}`
                        : "Disponible"
                    }
                    primaryTypographyProps={{ color: "white" }}
                    secondaryTypographyProps={{ color: "#d1d5db" }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="confirmar"
                      onClick={() => handleConfirmar(t.id)}
                      sx={{ color: "#3b82f6", mr: 1 }}
                    >
                      <CheckCircleIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="cancelar"
                      onClick={() => handleCancelar(t.id)}
                      sx={{ color: "#ef4444" }}
                    >
                      <CancelIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
          <Box display="flex" justifyContent="center" mt={4}>
            <Button
              variant="contained"
              onClick={() => navigate("/home")}
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: "bold",
                fontSize: "1rem",
                borderRadius: 2,
                textTransform: "none",
                backgroundColor: "#3b82f6", // azul suave
                "&:hover": { backgroundColor: "#2563eb" },
              }}
            >
              Volver al Inicio
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ConfirmarTurnos;
