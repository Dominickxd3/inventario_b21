import { memo, type ReactNode } from "react";

function PageHeader({
  titulo,
  subtitulo,
  acciones,
}: {
  titulo: string;
  subtitulo?: string;
  acciones?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 20,
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "1.35rem",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "#111827",
            margin: 0,
          }}
        >
          {titulo}
        </h1>
        {subtitulo && (
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#374151" }}>
            {subtitulo}
          </p>
        )}
      </div>
      {acciones && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{acciones}</div>}
    </div>
  );
}

export default memo(PageHeader);