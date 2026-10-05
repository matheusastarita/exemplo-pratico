import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getPublicInfo } from "@/lib/restaurant";
import { formatBRL } from "@/lib/format";

export const metadata: Metadata = { title: "Termos de Uso" };

export default async function TermosPage() {
  const { info } = await getPublicInfo();
  const hours = info.cancel_deadline_hours === 1 ? "1 hora" : `${info.cancel_deadline_hours} horas`;

  return (
    <LegalPage info={info} title="Termos de Uso" updated="outubro de 2026">
      <p>
        Estes termos valem para as reservas feitas pelo site do {info.name}. Ao reservar, você concorda com
        as regras abaixo — elas existem para que todo mundo encontre a mesa pronta na hora marcada.
      </p>

      <section>
        <h2>Reservas</h2>
        <ul>
          <li>Reservas pelo site valem para grupos de até {info.max_party_online} pessoas e até {info.max_advance_days} dias à frente.</li>
          <li>Para grupos maiores ou pedidos especiais, fale diretamente com o restaurante.</li>
          <li>A preferência de área (ex.: varanda) é atendida sempre que houver mesa, mas não é garantida.</li>
        </ul>
      </section>

      <section>
        <h2>Atrasos e tolerância</h2>
        <p>
          Seguramos a mesa por {info.grace_minutes} minutos após o horário marcado. Depois disso, ela pode ser
          liberada para outros clientes. Se for se atrasar, avise pelo WhatsApp.
        </p>
      </section>

      <section>
        <h2>Alterações e cancelamentos</h2>
        <p>
          Você pode alterar ou cancelar sem custo pelo link da reserva até {hours} antes do horário. Depois
          desse prazo, fale com o restaurante.
        </p>
      </section>

      {info.deposit_enabled && info.deposit_min_party && info.deposit_per_person ? (
        <section>
          <h2>Sinal para grupos</h2>
          <p>
            Grupos a partir de {info.deposit_min_party} pessoas pagam um sinal de {formatBRL(info.deposit_per_person)} por
            pessoa, descontado da conta. Cancelamentos dentro do prazo têm o sinal devolvido; em caso de falta
            sem aviso, o sinal não é devolvido.
          </p>
        </section>
      ) : null}

      <section>
        <h2>Faltas</h2>
        <p>
          Faltas sem aviso prejudicam outros clientes. Depois de faltas repetidas, a reserva pelo site pode
          ser bloqueada, e o atendimento passa a ser só por telefone.
        </p>
      </section>

      <section>
        <h2>Uso do site</h2>
        <p>
          Não é permitido usar o site para fazer reservas falsas ou automatizadas. Podemos cancelar reservas
          que fujam destas regras. Seus dados são tratados conforme a nossa Política de Privacidade.
        </p>
      </section>
    </LegalPage>
  );
}
