const { ImmutableX, Config } = require("@imtbl/core-sdk");
const Big = require("big.js");

const CTA_TOKEN_ADDRESS = "0xa04bcac09a3ca810796c9e3deee8fdc8c9807166";
const USDC_TOKEN_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const IMX_CONFIG = Config.PRODUCTION;

const client = new ImmutableX(IMX_CONFIG);

/**
 * Pour convertir un montant brut en montant lisible,
 * à partir du nombre de décimales du token (USDC par exemple)
 */
const toHumanAmount = (rawAmount, decimals) =>
  Big(rawAmount).div(Big(10).pow(decimals)).toNumber();

/**
 * Récupère le floor price d'une carte à partir de son ID (1=Solis, etc ...)
 */
const findFloorPrice = async (cardId) => {
  const assets = await client.listOrders({
    sellTokenAddress: CTA_TOKEN_ADDRESS, // l'adresse du token en vente (ici c'est l'adresse de la collection CTA)
    pageSize: 1, // nombre d'assets à récupérer par appel à listOrders (ici 1 car on trie par prix croissant et qu'on veut le floor price)
    status: "active", // uniquement les ordres qui sont actifs
    sellMetadata: encodeURI(
      // les metadatas de la carte que l'on cherche. C'est un objet JSON que l'on doit ensuite encoder avec encodeURI.
      JSON.stringify({
        tokenType: ["CARD"], // on cherche une carte de jeu (pas souvenir par exemple)
        id: [cardId.toString()], // on utilise l'ID passé en paramètre
      })
    ),
    orderBy: "buy_quantity_with_fees", // on trie par prix de vente ...
    direction: "asc", // ... croissant :-)
    buyTokenAddress: USDC_TOKEN_ADDRESS, // le token qui sert à payer la carte, ici l'USDC. Si vous voulez gérer plusieurs tokens, il faudra faire plusieurs appels puis convertir dans un même token pour pouvoir comparer.
  });

  // retourne le floor price (ici 6 = nombre de décimales définies pour l'USDC)
  return toHumanAmount(assets.result[0].buy.data.quantity_with_fees, 6);
};

/**
 * Initializing...
 */
const main = async () => {
  const price = await findFloorPrice(1);
  console.log("price: ", price);
};

main();
