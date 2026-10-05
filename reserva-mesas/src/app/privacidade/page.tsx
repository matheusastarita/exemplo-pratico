import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getPublicInfo } from "@/lib/restaurant";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default async function PrivacidadePage() {
  const { info } = await getPublicInfo();
  const contact = [info.phone, info.whatsapp ? "WhatsApp" : null].filter(Boolean).join(" ou ");

  return (
    <LegalPage info={info} title="Política de Privacidade" updated="outubro de 2026">
      <p>
        Esta política explica, em linguagem simples, como o {info.name} trata os dados pessoais de
        quem reserva uma mesa por este site, seguindo a Lei Geral de Proteção de Dados (Lei 13.709/2018 —
        LGPD).
      </p>

      <section>
        <h2>Quais dados coletamos</h2>
        <ul>
          <li>Nome, celular e, se você quiser, e-mail.</li>
          <li>Dados da reserva: data, horário, número de pessoas, ocasião, preferência de área e observações.</li>
          <li>
            Alergias e restrições alimentares, quando você informa. Por envolverem saúde, são <strong>dados
            sensíveis</strong> e só são usados com o seu consentimento específico, marcado no formulário.
          </li>
          <li>Histórico de visitas, faltas e cancelamentos, para organizar o salão.</li>
        </ul>
      </section>

      <section>
        <h2>Para que usamos</h2>
        <ul>
          <li>Confirmar, lembrar, alterar e cancelar a sua reserva (por WhatsApp, SMS ou e-mail).</li>
          <li>Preparar a mesa e avisar a cozinha sobre alergias e restrições.</li>
          <li>Avisar você se abrir uma vaga, quando você entra na lista de espera.</li>
          <li>Aplicar a política de faltas, que protege as mesas para quem vem.</li>
          <li>
            Enviar novidades e convites <strong>somente se você marcar essa opção</strong>. Você pode
            desistir a qualquer momento.
          </li>
        </ul>
      </section>

      <section>
        <h2>Base legal</h2>
        <p>
          Execução do serviço que você pediu (a reserva), consentimento (dados de saúde e novidades) e
          legítimo interesse do restaurante na organização do salão e na prevenção de abusos.
        </p>
      </section>

      <section>
        <h2>Com quem compartilhamos</h2>
        <p>
          Não vendemos nem cedemos seus dados. Eles ficam guardados com provedores de tecnologia que
          trabalham para o restaurante (banco de dados e envio de mensagens), com criptografia em trânsito e
          controle de acesso — só a equipe do restaurante vê suas reservas.
        </p>
      </section>

      <section>
        <h2>Por quanto tempo guardamos</h2>
        <p>
          Enquanto você for cliente e pelo tempo necessário para cumprir obrigações legais. Depois disso, os
          dados são apagados ou anonimizados.
        </p>
      </section>

      <section>
        <h2>Seus direitos</h2>
        <p>
          Você pode pedir acesso, correção, portabilidade ou exclusão dos seus dados, e revogar consentimentos.
          A equipe do restaurante consegue anonimizar seu cadastro: nome, contatos e observações pessoais são
          apagados, e ficam só números agregados (sem identificar você).
        </p>
        <p className="mt-2">
          Para exercer seus direitos, fale com o {info.name}
          {contact ? ` pelo ${contact}` : ""}
          {info.address ? ` ou no endereço ${info.address}` : ""}.
        </p>
      </section>
    </LegalPage>
  );
}
