/*
 * CONFIGURAÇÃO DA PÁGINA: preencha antes de publicar.
 *
 * checkoutUrl  Link do checkout da Kiwify (ex.: "https://pay.kiwify.com.br/AbC123").
 *              Todos os botões "Quero entrar no curso" passam a apontar para ele, levando junto
 *              os parâmetros do anúncio (utm_*, fbclid, gclid, src, sck...).
 *              Enquanto estiver vazio, os botões levam à seção da oferta.
 *
 * metaPixelId  ID do Pixel da Meta (só números). Vazio = não usa.
 * ga4Id        ID do Google Analytics 4 (ex.: "G-XXXXXXX"). Vazio = não usa.
 *              Pixel e Analytics só carregam depois que a pessoa clica em "Aceitar" no aviso
 *              de cookies. O aviso só aparece se pelo menos um dos dois estiver preenchido.
 */
window.FC_CONFIG = {
  checkoutUrl: '',
  metaPixelId: '',
  ga4Id: ''
};
