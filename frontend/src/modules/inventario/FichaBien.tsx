import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import { obtenerMensajeError } from '../../services/api';
import type { FichaBien } from '../../types';
import PageHeader from '../../components/PageHeader';
import EstadoBienChip from '../../components/EstadoBien';
import { formatearFecha } from '../../utils/formato';

export default function FichaBien() {
  const { codigo } = useParams<{ codigo: string }>();
  const [ficha, setFicha] = useState<FichaBien | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    api
      .get<FichaBien>(`/inventario/bienes/${codigo}`)
      .then((res) => setFicha(res.data))
      .catch((e) => setError(obtenerMensajeError(e)));
  }, [codigo]);

  if (error) {
    return (
      <Box>
        <PageHeader titulo="Ficha del bien" />
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!ficha) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  const b = ficha.bien;

  const fila = (label: string, valor: unknown) => (
    <TableRow>
      <TableCell sx={{ color: '#5c6470', fontWeight: 500, width: 230 }}>
        {label}
      </TableCell>
      <TableCell>{(valor as React.ReactNode) ?? '—'}</TableCell>
    </TableRow>
  );

  return (
    <Box>
      <PageHeader
        titulo={`Ficha ${b.CodigoInterno}`}
        subtitulo={b.NombreArticulo}
        breadcrumb={[
          { label: 'Inventario', to: '/inventario' },
          { label: b.CodigoInterno },
        ]}
        acciones={
          <Link
            to="/inventario"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-b21-red"
          >
            <ArrowLeft size={16} /> Volver
          </Link>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 2.5 }}>
        {/* Datos generales */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 1.8, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: '#f8f9fa' }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Datos generales</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableBody>
                {fila('Código interno', <span style={{ fontFamily: 'Consolas, monospace' }}>{b.CodigoInterno}</span>)}
                {fila('Código patrimonial', b.CodigoPatrimonial)}
                {fila('Artículo', b.NombreArticulo)}
                {fila('Tipo de control', b.TipoControl)}
                {fila('Marca', b.NombreMarca)}
                {fila('Modelo', b.NombreModelo)}
                {fila('Número de serie', b.NumeroSerie)}
                {fila('Estado', <EstadoBienChip nombre={b.NombreEstado} />)}
                {fila('Ubicación', b.NombreUbicacion)}
                {fila('Responsable', b.Responsable)}
                {fila('Fecha de ingreso', formatearFecha(b.FechaIngreso))}
                {fila('Observaciones', b.Observaciones)}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* QR */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 1.5 }}>
            Código QR
          </Typography>
          {ficha.qr && ficha.qr.length > 0 ? (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={`/api/inventario/bienes/${b.CodigoInterno}/qr/png`}
                alt={`QR ${b.CodigoInterno}`}
                style={{ width: 180, height: 180, border: '1px solid #dfe3e8', borderRadius: 8 }}
              />
              <Typography sx={{ fontSize: '0.72rem', color: '#5c6470', mt: 1 }}>
                Generado el {formatearFecha(ficha.qr[0].FechaGeneracion)}
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.8rem', color: '#5c6470' }}>
              No se ha generado QR para este bien.
            </Typography>
          )}
        </Paper>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: 2.5 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1.5 }}
        >
          <Tab label="Kardex" />
          <Tab label="Historial de estados" />
          <Tab label="Historial de responsables" />
          <Tab label="Componentes" />
          <Tab label="Fotos" />
          <Tab label="Documentos" />
        </Tabs>

        <Box sx={{ p: 2.5 }}>
          {tab === 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    {['Fecha', 'Movimiento', 'Detalle', 'Usuario'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', color: '#5c6470' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ficha.kardex.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ color: '#5c6470' }}>
                        Sin movimientos registrados.
                      </TableCell>
                    </TableRow>
                  )}
                  {ficha.kardex.map((k, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatearFecha(k.Fecha)}</TableCell>
                      <TableCell>{k.NombreMovimiento ?? k.CodigoMovimiento}</TableCell>
                      <TableCell>{k.Detalle ?? '—'}</TableCell>
                      <TableCell>{k.UsuarioRegistro ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tab === 1 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    {['Fecha', 'Estado anterior', 'Estado nuevo', 'Motivo', 'Usuario'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', color: '#5c6470' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ficha.historialEstado.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ color: '#5c6470' }}>
                        Sin cambios de estado.
                      </TableCell>
                    </TableRow>
                  )}
                  {ficha.historialEstado.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatearFecha(h.FechaCambio)}</TableCell>
                      <TableCell>{h.NombreEstadoAnterior ?? '—'}</TableCell>
                      <TableCell>{h.NombreEstadoNuevo ?? '—'}</TableCell>
                      <TableCell>{h.Motivo ?? '—'}</TableCell>
                      <TableCell>{h.UsuarioCambio ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tab === 2 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    {['Responsable', 'Desde', 'Hasta', 'Motivo'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', color: '#5c6470' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ficha.historialAsignacion.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ color: '#5c6470' }}>
                        Sin asignaciones.
                      </TableCell>
                    </TableRow>
                  )}
                  {ficha.historialAsignacion.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell>{h.Responsable}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatearFecha(h.FechaAsignacion)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{h.FechaFin ? formatearFecha(h.FechaFin) : 'Actual'}</TableCell>
                      <TableCell>{h.Motivo ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tab === 3 && (
            <Box>
              {ficha.relacion.length === 0 ? (
                <Typography sx={{ color: '#5c6470' }}>Sin componentes registrados.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {ficha.relacion.map((r: any, i: number) => (
                    <Paper key={i} variant="outlined" sx={{ px: 2, py: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{r.CodigoInterno}</Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: '#5c6470' }}>{r.NombreArticulo}</Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {tab === 4 && (
            <Box>
              {ficha.fotos.length === 0 ? (
                <Typography sx={{ color: '#5c6470' }}>Sin fotografías registradas.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {ficha.fotos.map((f, i) => (
                    <Box key={i} sx={{ textAlign: 'center' }}>
                      <img
                        src={f.RutaGoogleDrive}
                        alt={f.NombreArchivo}
                        style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid #dfe3e8' }}
                      />
                      <Typography sx={{ fontSize: '0.68rem', color: '#5c6470', mt: 0.5 }}>
                        {f.NombreArchivo}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {tab === 5 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    {['Documento', 'Tipo', 'Fecha', 'Enlace'].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', color: '#5c6470' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ficha.documentos?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ color: '#5c6470' }}>
                        Sin documentos registrados.
                      </TableCell>
                    </TableRow>
                  )}
                  {ficha.documentos?.map((d: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{d.NombreArchivoOriginal ?? d.CodigoDocumento}</TableCell>
                      <TableCell>{d.TipoDocumento}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatearFecha(d.FechaCarga ?? d.FechaGeneracion)}</TableCell>
                      <TableCell>
                        {d.RutaArchivo || d.IdArchivoGoogleDrive ? (
                          <a href={d.RutaArchivo ?? `https://drive.google.com/file/d/${d.IdArchivoGoogleDrive}/view`} target="_blank" rel="noreferrer" className="text-b21-red hover:underline">
                            Ver en Drive
                          </a>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
      <Divider sx={{ my: 1 }} />
    </Box>
  );
}

