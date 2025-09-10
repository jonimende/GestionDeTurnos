// client/src/components/auth/Register.tsx
import React, { useState } from "react";
import {
  Avatar,
  Button,
  Container,
  CssBaseline,
  Paper,
  TextField,
  Typography,
  Box,
  Link,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
export default function Register() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !apellido || !telefono || !password) {
      toast.error("Por favor completá todos los campos");
      return;
    }

    try {
      const res = await fetch("https://gestiondeturnos-production.up.railway.app/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, apellido, telefono, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al registrar usuario");
        return;
      }

      localStorage.setItem("token", data.token);
      toast.success("✅ Registro exitoso");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error(err);
      toast.error("❌ Error de conexión con el servidor");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('https://source.unsplash.com/featured/?finance,bank')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        bgcolor: "rgba(0, 0, 0, 0.7)",
        backgroundBlendMode: "darken",
      }}
    >
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Paper
          elevation={12}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 3,
            backdropFilter: "blur(8px)",
            bgcolor: "rgba(17, 24, 39, 0.85)",
            color: "white",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "success.main" }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" fontWeight="bold" mb={2}>
            Crear cuenta
          </Typography>

          <Box component="form" onSubmit={handleRegister} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              fullWidth
              label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              sx={muiInputStyle}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              sx={muiInputStyle}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              sx={muiInputStyle}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={muiInputStyle}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="success"
              sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: "bold", fontSize: "1rem" }}
            >
              Registrarse
            </Button>

            <Box display="flex" justifyContent="flex-end">
              <Link href="https://tende-corte.vercel.app/login" variant="body2" sx={{ color: "#3b82f6" }}>
                ¿Ya tenés cuenta? Iniciá sesión
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
      <ToastContainer />
    </Box>
  );
}

const muiInputStyle = {
  mb: 2,
  input: { color: "white" },
  label: { color: "#9ca3af" },
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#3b82f6" },
    "&:hover fieldset": { borderColor: "#60a5fa" },
    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
  },
};
