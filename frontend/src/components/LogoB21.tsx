import IsotipoB21 from "./IsotipoB21";

export default function LogoB21({
  size = 72,
  compact = false,
}: {
  size?: number;
  compact?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <IsotipoB21 size={size} />
      {!compact && (
        <div style={{ lineHeight: 1.2 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: size * 0.34,
              letterSpacing: "-0.01em",
              color: "#111827",
            }}
          >
            Compañía de Bomberos
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: size * 0.42,
              letterSpacing: "0.02em",
              color: "#8B0000",
            }}
          >
            RIMAC N°21
          </div>
          <div
            style={{
              fontSize: size * 0.22,
              fontWeight: 500,
              color: "#374151",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Inventario y Trazabilidad
          </div>
        </div>
      )}
    </div>
  );
}