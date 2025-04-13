// Must come FIRST to register the backend
import "@tensorflow/tfjs-node";

import * as fs from "fs";
import * as path from "path";
import * as use from "@tensorflow-models/universal-sentence-encoder";

interface GrantData {
  ecosystem: string;
  fundingTopics: string;
  fundingType: string;
  description: string;
  totalFundingAvailable: string;
}

const PRIORITY_WEIGHTS = {
  fundingTopics: 10,
  ecosystem: 9,
  fundingType: 5,
  description: 2,
  totalFundingAvailable: 1,
};

function prepareWeightedInput(data: GrantData): string {
  const fields = [
    { key: "ecosystem", weight: PRIORITY_WEIGHTS.ecosystem },
    { key: "fundingTopics", weight: PRIORITY_WEIGHTS.fundingTopics },
    { key: "fundingType", weight: PRIORITY_WEIGHTS.fundingType },
    { key: "description", weight: PRIORITY_WEIGHTS.description },
    {
      key: "totalFundingAvailable",
      weight: PRIORITY_WEIGHTS.totalFundingAvailable,
    },
  ];

  return fields
    .map((field) =>
      `${data[field.key as keyof GrantData] || ""} `.repeat(field.weight)
    )
    .join(" ")
    .trim();
}

async function generateEmbeddingsFromFile() {
  const filePath = path.resolve(import.meta.dir, "../../public/grants.json");
  const rawData = fs.readFileSync(filePath, "utf8");
  const grants = JSON.parse(rawData);

  const model = await use.load();

  const embeddingResults = [];

  for (let i = 0; i < grants.length; i++) {
    const grant = grants[i];
    const fieldEmbeddings: Record<string, number[]> = {};

    for (const field in PRIORITY_WEIGHTS) {
      const text = (grant[field] || "unknown").toString().trim();

      if (!text) {
        console.warn(`⚠️ Skipping empty field "${field}" for grant #${i}`);
        continue;
      }

      const embedding = await model.embed([text]);
      const vector = await embedding.array();
      fieldEmbeddings[field] = vector[0];
    }

    embeddingResults.push({
      id: i,
      name: grant.grantProgramName,
      embeddings: fieldEmbeddings,
      original: grant,
    });
  }

  const outPath = path.resolve(
    import.meta.dir,
    "../../public/grant_embeddings.json"
  );
  fs.writeFileSync(outPath, JSON.stringify(embeddingResults, null, 2));
  console.log(`🎉 All embeddings saved to grant_embeddings.json`);
}

generateEmbeddingsFromFile().catch(console.error);
