import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "512px",
          height: "512px",
          background: "#020617",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "112px",
        }}
      >
        <div
          style={{
            width: "320px",
            height: "320px",
            background: "#ffffff",
            borderRadius: "84px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#020617",
            fontSize: "148px",
            fontWeight: 900,
            fontFamily: "Arial",
          }}
        >
          LS
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}