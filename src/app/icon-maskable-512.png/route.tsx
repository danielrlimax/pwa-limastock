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
        }}
      >
        <div
          style={{
            width: "270px",
            height: "270px",
            background: "#ffffff",
            borderRadius: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#020617",
            fontSize: "124px",
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