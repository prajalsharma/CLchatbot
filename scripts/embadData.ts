// this script is used to embed the tag labels using the universal sentence encoder

/** 

import "@tensorflow/tfjs-node";
import * as fs from "fs";
import * as path from "path";
import * as use from "@tensorflow-models/universal-sentence-encoder";

const ecosystems = [
  { value: "Aptos", label: "Aptos" },
  { value: "Base", label: "Base" },
  { value: "Cartesi", label: "Cartesi" },
  { value: "Cosmos", label: "Cosmos" },
  { value: "Ethereum", label: "Ethereum" },
  { value: "European Union", label: "European Union" },
  { value: "Filecoin", label: "Filecoin" },
  { value: "Fuel", label: "Fuel" },
  { value: "Hedera", label: "Hedera" },
  { value: "IOTA", label: "IOTA" },
  { value: "Kadena", label: "Kadena" },
  { value: "Linea", label: "Linea" },
  { value: "Nibiru", label: "Nibiru" },
  { value: "Other", label: "Other" },
  { value: "Polkadot", label: "Polkadot" },
  { value: "Ripple", label: "Ripple" },
  { value: "Stellar", label: "Stellar" },
  { value: "XION", label: "XION" },
  { value: "Dfinity", label: "Dfinity" },
  { value: "TON", label: "TON" },
  { value: "Solana", label: "Solana" },
  { value: "Starknet", label: "Starknet" },
  { value: "Polygon", label: "Polygon" },
  { value: "Cardano", label: "Cardano" },
];

const fundingTypes = [
  { value: "Open Grants", label: "Open Grants" },
  { value: "Quadratic Funding", label: "Quadratic Funding" },
  { value: "Retroactive Grants", label: "Retroactive Grants" },
  { value: "Hackathon Grants", label: "Hackathon Grants" },
  { value: "Incubation and Acceleration", label: "Incubation and Acceleration" },
  { value: "Matching Grants", label: "Matching Grants" },
  { value: "Bounty-Based", label: "Bounty-Based" },
  { value: "Tender", label: "Tender" },
  { value: "AI-Blockchain Research Grants", label: "AI-Blockchain Research Grants" },
  { value: "Staking and Liquidity Incentives", label: "Staking and Liquidity Incentives" },
];

const fundingTopics = [
  { value: "AI", label: "AI" },
  { value: "AI Agents", label: "AI Agents" },
  { value: "CrossChain", label: "CrossChain" },
  { value: "DAOs", label: "DAOs" },
  { value: "Data & Oracles", label: "Data & Oracles" },
  { value: "DeFi", label: "DeFi" },
  { value: "DePIN", label: "DePIN" },
  { value: "Developer Tooling", label: "Developer Tooling" },
  { value: "Education", label: "Education" },
  { value: "Events", label: "Events" },
  { value: "Gaming & Metaverse", label: "Gaming & Metaverse" },
  { value: "Infrastructure", label: "Infrastructure" },
  { value: "NFTs & Creator Economy", label: "NFTs & Creator Economy" },
  { value: "Privacy & Security", label: "Privacy & Security" },
  { value: "Public Goods & Open Source", label: "Public Goods & Open Source" },
  { value: "Real-World Assets (RWAs)", label: "Real-World Assets (RWAs)" },
  { value: "Social & Community", label: "Social & Community" },
  { value: "Stablecoins & Payments", label: "Stablecoins & Payments" },
  { value: "Sustainability", label: "Sustainability" },
  { value: "Zero Knowledge (ZK)", label: "Zero Knowledge (ZK)" },
  { value: "Bugs", label: "Bugs" },
  { value: "Digital Euro", label: "Digital Euro" },
];

async function embedTagLabels() {
  const model = await use.load();
  const output: Record<string, Record<string, number[]>> = {
    ecosystems: {},
    fundingTypes: {},
    fundingTopics: {},
  };

  const processGroup = async (
    group: { value: string; label: string }[],
    key: string
  ) => {
    for (const item of group) {
      const emb = await model.embed([item.value]);
      const vector = await emb.array();
      output[key][item.value] = vector[0];
    }
  };

  await processGroup(ecosystems, "ecosystems");
  await processGroup(fundingTypes, "fundingTypes");
  await processGroup(fundingTopics, "fundingTopics");

  const outPath = path.resolve(
    import.meta.dir,
    "./../tag_embeddings.json"
  );
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log("✅ Tag embeddings saved to tag_embeddings.json");
}

embedTagLabels().catch(console.error);

*/