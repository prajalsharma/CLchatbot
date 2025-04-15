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
  { value: "EU", label: "European Union" },
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
  { value: "Dfinity", label: "Difinity" },
  { value: "TON", label: "TON" },
  { value: "Solana", label: "Solana" },
  { value: "Starknet", label: "Starknet" },
  { value: "Polygon", label: "Polygon" },
  { value: "Cardano", label: "Cardano" },
];

const fundingTypes = [
  {
    value: "AI-BlockchainResearchGrants",
    label: "AI-Blockchain Research Grants",
  },
  { value: "Bounty-Based", label: "Bounty-Based" },
  { value: "HackathonGrants", label: "Hackathon Grants" },
  { value: "IncubationAcceleration", label: "Incubation & Acceleration" },
  { value: "MatchingGrants", label: "Matching Grants" },
  { value: "OpenGrants", label: "Open Grants" },
  { value: "QuadraticFunding", label: "Quadratic Funding" },
  { value: "RetroactiveGrants", label: "Retroactive Grants" },
  {
    value: "StakingLiquidityIncentives",
    label: "Staking & Liquidity Incentives",
  },
  { value: "Tender", label: "Tender" },
];

const fundingTopics = [
  { value: "AI", label: "AI" },
  { value: "AIAgents", label: "AIAgents" },
  { value: "Bugs", label: "Bugs" },
  { value: "CrossChain", label: "CrossChain" },
  { value: "DAOs", label: "DAOs" },
  { value: "Data & Oracles", label: "Data & Oracles" },
  { value: "DeFi", label: "DeFi" },
  { value: "DePIN", label: "DePIN" },
  { value: "DevTooling", label: "Developer Tooling" },
  { value: "Digital Euro", label: "Digital Euro" },
  { value: "Education", label: "Education" },
  { value: "Events", label: "Events" },
  { value: "Gaming", label: "Gaming & Metaverse" },
  { value: "Infra", label: "Infrastructure" },
  { value: "NFTs", label: "NFTs & Creator Economy" },
  { value: "Privacy & Security", label: "Privacy & Security" },
  { value: "PublicGoods", label: "Public Goods & Open Source" },
  { value: "RWAs", label: "Real-World Assets (RWAs)" },
  { value: "Social & Community", label: "Social & Community" },
  { value: "Stablecoins & Payments", label: "Stablecoins & Payments" },
  { value: "Sustainability", label: "Sustainability" },
  { value: "ZK", label: "Zero Knowledge (ZK)" },
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