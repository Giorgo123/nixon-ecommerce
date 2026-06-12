import mercadopago from "mercadopago";

const mercadopagoClient = mercadopago as any;
mercadopagoClient.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
});

export default mercadopagoClient;
