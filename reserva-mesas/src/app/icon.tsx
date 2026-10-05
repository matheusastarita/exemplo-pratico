import { ImageResponse } from "next/og";
import { getPublicInfo } from "@/lib/restaurant";
import { initialsOf } from "@/components/ui/Avatar";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon gerado a partir da marca configurada (iniciais na cor do restaurante). */
export default async function Icon() {
  const { info } = await getPublicInfo();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 32,
          background: info.primary_color,
          color: "#ffffff",
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "serif",
        }}
      >
        {initialsOf(info.name)}
      </div>
    ),
    size
  );
}
