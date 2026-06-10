import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "192px",
          height: "192px",
          background: "#020617",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "42px",
        }}
      >
        <div
          style={{
            width: "118px",
            height: "118px",
            background: "#ffffff",
            borderRadius: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#020617",
            fontSize: "56px",
            fontWeight: 900,
            fontFamily: "Arial",
          }}
        >
          LS
        </div>
      </div>
    ),
    {
      width: 192,
      height: 192,
    }
  );
}