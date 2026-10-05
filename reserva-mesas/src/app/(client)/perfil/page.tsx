import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { requireUser } from "@/lib/session";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Meus dados" };

export default async function PerfilPage() {
  const { user, profile } = await requireUser("/perfil");

  return (
    <div>
      <SectionHeader serif title="Meus dados" subtitle="Seus dados agilizam as próximas reservas." />
      <ProfileForm
        email={user.email ?? ""}
        profile={{
          id: user.id,
          full_name: profile?.full_name ?? "",
          phone: profile?.phone ?? "",
          birthday: profile?.birthday ?? null,
          preferences: profile?.preferences ?? null,
        }}
      />
    </div>
  );
}
