"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Typography,
} from "@mui/material";
import { Lock, User, Eye, EyeOff, ShieldCheck, SearchCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import LogoB21 from "@/components/LogoB21";
import { api, guardarToken, guardarSesion, obtenerMensajeError } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { UsuarioAutenticado } from "@/types";

const schema = z.object({
  usuario: z.string().min(1, "Ingrese el usuario."),
  password: z.string().min(1, "Ingrese la contraseña."),
});

type FormLogin = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [verClave, setVerClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormLogin>({ resolver: zodResolver(schema) });

  const enviar = async (values: FormLogin) => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await api.post<UsuarioAutenticado>("/auth/login", values);
      guardarToken(data.token);
      guardarSesion(data);
      login(data);
      router.replace("/dashboard");
    } catch (e) {
      setError(obtenerMensajeError(e));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 460px",
      }}
    >
      <div
        style={{
          backgroundColor: "#111827",
          backgroundImage:
            "radial-gradient(ellipse at 20% 10%, rgba(139,0,0,0.5), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(200,169,81,0.25), transparent 60%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 72px",
          color: "#E5E7EB",
        }}
      >
        <LogoB21 size={88} />
        <Typography
          variant="h2"
          sx={{ color: "#FFFFFF", mt: 5, mb: 2, fontSize: "2.2rem", fontWeight: 800 }}
        >
          Centro de control patrimonial
        </Typography>
        <Typography sx={{ color: "#9CA3AF", maxWidth: 520, fontSize: "0.95rem", lineHeight: 1.6 }}>
          Plataforma de inventario y trazabilidad de los bienes de la Compañía de
          Bomberos Rímac N°21. Control operativo, seguridad y gestión patrimonial
          en un solo lugar.
        </Typography>
        <div style={{ display: "flex", gap: 24, marginTop: 28 }}>
          {[
            { icon: <ShieldCheck size={16} />, label: "Trazabilidad total" },
            { icon: <SearchCheck size={16} />, label: "Código B21 y QR" },
          ].map((f) => (
            <div
              key={f.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.8rem",
                color: "#E5E7EB",
                border: "1px solid #1F2937",
                borderRadius: 8,
                padding: "8px 14px",
                backgroundColor: "rgba(255,255,255,0.03)",
              }}
            >
              {f.icon}
              {f.label}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 44px",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827" }}>
          Iniciar sesión
        </Typography>
        <Typography sx={{ color: "#6B7280", fontSize: "0.85rem", mt: 0.5, mb: 3 }}>
          Sistema de Inventario y Trazabilidad B21
        </Typography>

        {error && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 1,
              backgroundColor: "#FDE8E8",
              color: "#B42318",
              fontSize: "0.8rem",
            }}
          >
            {error}
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit(enviar)} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            size="small"
            label="Usuario"
            autoComplete="username"
            {...register("usuario")}
            error={!!errors.usuario}
            helperText={errors.usuario?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <User size={16} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            size="small"
            label="Contraseña"
            type={verClave ? "text" : "password"}
            autoComplete="current-password"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={16} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setVerClave((v) => !v)}>
                      {verClave ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={cargando}
            size="large"
            sx={{ mt: 1, py: 1.3, fontWeight: 700 }}
          >
            {cargando ? "Validando…" : "Ingresar al sistema"}
          </Button>
        </Box>

        <Typography sx={{ color: "#9CA3AF", fontSize: "0.72rem", mt: 4, textAlign: "center", lineHeight: 1.5 }}>
          Compañía de Bomberos Rímac N°21 — Uso institucional
        </Typography>
      </div>
    </div>
  );
}